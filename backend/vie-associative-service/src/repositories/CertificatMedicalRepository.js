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
        statut: 'Valide'
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
      },
    });
  }
}

module.exports = CertificatMedicalRepository;
