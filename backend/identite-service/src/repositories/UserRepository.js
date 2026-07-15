const BaseRepository = require('./BaseRepository');
const { User } = require('../models');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return await this.model.findOne({
      where: { email }
    });
  }

  async findByRole(role) {
    return await this.model.findAll({
      where: { role }
    });
  }

  async findByCreatedBy(createdBy) {
    return await this.model.findAll({
      where: { created_by: createdBy }
    });
  }

  async findActiveUsers() {
    return await this.model.findAll({
      where: { active: true }
    });
  }

  async findInactiveUsers() {
    return await this.model.findAll({
      where: { active: false }
    });
  }

  async findWithMustChangePassword() {
    return await this.model.findAll({
      where: { must_change_password: true }
    });
  }
}

module.exports = UserRepository;
