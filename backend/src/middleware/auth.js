const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Middleware d'authentification
 * Vérifie que le token JWT est valide et ajoute l'utilisateur à la requête
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Récupérer le token depuis les headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Accès non autorisé. Token manquant.' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer l'utilisateur
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé.' });
    }
    
    if (!user.active) {
      return res.status(403).json({ message: 'Compte désactivé. Veuillez contacter un administrateur.' });
    }
    
    // Ajouter l'utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expirée. Veuillez vous reconnecter.' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide.' });
    }
    
    logger.error(`Erreur d'authentification: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de l\'authentification' });
  }
};

/**
 * Middleware d'autorisation
 * Vérifie que l'utilisateur a les rôles requis
 * @param {Array|String} roles - Rôle(s) autorisé(s)
 */
exports.authorize = (roles) => {
  return (req, res, next) => {
    try {
      // S'assurer que l'utilisateur est authentifié
      if (!req.user) {
        return res.status(401).json({ message: 'Accès non autorisé. Authentification requise.' });
      }
      
      // Convertir roles en tableau s'il ne l'est pas déjà
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      // Vérifier si l'utilisateur a l'un des rôles requis
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: 'Accès interdit. Vous n\'avez pas les autorisations nécessaires.' 
        });
      }
      
      next();
    } catch (error) {
      logger.error(`Erreur d'autorisation: ${error.message}`);
      return res.status(500).json({ message: 'Erreur lors de la vérification des autorisations' });
    }
  };
};

/**
 * Middleware pour ajouter l'utilisateur à la requête s'il est connecté
 * Utile pour les routes qui ne nécessitent pas d'authentification mais qui peuvent
 * avoir un comportement différent si l'utilisateur est connecté
 */
exports.optionalAuthenticate = async (req, res, next) => {
  try {
    // Récupérer le token depuis les headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Pas de token, continuer sans authentification
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer l'utilisateur
    const user = await User.findByPk(decoded.id);
    
    if (user && user.active) {
      // Ajouter l'utilisateur à la requête
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };
    }
    
    next();
  } catch (error) {
    // En cas d'erreur, continuer sans authentification
    next();
  }
};

/**
 * Middleware pour vérifier si l'utilisateur a accès à une ressource
 * Par exemple, pour vérifier si un utilisateur peut accéder à ses propres données
 * @param {Function} checkFn - Fonction de vérification qui prend req et renvoie un booléen
 * @param {String} message - Message d'erreur en cas d'échec
 */
exports.checkAccess = (checkFn, message = 'Accès interdit à cette ressource.') => {
  return (req, res, next) => {
    try {
      // S'assurer que l'utilisateur est authentifié
      if (!req.user) {
        return res.status(401).json({ message: 'Accès non autorisé. Authentification requise.' });
      }
      
      // Les administrateurs ont toujours accès
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Vérifier l'accès avec la fonction de vérification
      if (!checkFn(req)) {
        return res.status(403).json({ message });
      }
      
      next();
    } catch (error) {
      logger.error(`Erreur de vérification d'accès: ${error.message}`);
      return res.status(500).json({ message: 'Erreur lors de la vérification des accès' });
    }
  };
};