const BaseService = require("./BaseService");
const UserRepository = require("../repositories/UserRepository");
const { sendEmail } = require("../utils/email");
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
    } = data;

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new Error("Cet email est déjà utilisé");
    }

    // ✅ Générer le mot de passe temporaire EN CLAIR
    // Le hook beforeCreate dans User.js va le hacher automatiquement
    const tempPassword = this.generateTempPassword();

    const user = await this.userRepository.create({
      email,
      password: tempPassword, // ✅ clair ici, hashé par le hook
      name,
      role,
      phone,
      contact_urgence,
      niveau,
      created_by: createdBy,
      must_change_password: true,
      active: true,
    });

    // Envoyer l'email avec le mot de passe en clair
    await sendEmail({
      to: email,
      subject: "Bienvenue au Plongée Club - Vos identifiants de connexion",
      template: "welcome",
      data: {
        name,
        email,
        tempPassword, // ✅ mot de passe en clair pour l'email
        loginUrl: `${process.env.FRONTEND_URL}/login`,
      },
    });

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
      tempPassword, // ✅ retourné pour affichage dans l'interface
    };
  }

  // ✅ Générer un mot de passe temporaire
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

    // Vérifier l'ancien mot de passe
    const isValid = await user.comparePassword(oldPassword);
    if (!isValid) {
      throw new Error("Ancien mot de passe incorrect");
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.must_change_password = false;
    await user.save();

    return user;
  }

  // Dans backend/src/services/UserService.js — ajouter à la fin
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

    // Envoyer un email avec le nouveau mot de passe
    await sendEmail({
      to: user.email,
      subject: "Réinitialisation de votre mot de passe",
      template: "reset-password",
      data: {
        name: user.name,
        tempPassword,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
      },
    });

    return { user, tempPassword };
  }

  // ✅ Changer le niveau (uniquement par le DT)
  async changeNiveau(userId, niveau) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    user.niveau = niveau;
    await user.save();

    return user;
  }

  // ✅ Changer le rôle (uniquement par le DT)
  async changeRole(userId, role) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    user.role = role;
    await user.save();

    return user;
  }

  // ✅ Désactiver un compte (uniquement par le DT)
  async disableAccount(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    user.active = false;
    await user.save();

    return user;
  }

  // ✅ Réactiver un compte (uniquement par le DT)
  async enableAccount(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    user.active = true;
    await user.save();

    return user;
  }

  // ✅ Supprimer un compte (uniquement par le DT)
  async deleteAccount(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    await user.destroy();
    return true;
  }

  // ✅ Mettre à jour le profil (pour l'utilisateur connecté)
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

  // ✅ Récupérer les utilisateurs créés par un DT
  async getUsersCreatedBy(directorId) {
    return await this.userRepository.findByCreatedBy(directorId);
  }

  // ✅ Récupérer les utilisateurs par rôle
  async getUsersByRole(role) {
    return await this.userRepository.findByRole(role);
  }
}

module.exports = UserService;
