const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Modèle SeatingPlan
 * Représente un plan de table pour la salle de restauration
 */
const SeatingPlan = sequelize.define('SeatingPlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
    comment: 'Nom du plan de table (ex: "Plan de table - Janvier 2025")'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description du plan de table'
  },
  effectiveDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Date de mise en application du plan'
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'archived'),
    allowNull: false,
    defaultValue: 'draft',
    comment: 'Statut du plan: draft (brouillon), active (actif), archived (archivé)'
  },
  // Données du plan de table (stockées en JSON)
  seatingArrangement: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Arrangement des résidents aux tables: [{tableId, residentId, position}]'
  },
  guests: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Liste des invités temporaires: [{name, tableId, position, notes}]'
  },
  temporaryInstructions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Consignes temporaires pour ce plan de table'
  },
  // Métadonnées
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  activatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  activatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'seating_plans',
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['effectiveDate']
    },
    {
      fields: ['createdBy']
    }
  ]
});

// Méthodes d'instance
SeatingPlan.prototype.activate = function(userId) {
  this.status = 'active';
  this.activatedBy = userId;
  this.activatedAt = new Date();
  return this.save();
};

SeatingPlan.prototype.archive = function() {
  this.status = 'archived';
  return this.save();
};

SeatingPlan.prototype.getResidentCount = function() {
  return this.seatingArrangement ? this.seatingArrangement.length : 0;
};

SeatingPlan.prototype.getGuestCount = function() {
  return this.guests ? this.guests.length : 0;
};

SeatingPlan.prototype.getTotalSeatedCount = function() {
  return this.getResidentCount() + this.getGuestCount();
};

// Scopes
SeatingPlan.addScope('active', {
  where: { status: 'active' }
});

SeatingPlan.addScope('draft', {
  where: { status: 'draft' }
});

SeatingPlan.addScope('archived', {
  where: { status: 'archived' }
});

SeatingPlan.addScope('recent', {
  order: [['effectiveDate', 'DESC']],
  limit: 10
});

module.exports = SeatingPlan;
