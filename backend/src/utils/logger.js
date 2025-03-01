const winston = require('winston');
const path = require('path');

// Définition des niveaux et couleurs pour le logger
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Fonction pour déterminer le niveau de log en fonction de l'environnement
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Configuration des couleurs pour les différents niveaux
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Ajout des couleurs à winston
winston.addColors(colors);

// Format pour les logs en console
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Format pour les logs en fichier
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json(),
);

// Configuration des transports (où les logs seront envoyés)
const transports = [
  // Console pour tous les logs
  new winston.transports.Console({
    format: consoleFormat,
  }),
  // Fichier pour les erreurs
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  // Fichier pour tous les logs
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/all.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Création du logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

// Pour Morgan (HTTP logging)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;
