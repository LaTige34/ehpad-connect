const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Middleware de validation des données
 * Vérifie les résultats de validation d'express-validator
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn(`Erreur de validation de données: ${JSON.stringify(errors.array())}`);
    
    return res.status(400).json({
      message: 'Certaines données fournies sont invalides',
      errors: errors.array()
    });
  }
  
  next();
};

/**
 * Validation d'authentification
 */
exports.loginValidation = [
  { field: 'email', rules: 'required|email' },
  { field: 'password', rules: 'required|min:6' }
];

/**
 * Validation d'enregistrement d'utilisateur
 */
exports.registerValidation = [
  { field: 'name', rules: 'required|string|min:2' },
  { field: 'email', rules: 'required|email' },
  { field: 'password', rules: 'required|min:6' },
  { field: 'role', rules: 'required|in:admin,manager,employee' }
];

/**
 * Validation de création de document
 */
exports.createDocumentValidation = [
  { field: 'title', rules: 'required|string|min:3' },
  { field: 'description', rules: 'string' },
  { field: 'type', rules: 'required|in:contract,amendment,planning,info' },
  { field: 'recipientId', rules: 'required|numeric' }
];

/**
 * Validation de signature de document
 */
exports.signDocumentValidation = [
  { field: 'signatureData', rules: 'required|object' }
];

/**
 * Validation d'envoi de document par email
 */
exports.sendDocumentValidation = [
  { field: 'email', rules: 'required|email' }
];

/**
 * Validation de réinitialisation de mot de passe
 */
exports.resetPasswordValidation = [
  { field: 'token', rules: 'required|string' },
  { field: 'password', rules: 'required|min:6' }
];

/**
 * Validation de demande de réinitialisation de mot de passe
 */
exports.forgotPasswordValidation = [
  { field: 'email', rules: 'required|email' }
];

/**
 * Validation de mise à jour d'utilisateur
 */
exports.updateUserValidation = [
  { field: 'name', rules: 'string|min:2' },
  { field: 'email', rules: 'email' },
  { field: 'password', rules: 'min:6' },
  { field: 'role', rules: 'in:admin,manager,employee' },
  { field: 'active', rules: 'boolean' }
];

/**
 * Validation de mise à jour des préférences utilisateur
 */
exports.updatePreferencesValidation = [
  { field: 'notifications', rules: 'object' },
  { field: 'theme', rules: 'in:light,dark' }
];

/**
 * Validation de synchronisation du planning
 */
exports.syncPlanningValidation = [
  { field: 'year', rules: 'required|numeric|min:2020|max:2100' },
  { field: 'month', rules: 'required|numeric|min:1|max:12' }
];

/**
 * Convertit les règles de validation en validateurs express-validator
 * @param {Array} validations - Tableau de règles de validation
 * @returns {Array} Tableau de middlewares express-validator
 */
exports.getValidators = (validations) => {
  // TO-DO: Convertir le format de règles en validateurs express-validator
  // Pour l'instant, nous utilisons directement les validateurs dans les routes
  return [];
};

/**
 * Sanitize les données des requêtes
 * @param {Object} data - Données à sanitize
 * @returns {Object} Données sanitizées
 */
exports.sanitizeData = (data) => {
  // TO-DO: Sanitize les données
  return data;
};
