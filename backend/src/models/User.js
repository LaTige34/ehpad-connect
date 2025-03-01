const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

/**
 * Modèle utilisateur pour l'authentification et la gestion des comptes
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
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
  lastLogin: {
    type: DataTypes.DATE
  },
  resetPasswordToken: {
    type: DataTypes.STRING
  },
  resetPasswordExpires: {
    type: DataTypes.DATE
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      theme: 'light'
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

/**
 * Méthode pour vérifier la validité d'un mot de passe
 */
User.prototype.isValidPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

/**
 * Méthode pour exclure des champs sensibles lors de la conversion en JSON
 */
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  delete values.resetPasswordToken;
  delete values.resetPasswordExpires;
  return values;
};

module.exports = User;
