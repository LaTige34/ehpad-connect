const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
// Importation future des middlewares d'authentification
// const { authenticate, authorize } = require('../middleware/auth');
// Importation future des contrôleurs
// const { getPlanning, syncPlanning, signPlanning } = require('../controllers/planning.controller');

/**
 * @route   GET /api/planning/
 * @desc    Obtenir le planning de l'utilisateur connecté
 * @access  Privé
 */
router.get('/', (req, res) => {
  // Temporairement en attendant le contrôleur et le middleware d'authentification
  const userId = req.query.userId || 1; // Simulé en attendant l'authentification
  
  // Données de planning simulées
  const planning = {
    userId,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    days: Array.from({ length: 30 }, (_, i) => ({
      date: `2025-03-${String(i + 1).padStart(2, '0')}`,
      shift: i % 3 === 0 ? 'Matin' : i % 3 === 1 ? 'Après-midi' : 'Repos',
      hours: i % 3 === 0 ? '7h-15h' : i % 3 === 1 ? '15h-23h' : '',
      service: i % 3 !== 2 ? 'Service A' : ''
    }))
  };
  
  res.json({ planning });
});

/**
 * @route   GET /api/planning/:id
 * @desc    Obtenir un planning spécifique par ID
 * @access  Privé (+ autorisation)
 */
router.get('/:id', (req, res) => {
  // Temporairement en attendant le contrôleur
  const planningId = req.params.id;
  
  res.json({ 
    message: `Planning ${planningId} récupéré (simulation)`,
    planning: {
      id: planningId,
      month: 3,
      year: 2025,
      employee: {
        id: 1,
        name: 'Employé Test'
      },
      days: Array.from({ length: 30 }, (_, i) => ({
        date: `2025-03-${String(i + 1).padStart(2, '0')}`,
        shift: i % 3 === 0 ? 'Matin' : i % 3 === 1 ? 'Après-midi' : 'Repos',
        hours: i % 3 === 0 ? '7h-15h' : i % 3 === 1 ? '15h-23h' : '',
        service: i % 3 !== 2 ? 'Service A' : ''
      }))
    }
  });
});

/**
 * @route   POST /api/planning/sync
 * @desc    Synchroniser les plannings avec Octime
 * @access  Admin ou Manager
 */
router.post('/sync', (req, res) => {
  // Temporairement en attendant le contrôleur
  res.json({ 
    message: 'Synchronisation avec Octime démarrée (simulation)',
    syncId: Date.now(),
    status: 'in_progress'
  });
});

/**
 * @route   POST /api/planning/:id/sign
 * @desc    Signer un planning
 * @access  Privé
 */
router.post('/:id/sign', [
  body('signatureData').notEmpty().withMessage('Les données de signature sont requises')
], (req, res) => {
  // Temporairement en attendant le contrôleur
  const planningId = req.params.id;
  
  res.json({ 
    message: `Planning ${planningId} signé avec succès (simulation)`,
    signatureId: `sig_${Date.now()}`,
    signedAt: new Date().toISOString(),
    signedBy: 'Utilisateur Test',
    emailSentTo: ['utilisateur@example.com', 'mathieu.desobry@ehpadbelleviste.fr']
  });
});

/**
 * @route   GET /api/planning/:id/download
 * @desc    Télécharger un planning
 * @access  Privé
 */
router.get('/:id/download', (req, res) => {
  const planningId = req.params.id;
  
  // Normalement, on enverrait un fichier, mais ici on simule
  res.json({ 
    message: `Lien de téléchargement pour le planning ${planningId} (simulation)`,
    downloadUrl: `https://api.example.com/downloads/planning_${planningId}.pdf`
  });
});

module.exports = router;
