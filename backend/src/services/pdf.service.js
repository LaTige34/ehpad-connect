const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Service de génération de documents PDF
 */
class PDFService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    
    // Création du dossier temporaire s'il n'existe pas
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }
  
  /**
   * Génère un PDF pour un planning mensuel
   * @param {Object} planning - Objet planning avec les shifts
   * @returns {Promise<String>} Chemin du fichier PDF généré
   */
  async generatePlanningPDF(planning) {
    return new Promise((resolve, reject) => {
      try {
        // Chemin du fichier temporaire
        const filename = `planning_${planning.month}_${planning.year}_${crypto.randomBytes(8).toString('hex')}.pdf`;
        const filePath = path.join(this.tempDir, filename);
        
        // Création du document PDF
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });
        
        // Flux d'écriture
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        
        // En-tête du document
        doc.font('Helvetica-Bold')
           .fontSize(18)
           .text('EHPAD Belleviste', { align: 'center' })
           .moveDown(0.5);
        
        doc.fontSize(16)
           .text(`Planning Mensuel - ${this.getMonthName(planning.month)} ${planning.year}`, { align: 'center' })
           .moveDown(0.5);
        
        // Informations de l'employé
        if (planning.employee) {
          doc.fontSize(12)
             .text(`Employé: ${planning.employee.name}`, { align: 'left' })
             .moveDown(0.2);
        }
        
        doc.moveDown();
        
        // Tableau des services
        this.drawPlanningTable(doc, planning);
        
        // Pied de page
        const bottomPosition = doc.page.height - 50;
        doc.fontSize(10)
           .text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, 50, bottomPosition, { align: 'center' });
        
        // Si le planning est signé, ajouter la mention
        if (planning.status === 'signed' && planning.signedAt) {
          const signedDate = new Date(planning.signedAt).toLocaleDateString('fr-FR');
          doc.moveUp()
             .text(`Planning signé électroniquement le ${signedDate}`, { align: 'center' });
        }
        
        // Finalisation du document
        doc.end();
        
        // Attendre que le fichier soit écrit
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
   * @param {Object} planning - Objet planning avec les shifts
   */
  drawPlanningTable(doc, planning) {
    // Tri des services par date
    const shifts = planning.Shifts || [];
    shifts.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Définition des colonnes
    const columns = [
      { header: 'Date', width: 100 },
      { header: 'Service', width: 100 },
      { header: 'Horaires', width: 100 },
      { header: 'Service', width: 100 },
      { header: 'Statut', width: 80 }
    ];
    
    // Position initiale
    const startX = 50;
    let startY = doc.y;
    
    // Hauteur des cellules
    const rowHeight = 25;
    
    // En-tête du tableau
    this.drawTableHeader(doc, columns, startX, startY, rowHeight);
    
    // Corps du tableau
    startY += rowHeight;
    
    // Vérification si on atteint la fin de la page
    if (startY + rowHeight > doc.page.height - 100) {
      doc.addPage();
      startY = 50;
      this.drawTableHeader(doc, columns, startX, startY, rowHeight);
      startY += rowHeight;
    }
    
    // Dessin des lignes
    shifts.forEach((shift, index) => {
      // Vérification si on atteint la fin de la page
      if (startY + rowHeight > doc.page.height - 100) {
        doc.addPage();
        startY = 50;
        this.drawTableHeader(doc, columns, startX, startY, rowHeight);
        startY += rowHeight;
      }
      
      // Date
      const date = new Date(shift.date);
      const formattedDate = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
      
      doc.font('Helvetica')
         .fontSize(10)
         .text(formattedDate, startX + 5, startY + 7, { width: columns[0].width - 10 });
      
      // Type de service
      let shiftTypeText = '';
      switch (shift.shiftType) {
        case 'morning':
          shiftTypeText = 'Matin';
          break;
        case 'afternoon':
          shiftTypeText = 'Après-midi';
          break;
        case 'night':
          shiftTypeText = 'Nuit';
          break;
        case 'rest':
          shiftTypeText = 'Repos';
          break;
        default:
          shiftTypeText = shift.shiftType;
      }
      
      doc.text(shiftTypeText, startX + columns[0].width + 5, startY + 7, { width: columns[1].width - 10 });
      
      // Horaires
      let hoursText = '';
      if (shift.startTime && shift.endTime) {
        hoursText = `${shift.startTime.substring(0, 5)} - ${shift.endTime.substring(0, 5)}`;
      }
      
      doc.text(hoursText, startX + columns[0].width + columns[1].width + 5, startY + 7, { width: columns[2].width - 10 });
      
      // Service
      doc.text(shift.service || '', startX + columns[0].width + columns[1].width + columns[2].width + 5, startY + 7, { width: columns[3].width - 10 });
      
      // Statut
      let statusText = '';
      switch (shift.status) {
        case 'confirmed':
          statusText = 'Confirmé';
          break;
        case 'pending':
          statusText = 'En attente';
          break;
        case 'modified':
          statusText = 'Modifié';
          break;
        default:
          statusText = shift.status;
      }
      
      doc.text(statusText, startX + columns[0].width + columns[1].width + columns[2].width + columns[3].width + 5, startY + 7, { width: columns[4].width - 10 });
      
      // Bordures de la ligne
      doc.rect(startX, startY, columns.reduce((acc, col) => acc + col.width, 0), rowHeight).stroke();
      
      // Séparateurs de colonnes
      let colX = startX;
      for (let i = 0; i < columns.length - 1; i++) {
        colX += columns[i].width;
        doc.moveTo(colX, startY).lineTo(colX, startY + rowHeight).stroke();
      }
      
      // Mise à jour de la position Y
      startY += rowHeight;
    });
  }
  
  /**
   * Dessine l'en-tête du tableau
   * @param {PDFDocument} doc - Document PDF
   * @param {Array} columns - Définition des colonnes
   * @param {Number} startX - Position X de départ
   * @param {Number} startY - Position Y de départ
   * @param {Number} rowHeight - Hauteur de la ligne
   */
  drawTableHeader(doc, columns, startX, startY, rowHeight) {
    // Fond de l'en-tête
    doc.rect(startX, startY, columns.reduce((acc, col) => acc + col.width, 0), rowHeight)
       .fill('#f2f2f2');
    
    // Texte de l'en-tête
    doc.font('Helvetica-Bold').fontSize(11);
    
    let colX = startX;
    columns.forEach(column => {
      doc.text(column.header, colX + 5, startY + 7, { width: column.width - 10, align: 'center' });
      colX += column.width;
    });
    
    // Bordures
    doc.rect(startX, startY, columns.reduce((acc, col) => acc + col.width, 0), rowHeight)
       .stroke();
    
    // Séparateurs de colonnes
    colX = startX;
    for (let i = 0; i < columns.length - 1; i++) {
      colX += columns[i].width;
      doc.moveTo(colX, startY).lineTo(colX, startY + rowHeight).stroke();
    }
  }
  
  /**
   * Obtient le nom du mois en français
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
   * Supprime un fichier temporaire
   * @param {String} filePath - Chemin du fichier
   */
  async deleteTempFile(filePath) {
    try {
      await fs.promises.unlink(filePath);
      logger.debug(`Fichier temporaire supprimé: ${filePath}`);
    } catch (error) {
      logger.warn(`Erreur lors de la suppression du fichier temporaire: ${error.message}`);
    }
  }
  
  /**
   * Obtient la taille d'un fichier
   * @param {String} filePath - Chemin du fichier
   * @returns {Promise<Number>} Taille du fichier en octets
   */
  async getFileSize(filePath) {
    try {
      const stats = await fs.promises.stat(filePath);
      return stats.size;
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la taille du fichier: ${error.message}`);
      return 0;
    }
  }
}

module.exports = new PDFService();