// backend/services/AdherentService.js
const BaseService = require("./BaseService");
const AdherentRepository = require("../repositories/AdherentRepository");
const { getAdherentForUser } = require("../utils/roleScope");
const paiementClient = require("../utils/serviceClients/paiementClient");
const vieAssociativeClient = require("../utils/serviceClients/vieAssociativeClient");

class AdherentService extends BaseService {
  constructor() {
    super(new AdherentRepository());
    this.repository = new AdherentRepository();
  }

  async getAll(user = null) {
    const adherent = await getAdherentForUser(user);
    if (adherent) {
      return [await this.repository.findByIdWithPhoto(adherent.num_adherent)];
    }
    return await this.repository.findAllWithPhoto();
  }

  async assertCanAccessAdherent(num_adherent, user) {
    const adherent = await getAdherentForUser(user);
    if (adherent && num_adherent !== adherent.num_adherent) {
      throw new Error("Accès refusé à cette fiche adhérent");
    }
  }

  async getById(id, user = null) {
    await this.assertCanAccessAdherent(id, user);
    return await this.repository.findByIdWithPhoto(id);
  }

  // ✅ Crée l'adhérent ; si aucun user_id n'est fourni, réutilise un compte
  // utilisateur existant pour cet email (ex: créé au préalable via "Gestion
  // des utilisateurs") plutôt que d'en recréer un en double, sinon crée le
  // compte utilisateur lié (role "adherent"), conformément au schéma
  // (user_id not null/unique).
  async create(data) {
    let userId = data.user_id;
    let welcomeEmail = null;

    if (!userId) {
      const { User } = require("../models");
      const existingUser = await User.findOne({ where: { email: data.email } });

      if (existingUser) {
        const existingAdherent = await this.repository.findOne({
          user_id: existingUser.id,
        });
        if (existingAdherent) {
          throw new Error(
            `Un adhérent (${existingAdherent.num_adherent}) est déjà associé à cet email`,
          );
        }
        userId = existingUser.id;
        if (!existingUser.last_login) {
          const UserService = require("./UserService");
          const userService = new UserService();
          const { tempPassword } = await userService.resetPasswordByDirector(existingUser.id);
          welcomeEmail = {
            to: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
            tempPassword,
          };
        }
      } else {
        const UserService = require("./UserService");
        const userService = new UserService();
        const { user, tempPassword } = await userService.createUserByDirector(
          {
            email: data.email,
            name: `${data.prenom || ""} ${data.nom || ""}`.trim(),
            role: "adherent",
            phone: data.telephone,
          },
          data.created_by || null,
        );
        userId = user.id;
        welcomeEmail = { to: user.email, name: user.name, role: user.role, tempPassword };
      }
    }

    const num_adherent = data.num_adherent || (await this.repository.generateNumAdherent());

    try {
      const adherent = await this.repository.create({ ...data, num_adherent, user_id: userId });
      const plain = adherent.toJSON();
      return welcomeEmail ? { ...plain, _welcomeEmail: welcomeEmail } : plain;
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        throw new Error("Un adhérent existe déjà avec cet email ou ce numéro d'adhérent");
      }
      throw error;
    }
  }

  async getAdherentByEmail(email) {
    return await this.repository.findByEmail(email);
  }

  async getAdherentsByNiveau(niveau) {
    return await this.repository.findByNiveau(niveau);
  }

  async searchAdherents(query) {
    return await this.repository.search(query);
  }

  // Paiement/Adhesion/CertificatMedical vivent dans d'autres services
  // (finance-service, vie-associative-service) : recomposés ici via HTTP au
  // lieu d'un `include` Sequelize.
  async getAdherentWithDetails(id, user = null, authHeader = null) {
    await this.assertCanAccessAdherent(id, user);
    const adherent = await this.repository.findWithDetails(id);
    if (!adherent) return adherent;
    const plain = adherent.toJSON();
    const [paiements, adhesions, certificats] = await Promise.all([
      paiementClient.getByAdherent(id, authHeader),
      vieAssociativeClient.getAdhesionsByAdherent(id, authHeader),
      vieAssociativeClient.getCertificatsByAdherent(id, authHeader),
    ]);
    plain.paiements = paiements;
    plain.adhesions = adhesions;
    plain.certificats = certificats;
    return plain;
  }

  async getByUserId(user_id) {
    return await this.repository.findByUserId(user_id);
  }

  async getActiveAdherents() {
    return await this.repository.findActiveAdherents();
  }

  // CertificatMedical vit dans vie-associative-service : la liste des
  // num_adherent concernés est résolue par HTTP.
  async getAdherentsWithExpiringCertificates() {
    const numAdherents = await vieAssociativeClient.getNumAdherentsWithExpiringCertificates();
    return await this.repository.findByNumAdherents(numAdherents);
  }

  async incrementPlongeesCount(num_adherent) {
    const adherent = await this.repository.findById(num_adherent);
    if (!adherent) throw new Error("Adhérent non trouvé");

    adherent.nb_plongees_total = (adherent.nb_plongees_total || 0) + 1;
    await adherent.save();

    return adherent;
  }

  // Appelé par formation-service (résolu par HTTP) à la fin d'une formation
  // dont toutes les compétences de la check-list sont validées.
  async updateNiveau(num_adherent, niveau) {
    const adherent = await this.repository.findById(num_adherent);
    if (!adherent) throw new Error("Adhérent non trouvé");

    adherent.niveau = niveau;
    adherent.date_obtention_niveau = new Date();
    await adherent.save();

    return adherent;
  }

  async getAdherentStats() {
    const total = await this.repository.count();
    const active = await this.repository.count({ statut: "Actif" });
    const inactive = await this.repository.count({ statut: "Inactif" });
    const suspended = await this.repository.count({ statut: "Suspendu" });

    return {
      total,
      active,
      inactive,
      suspended,
    };
  }

  async validateAdherentData(data) {
    const errors = [];

    if (!data.nom) errors.push("Le nom est requis");
    if (!data.prenom) errors.push("Le prénom est requis");
    if (!data.email) errors.push("L'email est requis");
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push("Email invalide");
    }

    return errors;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validateDates(data) {
    const validated = { ...data };

    if (validated.date_naissance) {
      const date = new Date(validated.date_naissance);
      if (isNaN(date.getTime())) {
        throw new Error("La date de naissance est invalide");
      }
      validated.date_naissance = date.toISOString();
    }

    if (validated.date_obtention_niveau) {
      const date = new Date(validated.date_obtention_niveau);
      if (isNaN(date.getTime())) {
        throw new Error("La date d'obtention du niveau est invalide");
      }
      validated.date_obtention_niveau = date.toISOString();
    }

    return validated;
  }

  // Même calcul que DashboardService.countTrend dans le monolithe — dupliqué
  // ici pour que identite-service reste seul propriétaire de ses données ;
  // exposé via `GET /adherents/trend` pour que le dashboard (qui vit encore
  // dans le monolithe) puisse le récupérer par HTTP au lieu d'une requête
  // Sequelize directe sur un modèle qui ne lui appartient plus.
  async getTrend() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastPeriod = new Date(startOfLastMonth);
    endOfLastPeriod.setDate(startOfLastMonth.getDate() + now.getDate());

    const [current, previous] = await Promise.all([
      this.repository.countInPeriod("date_inscription", startOfThisMonth, now),
      this.repository.countInPeriod("date_inscription", startOfLastMonth, endOfLastPeriod),
    ]);

    let percent;
    if (previous === 0) {
      percent = current === 0 ? 0 : 100;
    } else {
      percent = ((current - previous) / previous) * 100;
    }
    const rounded = Math.round(percent);
    return {
      current,
      previous,
      trend: `${rounded >= 0 ? "+" : ""}${rounded}%`,
      trendUp: rounded >= 0,
    };
  }
}

module.exports = AdherentService;
