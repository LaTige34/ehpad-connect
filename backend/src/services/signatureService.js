const axios = require('axios');
const logger = require('../utils/logger');
const emailService = require('./emailService');

/**
 * Service de gestion des signatures électroniques
 * Intégration avec le fournisseur Yousign
 */
class SignatureService {
  constructor() {
    this.apiUrl = process.env.SIGNATURE_API_URL || 'https://api.yousign.com/';
    this.apiKey = process.env.SIGNATURE_API_KEY;
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    this.adminEmail = process.env.ADMIN_EMAIL || 'mathieu.desobry@ehpadbelleviste.fr';
  }

  /**
   * Crée une demande de signature pour un document
   * @param {Object} document - Les informations du document à signer
   * @param {Array} signers - Liste des signataires avec leurs informations
   * @returns {Promise<Object>} - La demande de signature créée
   */
  async createSignatureRequest(document, signers) {
    try {
      logger.info(`Création d'une demande de signature pour le document ${document.id}`);
      
      // En environnement de production, nous appellerions l'API Yousign
      if (process.env.NODE_ENV === 'production') {
        // Préparation des données pour Yousign
        const yousignData = {
          name: document.title,
          description: `Signature de ${document.title}`,
          ordered: false, // La signature peut être faite dans n'importe quel ordre
          expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
          signers: signers.map(signer => ({
            firstname: signer.firstName,
            lastname: signer.lastName,
            email: signer.email,
            phone: signer.phone,
            procedure: {
              type: 'email', // Signature par email
              verification: true
            }
          })),
          metadata: {
            documentId: document.id,
            documentType: document.type,
            createdBy: document.createdBy
          }
        };
        
        // Appel à l'API Yousign
        const response = await this.client.post('/v3/signature_requests', yousignData);
        
        // Enregistrement du succès
        logger.info(`Demande de signature créée avec succès: ${response.data.id}`);
        
        return response.data;
      } 
      // En développement ou test, nous simulons la réponse
      else {
        // Simulation d'une réponse de l'API Yousign
        const signatureRequestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        // Simulation d'un délai réseau
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockResponse = {
          id: signatureRequestId,
          name: document.title,
          description: `Signature de ${document.title}`,
          status: 'pending',
          expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          signers: signers.map(signer => ({
            id: `signer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            firstname: signer.firstName,
            lastname: signer.lastName,
            email: signer.email,
            status: 'pending',
            signatureURL: `https://app.yousign.com/sign/${signatureRequestId}?signer=${signer.email}`
          })),
          metadata: {
            documentId: document.id,
            documentType: document.type,
            createdBy: document.createdBy
          },
          createdAt: new Date().toISOString()
        };
        
        logger.info(`[DEV] Demande de signature simulée créée: ${mockResponse.id}`);
        
        return mockResponse;
      }
    } catch (error) {
      logger.error(`Erreur lors de la création de la demande de signature: ${error.message}`);
      throw new Error(`Erreur lors de la création de la demande de signature: ${error.message}`);
    }
  }

  /**
   * Récupère le statut d'une demande de signature
   * @param {string} signatureRequestId - L'identifiant de la demande de signature
   * @returns {Promise<Object>} - Les informations sur la demande de signature
   */
  async getSignatureRequestStatus(signatureRequestId) {
    try {
      logger.info(`Récupération du statut de la demande de signature ${signatureRequestId}`);
      
      if (process.env.NODE_ENV === 'production') {
        const response = await this.client.get(`/v3/signature_requests/${signatureRequestId}`);
        return response.data;
      } else {
        // Simulation d'un délai réseau
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Statuts possibles: pending, ongoing, done, expired, canceled
        const statuses = ['pending', 'ongoing', 'done', 'expired', 'canceled'];
        const randomStatus = statuses[Math.floor(Math.random() * 3)]; // Restreint aux 3 premiers pour la simulation
        
        const mockResponse = {
          id: signatureRequestId,
          status: randomStatus,
          signers: [
            {
              id: `signer_${Date.now()}`,
              email: 'utilisateur@ehpadbelleviste.fr',
              status: randomStatus === 'done' ? 'done' : 'pending',
              signedAt: randomStatus === 'done' ? new Date().toISOString() : null
            }
          ],
          updatedAt: new Date().toISOString()
        };
        
        logger.info(`[DEV] Statut simulé de la demande de signature: ${mockResponse.status}`);
        
        return mockResponse;
      }
    } catch (error) {
      logger.error(`Erreur lors de la récupération du statut de la demande de signature: ${error.message}`);
      throw new Error(`Erreur lors de la récupération du statut de la demande de signature: ${error.message}`);
    }
  }

  /**
   * Traite une signature complétée (appelée par webhook ou manuellement)
   * @param {string} signatureRequestId - L'identifiant de la demande de signature
   * @param {Object} documentInfo - Les informations du document signé
   * @returns {Promise<Object>} - Les informations sur le traitement effectué
   */
  async processCompletedSignature(signatureRequestId, documentInfo) {
    try {
      logger.info(`Traitement de la signature complétée ${signatureRequestId}`);
      
      // Récupérer les informations de la signature
      const signatureRequest = await this.getSignatureRequestStatus(signatureRequestId);
      
      if (signatureRequest.status === 'done') {
        // Obtenir la liste des signataires et leurs emails
        const signerEmails = signatureRequest.signers.map(signer => signer.email);
        
        // Préparer les données pour l'envoi d'email
        const emailData = {
          subject: `Document signé : ${documentInfo.title}`,
          recipients: [...signerEmails, this.adminEmail],
          template: 'document-signed',
          data: {
            documentTitle: documentInfo.title,
            documentId: documentInfo.id,
            signatureDate: new Date().toISOString(),
            signerNames: signatureRequest.signers.map(s => `${s.firstname} ${s.lastname}`).join(', ')
          },
          attachments: [
            {
              filename: `${documentInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
              path: documentInfo.filePath, // Chemin vers le document signé
              contentType: 'application/pdf'
            }
          ]
        };
        
        // Envoyer l'email de confirmation avec le document en pièce jointe
        await emailService.sendEmail(emailData);
        
        logger.info(`Email de confirmation envoyé pour la signature ${signatureRequestId}`);
        
        return {
          success: true,
          signatureRequestId,
          status: 'processed',
          emailsSent: emailData.recipients
        };
      }
      
      return {
        success: false,
        signatureRequestId,
        status: signatureRequest.status,
        message: 'La signature n\'est pas finalisée'
      };
    } catch (error) {
      logger.error(`Erreur lors du traitement de la signature complétée: ${error.message}`);
      throw new Error(`Erreur lors du traitement de la signature complétée: ${error.message}`);
    }
  }

  /**
   * Annule une demande de signature
   * @param {string} signatureRequestId - L'identifiant de la demande de signature
   * @returns {Promise<Object>} - Confirmation de l'annulation
   */
  async cancelSignatureRequest(signatureRequestId) {
    try {
      logger.info(`Annulation de la demande de signature ${signatureRequestId}`);
      
      if (process.env.NODE_ENV === 'production') {
        await this.client.delete(`/v3/signature_requests/${signatureRequestId}`);
        return { success: true, message: 'Demande de signature annulée avec succès' };
      } else {
        // Simulation d'un délai réseau
        await new Promise(resolve => setTimeout(resolve, 300));
        
        logger.info(`[DEV] Demande de signature simulée annulée: ${signatureRequestId}`);
        
        return {
          success: true,
          message: 'Demande de signature annulée avec succès',
          id: signatureRequestId,
          status: 'canceled'
        };
      }
    } catch (error) {
      logger.error(`Erreur lors de l'annulation de la demande de signature: ${error.message}`);
      throw new Error(`Erreur lors de l'annulation de la demande de signature: ${error.message}`);
    }
  }
}

module.exports = new SignatureService();
