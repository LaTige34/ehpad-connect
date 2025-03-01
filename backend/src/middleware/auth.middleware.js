const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Middleware d'authentification JWT
 * Vérifie la validité du token JWT présent dans les headers
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Récupération du token depuis le header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Accès non autorisé. Authentification requise.'
      });
    }
    
    // Extraction du token
    const token = authHeader.split(' ')[1];
    
    // Vérification du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ajout des informations utilisateur à la requête
    req.user = decoded;
    
    // Vérification que l'utilisateur existe toujours et est actif
    const user = await User.findByPk(decoded.id);
    if (!user || !user.active) {
      return res.status(401).json({
        message: 'Utilisateur non trouvé ou inactif.'
      });
    }
    
    next();
  } catch (error) {
    logger.error(`Erreur d'authentification: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Session expirée. Veuillez vous reconnecter.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Token invalide. Veuillez vous reconnecter.'
      });
    }
    
    return res.status(401).json({
      message: 'Erreur d\'authentification'
    });
  }
};

/**
 * Middleware d'autorisation basé sur les rôles
 * @param {Array<String>} roles - Rôles autorisés
 */
exports.authorize = (roles = []) => {
  return (req, res, next) => {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        message: 'Accès non autorisé. Authentification requise.'
      });
    }
    
    // Convertir en tableau si une seule valeur est fournie
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Vérifier que le rôle de l'utilisateur est autorisé
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      logger.warn(`Tentative d'accès non autorisé: ${req.user.email} (${req.user.role}) -> ${req.originalUrl}`);
      
      return res.status(403).json({
        message: 'Vous n\'avez pas les permissions nécessaires pour cette action.'
      });
    }
    
    next();
  };
};

/**
 * Middleware pour vérifier la propriété d'une ressource
 * @param {Function} getResourceIdFn - Fonction pour extraire l'ID de la ressource de la requête
 * @param {Function} checkOwnershipFn - Fonction asynchrone pour vérifier la propriété
 * @param {Array<String>} bypassRoles - Rôles pouvant bypasser la vérification
 */
exports.checkOwnership = (getResourceIdFn, checkOwnershipFn, bypassRoles = ['admin']) => {
  return async (req, res, next) => {
    try {
      // Vérifier que l'utilisateur est authentifié
      if (!req.user) {
        return res.status(401).json({
          message: 'Accès non autorisé. Authentification requise.'
        });
      }
      
      // Si l'utilisateur a un rôle qui bypass la vérification
      if (bypassRoles.includes(req.user.role)) {
        return next();
      }
      
      // Récupérer l'ID de la ressource
      const resourceId = getResourceIdFn(req);
      if (!resourceId) {
        return res.status(400).json({
          message: 'ID de ressource manquant ou invalide.'
        });
      }
      
      // Vérifier la propriété
      const isOwner = await checkOwnershipFn(req.user.id, resourceId);
      if (!isOwner) {
        logger.warn(`Tentative d'accès à une ressource non possédée: ${req.user.email} -> ${req.originalUrl}`);
        
        return res.status(403).json({
          message: 'Vous n\'avez pas les permissions nécessaires pour cette ressource.'
        });
      }
      
      next();
    } catch (error) {
      logger.error(`Erreur de vérification de propriété: ${error.message}`);
      next(error);
    }
  };
};

/**
 * Fonctions helper pour checkOwnership
 */
exports.getDocumentId = (req) => req.params.id;
exports.getPlanningId = (req) => req.params.id;

/**
 * Vérification de propriété pour un document
 */
exports.isDocumentOwner = async (userId, documentId) => {
  const { Document } = require('../models');
  const document = await Document.findByPk(documentId);
  return document && document.recipientId === userId;
};

/**
 * Vérification de propriété pour un planning
 */
exports.isPlanningOwner = async (userId, planningId) => {
  const { Planning } = require('../models');
  const planning = await Planning.findByPk(planningId);
  return planning && planning.employeeId === userId;
};