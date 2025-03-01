const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
// Importation future des contrôleurs
// const { login, register, forgotPassword, resetPassword } = require('../controllers/auth.controller');

/**
 * @route   POST /api/auth/login
 * @desc    Authentification d'un utilisateur
 * @access  Public
 */
router.post('/login', [
  body('email').isEmail().withMessage('Veuillez fournir un email valide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis')
], (req, res) => {
  // Temporairement en attendant le contrôleur
  res.json({ 
    message: 'Connexion réussie (simulation)',
    token: 'jwt-token-simulé', 
    user: {
      id: 1,
      name: 'Utilisateur Test',
      email: req.body.email,
      role: 'employee'
    }
  });
});

/**
 * @route   POST /api/auth/register
 * @desc    Enregistrement d'un nouvel utilisateur
 * @access  Admin seulement
 */
router.post('/register', [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('Veuillez fournir un email valide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('role').isIn(['admin', 'manager', 'employee']).withMessage('Rôle invalide')
], (req, res) => {
  // Temporairement en attendant le contrôleur
  res.status(201).json({ 
    message: 'Utilisateur créé avec succès (simulation)',
    user: {
      id: Math.floor(Math.random() * 1000),
      name: req.body.name,
      email: req.body.email,
      role: req.body.role
    }
  });
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Demande de réinitialisation de mot de passe
 * @access  Public
 */
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Veuillez fournir un email valide')
], (req, res) => {
  // Temporairement en attendant le contrôleur
  res.json({ message: 'Email de réinitialisation envoyé (simulation)' });
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Réinitialisation du mot de passe avec un token
 * @access  Public (avec token)
 */
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token requis'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
], (req, res) => {
  // Temporairement en attendant le contrôleur
  res.json({ message: 'Mot de passe réinitialisé avec succès (simulation)' });
});

module.exports = router;
