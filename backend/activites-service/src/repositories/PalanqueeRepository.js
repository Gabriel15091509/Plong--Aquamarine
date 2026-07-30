const BaseRepository = require('./BaseRepository');
const { Palanquee, Composer } = require('../models');

// Adherent (identite-service) a quitté ce schéma : plus d'include imbriqué
// sur Composer.adherent ici — voir PalanqueeService qui recompose via
// identiteClient après chaque appel qui en a besoin.
const WITH_COMPOSERS = [
  {
    model: Composer,
    as: 'composers',
  },
];

class PalanqueeRepository extends BaseRepository {
  constructor() {
    super(Palanquee);
  }

  async findByIdDetailed(id) {
    return await this.model.findByPk(id, { include: WITH_COMPOSERS });
  }

  async findAllDetailed() {
    return await this.model.findAll({
      include: WITH_COMPOSERS,
      order: [['created_at', 'DESC']],
    });
  }

  async findByPlongee(id_plongee) {
    return await this.model.findAll({
      where: { id_plongee },
      include: WITH_COMPOSERS,
    });
  }

  async findBySortie(id_sortie) {
    return await this.model.findAll({
      where: { id_sortie },
      include: WITH_COMPOSERS,
      // Ordre stable : la constitution automatique (voir
      // PalanqueeService.autoConstituerPourPresence) remplit les palanquées
      // existantes dans leur ordre de création avant d'en ouvrir une nouvelle.
      order: [['created_at', 'ASC']],
    });
  }

  async findByMoniteur(id_moniteur_encadrant) {
    return await this.model.findAll({
      where: { id_moniteur_encadrant },
      include: WITH_COMPOSERS,
      order: [['created_at', 'DESC']],
    });
  }

  async findByAdherent(num_adherent) {
    return await this.model.findAll({
      include: [
        {
          model: Composer,
          as: 'composers',
          where: { num_adherent },
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }
}

module.exports = PalanqueeRepository;
