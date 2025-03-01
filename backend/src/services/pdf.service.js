const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { format } = require('date-fns');
const { fr } = require('date-fns/locale');

/**
 * Service pour la génération de documents PDF
 */
class PDFService {
  constructor() {
    this.tempDir = process.env.TEMP_DIR || path.join(__dirname, '../../uploads/temp');
    
    // Initialiser le dossier temporaire
    this.initializeTempDir();
  }
  
  /**
   * Crée le dossier temporaire s'il n'existe pas
   */
  async initializeTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch (error) {
      // Créer le dossier s'il n'existe pas
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(`Dossier temporaire créé: ${this.tempDir}`);
    }
  }
  
  /**
   * Génère un PDF pour un planning mensuel
   * @param {Object} planning - Objet planning avec ses services
   * @returns {Promise<String>} Chemin du fichier PDF généré
   */
  async generatePlanningPDF(planning) {
    return new Promise(async (resolve, reject) => {
      try {
        // Créer un nom de fichier unique
        const fileName = `planning_${planning.month}_${planning.year}_${crypto.randomBytes(4).toString('hex')}.pdf`;
        const filePath = path.join(this.tempDir, fileName);
        
        // Créer le document PDF
        const doc = new PDFDocument({ 
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          info: {
            Title: `Planning ${planning.month}/${planning.year}`,
            Author: 'EHPAD Connect',
            Subject: `Planning mensuel pour ${planning.employee?.name || 'Employé'}`,
            Keywords: 'planning, ehpad, horaires',
            CreationDate: new Date()
          }
        });
        
        // Stream vers un fichier
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        
        // En-tête
        doc.font('Helvetica-Bold')
           .fontSize(18)
           .text('EHPAD Belleviste', { align: 'center' })
           .fontSize(16)
           .text(`Planning du mois de ${this.getMonthName(planning.month)} ${planning.year}`, { align: 'center' })
           .moveDown(0.5);
        
        // Informations employé
        doc.fontSize(12)
           .text(`Employé: ${planning.employee?.name || 'Non spécifié'}`, { align: 'left' })
           .text(`Statut: ${this.getPlanningStatusText(planning.status)}`, { align: 'left' })
           .moveDown(1);
        
        // Tableau des services
        this.drawPlanningTable(doc, planning);
        
        // Pied de page
        doc.fontSize(10)
           .text(`Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`, { align: 'center' })
           .text('EHPAD Connect - Application de gestion des plannings', { align: 'center' });
        
        // Zone de signature
        if (planning.status === 'signed' && planning.signedAt) {
          this.drawSignatureBlock(doc, planning);
        } else {
          this.drawSignatureArea(doc);
        }
        
        // Finaliser le document
        doc.end();
        
        // Attendre la fin de l'écriture
        stream.on('finish', () => {
          logger.info(`PDF du planning généré: ${filePath}`);
          resolve(filePath);
        });
        
        stream.on('error', (error) => {
          logger.error(`Erreur lors de la génération du PDF: ${error.message}`);
          reject(error);
        });
      } catch (error) {
        logger.error(`Erreur lors de la génération du PDF: ${error.message}`);
        reject(error);
      }
    });
  }
  
  /**
   * Dessine le tableau du planning
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} planning - Objet planning
   */
  drawPlanningTable(doc, planning) {
    // Définir les shifts triés par date
    const shifts = planning.Shifts ? [...planning.Shifts].sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    }) : [];
    
    // Définir les dimensions du tableau
    const tableTop = doc.y + 15;
    const cellPadding = 8;
    const colWidths = {
      date: 100,
      hours: 150,
      shift: 130,
      service: 150
    };
    const tableWidth = colWidths.date + colWidths.hours + colWidths.shift + colWidths.service;
    
    // Dessiner l'en-tête du tableau
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor('#333333');
    
    let yPos = tableTop;
    
    // En-tête
    doc.rect(50, yPos, tableWidth, 30).fill('#f2f2f2').stroke('#000000');
    doc.fillColor('#333333')
       .text('Date', 50 + cellPadding, yPos + 10)
       .text('Horaires', 50 + colWidths.date + cellPadding, yPos + 10)
       .text('Service', 50 + colWidths.date + colWidths.hours + cellPadding, yPos + 10)
       .text('Localisation', 50 + colWidths.date + colWidths.hours + colWidths.shift + cellPadding, yPos + 10);
    
    yPos += 30;
    
    // Lignes du tableau
    doc.font('Helvetica')
       .fontSize(10);
    
    let oddRow = false;
    
    for (const shift of shifts) {
      const rowHeight = 25;
      
      // Fond alterné
      if (oddRow) {
        doc.rect(50, yPos, tableWidth, rowHeight).fill('#f9f9f9').stroke('#CCCCCC');
      } else {
        doc.rect(50, yPos, tableWidth, rowHeight).fillColor('#ffffff').stroke('#CCCCCC');
      }
      
      // Date formatée
      const shiftDate = new Date(shift.date);
      const formattedDate = format(shiftDate, 'EEEE dd/MM', { locale: fr });
      
      // Horaires
      const hours = shift.shiftType === 'rest' 
        ? 'Repos' 
        : `${shift.startTime?.substring(0, 5) || ''} - ${shift.endTime?.substring(0, 5) || ''}`;
      
      // Type de service avec couleur
      const shiftTypeColor = this.getShiftTypeColor(shift.shiftType);
      
      // Textes des cellules
      doc.fillColor('#333333');
      
      // Date
      doc.text(formattedDate, 50 + cellPadding, yPos + 8);
      
      // Horaires
      doc.text(hours, 50 + colWidths.date + cellPadding, yPos + 8);
      
      // Type de service
      doc.fillColor(shiftTypeColor)
         .text(this.getShiftTypeText(shift.shiftType), 50 + colWidths.date + colWidths.hours + cellPadding, yPos + 8);
      
      // Service/localisation
      doc.fillColor('#333333')
         .text(shift.service || '', 50 + colWidths.date + colWidths.hours + colWidths.shift + cellPadding, yPos + 8);
      
      yPos += rowHeight;
      oddRow = !oddRow;
      
      // Nouvelle page si nécessaire
      if (yPos > doc.page.height - 150) {
        doc.addPage();
        yPos = 50;
        oddRow = false;
      }
    }
    
    // Ajouter espace après le tableau
    doc.moveDown(2);
  }
  
  /**
   * Dessine une zone de signature vide
   * @param {PDFDocument} doc - Document PDF
   */
  drawSignatureArea(doc) {
    // Texte d'explication
    doc.moveDown(2);
    doc.fontSize(12)
       .text('Signature de l\'employé:', { align: 'left' })
       .moveDown(0.5);
    
    // Rectangle pour la signature
    doc.rect(50, doc.y, 200, 100)
       .stroke('#CCCCCC');
    
    doc.moveDown(6);
    doc.fontSize(10)
       .fillColor('#666666')
       .text('Date: ________________', { align: 'left' });
    
    doc.moveDown(1);
    doc.text('Ce document doit être signé électroniquement via l\'application EHPAD Connect.', { align: 'center' });
  }
  
  /**
   * Dessine un bloc de signature avec certificat
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} planning - Objet planning
   */
  drawSignatureBlock(doc, planning) {
    doc.moveDown(2);
    
    // Fond du bloc de signature
    doc.rect(50, doc.y, 500, 120)
       .fill('#f5f5f5')
       .stroke('#cccccc');
    
    const signatureY = doc.y;
    
    // Titre
    doc.fontSize(12)
       .fillColor('#333333')
       .text('DOCUMENT SIGNÉ ÉLECTRONIQUEMENT', 70, signatureY + 15, { align: 'left' })
       .moveDown(0.5);
    
    // Détails de la signature
    doc.fontSize(9)
       .fillColor('#666666');
    
    doc.text(`Signé par: ${planning.employee?.name || 'Employé'}`, 70, doc.y);
    doc.text(`Date de signature: ${format(new Date(planning.signedAt), 'dd/MM/yyyy à HH:mm:ss')}`, 70, doc.y + 15);
    doc.text(`ID de signature: ${planning.signatureId || 'Non disponible'}`, 70, doc.y + 30);
    doc.text(`Certificat de validation: EHPAD Connect - ${crypto.createHash('sha256').update(planning.id.toString() + planning.signedAt.toString()).digest('hex').substring(0, 8)}`, 70, doc.y + 45);
    
    // Ajouter un QR code simulé (rectangle gris)
    doc.rect(450, signatureY + 15, 80, 80)
       .fillColor('#dddddd');
    
    // Revenir à la position après le bloc
    doc.x = 50;
    doc.y = signatureY + 130;
  }
  
  /**
   * Obtient le texte descriptif du statut du planning
   * @param {String} status - Statut du planning
   * @returns {String} Texte descriptif
   */
  getPlanningStatusText(status) {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'published': return 'Publié';
      case 'signed': return 'Signé';
      default: return status || 'Non défini';
    }
  }
  
  /**
   * Obtient le texte descriptif du type de service
   * @param {String} shiftType - Type de service
   * @returns {String} Texte descriptif
   */
  getShiftTypeText(shiftType) {
    switch (shiftType) {
      case 'morning': return 'Matin';
      case 'afternoon': return 'Après-midi';
      case 'night': return 'Nuit';
      case 'rest': return 'Repos';
      default: return shiftType || 'Non défini';
    }
  }
  
  /**
   * Obtient la couleur associée au type de service
   * @param {String} shiftType - Type de service
   * @returns {String} Code couleur
   */
  getShiftTypeColor(shiftType) {
    switch (shiftType) {
      case 'morning': return '#1976d2';    // Bleu
      case 'afternoon': return '#e91e63';  // Rose
      case 'night': return '#3f51b5';      // Bleu foncé
      case 'rest': return '#9e9e9e';       // Gris
      default: return '#333333';           // Noir
    }
  }
  
  /**
   * Obtient le nom du mois en français
   * @param {Number} month - Numéro du mois (1-12)
   * @returns {String} Nom du mois
   */
  getMonthName(month) {
    const date = new Date(2000, month - 1, 1);
    return format(date, 'MMMM', { locale: fr });
  }
  
  /**
   * Supprime un fichier temporaire
   * @param {String} filePath - Chemin du fichier
   */
  async deleteTempFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info(`Fichier temporaire supprimé: ${filePath}`);
    } catch (error) {
      logger.warn(`Impossible de supprimer le fichier temporaire: ${error.message}`);
    }
  }
  
  /**
   * Obtient la taille d'un fichier
   * @param {String} filePath - Chemin du fichier
   * @returns {Promise<Number>} Taille du fichier en octets
   */
  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la taille du fichier: ${error.message}`);
      return 0;
    }
  }
}

module.exports = new PDFService();