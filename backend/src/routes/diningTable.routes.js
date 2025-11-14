const express = require('express');
const router = express.Router();
const diningTableController = require('../controllers/diningTable.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { body } = require('express-validator');

// Validations
const createTableValidation = [
  body('tableNumber').isInt({ min: 1 }).withMessage('Le numéro de table doit être un entier positif'),
  body('capacity').optional().isInt({ min: 1, max: 10 }).withMessage('La capacité doit être entre 1 et 10'),
  body('shape').optional().isIn(['round', 'square', 'rectangular']).withMessage('Forme de table invalide'),
  body('positionX').optional().isFloat(),
  body('positionY').optional().isFloat(),
  body('active').optional().isBoolean()
];

const updateTableValidation = [
  body('tableNumber').optional().isInt({ min: 1 }).withMessage('Le numéro de table doit être un entier positif'),
  body('capacity').optional().isInt({ min: 1, max: 10 }).withMessage('La capacité doit être entre 1 et 10'),
  body('shape').optional().isIn(['round', 'square', 'rectangular']).withMessage('Forme de table invalide'),
  body('positionX').optional().isFloat(),
  body('positionY').optional().isFloat(),
  body('active').optional().isBoolean()
];

const bulkCreateValidation = [
  body('count').isInt({ min: 1, max: 50 }).withMessage('Le nombre de tables doit être entre 1 et 50'),
  body('startNumber').optional().isInt({ min: 1 }).withMessage('Le numéro de départ doit être un entier positif'),
  body('capacity').optional().isInt({ min: 1, max: 10 }).withMessage('La capacité doit être entre 1 et 10'),
  body('shape').optional().isIn(['round', 'square', 'rectangular']).withMessage('Forme de table invalide')
];

/**
 * @route   GET /api/dining-tables
 * @desc    Obtenir toutes les tables
 * @access  Private
 */
router.get('/', authenticate, diningTableController.getAllTables);

/**
 * @route   GET /api/dining-tables/:id
 * @desc    Obtenir une table par ID
 * @access  Private
 */
router.get('/:id', authenticate, diningTableController.getTableById);

/**
 * @route   POST /api/dining-tables
 * @desc    Créer une nouvelle table
 * @access  Private (admin, manager)
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'manager']),
  createTableValidation,
  validate,
  diningTableController.createTable
);

/**
 * @route   POST /api/dining-tables/bulk
 * @desc    Créer plusieurs tables en une fois
 * @access  Private (admin, manager)
 */
router.post(
  '/bulk',
  authenticate,
  authorize(['admin', 'manager']),
  bulkCreateValidation,
  validate,
  diningTableController.bulkCreateTables
);

/**
 * @route   PUT /api/dining-tables/:id
 * @desc    Mettre à jour une table
 * @access  Private (admin, manager)
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'manager']),
  updateTableValidation,
  validate,
  diningTableController.updateTable
);

/**
 * @route   DELETE /api/dining-tables/:id
 * @desc    Supprimer une table
 * @access  Private (admin, manager)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'manager']),
  diningTableController.deleteTable
);

module.exports = router;
