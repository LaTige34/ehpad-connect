const { validationResult } = require('express-validator');
const { Document, User, Notification } = require('../models');
const logger = require('../utils/logger');
const fileService = require('../services/file.service');
const emailService = require('../services/email.service');
const signatureService = require('../services/signature.service');
const path = require('path');

/**
 * Récupérer la liste des documents d'un utilisateur
 * @route GET /api/documents
 */
exports.getUserDocuments = async (req, res, next) => {
  try {
    // L'ID de l'utilisateur est récupéré du token d'authentification
    const userId = req.user.id;
    
    // Paramètres de pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Filtres
    const filters = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.type) {
      filters.type = req.query.type;
    }
    
    // Requête avec filtres et pagination
    const documents = await Document.findAndCountAll({
      where: {
        recipientId: userId,
        ...filters
      },
      order: [
        ['createdAt', 'DESC']
      ],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    return res.json({
      documents: documents.rows,
      total: documents.count,
      page,
      totalPages: Math.ceil(documents.count / limit)
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des documents: ${error.message}`);
    next(error);
  }
};

/**
 * Récupérer les détails d'un document spécifique
 * @route GET /api/documents/:id
 */
exports.getDocumentById = async (req, res, next) => {
  try {
    const documentId = req.params.id;
    const userId = req.user.id;
    
    // Récupération du document avec vérification d'accès
    const document = await Document.findOne({
      where: {
        id: documentId,
        recipientId: userId
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'signedBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!document) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }
    
    // Si le document est non lu, le marquer comme lu
    if (document.status === 'unread') {
      await document.update({ status: 'read' });
    }
    
    return res.json({ document });
  } catch (error) {
    logger.error(`Erreur lors de la récupération du document: ${error.message}`);
    next(error);
  }
};

/**
 * Télécharger un document
 * @route GET /api/documents/:id/download
 */
exports.downloadDocument = async (req, res, next) => {
  try {
    const documentId = req.params.id;
    const userId = req.user.id;
    
    // Récupération du document avec vérification d'accès
    const document = await Document.findOne({
      where: {
        id: documentId,
        recipientId: userId
      }
    });
    
    if (!document) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }
    
    // Récupération du fichier depuis le stockage
    const filePath = document.filePath;
    const fileName = path.basename(filePath);
    
    // Envoi du fichier
    return res.download(filePath, fileName, (err) => {
      if (err) {
        logger.error(`Erreur lors du téléchargement du document: ${err.message}`);
        return next(err);
      }
    });
  } catch (error) {
    logger.error(`Erreur lors du téléchargement du document: ${error.message}`);
    next(error);
  }
};

/**
 * Créer un nouveau document (admin ou manager seulement)
 * @route POST /api/documents
 */
exports.createDocument = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Seuls les admin et manager peuvent créer des documents
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const { title, description, type, recipientId } = req.body;
    
    // Vérification que le destinataire existe
    const recipient = await User.findByPk(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Destinataire non trouvé' });
    }
    
    // Gestion du fichier uploadé
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }
    
    // Stockage du fichier
    const filePath = await fileService.storeDocument(req.file);
    
    // Création du document
    const document = await Document.create({
      title,
      description,
      type,
      status: 'unread',
      filePath,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      creatorId: req.user.id,
      recipientId
    });
    
    // Création d'une notification pour le destinataire
    await Notification.create({
      type: 'document',
      title: 'Nouveau document',
      message: `Un nouveau document "${title}" a été ajouté à votre espace.`,
      userId: recipientId,
      priority: 'normal',
      link: `/documents/${document.id}`,
      metadata: {
        documentId: document.id,
        documentType: type
      }
    });
    
    logger.info(`Document "${title}" créé pour l'utilisateur ${recipientId}`);
    
    return res.status(201).json({
      message: 'Document créé avec succès',
      document
    });
  } catch (error) {
    logger.error(`Erreur lors de la création du document: ${error.message}`);
    next(error);
  }
};

/**
 * Demander la signature d'un document (admin ou manager seulement)
 * @route POST /api/documents/:id/request-signature
 */
exports.requestSignature = async (req, res, next) => {
  try {
    const documentId = req.params.id;
    
    // Seuls les admin et manager peuvent demander des signatures
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Récupération du document
    const document = await Document.findByPk(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }
    
    // Vérification que le document peut être signé
    if (document.status === 'signed') {
      return res.status(400).json({ message: 'Ce document est déjà signé' });
    }
    
    // Mise à jour du statut du document
    await document.update({ status: 'pending' });
    
    // Création d'une notification prioritaire pour le destinataire
    await Notification.create({
      type: 'document',
      title: 'Document à signer',
      message: `Le document "${document.title}" nécessite votre signature.`,
      userId: document.recipientId,
      priority: 'high',
      link: `/documents/${document.id}/sign`,
      metadata: {
        documentId: document.id,
        documentType: document.type
      },
      channels: ['app', 'email']
    });
    
    // Envoi d'un email au destinataire
    const recipient = await User.findByPk(document.recipientId);
    if (recipient) {
      await emailService.sendSignatureRequest(
        recipient.email,
        document.title,
        `${process.env.FRONTEND_URL}/documents/${document.id}/sign`
      );
    }
    
    logger.info(`Demande de signature pour le document ${documentId} envoyée`);
    
    return res.json({
      message: 'Demande de signature envoyée avec succès',
      document
    });
  } catch (error) {
    logger.error(`Erreur lors de la demande de signature: ${error.message}`);
    next(error);
  }
};

/**
 * Signer un document
 * @route POST /api/documents/:id/sign
 */
exports.signDocument = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const documentId = req.params.id;
    const userId = req.user.id;
    const { signatureData } = req.body;
    
    // Récupération du document avec vérification d'accès
    const document = await Document.findOne({
      where: {
        id: documentId,
        recipientId: userId,
        status: 'pending'
      }
    });
    
    if (!document) {
      return res.status(404).json({ message: 'Document non trouvé ou non éligible à la signature' });
    }
    
    // Appel au service de signature électronique
    const signatureResult = await signatureService.signDocument(document, userId, signatureData);
    
    // Mise à jour du document avec les informations de signature
    await document.update({
      status: 'signed',
      signedAt: new Date(),
      signedById: userId,
      signatureId: signatureResult.signatureId,
      signatureData: signatureResult.metadata
    });
    
    // Notification pour l'administrateur
    const adminUsers = await User.findAll({
      where: {
        role: 'admin'
      }
    });
    
    // Envoi d'un email à l'administrateur désigné
    await emailService.sendSignedDocumentNotification(
      process.env.ADMIN_EMAIL,
      document.title,
      `${process.env.FRONTEND_URL}/documents/${document.id}`
    );
    
    // Envoi d'un email de confirmation au signataire
    const user = await User.findByPk(userId);
    if (user) {
      await emailService.sendSignatureConfirmation(
        user.email,
        document.title,
        `${process.env.FRONTEND_URL}/documents/${document.id}`
      );
    }
    
    // Notifications dans l'application pour les administrateurs
    for (const admin of adminUsers) {
      await Notification.create({
        type: 'document',
        title: 'Document signé',
        message: `Le document "${document.title}" a été signé par ${user.name}.`,
        userId: admin.id,
        link: `/documents/${document.id}`,
        metadata: {
          documentId: document.id,
          documentType: document.type,
          signedBy: userId
        }
      });
    }
    
    logger.info(`Document ${documentId} signé par l'utilisateur ${userId}`);
    
    return res.json({
      message: 'Document signé avec succès',
      document,
      signatureId: signatureResult.signatureId,
      signedAt: document.signedAt,
      emailSentTo: [user.email, process.env.ADMIN_EMAIL]
    });
  } catch (error) {
    logger.error(`Erreur lors de la signature du document: ${error.message}`);
    next(error);
  }
};

/**
 * Envoyer un document par email
 * @route POST /api/documents/:id/send
 */
exports.sendDocumentByEmail = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const documentId = req.params.id;
    const userId = req.user.id;
    const { email } = req.body;
    
    // Récupération du document avec vérification d'accès
    const document = await Document.findOne({
      where: {
        id: documentId,
        recipientId: userId
      }
    });
    
    if (!document) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }
    
    // Envoi du document par email
    await emailService.sendDocumentAttachment(
      email,
      document.title,
      document.filePath
    );
    
    logger.info(`Document ${documentId} envoyé par email à ${email}`);
    
    return res.json({
      message: 'Document envoyé par email avec succès',
      sentTo: email,
      sentAt: new Date()
    });
  } catch (error) {
    logger.error(`Erreur lors de l'envoi du document par email: ${error.message}`);
    next(error);
  }
};