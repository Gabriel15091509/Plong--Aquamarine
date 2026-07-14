// backend/services/AdherentService.js
const BaseService = require("./BaseService");
const AdherentRepository = require("../repositories/AdherentRepository");
const { getAdherentForUser } = require("../utils/roleScope");

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
        // ✅ Compte jamais utilisé (créé mais son mot de passe n'a jamais été
        // communiqué, ex: tentative précédente interrompue) : on régénère un
        // mot de passe et on l'envoie maintenant, sinon la personne se
        // retrouve avec un compte dont elle ne connaîtra jamais le mot de
        // passe. Si le compte a déjà servi (last_login), on n'y touche pas.
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
        // ✅ transmis au frontend pour l'envoi de l'email de bienvenue
        // (le mot de passe temporaire n'existe qu'en clair à cet instant)
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

  // ✅ AJOUTER CETTE MÉTHODE MANQUANTE
  async getAdherentByEmail(email) {
    return await this.repository.findByEmail(email);
  }

  // ✅ AJOUTER CETTE MÉTHODE MANQUANTE
  async getAdherentsByNiveau(niveau) {
    return await this.repository.findByNiveau(niveau);
  }

  // ✅ AJOUTER CETTE MÉTHODE MANQUANTE
  async searchAdherents(query) {
    return await this.repository.search(query);
  }

  async getAdherentWithDetails(id, user = null) {
    await this.assertCanAccessAdherent(id, user);
    return await this.repository.findWithDetails(id);
  }

  async getActiveAdherents() {
    return await this.repository.findActiveAdherents();
  }

  async getAdherentsWithExpiringCertificates() {
    return await this.repository.findAdherentsWithExpiringCertificates();
  }

  async incrementPlongeesCount(num_adherent) {
    const adherent = await this.repository.findById(num_adherent);
    if (!adherent) throw new Error("Adhérent non trouvé");

    adherent.nb_plongees_total = (adherent.nb_plongees_total || 0) + 1;
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
}

module.exports = AdherentService;
