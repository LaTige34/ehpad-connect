const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { User } = require('../models');
const logger = require('../utils/logger');
const emailService = require('../services/email.service');

/**
 * Génération d'un token JWT pour l'authentification
 * @param {Object} user - Utilisateur authentifié
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '24h' }
  );
};

/**
 * Authentification d'un utilisateur
 * @route POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password } = req.body;
    
    // Recherche de l'utilisateur
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        message: 'Identifiants incorrects'
      });
    }
    
    // Vérification du mot de passe
    const isValidPassword = await user.isValidPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        message: 'Identifiants incorrects'
      });
    }
    
    // Vérification si le compte est actif
    if (!user.active) {
      return res.status(403).json({ 
        message: 'Votre compte est désactivé. Veuillez contacter un administrateur.'
      });
    }
    
    // Génération du token JWT
    const token = generateToken(user);
    
    // Mise à jour de la date de dernière connexion
    await User.update(
      { lastLogin: new Date() },
      { where: { id: user.id } }
    );
    
    logger.info(`Utilisateur ${user.email} connecté avec succès`);
    
    // Réponse avec le token et les informations utilisateur
    return res.json({
      token,
      user: user.toJSON()
    });
  } catch (error) {
    logger.error(`Erreur de connexion: ${error.message}`);
    next(error);
  }
};

/**
 * Enregistrement d'un nouvel utilisateur (admin seulement)
 * @route POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, email, password, role } = req.body;
    
    // Vérification si l'email existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }
    
    // Création du nouvel utilisateur
    const newUser = await User.create({
      name,
      email,
      password, // Le hachage se fait automatiquement via le hook beforeCreate
      role: role || 'employee',
      active: true
    });
    
    logger.info(`Nouvel utilisateur créé: ${newUser.email} (${newUser.role})`);
    
    return res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: newUser.toJSON()
    });
  } catch (error) {
    logger.error(`Erreur de création d'utilisateur: ${error.message}`);
    next(error);
  }
};

/**
 * Demande de réinitialisation de mot de passe
 * @route POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email } = req.body;
    
    // Recherche de l'utilisateur
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Pour des raisons de sécurité, ne pas indiquer si l'email existe ou non
      return res.json({ 
        message: 'Si votre email est enregistré, vous recevrez un lien de réinitialisation.'
      });
    }
    
    // Génération d'un token de réinitialisation
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 heure
    
    // Mise à jour de l'utilisateur avec le token
    await User.update(
      {
        resetPasswordToken: resetToken,
        resetPasswordExpires: new Date(resetTokenExpiry)
      },
      { where: { id: user.id } }
    );
    
    // Construction du lien de réinitialisation
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    // Envoi de l'email
    await emailService.sendPasswordResetEmail(user.email, resetUrl);
    
    logger.info(`Email de réinitialisation envoyé à ${user.email}`);
    
    return res.json({
      message: 'Un email avec les instructions de réinitialisation a été envoyé.'
    });
  } catch (error) {
    logger.error(`Erreur de demande de réinitialisation: ${error.message}`);
    next(error);
  }
};

/**
 * Réinitialisation du mot de passe avec un token
 * @route POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { token, password } = req.body;
    
    // Recherche de l'utilisateur avec le token valide
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          [sequelize.Op.gt]: new Date()
        }
      }
    });
    
    if (!user) {
      return res.status(400).json({ 
        message: 'Le token de réinitialisation est invalide ou a expiré.'
      });
    }
    
    // Mise à jour du mot de passe
    await User.update(
      {
        password, // Le hachage se fait automatiquement via le hook beforeUpdate
        resetPasswordToken: null,
        resetPasswordExpires: null
      },
      { where: { id: user.id } }
    );
    
    logger.info(`Mot de passe réinitialisé pour ${user.email}`);
    
    return res.json({
      message: 'Votre mot de passe a été réinitialisé avec succès.'
    });
  } catch (error) {
    logger.error(`Erreur de réinitialisation de mot de passe: ${error.message}`);
    next(error);
  }
};

/**
 * Récupération des informations de l'utilisateur connecté
 * @route GET /api/auth/me
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    // L'utilisateur est déjà disponible grâce au middleware d'authentification
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    return res.json({ user: user.toJSON() });
  } catch (error) {
    logger.error(`Erreur de récupération de l'utilisateur: ${error.message}`);
    next(error);
  }
};

/**
 * Déconnexion (côté serveur - invalidation du token)
 * @route POST /api/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    // Logique de déconnexion (par exemple, ajouter le token à une liste noire)
    // Dans une implémentation JWT simple, la déconnexion se fait côté client
    
    return res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    logger.error(`Erreur de déconnexion: ${error.message}`);
    next(error);
  }
};