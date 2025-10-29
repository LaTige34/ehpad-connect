const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Modèle TemperatureLog
 * Fiche de surveillance de température pour les produits thermosensibles
 * Conforme aux recommandations HAS
 */
const TemperatureLog = sequelize.define('TemperatureLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Identifiant du réfrigérateur
  refrigeratorId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Identifiant du réfrigérateur (ex: IDE-FRIGO-01)'
  },

  // Localisation
  location: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Localisation du réfrigérateur (ex: Salle de soins - IDE)'
  },

  // Date et heure du relevé
  measurementDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Date du relevé'
  },

  measurementTime: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: 'Heure du relevé'
  },

  // Période du relevé
  period: {
    type: DataTypes.ENUM('matin', 'soir', 'nuit'),
    allowNull: false,
    defaultValue: 'matin',
    comment: 'Période du relevé (matin: 6h-14h, soir: 14h-22h, nuit: 22h-6h)'
  },

  // Température mesurée
  temperature: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    validate: {
      min: -30,
      max: 50,
      isDecimal: true
    },
    comment: 'Température mesurée en °C'
  },

  // Statut de conformité selon HAS (+2°C à +8°C)
  isWithinRange: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Température conforme à la norme HAS (+2°C à +8°C)'
  },

  // Niveau d\'alerte
  alertLevel: {
    type: DataTypes.ENUM('none', 'warning', 'critical'),
    allowNull: false,
    defaultValue: 'none',
    comment: 'none: OK, warning: proche limite, critical: hors norme'
  },

  // Observations
  observations: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observations ou commentaires sur le relevé'
  },

  // Actions correctives
  correctiveActions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Actions correctives mises en place si anomalie'
  },

  // Personne ayant effectué le relevé
  recordedById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID de l\'IDE ayant effectué le relevé'
  },

  // Validation par un responsable
  validatedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID du responsable ayant validé (si anomalie)'
  },

  validatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de validation'
  },

  // Métadonnées additionnelles
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Données complémentaires (type de thermomètre, calibration, etc.)'
  },

  // Signature numérique pour traçabilité
  signature: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Hash de signature pour intégrité des données'
  }
}, {
  tableName: 'temperature_logs',
  timestamps: true,
  paranoid: true, // Soft delete pour archivage

  indexes: [
    {
      fields: ['refrigeratorId', 'measurementDate'],
      name: 'idx_refrigerator_date'
    },
    {
      fields: ['measurementDate'],
      name: 'idx_measurement_date'
    },
    {
      fields: ['alertLevel'],
      name: 'idx_alert_level'
    },
    {
      fields: ['recordedById'],
      name: 'idx_recorded_by'
    },
    {
      fields: ['isWithinRange'],
      name: 'idx_within_range'
    }
  ],

  hooks: {
    // Hook avant création/modification pour calculer automatiquement le statut
    beforeValidate: (temperatureLog) => {
      const temp = parseFloat(temperatureLog.temperature);

      // Vérifier conformité HAS (+2°C à +8°C)
      temperatureLog.isWithinRange = (temp >= 2.0 && temp <= 8.0);

      // Définir le niveau d'alerte
      if (temp < 0 || temp > 10) {
        temperatureLog.alertLevel = 'critical';
      } else if ((temp >= 0 && temp < 2) || (temp > 8 && temp <= 10)) {
        temperatureLog.alertLevel = 'warning';
      } else {
        temperatureLog.alertLevel = 'none';
      }
    },

    // Hook après création pour envoyer des alertes si nécessaire
    afterCreate: async (temperatureLog) => {
      if (temperatureLog.alertLevel !== 'none') {
        // TODO: Envoyer notification aux responsables
        console.log(`[ALERTE TEMPÉRATURE] ${temperatureLog.alertLevel.toUpperCase()} - ${temperatureLog.refrigeratorId} : ${temperatureLog.temperature}°C`);
      }
    }
  }
});

// Méthodes d'instance
TemperatureLog.prototype.validate = async function(validatorId) {
  this.validatedById = validatorId;
  this.validatedAt = new Date();
  return await this.save();
};

// Méthodes de classe (statiques)
TemperatureLog.findByRefrigerator = async function(refrigeratorId, startDate, endDate) {
  const where = { refrigeratorId };

  if (startDate && endDate) {
    where.measurementDate = {
      [sequelize.Sequelize.Op.between]: [startDate, endDate]
    };
  }

  return await this.findAll({
    where,
    order: [['measurementDate', 'DESC'], ['measurementTime', 'DESC']],
    include: [
      {
        model: sequelize.models.User,
        as: 'recordedBy',
        attributes: ['id', 'name', 'email']
      },
      {
        model: sequelize.models.User,
        as: 'validatedBy',
        attributes: ['id', 'name', 'email']
      }
    ]
  });
};

TemperatureLog.getMonthlyStats = async function(refrigeratorId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const logs = await this.findAll({
    where: {
      refrigeratorId,
      measurementDate: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    },
    order: [['measurementDate', 'ASC']]
  });

  // Calculer statistiques
  const temps = logs.map(log => parseFloat(log.temperature));
  const stats = {
    refrigeratorId,
    year,
    month,
    totalLogs: logs.length,
    avgTemperature: temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2) : null,
    minTemperature: temps.length > 0 ? Math.min(...temps) : null,
    maxTemperature: temps.length > 0 ? Math.max(...temps) : null,
    conformLogs: logs.filter(log => log.isWithinRange).length,
    nonConformLogs: logs.filter(log => !log.isWithinRange).length,
    warningLogs: logs.filter(log => log.alertLevel === 'warning').length,
    criticalLogs: logs.filter(log => log.alertLevel === 'critical').length,
    conformityRate: logs.length > 0 ? ((logs.filter(log => log.isWithinRange).length / logs.length) * 100).toFixed(2) : null
  };

  return { stats, logs };
};

TemperatureLog.getAnomalies = async function(refrigeratorId = null, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const where = {
    measurementDate: {
      [sequelize.Sequelize.Op.gte]: startDate
    },
    alertLevel: {
      [sequelize.Sequelize.Op.ne]: 'none'
    }
  };

  if (refrigeratorId) {
    where.refrigeratorId = refrigeratorId;
  }

  return await this.findAll({
    where,
    order: [['measurementDate', 'DESC'], ['measurementTime', 'DESC']],
    include: [
      {
        model: sequelize.models.User,
        as: 'recordedBy',
        attributes: ['id', 'name', 'email']
      }
    ]
  });
};

// Scopes
TemperatureLog.addScope('recent', {
  where: {
    measurementDate: {
      [sequelize.Sequelize.Op.gte]: sequelize.literal("CURRENT_DATE - INTERVAL '30 days'")
    }
  },
  order: [['measurementDate', 'DESC']]
});

TemperatureLog.addScope('anomalies', {
  where: {
    isWithinRange: false
  },
  order: [['measurementDate', 'DESC']]
});

TemperatureLog.addScope('critical', {
  where: {
    alertLevel: 'critical'
  },
  order: [['measurementDate', 'DESC']]
});

TemperatureLog.addScope('withUsers', {
  include: [
    {
      model: sequelize.models.User,
      as: 'recordedBy',
      attributes: ['id', 'name', 'email']
    },
    {
      model: sequelize.models.User,
      as: 'validatedBy',
      attributes: ['id', 'name', 'email']
    }
  ]
});

module.exports = TemperatureLog;
