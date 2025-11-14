const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Modèle DiningTable
 * Représente une table dans la salle de restauration
 */
const DiningTable = sequelize.define('DiningTable', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tableNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    validate: {
      min: 1
    }
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 4,
    validate: {
      min: 1,
      max: 10
    },
    comment: 'Capacité de la table (nombre de places)'
  },
  shape: {
    type: DataTypes.ENUM('round', 'square', 'rectangular'),
    allowNull: false,
    defaultValue: 'rectangular',
    comment: 'Forme de la table'
  },
  // Position dans la salle (pour l'affichage sur le plan)
  positionX: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Position X sur le plan de la salle'
  },
  positionY: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Position Y sur le plan de la salle'
  },
  // Notes
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes spécifiques à la table (emplacement, particularités, etc.)'
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Table active ou non'
  }
}, {
  tableName: 'dining_tables',
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ['tableNumber']
    },
    {
      fields: ['active']
    }
  ]
});

// Scopes
DiningTable.addScope('active', {
  where: { active: true }
});

module.exports = DiningTable;
