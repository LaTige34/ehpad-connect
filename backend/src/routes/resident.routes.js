const express = require('express');
const router = express.Router();
const residentController = require('../controllers/resident.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { body, query } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configuration de multer pour l'upload de photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/residents');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resident-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif)'));
    }
  }
});

// Validations
const createResidentValidation = [
  body('firstName').notEmpty().withMessage('Le prénom est requis'),
  body('lastName').notEmpty().withMessage('Le nom est requis'),
  body('roomNumber').notEmpty().withMessage('Le numéro de chambre est requis'),
  body('dietType').optional().isIn(['normal', 'modified', 'diabetic', 'low_sodium'])
    .withMessage('Type de régime invalide'),
  body('chokingRisk').optional().isBoolean(),
  body('medicationAdministration').optional().isBoolean(),
  body('enhancedHydration').optional().isBoolean(),
  body('foodAllergies').optional().isBoolean(),
  body('active').optional().isBoolean()
];

const updateResidentValidation = [
  body('firstName').optional().notEmpty().withMessage('Le prénom ne peut pas être vide'),
  body('lastName').optional().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('roomNumber').optional().notEmpty().withMessage('Le numéro de chambre ne peut pas être vide'),
  body('dietType').optional().isIn(['normal', 'modified', 'diabetic', 'low_sodium'])
    .withMessage('Type de régime invalide'),
  body('chokingRisk').optional().isBoolean(),
  body('medicationAdministration').optional().isBoolean(),
  body('enhancedHydration').optional().isBoolean(),
  body('foodAllergies').optional().isBoolean(),
  body('active').optional().isBoolean()
];

// Routes publiques (nécessitent une authentification mais pas de rôle spécifique)

/**
 * @route   GET /api/residents/stats
 * @desc    Obtenir les statistiques des résidents
 * @access  Private (tous les utilisateurs authentifiés)
 */
router.get('/stats', authenticate, residentController.getResidentStats);

/**
 * @route   GET /api/residents
 * @desc    Obtenir tous les résidents
 * @access  Private
 */
router.get('/', authenticate, residentController.getAllResidents);

/**
 * @route   GET /api/residents/:id
 * @desc    Obtenir un résident par ID
 * @access  Private
 */
router.get('/:id', authenticate, residentController.getResidentById);

// Routes nécessitant des permissions admin ou manager

/**
 * @route   POST /api/residents
 * @desc    Créer un nouveau résident
 * @access  Private (admin, manager)
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'manager']),
  createResidentValidation,
  validate,
  residentController.createResident
);

/**
 * @route   PUT /api/residents/:id
 * @desc    Mettre à jour un résident
 * @access  Private (admin, manager)
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'manager']),
  updateResidentValidation,
  validate,
  residentController.updateResident
);

/**
 * @route   DELETE /api/residents/:id
 * @desc    Supprimer un résident
 * @access  Private (admin, manager)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'manager']),
  residentController.deleteResident
);

/**
 * @route   POST /api/residents/:id/restore
 * @desc    Restaurer un résident supprimé
 * @access  Private (admin)
 */
router.post(
  '/:id/restore',
  authenticate,
  authorize(['admin']),
  residentController.restoreResident
);

/**
 * @route   POST /api/residents/:id/photo
 * @desc    Upload la photo d'un résident
 * @access  Private (admin, manager)
 */
router.post(
  '/:id/photo',
  authenticate,
  authorize(['admin', 'manager']),
  upload.single('photo'),
  residentController.uploadPhoto
);

module.exports = router;
