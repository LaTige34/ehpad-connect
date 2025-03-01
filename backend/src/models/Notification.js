const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

/**
 * Modèle Notification pour la gestion des alertes aux utilisateurs
 */
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('planning', 'document', 'system', 'message'),
    allowNull: false,
    defaultValue: 'system'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high'),
    defaultValue: 'normal'
  },
  link: {
    type: DataTypes.STRING,
    comment: 'Lien relatif pour rediriger l\'utilisateur dans l\'application'
  },
  expiresAt: {
    type: DataTypes.DATE
  },
  metadata: {
    type: DataTypes.JSON,
    comment: 'Données spécifiques liées à la notification (ID de document, planning, etc.)'
  },
  channels: {
    type: DataTypes.ARRAY(DataTypes.ENUM('app', 'email', 'sms')),
    defaultValue: ['app']
  },
  emailSentAt: {
    type: DataTypes.DATE
  },
  smsSentAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['isRead']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Relations
Notification.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Notification, { foreignKey: 'userId' });

// Hook pour gérer les notifications expirées
Notification.beforeFind((options) => {
  if (!options.where) {
    options.where = {};
  }
  
  // Ne pas retourner les notifications expirées, sauf si explicitement demandé
  if (!options.includeExpired) {
    options.where.expiresAt = {
      [sequelize.Op.or]: [
        { [sequelize.Op.gt]: new Date() },
        { [sequelize.Op.is]: null }
      ]
    };
  }
  
  return options;
});

// Scopes
Notification.addScope('unread', {
  where: {
    isRead: false
  }
});

Notification.addScope('recent', {
  where: {
    createdAt: {
      [sequelize.Op.gt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 jours
    }
  }
});

Notification.addScope('byPriority', (priority = 'normal') => ({
  where: {
    priority
  }
}));

// Méthodes du modèle
Notification.markAsRead = async function(id, userId) {
  return this.update(
    {
      isRead: true,
      readAt: new Date()
    },
    {
      where: {
        id,
        userId
      }
    }
  );
};

Notification.markAllAsRead = async function(userId) {
  return this.update(
    {
      isRead: true,
      readAt: new Date()
    },
    {
      where: {
        userId,
        isRead: false
      }
    }
  );
};

module.exports = Notification;