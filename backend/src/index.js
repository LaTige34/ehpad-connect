require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth.routes');
const planningRoutes = require('./routes/planning.routes');
const documentRoutes = require('./routes/document.routes');
const userRoutes = require('./routes/user.routes');

// Initialisation de l'application Express
const app = express();

// Middleware de base
app.use(helmet()); // Sécurité
app.use(cors()); // CORS
app.use(express.json()); // Parsing du corps JSON
app.use(express.urlencoded({ extended: true })); // Parsing des formulaires
app.use(morgan('combined', { stream: logger.stream })); // Logging

// Définition des routes
app.use('/api/auth', authRoutes);
app.use('/api/planning', planningRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);

// Route racine pour la santé de l'API
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API EHPAD Connect', status: 'OK' });
});

// Middleware de gestion des erreurs
app.use(errorHandler);

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Serveur démarré sur le port ${PORT}`);
  console.log(`Serveur démarré sur le port ${PORT}`);
});

// Gestion des erreurs non interceptées
process.on('unhandledRejection', (err) => {
  logger.error('Erreur non interceptée:', err);
  // Arrêt propre du serveur
  process.exit(1);
});

module.exports = app; // Pour les tests
