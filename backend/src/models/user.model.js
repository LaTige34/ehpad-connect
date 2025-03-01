const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

/**
 * Modèle Utilisateur pour l'application
 */
const User = db.define('User', {
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
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [8, 100]
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'employee'),
    allowNull: false,
    defaultValue: 'employee'
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  employeeId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Identifiant externe de l\'employé dans Octime'
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  position: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastPasswordChange: {
    type: DataTypes.DATE,
    allowNull: true
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      theme: 'light'
    }
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'users',
  paranoid: true, // Utilisation de la suppression douce
  hooks: {
    /**
     * Hook avant création - Hashage du mot de passe
     */
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
      user.lastPasswordChange = new Date();
    },
    /**
     * Hook avant mise à jour - Hashage du mot de passe si modifié
     */
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
        user.lastPasswordChange = new Date();
      }
    }
  }
});

/**
 * Méthode pour valider un mot de passe
 * @param {string} password - Mot de passe à valider
 * @returns {Promise<boolean>} - Vrai si le mot de passe est valide
 */
User.prototype.validPassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

/**
 * Méthode pour générer un token de réinitialisation de mot de passe
 * @returns {string} - Token de réinitialisation
 */
User.prototype.generatePasswordResetToken = function() {
  // Générer un token aléatoire
  const token = Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
  
  // Définir l'expiration à 24h
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);
  
  // Enregistrer le token et sa date d'expiration
  this.passwordResetToken = token;
  this.passwordResetExpires = expires;
  
  return token;
};

/**
 * Méthode pour obtenir une représentation sécurisée de l'utilisateur (sans mot de passe)
 * @returns {Object} - Données utilisateur sécurisées
 */
User.prototype.toSafeObject = function() {
  const { 
    id, firstName, lastName, email, role, 
    active, employeeId, department, position, 
    phone, avatar, lastLogin, preferences,
    createdAt, updatedAt
  } = this;
  
  return {
    id, firstName, lastName, email, role, 
    active, employeeId, department, position, 
    phone, avatar, lastLogin, preferences,
    createdAt, updatedAt,
    fullName: `${firstName} ${lastName}`
  };
};

module.exports = User;
