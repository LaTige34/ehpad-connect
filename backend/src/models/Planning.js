const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

/**
 * Modèle Shift pour la gestion des services individuels
 */
const Shift = sequelize.define('Shift', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  shiftType: {
    type: DataTypes.ENUM('morning', 'afternoon', 'night', 'rest'),
    allowNull: false
  },
  service: {
    type: DataTypes.STRING
  },
  location: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('draft', 'confirmed', 'pending', 'modified'),
    allowNull: false,
    defaultValue: 'draft'
  },
  octimeId: {
    type: DataTypes.STRING,
    comment: 'Identifiant du service dans Octime Expresso'
  },
  lastSync: {
    type: DataTypes.DATE
  },
  metadata: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'shifts',
  timestamps: true
});

/**
 * Modèle Planning pour le regroupement des services par mois
 */
const Planning = sequelize.define('Planning', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'signed'),
    allowNull: false,
    defaultValue: 'draft'
  },
  signedAt: {
    type: DataTypes.DATE
  },
  signatureId: {
    type: DataTypes.STRING
  },
  documentId: {
    type: DataTypes.INTEGER,
    comment: 'Référence au document PDF du planning signé'
  },
  octimeReference: {
    type: DataTypes.STRING,
    comment: 'Référence du planning dans Octime Expresso'
  }
}, {
  tableName: 'plannings',
  timestamps: true
});

// Relations
Shift.belongsTo(User, { as: 'employee', foreignKey: 'employeeId' });
Shift.belongsTo(Planning, { foreignKey: 'planningId' });

Planning.belongsTo(User, { as: 'employee', foreignKey: 'employeeId' });
Planning.belongsTo(User, { as: 'validator', foreignKey: 'validatorId' });
Planning.hasMany(Shift, { foreignKey: 'planningId' });

// Méthodes statiques
Planning.findByMonthYear = function(employeeId, month, year) {
  return this.findOne({
    where: {
      employeeId,
      month,
      year
    },
    include: [{
      model: Shift,
      where: {
        employeeId
      }
    }]
  });
};

// Scopes
Shift.addScope('active', {
  where: {
    status: ['confirmed', 'pending']
  }
});

Shift.addScope('forEmployee', (employeeId) => ({
  where: {
    employeeId
  }
}));

Planning.addScope('withShifts', {
  include: [{
    model: Shift
  }]
});

module.exports = { Planning, Shift };