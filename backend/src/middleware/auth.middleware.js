const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Middleware d'authentification
 * Vérifie que l'utilisateur est authentifié via un token JWT
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Récupération du token depuis le header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Authentification requise',
        error: 'NO_TOKEN'
      });
    }
    
    // Extraction du token
    const token = authHeader.split(' ')[1];
    
    try {
      // Vérification du token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Vérification que l'utilisateur existe toujours et est actif
      const user = await User.findByPk(decoded.id);
      
      if (!user || !user.active) {
        return res.status(401).json({ 
          message: 'Utilisateur invalide ou inactif',
          error: 'INVALID_USER'
        });
      }
      
      // Attachement des informations utilisateur à la requête
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };
      
      next();
    } catch (tokenError) {
      logger.warn(`Token invalide: ${tokenError.message}`);
      
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Session expirée, veuillez vous reconnecter',
          error: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({ 
        message: 'Token invalide',
        error: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    logger.error(`Erreur d'authentification: ${error.message}`);
    next(error);
  }
};

/**
 * Middleware d'autorisation basé sur les rôles
 * Vérifie que l'utilisateur a les rôles requis
 * @param {String[]} roles - Tableau des rôles autorisés
 */
exports.authorize = (roles = []) => {
  return (req, res, next) => {
    // S'assurer que le middleware d'authentification a été exécuté
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentification requise',
        error: 'NO_AUTH'
      });
    }

    // Convertir en tableau si une chaîne est fournie
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Si aucun rôle n'est spécifié, autoriser tous les utilisateurs authentifiés
    if (allowedRoles.length === 0) {
      return next();
    }
    
    // Vérifier si l'utilisateur a un rôle autorisé
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Accès non autorisé',
        error: 'FORBIDDEN'
      });
    }
    
    next();
  };
};

/**
 * Middleware pour vérifier que l'utilisateur peut accéder à une ressource
 * Vérifie que l'ID de l'utilisateur correspond à celui de la ressource,
 * ou que l'utilisateur est un administrateur ou un manager.
 * @param {Function} getResourceUserId - Fonction qui retourne l'ID utilisateur de la ressource
 */
exports.checkResourceAccess = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      // S'assurer que le middleware d'authentification a été exécuté
      if (!req.user) {
        return res.status(401).json({ 
          message: 'Authentification requise',
          error: 'NO_AUTH'
        });
      }
      
      // Les administrateurs et managers ont accès à toutes les ressources
      if (req.user.role === 'admin' || req.user.role === 'manager') {
        return next();
      }
      
      // Récupérer l'ID utilisateur associé à la ressource demandée
      const resourceUserId = await getResourceUserId(req);
      
      // Si l'ID utilisateur de la ressource ne correspond pas à celui connecté
      if (resourceUserId !== req.user.id) {
        return res.status(403).json({ 
          message: 'Accès non autorisé à cette ressource',
          error: 'FORBIDDEN_RESOURCE'
        });
      }
      
      next();
    } catch (error) {
      logger.error(`Erreur de vérification d'accès: ${error.message}`);
      next(error);
    }
  };
};

/**
 * Middleware pour journaliser les accès aux API
 */
exports.apiLogger = (req, res, next) => {
  const start = Date.now();
  
  // Fonction à exécuter à la fin de la requête
  const logFinish = () => {
    const duration = Date.now() - start;
    const userInfo = req.user ? `User ID: ${req.user.id}, Role: ${req.user.role}` : 'Non authentifié';
    const logMessage = `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${userInfo}`;
    
    // Log avec un niveau différent selon le code de statut
    if (res.statusCode >= 500) {
      logger.error(logMessage);
    } else if (res.statusCode >= 400) {
      logger.warn(logMessage);
    } else {
      logger.info(logMessage);
    }
  };
  
  // Intercept la fin de la réponse pour enregistrer les logs
  res.on('finish', logFinish);
  
  next();
};
