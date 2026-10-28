const BaseService = require('./BaseService');
const MoniteurRepository = require('../repositories/MoniteurRepository');
const UserService = require('./UserService');
const { isNiveauCompatible } = require('../utils/roleScope');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');

const NIVEAU_MIN_MONITEUR = 'Niveau 4';

class MoniteurService extends BaseService {
  constructor() {
    const repository = new MoniteurRepository();
    super(repository);
    this.moniteurRepository = repository;
    this.userService = new UserService();
  }

  // Si aucun user_id n'est fourni, réutilise un compte existant pour cet
  // email (ex: créé au préalable via "Gestion des utilisateurs") plutôt que
  // d'échouer avec "email déjà utilisé", sinon crée le compte.
  async create(data) {
    let user_id = data.user_id;
    let welcomeEmail = null;
    const { User } = require('../models');

    if (!user_id) {
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
    } else {
      // Compte explicitement lié (ex. un adhérent Niveau 4+ choisi dans
      // "Lier un compte existant", voir MoniteurForm.jsx) dont le rôle
      // n'est pas encore "moniteur" : le promouvoir ici. Sans ça, la fiche
      // moniteur existerait mais le compte resterait bloqué aux
      // permissions "adherent" — c'est le rôle, pas la présence d'une
      // fiche, qui gouverne les accès (voir authMiddleware). C'est
      // désormais la seule voie de promotion vers "moniteur" (le
      // changement de rôle libre a été retiré du menu ⚙️ de gestion de
      // compte, AccountActionsMenu.jsx côté frontend).
      const linkedUser = await User.findByPk(user_id);
      if (linkedUser && linkedUser.role !== 'moniteur') {
        await this.userService.changeRole(user_id, 'moniteur');
      }
    }

    try {
      const moniteur = await this.moniteurRepository.create({
        user_id,
        niveau: data.niveau,
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

  async getDisponibles(jour) {
    return await this.moniteurRepository.findDisponibles(jour);
  }

  // Toggle "disponible pour être désigné encadrant" + motif — distinct de
  // la mise à jour générale (PUT /:id, présidence uniquement) : un moniteur
  // doit pouvoir se déclarer indisponible lui-même (congés, arrêt...) sans
  // dépendre du président, mais seulement sur SA PROPRE fiche — d'où le
  // contrôle self-or-président ici plutôt qu'un simple rôle sur la route
  // (voir moniteurRoutes.js : ROLES.PRESIDENT_MONITEUR, trop large seul).
  async updateDisponibilite(id, { disponible, cause }, requestingUser) {
    const moniteur = await this.moniteurRepository.findById(id);
    if (!moniteur) {
      throw new NotFoundError("Moniteur non trouvé");
    }

    if (
      requestingUser?.role === "moniteur" &&
      moniteur.user_id !== requestingUser.id
    ) {
      throw new ForbiddenError(
        "Vous ne pouvez modifier que votre propre disponibilité",
      );
    }

    const dispo = !!disponible;
    if (!dispo && !cause?.trim()) {
      throw new ValidationError(
        "Un motif est requis pour se déclarer indisponible",
      );
    }

    return await this.moniteurRepository.update(id, {
      disponible: dispo,
      // Motif vidé dès que le moniteur redevient disponible : jamais
      // affiché comme "raison" d'une indisponibilité qui n'existe plus.
      cause_indisponibilite: dispo ? null : cause.trim(),
    });
  }

  async validateMoniteurData(data) {
    const errors = [];

    if (!data.niveau) {
      errors.push('Le niveau est requis');
    } else if (!isNiveauCompatible(data.niveau, NIVEAU_MIN_MONITEUR)) {
      errors.push(`Niveau insuffisant pour encadrer (niveau minimum requis : ${NIVEAU_MIN_MONITEUR})`);
    }
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
