const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const fileService = require('./file.service');

/**
 * Service de génération de PDF
 */
class PDFService {
  /**
   * Génère un PDF pour un planning mensuel
   * @param {Object} planning - Planning avec ses services
   * @returns {Promise<String>} Chemin du fichier PDF généré
   */
  async generatePlanningPDF(planning) {
    try {
      const tempFilePath = await this.createTempFilePath('planning', '.pdf');
      const writeStream = fs.createWriteStream(tempFilePath);
      
      // Créer un nouveau document PDF
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        },
        info: {
          Title: `Planning ${planning.month}/${planning.year}`,
          Author: 'EHPAD Belleviste',
          Subject: 'Planning mensuel',
          Keywords: 'planning, ehpad, schedule',
          Creator: 'EHPAD Connect',
          Producer: 'EHPAD Connect PDF Service'
        }
      });
      
      // Pipe le contenu vers le fichier
      doc.pipe(writeStream);
      
      // En-tête du document
      this.addHeader(doc, planning);
      
      // Tableau des services
      this.addPlanningTable(doc, planning);
      
      // Pied de page
      this.addFooter(doc, planning);
      
      // Finaliser le document
      doc.end();
      
      // Attendre que le fichier soit complètement écrit
      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          logger.info(`PDF généré: ${tempFilePath}`);
          resolve(tempFilePath);
        });
        writeStream.on('error', (error) => {
          logger.error(`Erreur lors de la génération du PDF: ${error.message}`);
          reject(error);
        });
      });
    } catch (error) {
      logger.error(`Erreur lors de la génération du PDF: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Ajoute l'en-tête au document PDF
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} planning - Planning mensuel
   */
  addHeader(doc, planning) {
    // Logo et titre
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('EHPAD Belleviste', { align: 'center' });
    
    doc.moveDown(0.5)
       .fontSize(18)
       .font('Helvetica')
       .text(`Planning Mensuel - ${this.getMonthName(planning.month)} ${planning.year}`, { align: 'center' });
    
    // Informations du salarié
    if (planning.employee) {
      doc.moveDown(1)
         .fontSize(12)
         .text(`Employé: ${planning.employee.name}`, { align: 'left' });
    }
    
    doc.moveDown(0.5)
       .text(`Statut: ${this.getStatusLabel(planning.status)}`, { align: 'left' });
    
    if (planning.signedAt) {
      doc.text(`Signé le: ${new Date(planning.signedAt).toLocaleDateString('fr-FR')}`, { align: 'left' });
    }
    
    doc.moveDown(1.5);
  }
  
  /**
   * Ajoute le tableau des services au document PDF
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} planning - Planning mensuel
   */
  addPlanningTable(doc, planning) {
    // Définition des couleurs par type de service
    const colors = {
      morning: '#B3E5FC',   // Bleu clair
      afternoon: '#FFCDD2', // Rouge clair
      night: '#D1C4E9',     // Violet clair
      rest: '#E0E0E0'       // Gris clair
    };
    
    // En-têtes du tableau
    const tableTop = doc.y;
    const columnWidth = (doc.page.width - 100) / 5;
    
    // En-têtes
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor('#000000');
    
    doc.text('Date', 50, tableTop, { width: columnWidth, align: 'center' });
    doc.text('Service', 50 + columnWidth, tableTop, { width: columnWidth, align: 'center' });
    doc.text('Horaires', 50 + columnWidth * 2, tableTop, { width: columnWidth, align: 'center' });
    doc.text('Lieu', 50 + columnWidth * 3, tableTop, { width: columnWidth, align: 'center' });
    doc.text('Statut', 50 + columnWidth * 4, tableTop, { width: columnWidth, align: 'center' });
    
    // Ligne de séparation
    doc.moveTo(50, tableTop + 20)
       .lineTo(doc.page.width - 50, tableTop + 20)
       .stroke();
    
    // Contenu du tableau
    let y = tableTop + 30;
    const rowHeight = 25;
    
    // Si planning.Shifts n'existe pas, utiliser un tableau vide
    const shifts = planning.Shifts || [];
    
    // Trier les services par date
    const sortedShifts = [...shifts].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    for (const shift of sortedShifts) {
      // Vérifier s'il faut passer à une nouvelle page
      if (y + rowHeight > doc.page.height - 70) {
        doc.addPage();
        y = 50; // Marge supérieure de la nouvelle page
        
        // Refaire les en-têtes sur la nouvelle page
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor('#000000');
        
        doc.text('Date', 50, y, { width: columnWidth, align: 'center' });
        doc.text('Service', 50 + columnWidth, y, { width: columnWidth, align: 'center' });
        doc.text('Horaires', 50 + columnWidth * 2, y, { width: columnWidth, align: 'center' });
        doc.text('Lieu', 50 + columnWidth * 3, y, { width: columnWidth, align: 'center' });
        doc.text('Statut', 50 + columnWidth * 4, y, { width: columnWidth, align: 'center' });
        
        // Ligne de séparation
        doc.moveTo(50, y + 20)
           .lineTo(doc.page.width - 50, y + 20)
           .stroke();
        
        y += 30;
      }
      
      // Fond coloré selon le type de service
      const bgColor = colors[shift.shiftType] || '#FFFFFF';
      doc.rect(50, y, doc.page.width - 100, rowHeight)
         .fill(bgColor);
      
      // Contenu de la ligne
      doc.font('Helvetica')
         .fontSize(9)
         .fillColor('#000000');
      
      // Formater la date
      const date = new Date(shift.date);
      const formattedDate = date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
      
      // Type de service
      let shiftTypeLabel = '';
      switch (shift.shiftType) {
        case 'morning': shiftTypeLabel = 'Matin'; break;
        case 'afternoon': shiftTypeLabel = 'Après-midi'; break;
        case 'night': shiftTypeLabel = 'Nuit'; break;
        case 'rest': shiftTypeLabel = 'Repos'; break;
        default: shiftTypeLabel = shift.shiftType;
      }
      
      // Horaires
      let hours = '';
      if (shift.startTime && shift.endTime) {
        hours = `${shift.startTime.substring(0, 5)} - ${shift.endTime.substring(0, 5)}`;
      }
      
      // Statut
      let statusLabel = this.getStatusLabel(shift.status);
      
      // Texte
      doc.text(formattedDate, 50, y + 7, { width: columnWidth, align: 'center' });
      doc.text(shiftTypeLabel, 50 + columnWidth, y + 7, { width: columnWidth, align: 'center' });
      doc.text(hours, 50 + columnWidth * 2, y + 7, { width: columnWidth, align: 'center' });
      doc.text(shift.location || '', 50 + columnWidth * 3, y + 7, { width: columnWidth, align: 'center' });
      doc.text(statusLabel, 50 + columnWidth * 4, y + 7, { width: columnWidth, align: 'center' });
      
      // Bordure de la ligne
      doc.rect(50, y, doc.page.width - 100, rowHeight)
         .stroke();
      
      y += rowHeight;
    }
    
    // Ajouter une légende
    doc.moveDown(2);
    const legendY = y + 20;
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Légende:', 50, legendY);
    
    doc.moveDown(0.5);
    
    // Carré de couleur pour chaque type de service
    const types = [
      { type: 'morning', label: 'Matin' },
      { type: 'afternoon', label: 'Après-midi' },
      { type: 'night', label: 'Nuit' },
      { type: 'rest', label: 'Repos' }
    ];
    
    let legendX = 50;
    const legendSpacing = 100;
    
    types.forEach((type, index) => {
      const x = legendX + index * legendSpacing;
      
      // Carré de couleur
      doc.rect(x, legendY + 20, 10, 10)
         .fill(colors[type.type]);
      
      // Libellé
      doc.font('Helvetica')
         .fillColor('#000000')
         .text(type.label, x + 15, legendY + 20, { width: 80 });
    });
  }
  
  /**
   * Ajoute le pied de page au document PDF
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} planning - Planning mensuel
   */
  addFooter(doc, planning) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Position en bas de page
      const footerY = doc.page.height - 50;
      
      // Ligne de séparation
      doc.moveTo(50, footerY - 15)
         .lineTo(doc.page.width - 50, footerY - 15)
         .stroke();
      
      // Texte du pied de page
      doc.fontSize(8)
         .font('Helvetica')
         .text(
           `EHPAD Belleviste - Planning généré le ${new Date().toLocaleDateString('fr-FR')}`,
           50,
           footerY,
           { align: 'center', width: doc.page.width - 100 }
         );
      
      // Numérotation des pages
      doc.text(
        `Page ${i + 1} sur ${pageCount}`,
        50,
        footerY,
        { align: 'right', width: doc.page.width - 100 }
      );
    }
  }
  
  /**
   * Obtient le libellé d'un mois à partir de son numéro
   * @param {Number} month - Numéro du mois (1-12)
   * @returns {String} Nom du mois
   */
  getMonthName(month) {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    return months[month - 1] || '';
  }
  
  /**
   * Obtient le libellé d'un statut à partir de son code
   * @param {String} status - Code du statut
   * @returns {String} Libellé du statut
   */
  getStatusLabel(status) {
    const statusLabels = {
      draft: 'Brouillon',
      published: 'Publié',
      signed: 'Signé',
      confirmed: 'Confirmé',
      pending: 'En attente',
      modified: 'Modifié'
    };
    
    return statusLabels[status] || status;
  }
  
  /**
   * Crée un chemin temporaire pour un fichier
   * @param {String} prefix - Préfixe du nom de fichier
   * @param {String} extension - Extension du fichier
   * @returns {Promise<String>} Chemin du fichier temporaire
   */
  async createTempFilePath(prefix = 'doc', extension = '.pdf') {
    const tempDir = path.join(__dirname, '../../uploads/temp');
    
    try {
      // Créer le dossier s'il n'existe pas
      await fs.mkdir(tempDir, { recursive: true });
      
      // Générer un nom de fichier unique
      const filename = `${prefix}_${Date.now()}${extension}`;
      return path.join(tempDir, filename);
    } catch (error) {
      logger.error(`Erreur lors de la création du chemin temporaire: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Obtient la taille d'un fichier
   * @param {String} filePath - Chemin du fichier
   * @returns {Promise<Number>} Taille en octets
   */
  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la taille du fichier: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Supprime un fichier temporaire
   * @param {String} filePath - Chemin du fichier
   * @returns {Promise<Boolean>} Succès de la suppression
   */
  async deleteTempFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.debug(`Fichier temporaire supprimé: ${filePath}`);
      return true;
    } catch (error) {
      logger.warn(`Erreur lors de la suppression du fichier temporaire: ${error.message}`);
      return false;
    }
  }
}

module.exports = new PDFService();