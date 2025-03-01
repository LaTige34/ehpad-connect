const logger = require('../utils/logger');

/**
 * Middleware de gestion globale des erreurs
 */
const errorHandler = (err, req, res, next) => {
  // Log de l'erreur
  logger.error(`${err.name}: ${err.message}\n${err.stack}`);

  // Détermination du code d'erreur
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  // Réponse au client
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    error: true
  });
};

/**
 * Middleware pour intercepter les routes qui n'existent pas
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route non trouvée - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};
