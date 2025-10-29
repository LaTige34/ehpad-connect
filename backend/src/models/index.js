const sequelize = require('../config/database');
const User = require('./User');
const Document = require('./Document');
const { Planning, Shift } = require('./Planning');
const Notification = require('./Notification');
const TemperatureLog = require('./TemperatureLog');

// Initialisation des relations entre les modèles
const initializeAssociations = () => {
  // Relations TemperatureLog avec User
  TemperatureLog.belongsTo(User, {
    foreignKey: 'recordedById',
    as: 'recordedBy'
  });

  TemperatureLog.belongsTo(User, {
    foreignKey: 'validatedById',
    as: 'validatedBy'
  });

  User.hasMany(TemperatureLog, {
    foreignKey: 'recordedById',
    as: 'temperatureLogsRecorded'
  });

  User.hasMany(TemperatureLog, {
    foreignKey: 'validatedById',
    as: 'temperatureLogsValidated'
  });
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
  TemperatureLog,
  initializeAssociations,
  syncAllModels
};