const BaseService = require("./BaseService");
const UserRepository = require("../repositories/UserRepository");
const bcrypt = require("bcryptjs");

class UserService extends BaseService {
  constructor() {
    const repository = new UserRepository();
    super(repository);
    this.userRepository = repository;
  }

  // ✅ Créer un compte utilisateur (par le directeur technique)
  async createUserByDirector(data, createdBy) {
    const {
      email,
      name,
      role = "adherent",
      phone,
      contact_urgence,
      niveau,
      password, // ✅ mot de passe déjà généré et envoyé par email côté frontend
    } = data;

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new Error("Cet email est déjà utilisé");
    }

    // ✅ Utiliser le mot de passe fourni (celui déjà envoyé par email),
    // avec un fallback de sécurité si jamais il n'est pas fourni.
    const tempPassword = password || this.generateTempPassword();

    const user = await this.userRepository.create({
      email,
      password: tempPassword, // ✅ clair ici, hashé par le hook beforeCreate
      name,
      role,
      phone,
      contact_urgence,
      niveau,
      created_by: createdBy,
      must_change_password: true,
      active: true,
    });

    // ❌ Plus d'envoi d'email ici : le frontend l'a déjà envoyé
    // via /api/email/send-welcome avant d'appeler cette route.

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        must_change_password: user.must_change_password,
        active: user.active,
      },
      tempPassword,
    };
  }

  // ✅ Générer un mot de passe temporaire (fallback uniquement)
  generateTempPassword() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // ✅ Changer le mot de passe (pour l'utilisateur connecté)
  async changePassword(userId, oldPassword, newPassword) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    const isValid = await user.comparePassword(oldPassword);
    if (!isValid) {
      throw new Error("Ancien mot de passe incorrect");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.must_change_password = false;
    await user.save();

    return user;
  }

  async getAllUsers(filters = {}) {
    const { User } = require("../models");
    const where = {};
    if (filters.role && filters.role !== "all") where.role = filters.role;
    if (filters.status === "active") where.active = true;
    if (filters.status === "inactive") where.active = false;

    return await User.findAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["created_at", "DESC"]],
    });
  }

  // ✅ Réinitialiser le mot de passe (par le directeur technique)
  // Reste sur son propre flux : ici on génère bien un nouveau mot de passe
  // et on doit prévenir l'utilisateur (à connecter à ta route email dédiée
  // si tu veux notifier par email côté frontend, comme pour la création).
  async resetPasswordByDirector(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    const tempPassword = this.generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    user.password = hashedPassword;
    user.must_change_password = true;
    await user.save();

    return { user, tempPassword };
  }

  async changeNiveau(userId, niveau) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    user.niveau = niveau;
    await user.save();
    return user;
  }

  async changeRole(userId, role) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    user.role = role;
    await user.save();
    return user;
  }

  async disableAccount(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    user.active = false;
    await user.save();
    return user;
  }

  async enableAccount(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    user.active = true;
    await user.save();
    return user;
  }

  async deleteAccount(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    await user.destroy();
    return true;
  }

  async updateProfile(userId, data) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    const allowedFields = ["email", "phone", "contact_urgence", "name"];
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        user[field] = data[field];
      }
    });
    await user.save();
    return user;
  }

  async getUsersCreatedBy(directorId) {
    return await this.userRepository.findByCreatedBy(directorId);
  }

  async getUsersByRole(role) {
    return await this.userRepository.findByRole(role);
  }
}

module.exports = UserService;
