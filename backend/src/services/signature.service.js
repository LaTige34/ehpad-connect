const axios = require('axios');
const fs = require('fs').promises;
const crypto = require('crypto');
const path = require('path');
const logger = require('../utils/logger');
const { User } = require('../models');

/**
 * Service de signature électronique
 */
class SignatureService {
  constructor() {
    this.apiUrl = process.env.SIGNATURE_API_URL;
    this.apiKey = process.env.SIGNATURE_API_KEY;
    this.service = process.env.SIGNATURE_SERVICE || 'mock';
    
    // Initialisation du client API en fonction du service configuré
    this.initializeClient();
  }
  
  /**
   * Initialise le client API pour le service de signature choisi
   */
  initializeClient() {
    switch (this.service.toLowerCase()) {
      case 'yousign':
        this.client = axios.create({
          baseURL: this.apiUrl,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        break;
        
      case 'docusign':
        this.client = axios.create({
          baseURL: this.apiUrl,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        break;
        
      case 'universign':
        this.client = axios.create({
          baseURL: this.apiUrl,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        break;
        
      default:
        // Mode simulé pour le développement
        logger.info('Service de signature en mode simulé');
        this.client = null;
    }
  }
  
  /**
   * Signe un document avec le service configuré
   * @param {Object} document - Informations sur le document à signer
   * @param {Number} userId - ID de l'utilisateur qui signe
   * @param {Object} signatureData - Données de signature (peut varier selon le service)
   * @returns {Promise<Object>} Résultat de la signature
   */
  async signDocument(document, userId, signatureData) {
    try {
      // Obtenir les informations de l'utilisateur qui signe
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }
      
      // En fonction du service configuré, appeler la méthode appropriée
      switch (this.service.toLowerCase()) {
        case 'yousign':
          return this.signWithYousign(document, user, signatureData);
          
        case 'docusign':
          return this.signWithDocuSign(document, user, signatureData);
          
        case 'universign':
          return this.signWithUniversign(document, user, signatureData);
          
        default:
          // Mode simulé pour le développement
          return this.mockSignature(document, user, signatureData);
      }
    } catch (error) {
      logger.error(`Erreur lors de la signature du document: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Signature avec YouSign
   */
  async signWithYousign(document, user, signatureData) {
    try {
      // Vérifier que le fichier existe
      const filePath = document.filePath;
      await fs.access(filePath);
      
      // Lire le fichier en base64
      const fileContent = await fs.readFile(filePath);
      const fileBase64 = fileContent.toString('base64');
      
      // Créer la procédure de signature
      const procedureResponse = await this.client.post('/procedures', {
        name: document.title,
        description: `Signature de ${document.title}`,
        members: [
          {
            firstname: user.name.split(' ')[0],
            lastname: user.name.split(' ').slice(1).join(' '),
            email: user.email,
            phone: signatureData.phone || null,
            fileObjects: [
              {
                file: fileBase64,
                page: 1,
                position: signatureData.position || "230,499,464,589",
                mention: "Lu et approuvé"
              }
            ]
          }
        ]
      });
      
      // Récupérer l'ID de la procédure
      const procedureId = procedureResponse.data.id;
      
      // Activer la procédure
      await this.client.put(`/procedures/${procedureId}/start`);
      
      return {
        signatureId: procedureId,
        metadata: {
          provider: 'yousign',
          procedureId,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`Erreur lors de la signature avec YouSign: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Signature avec DocuSign
   */
  async signWithDocuSign(document, user, signatureData) {
    try {
      // Implémentation spécifique à DocuSign
      // Cette méthode doit être adaptée à l'API DocuSign
      
      logger.error('Signature avec DocuSign non implémentée');
      throw new Error('Signature avec DocuSign non implémentée');
    } catch (error) {
      logger.error(`Erreur lors de la signature avec DocuSign: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Signature avec Universign
   */
  async signWithUniversign(document, user, signatureData) {
    try {
      // Implémentation spécifique à Universign
      // Cette méthode doit être adaptée à l'API Universign
      
      logger.error('Signature avec Universign non implémentée');
      throw new Error('Signature avec Universign non implémentée');
    } catch (error) {
      logger.error(`Erreur lors de la signature avec Universign: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Signature simulée pour le développement
   */
  async mockSignature(document, user, signatureData) {
    try {
      logger.info(`Signature simulée pour le document ${document.title} par ${user.name}`);
      
      // Générer un ID de signature aléatoire
      const signatureId = `sig_${crypto.randomBytes(16).toString('hex')}`;
      
      // Simuler un délai pour l'opération de signature
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Si le document est un fichier, ajouter une marque de signature
      if (document.filePath) {
        try {
          // Vérifier que le fichier existe
          await fs.access(document.filePath);
          
          // En développement, on pourrait ajouter une marque de signature
          // sur le document (par exemple avec PDFKit), mais ici on simule
          logger.info(`Ajout d'une marque de signature sur le fichier: ${document.filePath}`);
        } catch (error) {
          logger.warn(`Impossible d'accéder au fichier: ${error.message}`);
          // Continuer sans modifier le fichier
        }
      }
      
      return {
        signatureId,
        metadata: {
          provider: 'mock',
          timestamp: new Date().toISOString(),
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          document: {
            title: document.title,
            type: document.type
          },
          signatureData: {
            ip: signatureData.ip || '127.0.0.1',
            userAgent: signatureData.userAgent || 'Mozilla/5.0',
            consent: true
          }
        }
      };
    } catch (error) {
      logger.error(`Erreur lors de la signature simulée: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Vérifie la validité d'une signature
   * @param {String} signatureId - ID de la signature à vérifier
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async verifySignature(signatureId) {
    try {
      // En fonction du service configuré, appeler la méthode appropriée
      switch (this.service.toLowerCase()) {
        case 'yousign':
          // Implémenter la vérification Yousign
          break;
          
        case 'docusign':
          // Implémenter la vérification DocuSign
          break;
          
        case 'universign':
          // Implémenter la vérification Universign
          break;
          
        default:
          // Mode simulé
          return {
            valid: true,
            details: {
              provider: 'mock',
              signatureId,
              verifiedAt: new Date().toISOString()
            }
          };
      }
    } catch (error) {
      logger.error(`Erreur lors de la vérification de la signature: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new SignatureService();