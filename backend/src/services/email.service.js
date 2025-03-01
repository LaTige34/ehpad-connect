const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * Configuration du transporteur d'emails
 */
const transporterConfig = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

// En mode développement, utiliser un transporteur de test
let testAccount;
let transporter;

/**
 * Initialisation du service d'email
 */
const initializeTransporter = async () => {
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    // En développement, utiliser un compte Ethereal pour les tests
    testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    logger.info('Service email initialisé en mode test avec Ethereal');
  } else {
    // En production, utiliser la configuration SMTP réelle
    transporter = nodemailer.createTransport(transporterConfig);
    
    logger.info('Service email initialisé avec la configuration SMTP');
  }
};

/**
 * Envoi d'un email générique
 */
const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    if (!transporter) {
      await initializeTransporter();
    }
    
    // Configuration de l'email
    const mailOptions = {
      from: process.env.SMTP_FROM || '"EHPAD Connect" <noreply@ehpadbelleviste.fr>',
      to,
      subject,
      html,
      attachments
    };
    
    // Ajouter automatiquement l'email administrateur en copie
    if (process.env.ADMIN_EMAIL && !to.includes(process.env.ADMIN_EMAIL)) {
      mailOptions.cc = process.env.ADMIN_EMAIL;
    }
    
    // Envoi de l'email
    const info = await transporter.sendMail(mailOptions);
    
    // En mode test, afficher l'URL de prévisualisation
    if (process.env.NODE_ENV === 'development' && testAccount) {
      logger.info(`Email envoyé: ${info.messageId}`);
      logger.info(`Prévisualisation: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return info;
  } catch (error) {
    logger.error(`Erreur lors de l'envoi de l'email: ${error.message}`);
    throw error;
  }
};

/**
 * Email de réinitialisation de mot de passe
 */
exports.sendPasswordResetEmail = async (to, resetUrl) => {
  const subject = 'Réinitialisation de votre mot de passe - EHPAD Connect';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Réinitialisation de votre mot de passe</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe pour EHPAD Connect.</p>
      <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
      <p>
        <a href="${resetUrl}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Réinitialiser mon mot de passe
        </a>
      </p>
      <p>Ce lien expirera dans 1 heure.</p>
      <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
      <p style="margin-top: 30px; font-size: 12px; color: #666;">
        EHPAD Belleviste<br>
        Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      </p>
    </div>
  `;
  
  return sendEmail(to, subject, html);
};

/**
 * Email pour demander une signature de document
 */
exports.sendSignatureRequest = async (to, documentTitle, documentUrl) => {
  const subject = `Document à signer: ${documentTitle} - EHPAD Connect`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Document à signer</h2>
      <p>Un document nécessite votre signature sur EHPAD Connect.</p>
      <p><strong>Document :</strong> ${documentTitle}</p>
      <p>Veuillez vous connecter à votre compte et signer ce document dès que possible.</p>
      <p>
        <a href="${documentUrl}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Accéder au document
        </a>
      </p>
      <p style="margin-top: 30px; font-size: 12px; color: #666;">
        EHPAD Belleviste<br>
        Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      </p>
    </div>
  `;
  
  return sendEmail(to, subject, html);
};

/**
 * Email de confirmation après signature d'un document
 */
exports.sendSignatureConfirmation = async (to, documentTitle, documentUrl) => {
  const subject = `Confirmation de signature: ${documentTitle} - EHPAD Connect`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Document signé avec succès</h2>
      <p>Vous avez signé le document suivant sur EHPAD Connect :</p>
      <p><strong>Document :</strong> ${documentTitle}</p>
      <p>Un certificat de signature électronique a été généré et le document est maintenant disponible dans votre espace personnel.</p>
      <p>
        <a href="${documentUrl}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Consulter le document signé
        </a>
      </p>
      <p style="margin-top: 30px; font-size: 12px; color: #666;">
        EHPAD Belleviste<br>
        Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      </p>
    </div>
  `;
  
  return sendEmail(to, subject, html);
};

/**
 * Email de notification pour l'admin après signature d'un document
 */
exports.sendSignedDocumentNotification = async (to, documentTitle, documentUrl) => {
  const subject = `Document signé: ${documentTitle} - EHPAD Connect`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Document signé</h2>
      <p>Un document a été signé sur EHPAD Connect :</p>
      <p><strong>Document :</strong> ${documentTitle}</p>
      <p>
        <a href="${documentUrl}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Consulter le document
        </a>
      </p>
      <p style="margin-top: 30px; font-size: 12px; color: #666;">
        EHPAD Belleviste<br>
        Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      </p>
    </div>
  `;
  
  return sendEmail(to, subject, html);
};

/**
 * Email de notification après signature d'un planning
 */
exports.sendSignedPlanningNotification = async (to, planningTitle, employeeName, documentUrl) => {
  const subject = `Planning signé: ${planningTitle} - EHPAD Connect`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Planning signé</h2>
      <p>Un planning a été signé sur EHPAD Connect :</p>
      <p><strong>Planning :</strong> ${planningTitle}</p>
      <p><strong>Employé :</strong> ${employeeName}</p>
      <p>
        <a href="${documentUrl}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Consulter le planning
        </a>
      </p>
      <p style="margin-top: 30px; font-size: 12px; color: #666;">
        EHPAD Belleviste<br>
        Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      </p>
    </div>
  `;
  
  return sendEmail(to, subject, html);
};

/**
 * Email avec document en pièce jointe
 */
exports.sendDocumentAttachment = async (to, documentTitle, filePath) => {
  try {
    const subject = `Document: ${documentTitle} - EHPAD Connect`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Document demandé</h2>
        <p>Veuillez trouver ci-joint le document que vous avez demandé :</p>
        <p><strong>Document :</strong> ${documentTitle}</p>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          EHPAD Belleviste<br>
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    `;
    
    // Vérifier si le fichier existe
    await fs.access(filePath);
    
    // Préparer la pièce jointe
    const attachments = [
      {
        filename: path.basename(filePath),
        path: filePath
      }
    ];
    
    return sendEmail(to, subject, html, attachments);
  } catch (error) {
    logger.error(`Erreur lors de l'envoi du document par email: ${error.message}`);
    throw error;
  }
};

// Initialiser le transporteur au démarrage si nécessaire
if (process.env.NODE_ENV === 'production') {
  initializeTransporter();
}

module.exports.transporter = transporter;
module.exports.initializeTransporter = initializeTransporter;