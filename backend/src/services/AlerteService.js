const { Op } = require("sequelize");
const BaseService = require("./BaseService");
const AlerteRepository = require("../repositories/AlerteRepository");
const { Adherent, Adhesion, CertificatMedical } = require("../models");

const ALERT_TYPES = {
  adhesionExpiring: {
    preferred: "Adhesion expire bientot",
    fallback: "Adhésion expirée",
  },
  certificatExpiring: {
    preferred: "Certificat expire bientot",
    fallback: "Certificat expiré",
  },
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
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
  }

  async getAdherentForUser(user) {
    if (!user || this.canManageAlertes(user.role)) return null;
    const adherent = await Adherent.findOne({ where: { user_id: user.id } });
    if (!adherent) {
      throw new Error("Profil adhérent introuvable pour cet utilisateur");
    }
    return adherent;
  }

  async getScopeForUser(user) {
    const adherent = await this.getAdherentForUser(user);
    return adherent ? { num_adherent: adherent.num_adherent } : {};
  }

  async getAll(options = {}, user = null) {
    await this.syncExpirationAlertes();
    const scope = await this.getScopeForUser(user);
    return await super.getAll({ ...options, where: { ...options.where, ...scope } });
  }

  async getUnread(user = null) {
    await this.syncExpirationAlertes();
    const scope = await this.getScopeForUser(user);
    return await this.alerteRepository.findUnread(scope);
  }

  async getByAdherent(num_adherent, user = null) {
    await this.syncExpirationAlertes();
    const scope = await this.getScopeForUser(user);
    if (scope.num_adherent && scope.num_adherent !== num_adherent) {
      throw new Error("Accès refusé à ces alertes");
    }
    return await this.alerteRepository.findByAdherent(num_adherent);
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

  async createAlerte(data) {
    const adherent = await Adherent.findByPk(data.num_adherent);
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

    const [adhesions, certificats] = await Promise.all([
      Adhesion.findAll({
        where: {
          date_fin: { [Op.between]: [today, limit] },
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

    for (const adhesion of adhesions) {
      await this.upsertAutomaticAlerte(
        adhesion.num_adherent,
        ALERT_TYPES.adhesionExpiring,
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