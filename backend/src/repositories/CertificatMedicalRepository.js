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
}

module.exports = CertificatMedicalRepository;