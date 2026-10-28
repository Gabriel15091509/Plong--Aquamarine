const BaseRepository = require('./BaseRepository');
const { Reparation } = require('../models');

class ReparationRepository extends BaseRepository {
  constructor() {
    super(Reparation);
  }

  async findByMateriel(num_inventaire) {
    return await this.model.findAll({
      where: { num_inventaire },
      order: [['date_constat', 'DESC']]
    });
  }

  async findEnCours() {
    return await this.model.findAll({
      where: { statut: 'En cours' }
    });
  }

  // Réparation "En cours" pour CE matériel précis — voir
  // MaterielService.assertPasDeReparationActive, qui s'en sert pour
  // empêcher de remettre un matériel "Bon"/"Neuf"/"Local" tant que sa
  // réparation n'est pas terminée.
  async findActiveByMateriel(num_inventaire) {
    return await this.model.findOne({
      where: { num_inventaire, statut: 'En cours' },
    });
  }
}

module.exports = ReparationRepository;
