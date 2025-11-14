const express = require('express');
const router = express.Router();
const seatingPlanController = require('../controllers/seatingPlan.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { body } = require('express-validator');

// Validations
const createSeatingPlanValidation = [
  body('name').notEmpty().withMessage('Le nom du plan de table est requis'),
  body('effectiveDate').isISO8601().withMessage('Date d\'application invalide'),
  body('seatingArrangement').isArray().withMessage('L\'arrangement des sièges doit être un tableau'),
  body('guests').optional().isArray().withMessage('Les invités doivent être un tableau'),
  body('status').optional().isIn(['draft', 'active', 'archived']).withMessage('Statut invalide')
];

const updateSeatingPlanValidation = [
  body('name').optional().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('effectiveDate').optional().isISO8601().withMessage('Date d\'application invalide'),
  body('seatingArrangement').optional().isArray().withMessage('L\'arrangement des sièges doit être un tableau'),
  body('guests').optional().isArray().withMessage('Les invités doivent être un tableau'),
  body('status').optional().isIn(['draft', 'active', 'archived']).withMessage('Statut invalide')
];

const duplicateSeatingPlanValidation = [
  body('name').optional().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('effectiveDate').optional().isISO8601().withMessage('Date d\'application invalide')
];

/**
 * @route   GET /api/seating-plans/active/current
 * @desc    Obtenir le plan de table actif
 * @access  Private
 */
router.get('/active/current', authenticate, seatingPlanController.getActiveSeatingPlan);

/**
 * @route   GET /api/seating-plans
 * @desc    Obtenir tous les plans de table
 * @access  Private
 */
router.get('/', authenticate, seatingPlanController.getAllSeatingPlans);

/**
 * @route   GET /api/seating-plans/:id
 * @desc    Obtenir un plan de table par ID
 * @access  Private
 */
router.get('/:id', authenticate, seatingPlanController.getSeatingPlanById);

/**
 * @route   GET /api/seating-plans/:id/pdf
 * @desc    Générer et télécharger le PDF d'un plan de table
 * @access  Private
 */
router.get('/:id/pdf', authenticate, seatingPlanController.generatePDF);

/**
 * @route   POST /api/seating-plans
 * @desc    Créer un nouveau plan de table
 * @access  Private (admin, manager)
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'manager']),
  createSeatingPlanValidation,
  validate,
  seatingPlanController.createSeatingPlan
);

/**
 * @route   POST /api/seating-plans/:id/duplicate
 * @desc    Dupliquer un plan de table
 * @access  Private (admin, manager)
 */
router.post(
  '/:id/duplicate',
  authenticate,
  authorize(['admin', 'manager']),
  duplicateSeatingPlanValidation,
  validate,
  seatingPlanController.duplicateSeatingPlan
);

/**
 * @route   POST /api/seating-plans/:id/activate
 * @desc    Activer un plan de table
 * @access  Private (admin, manager)
 */
router.post(
  '/:id/activate',
  authenticate,
  authorize(['admin', 'manager']),
  seatingPlanController.activateSeatingPlan
);

/**
 * @route   POST /api/seating-plans/:id/archive
 * @desc    Archiver un plan de table
 * @access  Private (admin, manager)
 */
router.post(
  '/:id/archive',
  authenticate,
  authorize(['admin', 'manager']),
  seatingPlanController.archiveSeatingPlan
);

/**
 * @route   PUT /api/seating-plans/:id
 * @desc    Mettre à jour un plan de table
 * @access  Private (admin, manager)
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'manager']),
  updateSeatingPlanValidation,
  validate,
  seatingPlanController.updateSeatingPlan
);

/**
 * @route   DELETE /api/seating-plans/:id
 * @desc    Supprimer un plan de table
 * @access  Private (admin, manager)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'manager']),
  seatingPlanController.deleteSeatingPlan
);

module.exports = router;
