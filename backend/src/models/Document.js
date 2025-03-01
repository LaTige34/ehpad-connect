const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

/**
 * Modèle Document pour la gestion des contrats et documents RH
 */
const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.ENUM('contract', 'amendment', 'planning', 'info'),
    allowNull: false,
    defaultValue: 'info'
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'signed', 'rejected', 'expired', 'unread', 'read'),
    allowNull: false,
    defaultValue: 'draft'
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER
  },
  fileType: {
    type: DataTypes.STRING
  },
  signedAt: {
    type: DataTypes.DATE
  },
  signatureId: {
    type: DataTypes.STRING
  },
  signatureData: {
    type: DataTypes.JSON
  },
  expiresAt: {
    type: DataTypes.DATE
  },
  metadata: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'documents',
  timestamps: true,
  paranoid: true, // Soft delete
});

// Relations
Document.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
Document.belongsTo(User, { as: 'recipient', foreignKey: 'recipientId' });
Document.belongsTo(User, { as: 'signedBy', foreignKey: 'signedById' });

// Scope pour récupérer les documents destinés à un utilisateur spécifique
Document.addScope('forUser', (userId) => ({
  where: {
    recipientId: userId
  }
}));

// Scope pour les documents à signer
Document.addScope('pending', {
  where: {
    status: 'pending'
  }
});

// Scope pour les documents signés
Document.addScope('signed', {
  where: {
    status: 'signed'
  }
});

// Scope pour les documents de type contrat
Document.addScope('contracts', {
  where: {
    type: ['contract', 'amendment']
  }
});

module.exports = Document;