const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
// Importation future des middlewares d'authentification
// const { authenticate, authorize } = require('../middleware/auth');
// Importation future des contrôleurs
// const { getUsers, getUser, updateUser, deleteUser } = require('../controllers/user.controller');

/**
 * @route   GET /api/users
 * @desc    Obtenir la liste des utilisateurs
 * @access  Admin seulement
 */
router.get('/', (req, res) => {
  // Temporairement en attendant le contrôleur et l'authentification
  
  // Données simulées
  const users = [
    {
      id: 1,
      name: 'Admin Test',
      email: 'admin@ehpadbelleviste.fr',
      role: 'admin',
      createdAt: '2025-01-01T10:00:00Z'
    },
    {
      id: 2,
      name: 'Manager Test',
      email: 'manager@ehpadbelleviste.fr',
      role: 'manager',
      createdAt: '2025-01-02T11:00:00Z'
    },
    {
      id: 3,
      name: 'Employé Test',
      email: 'employe@ehpadbelleviste.fr',
      role: 'employee',
      createdAt: '2025-01-03T12:00:00Z'
    }
  ];
  
  res.json({ users });
});

/**
 * @route   GET /api/users/:id
 * @desc    Obtenir les détails d'un utilisateur spécifique
 * @access  Admin ou l'utilisateur lui-même
 */
router.get('/:id', (req, res) => {
  const userId = req.params.id;
  
  // Données simulées
  const user = {
    id: userId,
    name: `Utilisateur ${userId}`,
    email: `user${userId}@ehpadbelleviste.fr`,
    role: ['admin', 'manager', 'employee'][userId % 3],
    createdAt: '2025-01-01T10:00:00Z',
    lastLogin: '2025-03-01T08:30:00Z',
    preferences: {
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      theme: 'light'
    }
  };
  
  res.json({ user });
});

/**
 * @route   PUT /api/users/:id
 * @desc    Mettre à jour un utilisateur
 * @access  Admin ou l'utilisateur lui-même
 */
router.put('/:id', [
  body('name').optional(),
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('role').optional().isIn(['admin', 'manager', 'employee']).withMessage('Rôle invalide'),
  body('preferences').optional()
], (req, res) => {
  const userId = req.params.id;
  
  res.json({ 
    message: `Utilisateur ${userId} mis à jour avec succès (simulation)`,
    user: {
      id: userId,
      name: req.body.name || `Utilisateur ${userId}`,
      email: req.body.email || `user${userId}@ehpadbelleviste.fr`,
      role: req.body.role || 'employee',
      updatedAt: new Date().toISOString()
    }
  });
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Supprimer un utilisateur
 * @access  Admin seulement
 */
router.delete('/:id', (req, res) => {
  const userId = req.params.id;
  
  res.json({ 
    message: `Utilisateur ${userId} supprimé avec succès (simulation)`,
    deletedAt: new Date().toISOString()
  });
});

/**
 * @route   PUT /api/users/:id/preferences
 * @desc    Mettre à jour les préférences d'un utilisateur
 * @access  L'utilisateur lui-même
 */
router.put('/:id/preferences', [
  body('notifications').optional(),
  body('theme').optional().isIn(['light', 'dark']).withMessage('Thème invalide')
], (req, res) => {
  const userId = req.params.id;
  
  res.json({ 
    message: `Préférences de l'utilisateur ${userId} mises à jour avec succès (simulation)`,
    preferences: req.body,
    updatedAt: new Date().toISOString()
  });
});

/**
 * @route   GET /api/users/:id/documents
 * @desc    Obtenir tous les documents d'un utilisateur
 * @access  Admin ou l'utilisateur lui-même
 */
router.get('/:id/documents', (req, res) => {
  const userId = req.params.id;
  
  // Données simulées
  const documents = [
    {
      id: 1,
      title: 'Contrat de travail',
      type: 'contract',
      status: 'signed',
      createdAt: '2025-01-10T10:30:00Z',
      signedAt: '2025-01-15T14:22:10Z'
    },
    {
      id: 2,
      title: 'Avenant au contrat',
      type: 'amendment',
      status: 'pending',
      createdAt: '2025-02-28T09:15:00Z'
    }
  ];
  
  res.json({ documents });
});

module.exports = router;
