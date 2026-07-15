const BaseService = require('./BaseService');
const MoniteurRepository = require('../repositories/MoniteurRepository');
const UserService = require('./UserService');

class MoniteurService extends BaseService {
  constructor() {
    const repository = new MoniteurRepository();
    super(repository);
    this.moniteurRepository = repository;
    this.userService = new UserService();
  }

  // ✅ Si aucun user_id n'est fourni, réutilise un compte existant pour cet
  // email (ex: créé au préalable via "Gestion des utilisateurs") plutôt que
  // d'échouer avec "email déjà utilisé", sinon crée le compte.
  async create(data) {
    let user_id = data.user_id;
    let welcomeEmail = null;

    if (!user_id) {
      const { User } = require('../models');
      const existingUser = await User.findOne({ where: { email: data.email } });

      if (existingUser) {
        const existingMoniteur = await this.moniteurRepository.findByUserId(existingUser.id);
        if (existingMoniteur) {
          throw new Error('Une fiche moniteur est déjà associée à cet email');
        }
        user_id = existingUser.id;
        if (!existingUser.last_login) {
          const { tempPassword } = await this.userService.resetPasswordByDirector(existingUser.id);
          welcomeEmail = {
            to: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
            tempPassword,
          };
        }
      } else {
        const { user, tempPassword } = await this.userService.createUserByDirector(
          {
            email: data.email,
            name: data.name,
            role: 'moniteur',
            phone: data.phone
          },
          data.created_by || null
        );
        user_id = user.id;
        welcomeEmail = { to: user.email, name: user.name, role: user.role, tempPassword };
      }
    }

    try {
      const moniteur = await this.moniteurRepository.create({
        user_id,
        num_brevet: data.num_brevet,
        date_obtention_brevet: data.date_obtention_brevet,
        specialites: data.specialites,
        disponibilites: data.disponibilites
      });
      const plain = moniteur.toJSON();
      return welcomeEmail ? { ...plain, _welcomeEmail: welcomeEmail } : plain;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error('Une fiche moniteur existe déjà pour ce compte');
      }
      throw error;
    }
  }

  async getByUserId(user_id) {
    return await this.moniteurRepository.findByUserId(user_id);
  }

  async getBySpecialite(specialite) {
    return await this.moniteurRepository.findBySpecialite(specialite);
  }

  async getDisponibles() {
    return await this.moniteurRepository.findDisponibles();
  }

  async validateMoniteurData(data) {
    const errors = [];

    if (!data.num_brevet) errors.push('Le numéro de brevet est requis');
    if (!data.date_obtention_brevet) errors.push('La date d\'obtention du brevet est requise');

    if (!data.user_id) {
      if (!data.email) errors.push('L\'email est requis pour créer le compte du moniteur');
      if (!data.name) errors.push('Le nom est requis pour créer le compte du moniteur');
    }

    return errors;
  }
}

module.exports = MoniteurService;
