const BaseRepository = require('./BaseRepository');
const { CertificatMedical } = require('../models');
const { Op } = require('sequelize');

class CertificatMedicalRepository extends BaseRepository {
  constructor() {
    super(CertificatMedical);
  }

  async findValidCertificates() {
    const today = new Date();
    return await this.model.findAll({
      where: {
        date_validite: { [Op.gte]: today },
        statut: 'Valide',
        statut_validation: 'Validé',
      }
    });
  }

  async findExpiredCertificates() {
    const today = new Date();
    return await this.model.findAll({
      where: {
        date_validite: { [Op.lt]: today },
        statut: 'Valide'
      }
    });
  }

  async findByAdherent(num_adherent) {
    return await this.model.findAll({
      where: { num_adherent },
      order: [['date_validite', 'DESC']]
    });
  }

  // Utilisé par le monolithe (AdherentController.getWithExpiringCertificates)
  // via HTTP : liste des num_adherent dont un certificat valide expire dans
  // les `days` prochains jours.
  async findExpiringSoon(days = 30) {
    const today = new Date();
    const limit = new Date(today);
    limit.setDate(today.getDate() + days);
    return await this.model.findAll({
      where: {
        date_validite: { [Op.between]: [today, limit] },
        statut: 'Valide',
        statut_validation: 'Validé',
      },
    });
  }

  // Corrige en base les certificats dont `statut` est resté "Valide" alors
  // que leur date de validité est dépassée — `statut` est saisi manuellement
  // (par le moniteur/président) et ne se recalcule jamais tout seul sinon.
  // Appelé quotidiennement (voir app.js, même schéma que
  // AlerteService.syncExpirationAlertes) pour que la colonne reste fiable
  // pour tout consommateur qui la lit directement (SQL, exports...), en
  // complément de la correction dynamique faite côté service à la lecture.
  async expireOverdue() {
    const today = new Date();
    const [count] = await this.model.update(
      { statut: 'Expiré' },
      { where: { date_validite: { [Op.lt]: today }, statut: 'Valide' } },
    );
    return count;
  }
}

module.exports = CertificatMedicalRepository;
