const BaseRepository = require('./BaseRepository');
const { Composer, Palanquee } = require('../models');

class ComposerRepository extends BaseRepository {
  constructor() {
    super(Composer);
  }

  // ⚠️ Composer est identifié fonctionnellement par le couple (id_palanquee, num_adherent).
  // On surcharge findById/update/delete de BaseRepository (basés sur findByPk) pour
  // accepter un objet { id_palanquee, num_adherent } au lieu d'un id scalaire.
  async findById({ id_palanquee, num_adherent } = {}) {
    return await this.findComposition(id_palanquee, num_adherent);
  }

  async update({ id_palanquee, num_adherent } = {}, data) {
    const instance = await this.findComposition(id_palanquee, num_adherent);
    if (!instance) throw new Error('Composition non trouvée');
    return await instance.update(data);
  }

  async delete({ id_palanquee, num_adherent } = {}) {
    return await this.deleteComposition(id_palanquee, num_adherent);
  }

  async findComposition(id_palanquee, num_adherent) {
    return await this.model.findOne({ where: { id_palanquee, num_adherent } });
  }

  async deleteComposition(id_palanquee, num_adherent) {
    const instance = await this.model.findOne({ where: { id_palanquee, num_adherent } });
    if (!instance) throw new Error('Composition non trouvée');
    await instance.destroy();
    return true;
  }

  async findByAdherent(num_adherent) {
    return await this.model.findAll({
      where: { num_adherent },
      include: [{ model: Palanquee, as: 'palanquee' }]
    });
  }
}

module.exports = ComposerRepository;
