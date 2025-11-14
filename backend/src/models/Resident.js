const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Modèle Resident
 * Représente un résident de l'EHPAD avec toutes les informations nécessaires
 * pour le plan de table et la gestion des repas
 */
const Resident = sequelize.define('Resident', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  roomNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  photoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL ou chemin de la photo du résident'
  },
  dietType: {
    type: DataTypes.ENUM('normal', 'modified', 'diabetic', 'low_sodium'),
    allowNull: false,
    defaultValue: 'normal',
    comment: 'Type de régime alimentaire: normal (vert), modified (rouge - texture modifiée/mixée), diabetic (orange), low_sodium (bleu - sans sel)'
  },
  // Précautions médicales
  chokingRisk: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Risque de fausse route ⚠️'
  },
  medicationAdministration: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Administration médicamenteuse spécifique 💊'
  },
  enhancedHydration: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Hydratation renforcée 🥤'
  },
  foodAllergies: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Allergies alimentaires 🚫'
  },
  // Détails des allergies et notes
  allergyDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Détails des allergies alimentaires'
  },
  medicalNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes médicales importantes pour les repas'
  },
  // Statut du résident
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Résident actif ou non (départ, hospitalisation, etc.)'
  },
  // Métadonnées
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
  }
}, {
  tableName: 'residents',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['lastName', 'firstName']
    },
    {
      fields: ['roomNumber']
    },
    {
      fields: ['active']
    }
  ]
});

// Méthodes d'instance
Resident.prototype.getFullName = function() {
  return `${this.lastName.toUpperCase()} ${this.firstName}`;
};

Resident.prototype.getDietColor = function() {
  const colors = {
    normal: '#C8E6C9',      // Vert Menthe
    modified: '#FF6B6B',    // Rouge
    diabetic: '#FFA726',    // Orange
    low_sodium: '#64B5F6'   // Bleu
  };
  return colors[this.dietType] || colors.normal;
};

Resident.prototype.getPrecautions = function() {
  const precautions = [];
  if (this.chokingRisk) precautions.push({ icon: '⚠️', label: 'Risque de fausse route' });
  if (this.medicationAdministration) precautions.push({ icon: '💊', label: 'Administration médicamenteuse' });
  if (this.enhancedHydration) precautions.push({ icon: '🥤', label: 'Hydratation renforcée' });
  if (this.foodAllergies) precautions.push({ icon: '🚫', label: 'Allergies alimentaires' });
  return precautions;
};

// Scopes
Resident.addScope('active', {
  where: { active: true }
});

Resident.addScope('withPrecautions', {
  where: {
    [sequelize.Sequelize.Op.or]: [
      { chokingRisk: true },
      { medicationAdministration: true },
      { enhancedHydration: true },
      { foodAllergies: true }
    ]
  }
});

module.exports = Resident;
