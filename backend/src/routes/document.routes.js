const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
// Importation future des middlewares d'authentification
// const { authenticate, authorize } = require('../middleware/auth');
// Importation future des contrôleurs
// const { getDocuments, getDocument, uploadDocument, signDocument, sendDocument } = require('../controllers/document.controller');

/**
 * @route   GET /api/documents
 * @desc    Obtenir la liste des documents de l'utilisateur
 * @access  Privé
 */
router.get('/', (req, res) => {
  // Temporairement en attendant le contrôleur et l'authentification
  const userId = req.query.userId || 1; // Simulé en attendant l'authentification
  
  // Données simulées
  const documents = [
    {
      id: 1,
      title: 'Contrat de travail',
      type: 'contract',
      status: 'signed',
      createdAt: '2025-01-10T10:30:00Z',
      signedAt: '2025-01-15T14:22:10Z',
      url: '/api/documents/1/download'
    },
    {
      id: 2,
      title: 'Avenant au contrat',
      type: 'amendment',
      status: 'pending',
      createdAt: '2025-02-28T09:15:00Z',
      url: '/api/documents/2/view'
    },
    {
      id: 3,
      title: 'Fiche de poste',
      type: 'info',
      status: 'read',
      createdAt: '2025-02-05T11:45:00Z',
      url: '/api/documents/3/download'
    }
  ];
  
  res.json({ documents });
});

/**
 * @route   GET /api/documents/:id
 * @desc    Obtenir les détails d'un document spécifique
 * @access  Privé
 */
router.get('/:id', (req, res) => {
  const documentId = req.params.id;
  
  // Données simulées
  const document = {
    id: documentId,
    title: `Document ${documentId}`,
    type: documentId % 2 === 0 ? 'contract' : 'info',
    status: ['draft', 'pending', 'signed', 'read'][documentId % 4],
    createdAt: '2025-02-01T10:00:00Z',
    content: 'Contenu du document...',
    metadata: {
      pages: 3,
      fileSize: '250KB',
      fileType: 'application/pdf'
    }
  };
  
  res.json({ document });
});

/**
 * @route   POST /api/documents
 * @desc    Créer un nouveau document
 * @access  Admin ou Manager
 */
router.post('/', [
  body('title').notEmpty().withMessage('Le titre est requis'),
  body('type').isIn(['contract', 'amendment', 'info']).withMessage('Type de document invalide'),
  body('recipientId').notEmpty().withMessage('Le destinataire est requis')
], (req, res) => {
  // Temporairement en attendant le contrôleur
  res.status(201).json({ 
    message: 'Document créé avec succès (simulation)',
    document: {
      id: Date.now(),
      title: req.body.title,
      type: req.body.type,
      status: 'draft',
      createdAt: new Date().toISOString(),
      recipientId: req.body.recipientId
    }
  });
});

/**
 * @route   POST /api/documents/:id/sign
 * @desc    Signer un document
 * @access  Privé
 */
router.post('/:id/sign', [
  body('signatureData').notEmpty().withMessage('Les données de signature sont requises')
], (req, res) => {
  const documentId = req.params.id;
  
  res.json({ 
    message: `Document ${documentId} signé avec succès (simulation)`,
    signatureId: `sig_${Date.now()}`,
    signedAt: new Date().toISOString(),
    status: 'signed',
    emailSentTo: ['utilisateur@example.com', 'mathieu.desobry@ehpadbelleviste.fr']
  });
});

/**
 * @route   GET /api/documents/:id/download
 * @desc    Télécharger un document
 * @access  Privé
 */
router.get('/:id/download', (req, res) => {
  const documentId = req.params.id;
  
  // Normalement, on enverrait un fichier, mais ici on simule
  res.json({ 
    message: `Lien de téléchargement pour le document ${documentId} (simulation)`,
    downloadUrl: `https://api.example.com/downloads/document_${documentId}.pdf`
  });
});

/**
 * @route   POST /api/documents/:id/send
 * @desc    Envoyer un document par email
 * @access  Privé
 */
router.post('/:id/send', [
  body('email').isEmail().withMessage('Email invalide')
], (req, res) => {
  const documentId = req.params.id;
  
  res.json({ 
    message: `Document ${documentId} envoyé avec succès à ${req.body.email} (simulation)`,
    sentAt: new Date().toISOString()
  });
});

module.exports = router;
