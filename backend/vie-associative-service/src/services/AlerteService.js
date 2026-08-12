const { Op } = require("sequelize");
const BaseService = require("./BaseService");
const AlerteRepository = require("../repositories/AlerteRepository");
const { Adhesion, CertificatMedical } = require("../models");
const identiteClient = require("../utils/serviceClients/identiteClient");
const { withAdherentNames } = require("../utils/enrichAdherents");
const { sendAlerteRelanceEmail } = require("../utils/email");
const { NotFoundError, ForbiddenError } = require("../utils/errors");

const ALERT_TYPES = {
  adhesionExpiring: {
    preferred: "Adhesion expire bientot",
    fallback: "Adhésion expirée",
  },
  // Adhésion dont date_fin est déjà dépassée (pas seulement "bientôt") —
  // jusqu'ici seule la fenêtre des 30 prochains jours était couverte par
  // syncExpirationAlertes, une adhésion déjà expirée depuis longtemps ne
  // générait donc jamais cette alerte au passé, malgré son libellé/sa
  // description ("L'adhésion est arrivée à expiration") déjà prévus pour ça.
  adhesionExpired: {
    preferred: "Adhésion expirée",
    fallback: "Adhésion expirée",
  },
  certificatExpiring: {
    preferred: "Certificat expire bientot",
    fallback: "Certificat expiré",
  },
};

// Périmètre des alertes visibles par rôle de gestion (CDC : chaque
// responsable ne doit voir que ce qui relève de son domaine). Le
// président n'a pas d'entrée ici : canManageAlertes() + l'absence de
// clé dans cette table équivaut à "aucun filtre de type" (voit tout).
const ROLE_ALERT_TYPES = {
  tresorier: ["Paiement en retard"],
  moniteur: ["Formation", "Inactivite plongee"],
};

const ALERT_DESCRIPTIONS = {
  "Certificat expiré": "Le certificat médical a expiré",
  "Certificat expire bientot": "Le certificat médical expire dans moins de 30 jours",
  "Adhésion expirée": "L'adhésion est arrivée à expiration",
  "Adhesion expire bientot": "L'adhésion expire dans moins de 30 jours",
  "Paiement en retard": "Un paiement est en attente",
  Formation: "Une formation est disponible",
  "Materiel en retard": "Du matériel emprunté n'a pas été retourné à temps",
  "Inactivite plongee": "Aucune plongée enregistrée depuis longtemps",
};

class AlerteService extends BaseService {
  constructor() {
    const repository = new AlerteRepository();
    super(repository);
    this.alerteRepository = repository;
  }

  canManageAlertes(role) {
    const normalizedRole = this.normalizeRole(role);
    return ["president", "moniteur", "tresorier"].includes(normalizedRole);
  }

  normalizeRole(role) {
    return (role || "")
      .toString()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
  }

  // Adherent vit dans identite-service (autre process) : résolu par HTTP au
  // lieu d'un `Adherent.findOne` local.
  async getAdherentForUser(user) {
    if (!user || this.canManageAlertes(user.role)) return null;
    const adherent = await identiteClient.getAdherentForUser(user);
    if (!adherent) {
      throw new Error("Profil adhérent introuvable pour cet utilisateur");
    }
    return adherent;
  }

  async getScopeForUser(user) {
    const adherent = await this.getAdherentForUser(user);
    if (adherent) return { num_adherent: adherent.num_adherent };

    // Adhérent non trouvé (canManageAlertes === true) : filtrer par
    // domaine de responsabilité. Le président (absent de ROLE_ALERT_TYPES)
    // n'a aucune restriction et voit toutes les alertes.
    const allowedTypes = ROLE_ALERT_TYPES[this.normalizeRole(user?.role)];
    return allowedTypes ? { type: { [Op.in]: allowedTypes } } : {};
  }

  async getAll(options = {}, user = null, authHeader = null) {
    await this.syncExpirationAlertes();
    const scope = await this.getScopeForUser(user);
    const results = await super.getAll({ ...options, where: { ...options.where, ...scope } });
    return await withAdherentNames(results, authHeader);
  }

  async getUnread(user = null, authHeader = null) {
    await this.syncExpirationAlertes();
    const scope = await this.getScopeForUser(user);
    const results = await this.alerteRepository.findUnread(scope);
    return await withAdherentNames(results, authHeader);
  }

  async getByAdherent(num_adherent, user = null, authHeader = null) {
    await this.syncExpirationAlertes();
    const scope = await this.getScopeForUser(user);
    if (scope.num_adherent && scope.num_adherent !== num_adherent) {
      throw new Error("Accès refusé à ces alertes");
    }
    const results = await this.alerteRepository.findByAdherent(num_adherent);
    return await withAdherentNames(results, authHeader);
  }

  // Vérifie qu'une alerte tombe dans le périmètre (num_adherent pour un
  // adhérent, type pour un rôle métier restreint) — utilisé partout où on
  // accède à une alerte précise par id, pour ne pas se fier uniquement au
  // filtrage en amont des listes.
  alerteMatchesScope(alerte, scope) {
    if (scope.num_adherent && scope.num_adherent !== alerte.num_adherent) {
      return false;
    }
    if (scope.type && !scope.type[Op.in].includes(alerte.type)) {
      return false;
    }
    return true;
  }

  async getByIdForUser(id, user = null, authHeader = null) {
    const alerte = await this.alerteRepository.findById(id);
    if (!alerte) throw new NotFoundError("Alerte non trouvée");
    const scope = await this.getScopeForUser(user);
    if (!this.alerteMatchesScope(alerte, scope)) {
      throw new ForbiddenError("Accès refusé à cette alerte");
    }
    return await withAdherentNames(alerte, authHeader);
  }

  async relancerParEmail(id, user = null, authHeader = null) {
    if (!this.canManageAlertes(user?.role)) {
      throw new ForbiddenError("Seuls le président, un moniteur ou le trésorier peuvent relancer une alerte");
    }

    const alerte = await this.alerteRepository.findById(id);
    if (!alerte) throw new NotFoundError("Alerte non trouvée");

    const scope = await this.getScopeForUser(user);
    if (!this.alerteMatchesScope(alerte, scope)) {
      throw new ForbiddenError("Cette alerte ne relève pas de votre périmètre");
    }

    const adherent = await identiteClient.getAdherentById(alerte.num_adherent, authHeader);
    if (!adherent?.email) {
      throw new Error("Adresse email de l'adhérent introuvable");
    }

    await sendAlerteRelanceEmail({
      to: adherent.email,
      adherentName: `${adherent.prenom} ${adherent.nom}`,
      type: alerte.type,
      description: ALERT_DESCRIPTIONS[alerte.type] || alerte.type,
      idAlerte: alerte.id_alerte,
    });

    alerte.canal = "Email";
    alerte.date_envoi = new Date();
    alerte.statut = "Envoyé";
    alerte.read = false;
    await alerte.save();

    return await withAdherentNames(alerte, authHeader);
  }

  async markAsRead(id, user = null) {
    const scope = await this.getScopeForUser(user);
    return await this.alerteRepository.markAsRead(id, scope);
  }

  async markAllAsRead(user = null) {
    const scope = await this.getScopeForUser(user);
    return await this.alerteRepository.markAllAsRead(scope);
  }

  async getStats(user = null) {
    await this.syncExpirationAlertes();
    const scope = await this.getScopeForUser(user);
    return await this.alerteRepository.getStats(scope);
  }

  async getUnreadCount(user = null) {
    await this.syncExpirationAlertes();
    const scope = await this.getScopeForUser(user);
    return await this.alerteRepository.getUnreadCount(scope);
  }

  async createAlerte(data, authHeader = null) {
    const adherent = await identiteClient.getAdherentById(data.num_adherent, authHeader);
    if (!adherent) {
      throw new Error("Adhérent non trouvé");
    }

    return await this.alerteRepository.create({
      ...data,
      date_envoi: new Date(),
      statut: "Envoyé",
      read: false,
    });
  }

  async syncExpirationAlertes(days = 30) {
    const today = this.startOfDay(new Date());
    const limit = this.endOfDay(this.addDays(today, days));

    const [adhesionsExpirantBientot, adhesionsExpirees, certificats] = await Promise.all([
      Adhesion.findAll({
        where: {
          date_fin: { [Op.between]: [today, limit] },
          statut_paiement: "Payé",
        },
      }),
      // date_fin déjà dépassée (pas juste "bientôt") — voir ALERT_TYPES.
      // adhesionExpired.
      Adhesion.findAll({
        where: {
          date_fin: { [Op.lt]: today },
          statut_paiement: "Payé",
        },
      }),
      CertificatMedical.findAll({
        where: {
          date_validite: { [Op.between]: [today, limit] },
          statut: "Valide",
        },
      }),
    ]);

    for (const adhesion of adhesionsExpirantBientot) {
      await this.upsertAutomaticAlerte(
        adhesion.num_adherent,
        ALERT_TYPES.adhesionExpiring,
      );
    }

    for (const adhesion of adhesionsExpirees) {
      await this.upsertAutomaticAlerte(
        adhesion.num_adherent,
        ALERT_TYPES.adhesionExpired,
      );
    }

    for (const certificat of certificats) {
      await this.upsertAutomaticAlerte(
        certificat.num_adherent,
        ALERT_TYPES.certificatExpiring,
      );
    }
  }

  async upsertAutomaticAlerte(numAdherent, typeConfig) {
    const existing = await this.alerteRepository.findOne({
      num_adherent: numAdherent,
      type: { [Op.in]: [typeConfig.preferred, typeConfig.fallback] },
    });

    if (existing) {
      const updateData = {
        date_envoi: new Date(),
        statut: "Envoyé",
        read: false,
      };

      if (existing.type !== typeConfig.preferred) {
        updateData.type = typeConfig.preferred;
      }

      try {
        return await existing.update(updateData);
      } catch (error) {
        delete updateData.type;
        return await existing.update(updateData);
      }
    }

    try {
      return await this.alerteRepository.create({
        num_adherent: numAdherent,
        type: typeConfig.preferred,
        canal: "Notification",
        statut: "Envoyé",
        read: false,
        date_envoi: new Date(),
      });
    } catch (error) {
      return await this.alerteRepository.create({
        num_adherent: numAdherent,
        type: typeConfig.fallback,
        canal: "Notification",
        statut: "Envoyé",
        read: false,
        date_envoi: new Date(),
      });
    }
  }

  startOfDay(date) {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
  }

  endOfDay(date) {
    const value = new Date(date);
    value.setHours(23, 59, 59, 999);
    return value;
  }

  addDays(date, days) {
    const value = new Date(date);
    value.setDate(value.getDate() + days);
    return value;
  }

  async validateAlerteData(data) {
    const errors = [];

    if (!data.num_adherent) errors.push("L'adhérent est requis");
    if (!data.type) errors.push("Le type d'alerte est requis");
    if (!data.canal) errors.push("Le canal est requis");

    const validTypes = [
      "Certificat expiré",
      "Certificat expire bientot",
      "Adhésion expirée",
      "Adhesion expire bientot",
      "Paiement en retard",
      "Formation",
      "Materiel en retard",
      "Inactivite plongee",
    ];
    if (data.type && !validTypes.includes(data.type)) {
      errors.push("Type d'alerte invalide");
    }

    const validCanaux = ["Email", "SMS", "Notification"];
    if (data.canal && !validCanaux.includes(data.canal)) {
      errors.push("Canal invalide");
    }

    return errors;
  }
}

module.exports = AlerteService;
