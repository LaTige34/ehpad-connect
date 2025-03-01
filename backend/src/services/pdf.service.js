const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');
const fileService = require('./file.service');

/**
 * Service de génération de PDF
 */
class PDFService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../uploads/temp');
    this.initTempDir();
  }
  
  /**
   * Initialise le répertoire temporaire
   */
  async initTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      logger.error(`Erreur lors de l'initialisation du répertoire temporaire: ${error.message}`);
    }
  }
  
  /**
   * Génère un PDF pour un planning mensuel
   * @param {Object} planning - Objet planning avec les services associés
   * @returns {Promise<String>} Chemin du fichier PDF généré
   */
  async generatePlanningPDF(planning) {
    return new Promise(async (resolve, reject) => {
      try {
        // Génération du nom de fichier temporaire
        const tempFilePath = path.join(this.tempDir, `planning_${planning.id}_${Date.now()}.pdf`);
        
        // Récupérer les données nécessaires pour le PDF
        const employee = planning.employee || { name: 'Employé' };
        const shifts = planning.Shifts || [];
        
        // Organiser les services par jour
        const days = {};
        shifts.forEach(shift => {
          const day = new Date(shift.date).getDate();
          days[day] = shift;
        });
        
        // Créer le document PDF
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4',
          info: {
            Title: `Planning ${planning.month}/${planning.year} - ${employee.name}`,
            Author: 'EHPAD Connect',
            Subject: `Planning mensuel ${planning.month}/${planning.year}`,
            Keywords: 'planning, emploi du temps, ehpad'
          }
        });
        
        // Rediriger la sortie vers un fichier
        const stream = fs.createWriteStream(tempFilePath);
        doc.pipe(stream);
        
        // En-tête du document
        doc.fontSize(20).text('EHPAD Belleviste', { align: 'center' });
        doc.fontSize(16).text(`Planning - ${planning.month}/${planning.year}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Employé: ${employee.name}`, { align: 'left' });
        doc.moveDown();
        
        // Date de génération
        doc.fontSize(10).text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
        doc.moveDown();
        
        // Style pour le tableau
        const tableTop = 200;
        const tableLeft = 50;
        const cellPadding = 10;
        const columns = [
          { title: 'Jour', width: 50 },
          { title: 'Date', width: 80 },
          { title: 'Type', width: 80 },
          { title: 'Horaires', width: 120 },
          { title: 'Service', width: 120 },
          { title: 'Statut', width: 80 }
        ];
        
        // Calculer la largeur totale du tableau
        const tableWidth = columns.reduce((width, column) => width + column.width, 0);
        
        // En-tête du tableau
        doc.moveTo(tableLeft, tableTop)
          .lineTo(tableLeft + tableWidth, tableTop)
          .stroke();
          
        let currentLeft = tableLeft;
        columns.forEach(column => {
          doc.fontSize(12).text(column.title, currentLeft + cellPadding, tableTop + cellPadding, {
            width: column.width - 2 * cellPadding,
            align: 'left'
          });
          currentLeft += column.width;
          
          // Ligne verticale
          doc.moveTo(currentLeft, tableTop)
            .lineTo(currentLeft, tableTop + 30)
            .stroke();
        });
        
        // Ligne horizontale après l'en-tête
        const headerBottom = tableTop + 30;
        doc.moveTo(tableLeft, headerBottom)
          .lineTo(tableLeft + tableWidth, headerBottom)
          .stroke();
        
        // Corps du tableau
        let currentTop = headerBottom;
        const rowHeight = 30;
        const daysInMonth = new Date(planning.year, planning.month, 0).getDate();
        
        // Sélection de couleurs par type de service
        const shiftColors = {
          morning: [220, 240, 255],
          afternoon: [255, 240, 220],
          night: [230, 220, 255],
          rest: [240, 240, 240]
        };
        
        for (let day = 1; day <= daysInMonth; day++) {
          const shift = days[day] || { date: new Date(planning.year, planning.month - 1, day), shiftType: 'undefined' };
          const date = new Date(shift.date);
          
          // Ajouter une page si nécessaire
          if (currentTop + rowHeight > doc.page.height - 50) {
            doc.addPage();
            currentTop = 50;
            
            // Re-dessiner l'en-tête du tableau
            doc.moveTo(tableLeft, currentTop)
              .lineTo(tableLeft + tableWidth, currentTop)
              .stroke();
              
            currentLeft = tableLeft;
            columns.forEach(column => {
              doc.fontSize(12).text(column.title, currentLeft + cellPadding, currentTop + cellPadding, {
                width: column.width - 2 * cellPadding,
                align: 'left'
              });
              currentLeft += column.width;
              
              // Ligne verticale
              doc.moveTo(currentLeft, currentTop)
                .lineTo(currentLeft, currentTop + 30)
                .stroke();
            });
            
            // Ligne horizontale après l'en-tête
            const newHeaderBottom = currentTop + 30;
            doc.moveTo(tableLeft, newHeaderBottom)
              .lineTo(tableLeft + tableWidth, newHeaderBottom)
              .stroke();
              
            currentTop = newHeaderBottom;
          }
          
          // Couleur de fond en fonction du type de service
          const color = shiftColors[shift.shiftType] || [255, 255, 255];
          doc.rect(tableLeft, currentTop, tableWidth, rowHeight).fill(color);
          
          // Lignes de la cellule
          doc.rect(tableLeft, currentTop, tableWidth, rowHeight).stroke();
          
          // Contenu de la ligne
          let cellLeft = tableLeft;
          
          // Jour
          doc.fontSize(10).text(day.toString(), cellLeft + cellPadding, currentTop + cellPadding, {
            width: columns[0].width - 2 * cellPadding,
            align: 'center'
          });
          cellLeft += columns[0].width;
          
          // Date
          const options = { weekday: 'short', month: 'short', day: 'numeric' };
          doc.fontSize(10).text(date.toLocaleDateString('fr-FR', options), cellLeft + cellPadding, currentTop + cellPadding, {
            width: columns[1].width - 2 * cellPadding,
            align: 'left'
          });
          cellLeft += columns[1].width;
          
          // Type de service
          const shiftTypeNames = {
            morning: 'Matin',
            afternoon: 'Après-midi',
            night: 'Nuit',
            rest: 'Repos'
          };
          doc.fontSize(10).text(shiftTypeNames[shift.shiftType] || '-', cellLeft + cellPadding, currentTop + cellPadding, {
            width: columns[2].width - 2 * cellPadding,
            align: 'left'
          });
          cellLeft += columns[2].width;
          
          // Horaires
          const hours = shift.startTime && shift.endTime 
            ? `${shift.startTime.substring(0, 5)} - ${shift.endTime.substring(0, 5)}`
            : '-';
          doc.fontSize(10).text(hours, cellLeft + cellPadding, currentTop + cellPadding, {
            width: columns[3].width - 2 * cellPadding,
            align: 'left'
          });
          cellLeft += columns[3].width;
          
          // Service
          doc.fontSize(10).text(shift.service || '-', cellLeft + cellPadding, currentTop + cellPadding, {
            width: columns[4].width - 2 * cellPadding,
            align: 'left'
          });
          cellLeft += columns[4].width;
          
          // Statut
          const statusNames = {
            draft: 'Brouillon',
            confirmed: 'Confirmé',
            pending: 'En attente',
            modified: 'Modifié'
          };
          doc.fontSize(10).text(statusNames[shift.status] || '-', cellLeft + cellPadding, currentTop + cellPadding, {
            width: columns[5].width - 2 * cellPadding,
            align: 'left'
          });
          
          // Avancer pour la prochaine ligne
          currentTop += rowHeight;
          
          // Lignes verticales
          cellLeft = tableLeft;
          columns.forEach(column => {
            cellLeft += column.width;
            doc.moveTo(cellLeft, currentTop - rowHeight)
              .lineTo(cellLeft, currentTop)
              .stroke();
          });
        }
        
        // Pied de page
        doc.addPage();
        doc.fontSize(14).text('Signature', { align: 'center' });
        doc.moveDown();
        
        // Zone de signature
        const signatureTop = 150;
        const signatureHeight = 100;
        const signatureWidth = 300;
        
        // Cadre pour la signature
        doc.rect(
          doc.page.width / 2 - signatureWidth / 2,
          signatureTop,
          signatureWidth,
          signatureHeight
        ).stroke();
        
        // Texte d'instruction
        doc.fontSize(10).text(
          'Signature de l\'employé',
          doc.page.width / 2 - signatureWidth / 2,
          signatureTop + signatureHeight + 10,
          { width: signatureWidth, align: 'center' }
        );
        
        // Informations juridiques
        doc.moveDown(5);
        doc.fontSize(8).text(
          'Ce document atteste que l\'employé a pris connaissance de son planning de travail pour la période indiquée. ' +
          'La signature électronique apposée a la même valeur juridique qu\'une signature manuscrite conformément ' +
          'au règlement eIDAS n°910/2014 du 23 juillet 2014.',
          { align: 'center' }
        );
        
        // Finaliser le document
        doc.end();
        
        // Attendre que le stream soit fermé
        stream.on('finish', () => {
          logger.info(`PDF du planning ${planning.id} généré: ${tempFilePath}`);
          resolve(tempFilePath);
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
   * Supprime un fichier temporaire
   * @param {String} filePath - Chemin du fichier à supprimer
   */
  async deleteTempFile(filePath) {
    try {
      await fs.unlink(filePath);
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
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la taille du fichier: ${error.message}`);
      return 0;
    }
  }
}

module.exports = new PDFService();