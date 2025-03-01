const sequelize = require('../config/database');
const User = require('./User');
const Document = require('./Document');
const { Planning, Shift } = require('./Planning');
const Notification = require('./Notification');

// Initialisation des relations entre les modèles
const initializeAssociations = () => {
  // Associations déjà définies dans les fichiers individuels
  // Ceci est juste pour s'assurer que toutes les associations sont correctement chargées
};

// Synchronisation de tous les modèles avec la base de données
const syncAllModels = async (force = false) => {
  await sequelize.sync({ force });
};

module.exports = {
  sequelize,
  User,
  Document,
  Planning,
  Shift,
  Notification,
  initializeAssociations,
  syncAllModels
};