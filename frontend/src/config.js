// Configuration de l'application
const config = {
  // URL de base de l'API
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  
  // Délai d'expiration des requêtes (en millisecondes)
  API_TIMEOUT: 30000,
  
  // Paramètres d'authentification
  AUTH: {
    // Durée de vie du token en localStorage (en jours)
    TOKEN_EXPIRY_DAYS: 1,
    // Clé de stockage du token dans localStorage
    TOKEN_KEY: 'ehpad_connect_token',
  },
  
  // Paramètres de notification
  NOTIFICATION: {
    // Durée d'affichage des notifications (en millisecondes)
    DISPLAY_DURATION: 5000,
  },
  
  // Configuration d'envoi d'email
  EMAIL: {
    // Email administrateur par défaut
    ADMIN_EMAIL: 'mathieu.desobry@ehpadbelleviste.fr',
  },
  
  // Configuration du service de signature
  SIGNATURE: {
    // Service utilisé (yousign, docusign, etc.)
    SERVICE: 'yousign',
  },
  
  // Configuration pour le mode développement
  DEV: {
    // Activer les données de test
    ENABLE_MOCK_DATA: process.env.NODE_ENV === 'development',
    // Simuler le délai réseau pour les données de test (en millisecondes)
    MOCK_DELAY: 800,
  }
};

// Exports pour utilisation dans l'application
export const { 
  API_URL, 
  API_TIMEOUT, 
  AUTH, 
  NOTIFICATION, 
  EMAIL, 
  SIGNATURE, 
  DEV 
} = config;

export default config;
