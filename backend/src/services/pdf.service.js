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
   * Génère un PDF du planning mensuel
   * @param {Object} planning - Objet planning avec les relations associées
   * @returns {Promise<String>} Chemin du fichier PDF généré
   */
  async generatePlanningPDF(planning) {
    try {
      // Créer un nouveau document PDF
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      
      // Créer un flux de fichier temporaire
      const tempFilePath = await fileService.createTempFile('', '.pdf');
      const stream = fs.createWriteStream(tempFilePath);
      
      // Pipe du PDF vers le fichier
      doc.pipe(stream);
      
      // Titre et entête
      this.addHeader(doc, planning);
      
      // Tableau des services
      this.addPlanningTable(doc, planning);
      
      // Pied de page
      this.addFooter(doc, planning);
      
      // Finaliser le PDF
      doc.end();
      
      // Attendre que le fichier soit écrit
      await new Promise(resolve => {
        stream.on('finish', resolve);
      });
      
      logger.info(`PDF du planning généré: ${tempFilePath}`);
      return tempFilePath;
    } catch (error) {
      logger.error(`Erreur lors de la génération du PDF: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Ajoute l'en-tête au document PDF
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} planning - Objet planning
   */
  addHeader(doc, planning) {
    // Logo ou titre de l'établissement
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('EHPAD Belleviste', { align: 'center' });
    
    // Titre du document
    doc.moveDown()
       .fontSize(16)
       .text(`Planning Mensuel - ${this.getMonthName(planning.month)} ${planning.year}`, { align: 'center' });
    
    // Informations de l'employé
    if (planning.employee) {
      doc.moveDown()
         .fontSize(12)
         .text(`Employé: ${planning.employee.name}`, { align: 'left' });
    }
    
    // Date de génération
    doc.fontSize(10)
       .text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
    
    // Status du planning
    const statusText = planning.status === 'signed' 
      ? `Signé le: ${new Date(planning.signedAt).toLocaleDateString('fr-FR')}` 
      : `Statut: ${this.formatStatus(planning.status)}`;
    
    doc.text(statusText, { align: 'right' });
    
    doc.moveDown(2);
  }
  
  /**
   * Ajoute le tableau des services au document PDF
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} planning - Objet planning
   */
  addPlanningTable(doc, planning) {
    // Dimensions et positions
    const pageWidth = doc.page.width;
    const startX = 50;
    const startY = doc.y;
    const colWidth = (pageWidth - 100) / 5; // 5 colonnes
    const rowHeight = 30;
    
    // En-têtes du tableau
    const headers = ['Date', 'Service', 'Début', 'Fin', 'Statut'];
    
    // Dessiner l'en-tête du tableau
    doc.font('Helvetica-Bold')
       .fontSize(12);
    
    headers.forEach((header, i) => {
      doc.rect(startX + (i * colWidth), startY, colWidth, rowHeight)
         .stroke();
      
      doc.text(
        header,
        startX + (i * colWidth) + 5,
        startY + 10,
        { width: colWidth - 10 }
      );
    });
    
    // Trier les services par date
    const shifts = [...planning.Shifts].sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
    
    // Dessiner les lignes du tableau
    doc.font('Helvetica')
       .fontSize(10);
    
    shifts.forEach((shift, i) => {
      const y = startY + (i + 1) * rowHeight;
      
      // Vérifier si on a besoin d'une nouvelle page
      if (y + rowHeight > doc.page.height - 100) {
        doc.addPage();
        return this.addPlanningTable(doc, {
          ...planning,
          Shifts: shifts.slice(i)
        });
      }
      
      // Dessiner les cellules
      doc.fillColor(shift.shiftType === 'rest' ? '#f5f5f5' : 'white');
      
      headers.forEach((_, j) => {
        doc.rect(startX + (j * colWidth), y, colWidth, rowHeight)
           .fillAndStroke();
      });
      
      doc.fillColor('black');
      
      // Date
      const date = new Date(shift.date);
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1} ${this.getDayName(date.getDay())}`;
      doc.text(
        formattedDate,
        startX + 5,
        y + 10,
        { width: colWidth - 10 }
      );
      
      // Service
      doc.text(
        shift.shiftType === 'rest' ? 'Repos' : shift.service || '',
        startX + colWidth + 5,
        y + 10,
        { width: colWidth - 10 }
      );
      
      // Heure de début
      doc.text(
        shift.startTime || '-',
        startX + (2 * colWidth) + 5,
        y + 10,
        { width: colWidth - 10 }
      );
      
      // Heure de fin
      doc.text(
        shift.endTime || '-',
        startX + (3 * colWidth) + 5,
        y + 10,
        { width: colWidth - 10 }
      );
      
      // Statut
      doc.text(
        this.formatStatus(shift.status),
        startX + (4 * colWidth) + 5,
        y + 10,
        { width: colWidth - 10 }
      );
    });
    
    // Mise à jour de la position Y
    doc.y = startY + (shifts.length + 1) * rowHeight + 20;
  }
  
  /**
   * Ajoute le pied de page au document PDF
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} planning - Objet planning
   */
  addFooter(doc, planning) {
    // Espace pour signature si non signé
    if (planning.status !== 'signed') {
      doc.moveDown(2)
         .fontSize(12)
         .text('Signature de l\'employé:', { align: 'left' });
      
      doc.moveDown(3)
         .text('...................................................', { align: 'left' });
      
      doc.moveDown(2)
         .fontSize(12)
         .text('Signature du responsable:', { align: 'right' });
      
      doc.moveDown(3)
         .text('...................................................', { align: 'right' });
    } else {
      // Information sur la signature
      doc.moveDown(2)
         .fontSize(12)
         .text('Document signé électroniquement', { align: 'center' })
         .moveDown()
         .fontSize(10)
         .text(`Signé le: ${new Date(planning.signedAt).toLocaleDateString('fr-FR')}`, { align: 'center' });
      
      if (planning.signatureId) {
        doc.text(`Référence signature: ${planning.signatureId}`, { align: 'center' });
      }
    }
    
    // Pied de page avec numéro de page
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      
      doc.fontSize(8)
         .text(
           `Page ${i + 1} / ${totalPages}`,
           50,
           doc.page.height - 50,
           { align: 'center' }
         );
      
      doc.fontSize(8)
         .text(
           'EHPAD Belleviste - Document généré par EHPAD Connect',
           50,
           doc.page.height - 30,
           { align: 'center' }
         );
    }
  }
  
  /**
   * Formate le statut pour l'affichage
   * @param {String} status - Statut à formater
   * @returns {String} Statut formaté
   */
  formatStatus(status) {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'modified': return 'Modifié';
      case 'signed': return 'Signé';
      case 'published': return 'Publié';
      default: return status;
    }
  }
  
  /**
   * Retourne le nom du mois à partir de son numéro
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
   * Retourne le nom du jour à partir de son numéro
   * @param {Number} day - Numéro du jour (0-6, 0 = dimanche)
   * @returns {String} Nom abrégé du jour
   */
  getDayName(day) {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[day] || '';
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