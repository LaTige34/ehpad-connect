const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Configuration de la connexion à la base de données
const sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false // À adapter selon la configuration SSL
      } : false
    }
  }
);

// Fonction pour tester la connexion
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Connexion à la base de données PostgreSQL établie avec succès.');
    return true;
  } catch (error) {
    logger.error(`Impossible de se connecter à la base de données: ${error.message}`);
    return false;
  }
};

// Synchronisation des modèles avec la base de données
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    logger.info(`Base de données synchronisée${force ? ' (tables recréées)' : ''}`);
    return true;
  } catch (error) {
    logger.error(`Erreur lors de la synchronisation de la base de données: ${error.message}`);
    return false;
  }
};

module.exports = sequelize;
module.exports.testConnection = testConnection;
module.exports.syncDatabase = syncDatabase;