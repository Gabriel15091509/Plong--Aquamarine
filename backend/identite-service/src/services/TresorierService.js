const BaseService = require('./BaseService');
const TresorierRepository = require('../repositories/TresorierRepository');
const UserService = require('./UserService');

class TresorierService extends BaseService {
  constructor() {
    const repository = new TresorierRepository();
    super(repository);
    this.tresorierRepository = repository;
    this.userService = new UserService();
  }

  // Si aucun user_id n'est fourni, réutilise un compte existant pour cet
  // email (ex: créé au préalable via "Gestion des utilisateurs") plutôt que
  // d'échouer avec "email déjà utilisé", sinon crée le compte.
  async create(data) {
    let user_id = data.user_id;
    let welcomeEmail = null;

    if (!user_id) {
      const { User } = require('../models');
      const existingUser = await User.findOne({ where: { email: data.email } });

      if (existingUser) {
        const existingTresorier = await this.tresorierRepository.findByUserId(existingUser.id);
        if (existingTresorier) {
          throw new Error('Une fiche trésorier est déjà associée à cet email');
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
            role: 'tresorier',
            phone: data.phone
          },
          data.created_by || null
        );
        user_id = user.id;
        welcomeEmail = { to: user.email, name: user.name, role: user.role, tempPassword };
      }
    }

    try {
      const tresorier = await this.tresorierRepository.create({
        user_id,
        annee_en_poste: data.annee_en_poste
      });
      const plain = tresorier.toJSON();
      return welcomeEmail ? { ...plain, _welcomeEmail: welcomeEmail } : plain;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error('Une fiche trésorier existe déjà pour ce compte');
      }
      throw error;
    }
  }

  async getByUserId(user_id) {
    return await this.tresorierRepository.findByUserId(user_id);
  }

  async getByAnnee(annee) {
    return await this.tresorierRepository.findByAnnee(annee);
  }

  async validateTresorierData(data) {
    const errors = [];

    if (!data.user_id) {
      if (!data.email) errors.push('L\'email est requis pour créer le compte du trésorier');
      if (!data.name) errors.push('Le nom est requis pour créer le compte du trésorier');
    }

    return errors;
  }
}

module.exports = TresorierService;
