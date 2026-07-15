const BaseService = require('./BaseService');
const ComposerRepository = require('../repositories/ComposerRepository');

class ComposerService extends BaseService {
  constructor() {
    const repository = new ComposerRepository();
    super(repository);
    this.composerRepository = repository;
  }

  async getByAdherent(num_adherent) {
    return await this.composerRepository.findByAdherent(num_adherent);
  }

  async deleteComposition(id_palanquee, num_adherent) {
    return await this.composerRepository.deleteComposition(id_palanquee, num_adherent);
  }

  async validateComposerData(data) {
    const errors = [];

    if (!data.id_palanquee) errors.push("La palanquée est requise");
    if (!data.num_adherent) errors.push("L'adhérent est requis");

    return errors;
  }
}

module.exports = ComposerService;
