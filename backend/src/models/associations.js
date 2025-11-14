/**
 * Définition des associations entre les modèles Sequelize
 * Ce fichier doit être importé après la définition de tous les modèles
 */

const User = require('./user.model');
const Resident = require('./Resident');
const DiningTable = require('./DiningTable');
const SeatingPlan = require('./SeatingPlan');
const Document = require('./Document');
const Planning = require('./Planning');

/**
 * Associations pour le modèle Resident
 */
// Un résident est créé par un utilisateur
Resident.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

// Un résident est mis à jour par un utilisateur
Resident.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'updater'
});

/**
 * Associations pour le modèle SeatingPlan
 */
// Un plan de table est créé par un utilisateur
SeatingPlan.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

// Un plan de table est mis à jour par un utilisateur
SeatingPlan.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'updater'
});

// Un plan de table est activé par un utilisateur
SeatingPlan.belongsTo(User, {
  foreignKey: 'activatedBy',
  as: 'activator'
});

/**
 * Associations inverses pour User
 */
User.hasMany(Resident, {
  foreignKey: 'createdBy',
  as: 'createdResidents'
});

User.hasMany(SeatingPlan, {
  foreignKey: 'createdBy',
  as: 'createdSeatingPlans'
});

User.hasMany(SeatingPlan, {
  foreignKey: 'activatedBy',
  as: 'activatedSeatingPlans'
});

/**
 * Note: Les associations pour les tables (DiningTable) ne sont pas nécessaires
 * car elles sont gérées via le JSON seatingArrangement dans SeatingPlan.
 * Les résidents sont également liés aux tables via ce JSON.
 */

module.exports = {
  User,
  Resident,
  DiningTable,
  SeatingPlan,
  Document,
  Planning
};
