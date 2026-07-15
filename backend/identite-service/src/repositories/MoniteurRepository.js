const BaseRepository = require('./BaseRepository');
const { Moniteur, User } = require('../models');

const WITH_USER = [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }];

class MoniteurRepository extends BaseRepository {
  constructor() {
    super(Moniteur);
  }

  async findAll(options = {}) {
    return await this.model.findAll({ include: WITH_USER, ...options });
  }

  async findByUserId(user_id) {
    return await this.model.findOne({ where: { user_id } });
  }

  async findBySpecialite(specialite) {
    const moniteurs = await this.model.findAll();
    return moniteurs.filter((moniteur) => {
      const specialites = moniteur.specialites;
      if (!specialites) return false;
      if (Array.isArray(specialites)) {
        return specialites.includes(specialite);
      }
      return false;
    });
  }

  async findDisponibles() {
    return await this.model.findAll();
  }
}

module.exports = MoniteurRepository;
