const BaseService = require("./BaseService");
const UserRepository = require("../repositories/UserRepository");
const { ForbiddenError, ValidationError } = require("../utils/errors");

// Chaque rôle métier a une fiche métier avec des champs obligatoires que le
// formulaire générique "Utilisateurs → Nouvel utilisateur" ne collecte pas
// (Adherent: civilité, date de naissance, adresse... / Moniteur: numéro de
// brevet... / Trésorier et Président: année en poste...). Un compte créé
// depuis ce formulaire générique serait orphelin (sans fiche) et bloquerait
// ensuite sa création depuis la page dédiée (email déjà utilisé). Chaque
// page dédiée crée elle-même le compte via `createUserByDirector`.
const DEDICATED_PAGE_BY_ROLE = {
  adherent: "Adhérents → Nouvel adhérent",
  moniteur: "Moniteurs → Nouveau moniteur",
  tresorier: "Trésoriers → Nouveau trésorier",
  president: "Présidents → Nouveau président",
};

class UserService extends BaseService {
  constructor() {
    const repository = new UserRepository();
    super(repository);
    this.userRepository = repository;
  }

  // Point d'entrée du formulaire générique "Utilisateurs → Nouvel
  // utilisateur". Les rôles métier ont chacun leur propre écran dédié qui
  // crée à la fois le compte ET la fiche associée en appelant directement
  // `createUserByDirector` (AdherentService/MoniteurService/TresorierService) —
  // ce garde-fou ne doit s'appliquer qu'à ce point d'entrée générique.
  async createGenericUser(data, requestingUser) {
    const canCreateUser =
      requestingUser?.role === "president" ||
      (requestingUser?.hasPermission &&
        requestingUser.hasPermission("manage_users"));
    if (!canCreateUser) {
      throw new ForbiddenError(
        "Accès refusé - Vous n'avez pas les permissions pour créer un utilisateur",
      );
    }

    const dedicatedPage = DEDICATED_PAGE_BY_ROLE[data.role];
    if (dedicatedPage) {
      throw new ValidationError(
        `Un compte "${data.role}" doit être créé depuis la page "${dedicatedPage}", qui crée automatiquement le compte de connexion et sa fiche associée`,
      );
    }

    return this.createUserByDirector(data, requestingUser.id);
  }

  // Créer un compte utilisateur (par le directeur technique)
  async createUserByDirector(data, createdBy) {
    const {
      email,
      name,
      role = "adherent",
      phone,
      password, // mot de passe déjà généré et envoyé par email côté frontend
    } = data;

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new Error("Cet email est déjà utilisé");
    }

    // Utiliser le mot de passe fourni (celui déjà envoyé par email),
    // avec un fallback de sécurité si jamais il n'est pas fourni.
    const tempPassword = password || this.generateTempPassword();

    const user = await this.userRepository.create({
      email,
      password: tempPassword, // clair ici, hashé par le hook beforeCreate
      name,
      role,
      phone,
      created_by: createdBy,
      must_change_password: true,
      active: true,
    });

    // Plus d'envoi d'email ici : le frontend l'a déjà envoyé
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

  // Générer un mot de passe temporaire (fallback uniquement)
  generateTempPassword() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Changer le mot de passe (pour l'utilisateur connecté)
  async changePassword(userId, oldPassword, newPassword) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    const isValid = await user.comparePassword(oldPassword);
    if (!isValid) {
      throw new Error("Ancien mot de passe incorrect");
    }

    // Mot de passe en clair ici : le hook beforeUpdate du modèle User le
    // hashe déjà à la sauvegarde (le hasher ici en plus produirait un
    // double hash, et le mot de passe communiqué ne fonctionnerait jamais).
    user.password = newPassword;
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

  // Réinitialiser le mot de passe (par le directeur technique)
  async resetPasswordByDirector(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    const tempPassword = this.generateTempPassword();

    user.password = tempPassword;
    user.must_change_password = true;
    await user.save();

    return { user, tempPassword };
  }

  async changeNiveau(userId, niveau) {
    const { Adherent } = require("../models");
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    const adherent = await Adherent.findOne({ where: { user_id: userId } });
    if (!adherent) {
      throw new Error("Aucune fiche adhérent associée à cet utilisateur");
    }
    adherent.niveau = niveau;
    adherent.date_obtention_niveau = new Date();
    await adherent.save();
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

  // Photo prise/uploadée par un président pour le compte d'un autre
  // utilisateur (ex: adhérent dont le compte n'a jamais été utilisé) —
  // complète `updateProfile` qui est self-service uniquement.
  async updatePhoto(userId, photoPath) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    user.photo = photoPath;
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

  // RGPD (droit à l'oubli) : anonymiser plutôt que supprimer (DELETE en
  // base cassait les références détenues par d'autres services —
  // paiements, certificats, adhésions — qui pointent sur num_adherent/
  // user_id sans jamais les recevoir en cascade). Les données identifiantes
  // sont remplacées, le compte est désactivé et son mot de passe rendu
  // inutilisable ; l'historique métier (sorties, paiements...) reste
  // intact mais dépersonnalisé.
  async deleteAccount(userId) {
    const { Adherent } = require("../models");
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    const crypto = require("crypto");
    const anonymousEmail = `compte-supprime-${user.id}@anonyme.local`;

    user.name = `Compte supprimé #${user.id}`;
    user.email = anonymousEmail;
    user.phone = null;
    user.photo = null;
    user.preferences = null;
    user.password = crypto.randomUUID();
    user.active = false;
    user.otp_code_hash = null;
    user.otp_expires_at = null;
    user.otp_attempts = 0;
    await user.save();

    const adherent = await Adherent.findOne({ where: { user_id: userId } });
    if (adherent) {
      adherent.nom = "Anonymisé";
      adherent.prenom = "Anonymisé";
      adherent.date_naissance = new Date("1900-01-01");
      adherent.adresse = "Adresse supprimée";
      adherent.telephone = "0000000000";
      adherent.email = anonymousEmail;
      adherent.contact_urgence = null;
      adherent.photo = null;
      adherent.statut = "Ancien";
      await adherent.save();
    }

    return true;
  }

  async updateProfile(userId, data) {
    const { Adherent } = require("../models");
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    const allowedFields = ["email", "phone", "name", "photo"];
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        user[field] = data[field];
      }
    });
    await user.save();

    if (data.contact_urgence !== undefined) {
      const adherent = await Adherent.findOne({ where: { user_id: userId } });
      if (adherent) {
        adherent.contact_urgence = data.contact_urgence;
        await adherent.save();
      }
    }

    return user;
  }

  async getUsersCreatedBy(directorId) {
    return await this.userRepository.findByCreatedBy(directorId);
  }

  async getUsersByRole(role) {
    return await this.userRepository.findByRole(role);
  }

  // Endpoint interne : utilisé par activites-service pour afficher qui a
  // pointé une présence (Sortie.inscriptions[].checker), sans exposer tout
  // le compte (mot de passe, préférences...).
  async getBasicById(id) {
    const user = await this.userRepository.findById(id);
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email };
  }

  // RGPD (droit d'accès/portabilité) : export des données personnelles du
  // compte connecté, détenues par identite-service (compte + fiche
  // adhérent). N'inclut pas l'historique métier détenu par les autres
  // services (paiements, sorties...) — hors périmètre de ce premier export.
  async exportMyData(userId) {
    const { Adherent } = require("../models");
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    const adherent = await Adherent.findOne({ where: { user_id: userId } });

    return {
      genere_le: new Date().toISOString(),
      compte: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        active: user.active,
        last_login: user.last_login,
        preferences: user.preferences,
        created_at: user.created_at,
      },
      fiche_adherent: adherent
        ? {
            num_adherent: adherent.num_adherent,
            civilite: adherent.civilite,
            nom: adherent.nom,
            prenom: adherent.prenom,
            date_naissance: adherent.date_naissance,
            adresse: adherent.adresse,
            telephone: adherent.telephone,
            email: adherent.email,
            contact_urgence: adherent.contact_urgence,
            niveau: adherent.niveau,
            num_brevet: adherent.num_brevet,
            num_licence_ffesm: adherent.num_licence_ffesm,
            statut: adherent.statut,
            date_inscription: adherent.date_inscription,
          }
        : null,
    };
  }
}

module.exports = UserService;
