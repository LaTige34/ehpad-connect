const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const { format } = require('date-fns');
const { fr } = require('date-fns/locale');
const logger = require('../utils/logger');
const fileService = require('./file.service');

/**
 * Service de génération de PDF pour les plannings et documents
 */
class PDFService {
  /**
   * Génère un PDF du planning mensuel
   * @param {Object} planning - Planning à convertir en PDF
   * @returns {Promise<String>} Chemin du fichier PDF généré
   */
  async generatePlanningPDF(planning) {
    try {
      // Créer un document PDF
      const doc = new PDFDocument({
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        size: 'A4'
      });
      
      // Préparer le buffer pour stocker le PDF
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      
      // Ajouter le contenu au PDF
      this.addPlanningContent(doc, planning);
      
      // Finaliser le document
      doc.end();
      
      // Convertir les buffers en un seul buffer
      const pdfBuffer = Buffer.concat(buffers);
      
      // Créer un fichier temporaire
      const tempFilePath = await fileService.createTempFile(pdfBuffer, '.pdf');
      
      logger.info(`PDF du planning généré: ${tempFilePath}`);
      return tempFilePath;
    } catch (error) {
      logger.error(`Erreur lors de la génération du PDF du planning: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Ajoute le contenu du planning au document PDF
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} planning - Planning à ajouter au PDF
   */
  addPlanningContent(doc, planning) {
    // En-tête du document
    doc.font('Helvetica-Bold')
       .fontSize(18)
       .text('EHPAD Belleviste', { align: 'center' })
       .moveDown(0.5);
    
    doc.fontSize(14)
       .text(`Planning mensuel: ${this.getMonthName(planning.month)} ${planning.year}`, { align: 'center' })
       .moveDown(0.5);
    
    // Informations sur l'employé
    if (planning.employee) {
      doc.fontSize(12)
         .text(`Employé: ${planning.employee.name}`, { align: 'center' })
         .moveDown(1);
    }
    
    // Statut du planning
    doc.fontSize(10)
       .fillColor(planning.status === 'signed' ? '#4caf50' : '#1976d2')
       .text(`Statut: ${this.getStatusLabel(planning.status)}`, { align: 'right' })
       .moveDown(0.5);
    
    // Date de signature si applicable
    if (planning.signedAt) {
      doc.text(`Signé le: ${format(new Date(planning.signedAt), 'dd/MM/yyyy à HH:mm')}`, { align: 'right' })
         .moveDown(1);
    }
    
    doc.fillColor('black');
    
    // Tableau des jours du mois
    this.addPlanningTable(doc, planning);
    
    // Pied de page
    doc.fontSize(8)
       .text('Document généré automatiquement par EHPAD Connect', { align: 'center' })
       .text(`Date d'édition: ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`, { align: 'center' });
  }
  
  /**
   * Ajoute un tableau de planning au document PDF
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} planning - Planning à ajouter
   */
  addPlanningTable(doc, planning) {
    // Trier les shifts par date
    const shifts = [...planning.Shifts].sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
    
    // En-têtes du tableau
    const headers = ['Date', 'Jour', 'Horaire', 'Service', 'Lieu'];
    const columnWidths = [60, 80, 100, 150, 100]; // Largeurs en points
    
    // Définir des coordonnées de départ
    let y = doc.y;
    let x = 50; // Marge gauche
    
    // En-tête du tableau
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor('#1976d2');
    
    headers.forEach((header, i) => {
      doc.text(header, x, y, { width: columnWidths[i], align: 'left' });
      x += columnWidths[i];
    });
    
    // Ligne de séparation
    y += 15;
    doc.moveTo(50, y)
       .lineTo(doc.page.width - 50, y)
       .stroke();
    
    // Contenu du tableau
    doc.font('Helvetica')
       .fillColor('black');
    
    shifts.forEach((shift, index) => {
      y += 20;
      
      // Vérifier si on doit passer à une nouvelle page
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = 50;
        
        // Réajouter l'en-tête du tableau sur la nouvelle page
        x = 50;
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor('#1976d2');
        
        headers.forEach((header, i) => {
          doc.text(header, x, y, { width: columnWidths[i], align: 'left' });
          x += columnWidths[i];
        });
        
        // Ligne de séparation
        y += 15;
        doc.moveTo(50, y)
           .lineTo(doc.page.width - 50, y)
           .stroke();
        
        doc.font('Helvetica')
           .fillColor('black');
        
        y += 5;
      }
      
      // Date avec couleur conditionnelle selon le type de shift
      x = 50;
      doc.fillColor(this.getShiftColor(shift.shiftType))
         .text(format(new Date(shift.date), 'dd/MM/yyyy'), x, y, { width: columnWidths[0] });
      
      // Jour de la semaine
      x += columnWidths[0];
      doc.text(format(new Date(shift.date), 'EEEE', { locale: fr }), x, y, { width: columnWidths[1] });
      
      // Horaire
      x += columnWidths[1];
      if (shift.shiftType !== 'rest') {
        doc.text(`${shift.startTime} - ${shift.endTime}`, x, y, { width: columnWidths[2] });
      } else {
        doc.text('Repos', x, y, { width: columnWidths[2] });
      }
      
      // Service
      x += columnWidths[2];
      doc.text(shift.service || '', x, y, { width: columnWidths[3] });
      
      // Lieu
      x += columnWidths[3];
      doc.text(shift.location || '', x, y, { width: columnWidths[4] });
      
      // Ligne alternée pour la lisibilité
      if (index % 2 === 0) {
        doc.rect(50, y - 5, doc.page.width - 100, 20)
           .fill('#f5f5f5')
           .fillColor(this.getShiftColor(shift.shiftType));
      }
      
      // Ligne de séparation
      doc.moveTo(50, y + 15)
         .lineTo(doc.page.width - 50, y + 15)
         .stroke();
    });
    
    // Légende des couleurs
    y += 40;
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor('black')
       .text('Légende:', 50, y)
       .moveDown(0.5);
    
    doc.font('Helvetica')
       .fontSize(9);
    
    // Liste des types de shift avec couleurs
    const shiftTypes = [
      { type: 'morning', label: 'Matin' },
      { type: 'afternoon', label: 'Après-midi' },
      { type: 'night', label: 'Nuit' },
      { type: 'rest', label: 'Repos' }
    ];
    
    shiftTypes.forEach((item, index) => {
      const xPos = 50 + (index * 100);
      doc.fillColor(this.getShiftColor(item.type))
         .text(item.label, xPos, y + 15);
    });
  }
  
  /**
   * Retourne le nom du mois en français
   * @param {Number} month - Numéro du mois (1-12)
   * @returns {String} Nom du mois
   */
  getMonthName(month) {
    const date = new Date(2000, month - 1, 1);
    return format(date, 'MMMM', { locale: fr });
  }
  
  /**
   * Retourne la couleur pour le type de shift
   * @param {String} shiftType - Type de shift
   * @returns {String} Code couleur
   */
  getShiftColor(shiftType) {
    switch (shiftType) {
      case 'morning':
        return '#1976d2'; // Bleu
      case 'afternoon':
        return '#f50057'; // Rose
      case 'night':
        return '#673ab7'; // Violet
      case 'rest':
        return '#757575'; // Gris
      default:
        return '#000000'; // Noir
    }
  }
  
  /**
   * Retourne le libellé pour le statut
   * @param {String} status - Code du statut
   * @returns {String} Libellé du statut
   */
  getStatusLabel(status) {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'published':
        return 'Publié';
      case 'signed':
        return 'Signé';
      default:
        return status;
    }
  }
  
  /**
   * Supprime un fichier temporaire
   * @param {String} filePath - Chemin du fichier à supprimer
   */
  async deleteTempFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.debug(`Fichier temporaire supprimé: ${filePath}`);
    } catch (error) {
      logger.warn(`Impossible de supprimer le fichier temporaire: ${error.message}`);
    }
  }
  
  /**
   * Récupère la taille d'un fichier
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