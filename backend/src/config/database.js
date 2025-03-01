const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Configuration de la connexion à la base de données PostgreSQL
const sequelize = new Sequelize({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'ehpad_connect',
  username: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: false,
    charset: 'utf8',
    dialectOptions: {
      collate: 'utf8_general_ci'
    }
  }
});

/**
 * Initialise la connexion à la base de données
 */
const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Connexion à la base de données PostgreSQL établie avec succès');
    
    // En développement, on peut synchroniser les modèles avec la base
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Modèles synchronisés avec la base de données');
    }
    
    return true;
  } catch (error) {
    logger.error(`Impossible de se connecter à la base de données: ${error.message}`);
    return false;
  }
};

// Exporter l'instance Sequelize
module.exports = sequelize;
module.exports.initDatabase = initDatabase;
