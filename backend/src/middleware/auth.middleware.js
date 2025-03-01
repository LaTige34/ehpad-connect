const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Middleware d'authentification JWT
 * Vérifie que le token JWT est valide et attache l'utilisateur à la requête
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Accès non autorisé. Veuillez vous connecter.' });
    }

    const token = authHeader.split(' ')[1];

    // Vérifier le token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      // Vérifier que l'utilisateur existe toujours et est actif
      const user = await User.findByPk(decoded.id);
      if (!user || !user.active) {
        return res.status(401).json({ message: 'Utilisateur invalide ou désactivé.' });
      }

      next();
    } catch (error) {
      // En cas d'erreur de vérification du token
      logger.warn(`Tentative d'authentification avec un token invalide: ${error.message}`);
      return res.status(401).json({ message: 'Token invalide ou expiré. Veuillez vous reconnecter.' });
    }
  } catch (error) {
    logger.error(`Erreur d'authentification: ${error.message}`);
    next(error);
  }
};

/**
 * Middleware d'autorisation basée sur les rôles
 * Vérifie que l'utilisateur a les rôles nécessaires pour accéder à la ressource
 * @param {Array|String} roles - Rôle(s) autorisé(s)
 */
exports.authorize = (roles) => {
  return (req, res, next) => {
    try {
      // Vérifier que l'utilisateur est bien authentifié
      if (!req.user) {
        return res.status(401).json({ message: 'Accès non autorisé. Veuillez vous connecter.' });
      }

      // Convertir en tableau si un seul rôle est fourni
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      // Vérifier si l'utilisateur a un rôle autorisé
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`Tentative d'accès non autorisé par l'utilisateur ${req.user.id} (${req.user.role}) à ${req.originalUrl}`);
        return res.status(403).json({ message: 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.' });
      }

      next();
    } catch (error) {
      logger.error(`Erreur d'autorisation: ${error.message}`);
      next(error);
    }
  };
};

/**
 * Middleware de validation d'accès aux ressources
 * Vérifie que l'utilisateur a le droit d'accéder à une ressource spécifique
 * @param {Function} validationFn - Fonction de validation qui retourne true/false
 */
exports.validateResourceAccess = (validationFn) => {
  return async (req, res, next) => {
    try {
      // Vérifier que l'utilisateur est bien authentifié
      if (!req.user) {
        return res.status(401).json({ message: 'Accès non autorisé. Veuillez vous connecter.' });
      }

      // Exécuter la fonction de validation
      const hasAccess = await validationFn(req);

      if (!hasAccess) {
        logger.warn(`Tentative d'accès non autorisé à une ressource par l'utilisateur ${req.user.id}`);
        return res.status(403).json({ message: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource.' });
      }

      next();
    } catch (error) {
      logger.error(`Erreur de validation d'accès: ${error.message}`);
      next(error);
    }
  };
};

/**
 * Vérifications communes d'accès aux ressources
 */
exports.resourceAccess = {
  // Vérifier que l'utilisateur est le propriétaire d'un document
  isDocumentOwner: async (req) => {
    const { Document } = require('../models');
    const documentId = req.params.id;
    const userId = req.user.id;

    const document = await Document.findByPk(documentId);
    return document && document.recipientId === userId;
  },

  // Vérifier que l'utilisateur est le propriétaire d'un planning
  isPlanningOwner: async (req) => {
    const { Planning } = require('../models');
    const planningId = req.params.id;
    const userId = req.user.id;

    const planning = await Planning.findByPk(planningId);
    return planning && planning.employeeId === userId;
  },

  // Vérifier que l'utilisateur a accès à un autre utilisateur (lui-même ou admin)
  canAccessUser: async (req) => {
    const targetUserId = parseInt(req.params.id);
    return req.user.id === targetUserId || req.user.role === 'admin';
  }
};
