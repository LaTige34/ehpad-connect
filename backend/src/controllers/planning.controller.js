const { validationResult } = require('express-validator');
const { Planning, Shift, User, Document, Notification } = require('../models');
const logger = require('../utils/logger');
const octimeService = require('../services/octime.service');
const signatureService = require('../services/signature.service');
const emailService = require('../services/email.service');
const pdfService = require('../services/pdf.service');
const { Op } = require('sequelize');

/**
 * Récupérer le planning mensuel d'un utilisateur
 * @route GET /api/planning/monthly/:year/:month
 */
exports.getMonthlyPlanning = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const userId = req.user.id;
    
    // Validation des paramètres
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ message: 'Paramètres de date invalides' });
    }
    
    // Recherche du planning existant
    let planning = await Planning.findOne({
      where: {
        employeeId: userId,
        year: yearNum,
        month: monthNum
      },
      include: [
        {
          model: Shift,
          where: {
            employeeId: userId
          },
          required: false
        }
      ]
    });
    
    // Si aucun planning n'existe, synchroniser avec Octime
    if (!planning || planning.Shifts.length === 0) {
      try {
        // Synchronisation avec Octime
        await octimeService.syncEmployeePlanning(userId, yearNum, monthNum);
        
        // Récupération du planning mis à jour
        planning = await Planning.findOne({
          where: {
            employeeId: userId,
            year: yearNum,
            month: monthNum
          },
          include: [
            {
              model: Shift,
              where: {
                employeeId: userId
              },
              required: false
            }
          ]
        });
      } catch (syncError) {
        logger.error(`Erreur lors de la synchronisation avec Octime: ${syncError.message}`);
        // Continuer avec les données disponibles en local (ou aucune)
      }
    }
    
    // Formater la réponse
    if (planning) {
      return res.json({
        planning: {
          id: planning.id,
          month: planning.month,
          year: planning.year,
          status: planning.status,
          signedAt: planning.signedAt,
          employee: {
            id: userId
          },
          shifts: planning.Shifts.map(shift => ({
            id: shift.id,
            date: shift.date,
            startTime: shift.startTime,
            endTime: shift.endTime,
            shiftType: shift.shiftType,
            service: shift.service,
            location: shift.location,
            status: shift.status
          }))
        }
      });
    } else {
      // Aucun planning trouvé même après synchronisation
      return res.json({
        planning: {
          month: monthNum,
          year: yearNum,
          employee: {
            id: userId
          },
          shifts: []
        }
      });
    }
  } catch (error) {
    logger.error(`Erreur lors de la récupération du planning: ${error.message}`);
    next(error);
  }
};

/**
 * Récupérer les prochains services d'un utilisateur
 * @route GET /api/planning/upcoming
 */
exports.getUpcomingShifts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = parseInt(req.query.count) || 5;
    
    // Date du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Récupérer les prochains services
    const shifts = await Shift.findAll({
      where: {
        employeeId: userId,
        date: {
          [Op.gte]: today
        },
        shiftType: {
          [Op.ne]: 'rest' // Exclure les jours de repos
        }
      },
      order: [
        ['date', 'ASC'],
        ['startTime', 'ASC']
      ],
      limit: count
    });
    
    return res.json({ shifts });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des prochains services: ${error.message}`);
    next(error);
  }
};

/**
 * Synchroniser le planning d'un utilisateur avec Octime
 * @route POST /api/planning/sync/:year/:month
 */
exports.syncPlanning = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const userId = req.query.userId || req.user.id;
    
    // Vérification des permissions si synchrionisation pour un autre utilisateur
    if (userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Validation des paramètres
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ message: 'Paramètres de date invalides' });
    }
    
    // Synchronisation avec Octime
    const syncResult = await octimeService.syncEmployeePlanning(userId, yearNum, monthNum);
    
    // Notification à l'utilisateur
    await Notification.create({
      type: 'planning',
      title: 'Planning mis à jour',
      message: `Votre planning pour ${monthNum}/${yearNum} a été mis à jour.`,
      userId,
      link: `/planning?year=${yearNum}&month=${monthNum}`,
      metadata: {
        year: yearNum,
        month: monthNum
      }
    });
    
    logger.info(`Planning ${monthNum}/${yearNum} synchronisé pour l'utilisateur ${userId}`);
    
    return res.json({
      message: 'Planning synchronisé avec succès',
      syncId: syncResult.syncId,
      summary: syncResult.summary
    });
  } catch (error) {
    logger.error(`Erreur lors de la synchronisation du planning: ${error.message}`);
    next(error);
  }
};

/**
 * Générer un PDF du planning mensuel
 * @route GET /api/planning/:id/pdf
 */
exports.generatePlanningPDF = async (req, res, next) => {
  try {
    const planningId = req.params.id;
    const userId = req.user.id;
    
    // Récupération du planning
    const planning = await Planning.findOne({
      where: {
        id: planningId,
        employeeId: userId
      },
      include: [
        {
          model: Shift,
          where: {
            employeeId: userId
          },
          required: false
        },
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!planning) {
      return res.status(404).json({ message: 'Planning non trouvé' });
    }
    
    // Génération du PDF
    const pdfPath = await pdfService.generatePlanningPDF(planning);
    
    // Envoi du fichier
    const fileName = `planning_${planning.month}_${planning.year}.pdf`;
    return res.download(pdfPath, fileName, (err) => {
      if (err) {
        logger.error(`Erreur lors du téléchargement du planning PDF: ${err.message}`);
        return next(err);
      }
      // Suppression du fichier temporaire après envoi
      pdfService.deleteTempFile(pdfPath);
    });
  } catch (error) {
    logger.error(`Erreur lors de la génération du PDF: ${error.message}`);
    next(error);
  }
};

/**
 * Signer un planning mensuel
 * @route POST /api/planning/:id/sign
 */
exports.signPlanning = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const planningId = req.params.id;
    const userId = req.user.id;
    const { signatureData } = req.body;
    
    // Récupération du planning
    const planning = await Planning.findOne({
      where: {
        id: planningId,
        employeeId: userId,
        status: {
          [Op.notIn]: ['signed'] // Exclure les plannings déjà signés
        }
      },
      include: [
        {
          model: Shift,
          where: {
            employeeId: userId
          },
          required: false
        },
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!planning) {
      return res.status(404).json({ message: 'Planning non trouvé ou déjà signé' });
    }
    
    // Génération du PDF pour signature
    const pdfPath = await pdfService.generatePlanningPDF(planning);
    
    // Appel au service de signature électronique
    const signatureResult = await signatureService.signDocument({
      filePath: pdfPath,
      title: `Planning ${planning.month}/${planning.year}`,
      type: 'planning'
    }, userId, signatureData);
    
    // Mise à jour du planning avec les informations de signature
    await planning.update({
      status: 'signed',
      signedAt: new Date(),
      signatureId: signatureResult.signatureId
    });
    
    // Création d'un document pour le planning signé
    const document = await Document.create({
      title: `Planning ${planning.month}/${planning.year}`,
      description: `Planning mensuel signé pour ${planning.month}/${planning.year}`,
      type: 'planning',
      status: 'signed',
      filePath: pdfPath, // Le PDF généré et signé
      fileSize: await pdfService.getFileSize(pdfPath),
      fileType: 'application/pdf',
      creatorId: userId, // L'employé est à la fois créateur et destinataire
      recipientId: userId,
      signedById: userId,
      signedAt: new Date(),
      signatureId: signatureResult.signatureId,
      signatureData: signatureResult.metadata
    });
    
    // Mise à jour de la référence au document
    await planning.update({
      documentId: document.id
    });
    
    // Notification pour les administrateurs
    const adminUsers = await User.findAll({
      where: {
        role: 'admin'
      }
    });
    
    // Envoi d'un email à l'administrateur désigné
    await emailService.sendSignedPlanningNotification(
      process.env.ADMIN_EMAIL,
      `Planning ${planning.month}/${planning.year}`,
      planning.employee.name,
      `${process.env.FRONTEND_URL}/documents/${document.id}`
    );
    
    // Envoi d'un email de confirmation au signataire
    await emailService.sendSignatureConfirmation(
      planning.employee.email,
      `Planning ${planning.month}/${planning.year}`,
      `${process.env.FRONTEND_URL}/documents/${document.id}`
    );
    
    // Notifications dans l'application pour les administrateurs
    for (const admin of adminUsers) {
      await Notification.create({
        type: 'planning',
        title: 'Planning signé',
        message: `Le planning de ${planning.month}/${planning.year} a été signé par ${planning.employee.name}.`,
        userId: admin.id,
        link: `/documents/${document.id}`,
        metadata: {
          planningId,
          documentId: document.id,
          year: planning.year,
          month: planning.month,
          signedBy: userId
        }
      });
    }
    
    logger.info(`Planning ${planningId} signé par l'utilisateur ${userId}`);
    
    return res.json({
      message: 'Planning signé avec succès',
      planning: {
        id: planning.id,
        status: planning.status,
        signedAt: planning.signedAt
      },
      document: {
        id: document.id
      },
      signatureId: signatureResult.signatureId,
      emailSentTo: [planning.employee.email, process.env.ADMIN_EMAIL]
    });
  } catch (error) {
    logger.error(`Erreur lors de la signature du planning: ${error.message}`);
    next(error);
  }
};