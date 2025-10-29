const express = require('express');
const router = express.Router();
const temperatureController = require('../controllers/temperature.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * Routes pour la gestion des relevés de température
 * Toutes les routes nécessitent une authentification
 */

// Appliquer l'authentification à toutes les routes
router.use(authenticate);

/**
 * @route   POST /api/temperature
 * @desc    Créer un nouveau relevé de température
 * @access  Private (tous les utilisateurs authentifiés)
 */
router.post('/', temperatureController.createTemperatureLog);

/**
 * @route   GET /api/temperature
 * @desc    Récupérer les relevés de température avec filtres
 * @query   refrigeratorId, startDate, endDate, alertLevel, period, page, limit
 * @access  Private
 */
router.get('/', temperatureController.getTemperatureLogs);

/**
 * @route   GET /api/temperature/refrigerators
 * @desc    Récupérer la liste des réfrigérateurs
 * @access  Private
 */
router.get('/refrigerators', temperatureController.getRefrigerators);

/**
 * @route   GET /api/temperature/anomalies
 * @desc    Récupérer les anomalies récentes
 * @query   refrigeratorId, days
 * @access  Private
 */
router.get('/anomalies', temperatureController.getAnomalies);

/**
 * @route   GET /api/temperature/stats/:refrigeratorId/:year/:month
 * @desc    Récupérer les statistiques mensuelles
 * @access  Private
 */
router.get('/stats/:refrigeratorId/:year/:month', temperatureController.getMonthlyStats);

/**
 * @route   GET /api/temperature/pdf/:refrigeratorId/:year/:month
 * @desc    Générer le PDF de la fiche mensuelle de surveillance
 * @access  Private
 */
router.get('/pdf/:refrigeratorId/:year/:month', temperatureController.generateMonthlyPDF);

/**
 * @route   GET /api/temperature/check-missing/:refrigeratorId
 * @desc    Vérifier les relevés manquants pour un réfrigérateur
 * @query   date (optionnel, par défaut aujourd'hui)
 * @access  Private
 */
router.get('/check-missing/:refrigeratorId', temperatureController.checkMissingLogs);

/**
 * @route   GET /api/temperature/:id
 * @desc    Récupérer un relevé par ID
 * @access  Private
 */
router.get('/:id', temperatureController.getTemperatureLogById);

/**
 * @route   PUT /api/temperature/:id
 * @desc    Mettre à jour un relevé de température
 * @access  Private (admin, manager ou créateur du relevé)
 */
router.put('/:id', temperatureController.updateTemperatureLog);

/**
 * @route   POST /api/temperature/:id/validate
 * @desc    Valider un relevé de température (pour anomalies)
 * @access  Private (admin ou manager uniquement)
 */
router.post('/:id/validate', authorize(['admin', 'manager']), temperatureController.validateTemperatureLog);

/**
 * @route   DELETE /api/temperature/:id
 * @desc    Supprimer un relevé de température
 * @access  Private (admin uniquement)
 */
router.delete('/:id', authorize(['admin']), temperatureController.deleteTemperatureLog);

module.exports = router;
