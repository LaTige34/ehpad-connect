const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const logger = require('../utils/logger');

/**
 * Service de gestion des emails
 */
class EmailService {
  constructor() {
    // Configuration du transporteur d'emails
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    // Email administrateur par défaut
    this.adminEmail = process.env.ADMIN_EMAIL || 'mathieu.desobry@ehpadbelleviste.fr';
    
    // Email expéditeur par défaut
    this.defaultFrom = process.env.SMTP_FROM || 'EHPAD Belleviste <noreply@ehpadbelleviste.fr>';
    
    // Chemin vers les templates d'emails
    this.templatesDir = path.resolve(__dirname, '../templates/emails');
  }

  /**
   * Charge et compile un template d'email
   * @param {string} templateName - Nom du template à charger
   * @param {Object} data - Données à injecter dans le template
   * @returns {Promise<string>} - Le contenu HTML du template compilé
   */
  async loadTemplate(templateName, data) {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.html`);
      const templateSource = await fs.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateSource);
      return template(data);
    } catch (error) {
      logger.error(`Erreur lors du chargement du template ${templateName}: ${error.message}`);
      
      // Si en développement, nous simulons le contenu du template
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`[DEV] Utilisation d'un template d'email simulé pour ${templateName}`);
        return this.getSimulatedTemplate(templateName, data);
      }
      
      throw new Error(`Erreur lors du chargement du template ${templateName}`);
    }
  }

  /**
   * Génère un template d'email simulé pour le développement
   * @param {string} templateName - Nom du template à simuler
   * @param {Object} data - Données à injecter dans le template
   * @returns {string} - Le contenu HTML du template simulé
   */
  getSimulatedTemplate(templateName, data) {
    let template = '';
    
    switch (templateName) {
      case 'document-signed':
        template = `
          <h1>Document signé : ${data.documentTitle}</h1>
          <p>Le document <strong>${data.documentTitle}</strong> a été signé par ${data.signerNames}.</p>
          <p>Date de signature : ${new Date(data.signatureDate).toLocaleString('fr-FR')}</p>
          <p>Vous trouverez le document signé en pièce jointe.</p>
          <p>Cordialement,<br>L'équipe EHPAD Belleviste</p>
        `;
        break;
        
      case 'planning-updated':
        template = `
          <h1>Mise à jour du planning</h1>
          <p>Votre planning a été mis à jour pour la période : ${data.period}.</p>
          <p>Pour consulter votre planning, connectez-vous à l'application EHPAD Connect.</p>
          <p>Cordialement,<br>L'équipe EHPAD Belleviste</p>
        `;
        break;
        
      case 'password-reset':
        template = `
          <h1>Réinitialisation de votre mot de passe</h1>
          <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
          <p>Cliquez sur le lien suivant pour définir un nouveau mot de passe :</p>
          <p><a href="${data.resetLink}">Réinitialiser mon mot de passe</a></p>
          <p>Ce lien est valide pendant 24 heures.</p>
          <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
          <p>Cordialement,<br>L'équipe EHPAD Belleviste</p>
        `;
        break;
        
      default:
        template = `
          <h1>${templateName}</h1>
          <p>Ceci est un email simulé pour le développement.</p>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        `;
    }
    
    return template;
  }

  /**
   * Envoie un email
   * @param {Object} options - Options d'envoi
   * @param {string} options.subject - Sujet de l'email
   * @param {Array|string} options.recipients - Destinataires de l'email
   * @param {string} options.template - Nom du template à utiliser
   * @param {Object} options.data - Données à injecter dans le template
   * @param {Array} [options.attachments] - Pièces jointes
   * @param {string} [options.cc] - Copie carbone
   * @param {string} [options.bcc] - Copie carbone cachée
   * @returns {Promise<Object>} - Résultat de l'envoi
   */
  async sendEmail(options) {
    try {
      const { subject, recipients, template, data, attachments, cc, bcc } = options;
      
      // S'assurer que les destinataires sont au format tableau
      const toRecipients = Array.isArray(recipients) ? recipients : [recipients];
      
      // Charger le template
      const htmlContent = await this.loadTemplate(template, data);
      
      // Préparer les options d'envoi
      const mailOptions = {
        from: options.from || this.defaultFrom,
        to: toRecipients.join(', '),
        subject,
        html: htmlContent,
        attachments: attachments || []
      };
      
      // Ajouter CC et BCC si fournis
      if (cc) mailOptions.cc = cc;
      if (bcc) mailOptions.bcc = bcc;
      
      // En développement, nous simulons l'envoi
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`[DEV] Simulation d'envoi d'email:
          Sujet: ${subject}
          Destinataires: ${toRecipients.join(', ')}
          Template: ${template}
          Pièces jointes: ${attachments ? attachments.length : 0}
        `);
        
        return {
          success: true,
          messageId: `simulé_${Date.now()}`,
          recipients: toRecipients,
          preview: htmlContent.substring(0, 200) + '...'
        };
      }
      
      // Envoi réel en production
      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email envoyé: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
        recipients: toRecipients
      };
    } catch (error) {
      logger.error(`Erreur lors de l'envoi d'email: ${error.message}`);
      throw new Error(`Erreur lors de l'envoi d'email: ${error.message}`);
    }
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   * @param {string} email - Email du destinataire
   * @param {string} resetToken - Token de réinitialisation
   * @param {string} resetLink - Lien de réinitialisation
   * @returns {Promise<Object>} - Résultat de l'envoi
   */
  async sendPasswordResetEmail(email, resetToken, resetLink) {
    return this.sendEmail({
      subject: 'Réinitialisation de votre mot de passe - EHPAD Connect',
      recipients: [email],
      template: 'password-reset',
      data: {
        resetToken,
        resetLink
      }
    });
  }

  /**
   * Envoie un email de notification de mise à jour du planning
   * @param {string} email - Email du destinataire
   * @param {Object} planningData - Données du planning mis à jour
   * @returns {Promise<Object>} - Résultat de l'envoi
   */
  async sendPlanningUpdateNotification(email, planningData) {
    return this.sendEmail({
      subject: 'Mise à jour de votre planning - EHPAD Connect',
      recipients: [email],
      cc: this.adminEmail, // Copie à l'administrateur
      template: 'planning-updated',
      data: {
        period: planningData.period,
        updatedBy: planningData.updatedBy,
        updateDate: planningData.updateDate
      }
    });
  }

  /**
   * Envoie un email avec un document signé
   * @param {string} email - Email du destinataire
   * @param {Object} documentData - Données du document signé
   * @param {string} documentPath - Chemin vers le document signé
   * @returns {Promise<Object>} - Résultat de l'envoi
   */
  async sendSignedDocument(email, documentData, documentPath) {
    return this.sendEmail({
      subject: `Document signé : ${documentData.title} - EHPAD Connect`,
      recipients: [email],
      cc: this.adminEmail, // Copie à l'administrateur
      template: 'document-signed',
      data: {
        documentTitle: documentData.title,
        documentId: documentData.id,
        signatureDate: documentData.signedAt,
        signerNames: documentData.signerName
      },
      attachments: [
        {
          filename: `${documentData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
          path: documentPath,
          contentType: 'application/pdf'
        }
      ]
    });
  }
}

module.exports = new EmailService();
