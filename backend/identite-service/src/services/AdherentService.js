// backend/services/AdherentService.js
const BaseService = require("./BaseService");
const AdherentRepository = require("../repositories/AdherentRepository");
const { getAdherentForUser } = require("../utils/roleScope");
const paiementClient = require("../utils/serviceClients/paiementClient");
const vieAssociativeClient = require("../utils/serviceClients/vieAssociativeClient");
const activitesClient = require("../utils/serviceClients/activitesClient");
const { sendCommunicationEmail } = require("../utils/email");
const { friendlyUniqueConstraintMessage } = require("../utils/uniqueConstraintMessage");

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

  // nb_plongees_reelles/profondeur_max_reelle/duree_totale_reelle sont
  // calculés à la volée depuis activites-service (carnets Plongee réellement
  // enregistrés), affichés à côté de nb_plongees_total qui reste un champ
  // éditable manuellement (point de départ/historique, pilote le niveau
  // sélectionnable côté formulaire). Best-effort : si activites-service est
  // indisponible, ces champs restent `null` sans faire échouer l'affichage
  // de la fiche adhérent.
  async getById(id, user = null, authHeader = null) {
    await this.assertCanAccessAdherent(id, user);
    const adherent = await this.repository.findByIdWithPhoto(id);
    if (!adherent) return adherent;
    const carnetStats = await activitesClient.getCarnetStats(id, authHeader);
    return {
      ...adherent,
      nb_plongees_reelles: carnetStats?.count ?? null,
      profondeur_max_reelle: carnetStats?.profondeurMax ?? null,
      duree_totale_reelle: carnetStats?.dureeTotale ?? null,
    };
  }

  // Crée l'adhérent ; si aucun user_id n'est fourni, réutilise un compte
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
        throw new Error(friendlyUniqueConstraintMessage(error));
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
  // dont toutes les compétences de la check-list sont validées. `extra`
  // (num_brevet/num_licence_ffesm) est optionnel et laissé intact si non
  // fourni (ex: passage automatique via tryAutoComplete, sans saisie
  // humaine) — seul un moniteur/président qui valide la formation à la main
  // connaît les numéros réellement délivrés à ce moment-là.
  async updateNiveau(num_adherent, niveau, extra = {}) {
    const adherent = await this.repository.findById(num_adherent);
    if (!adherent) throw new Error("Adhérent non trouvé");

    const ancienNiveau = adherent.niveau;

    adherent.niveau = niveau;
    adherent.date_obtention_niveau = new Date();
    if (extra.num_brevet !== undefined) adherent.num_brevet = extra.num_brevet || null;
    if (extra.num_licence_ffesm !== undefined) {
      adherent.num_licence_ffesm = extra.num_licence_ffesm || null;
    }
    await adherent.save();

    // Historique (table Brevet) : une ligne par vrai changement de niveau,
    // jamais sur un no-op (ex. re-validation d'une formation déjà à ce
    // niveau) — adherent.niveau/date_obtention_niveau ci-dessus restent le
    // cache "niveau courant" utilisé partout ailleurs (isNiveauCompatible
    // etc.), cette table ne fait qu'empiler l'historique en plus.
    if (niveau !== ancienNiveau) {
      const { Brevet } = require("../models");
      await Brevet.create({
        num_adherent,
        niveau,
        num_brevet: adherent.num_brevet,
        date_obtention: adherent.date_obtention_niveau,
      });
    }

    return adherent;
  }

  async getAdherentStats() {
    const total = await this.repository.count();
    // Un invité (CDC 3.2.1) n'est pas un membre du club : exclu du décompte
    // "adhérents actifs" (CDC 3.6.2), même s'il est statut "Actif" pour la
    // durée de sa venue.
    const active = await this.repository.count({ statut: "Actif", est_invite: false });
    const inactive = await this.repository.count({ statut: "Inactif" });
    const suspended = await this.repository.count({ statut: "Suspendu" });
    const enFormation = await this.repository.count({ statut: "En formation" });
    const ancien = await this.repository.count({ statut: "Ancien" });

    return {
      total,
      active,
      inactive,
      suspended,
      enFormation,
      ancien,
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
    } else if (validated.date_obtention_niveau === "") {
      // Un adhérent dont le niveau n'a pas (encore) de date d'obtention
      // connue recharge ce champ en chaîne vide côté formulaire (valeur
      // initiale null). Contrairement à null, "" n'est pas exemptée par
      // allowNull et fait échouer le validateur isDate du modèle (400 à
      // chaque mise à jour tant que ce champ n'est pas renseigné).
      validated.date_obtention_niveau = null;
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

  // Communication ciblée (CDC 3.6.1) : envoi d'un message libre à tous les
  // adhérents Actifs correspondant au segment demandé (niveau et/ou
  // ancienneté minimale). Best-effort — un envoi en échec n'interrompt pas
  // les autres, le compte retourné ne reflète que les envois réussis.
  async sendCommunication({ niveau, ancienneteMinAnnees, subject, message }) {
    if (!subject) throw new Error("L'objet du message est requis");
    if (!message) throw new Error("Le message est requis");

    const adherents = await this.repository.findBySegment({ niveau, ancienneteMinAnnees });
    let sent = 0;
    for (const adherent of adherents) {
      if (!adherent.email) continue;
      try {
        await sendCommunicationEmail({
          to: adherent.email,
          adherentName: `${adherent.prenom} ${adherent.nom}`,
          subject,
          message,
        });
        sent += 1;
      } catch (error) {
        console.error(`Erreur envoi communication (adhérent ${adherent.num_adherent}):`, error.message);
      }
    }
    return { matched: adherents.length, sent };
  }
}

module.exports = AdherentService;
