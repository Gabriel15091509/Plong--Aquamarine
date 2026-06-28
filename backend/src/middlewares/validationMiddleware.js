const Joi = require('joi');

class ValidationMiddleware {
  static validate(schema) {
    return (req, res, next) => {
      const { error } = schema.validate(req.body, { abortEarly: false });
      
      if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({
          success: false,
          errors
        });
      }
      
      next();
    };
  }

  static adherentSchema = Joi.object({
    civilite: Joi.string().valid('M.', 'Mme', 'Mlle').required(),
    nom: Joi.string().max(50).required(),
    prenom: Joi.string().max(50).required(),
    date_naissance: Joi.date().required(),
    adresse: Joi.string().max(200).required(),
    telephone: Joi.string().max(20).required(),
    email: Joi.string().email().max(100).required(),
    contact_urgence: Joi.string().max(100).allow(null, ''),
    niveau: Joi.string().valid('Débutant', 'Niveau 1', 'Niveau 2', 'Niveau 3', 'Niveau 4', 'Moniteur').allow(null, ''),
    date_obtention_niveau: Joi.date().allow(null),
    statut: Joi.string().valid('Actif', 'Inactif', 'Suspendu').default('Actif')
  });
}

module.exports = ValidationMiddleware;