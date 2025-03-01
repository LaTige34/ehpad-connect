const fs = require('fs').promises;
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const logger = require('../utils/logger');
const fileService = require('./file.service');

/**
 * Service de génération de PDF pour les plannings et documents
 */
class PDFService {
  constructor() {
    // Dossier pour les PDF temporaires
    this.tempPath = path.join(__dirname, '../../uploads/temp');
    this.initializeTempDirectory();
  }
  
  /**
   * Crée le dossier temporaire s'il n'existe pas
   */
  async initializeTempDirectory() {
    try {
      await fs.access(this.tempPath);
    } catch (error) {
      await fs.mkdir(this.tempPath, { recursive: true });
      logger.info(`Dossier temporaire pour les PDF créé: ${this.tempPath}`);
    }
  }
  
  /**
   * Génère un PDF du planning mensuel
   * @param {Object} planning - Planning avec les services
   * @returns {Promise<String>} Chemin du fichier PDF généré
   */
  async generatePlanningPDF(planning) {
    try {
      // Création d'un nouveau document PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // Format A4
      
      // Récupération et incorporation des polices
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Variables pour la mise en page
      const { width, height } = page.getSize();
      const margin = 50;
      const contentWidth = width - 2 * margin;
      let yPosition = height - margin;
      
      // En-tête du document
      page.drawText('EHPAD Belleviste', {
        x: margin,
        y: yPosition,
        size: 20,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.7)
      });
      
      yPosition -= 30;
      
      // Titre du planning
      page.drawText(`Planning du mois ${planning.month}/${planning.year}`, {
        x: margin,
        y: yPosition,
        size: 16,
        font: helveticaBold
      });
      
      yPosition -= 20;
      
      // Informations employé
      if (planning.employee) {
        page.drawText(`Employé: ${planning.employee.name}`, {
          x: margin,
          y: yPosition,
          size: 12,
          font: helveticaFont
        });
        
        yPosition -= 20;
        
        page.drawText(`Email: ${planning.employee.email}`, {
          x: margin,
          y: yPosition,
          size: 12,
          font: helveticaFont
        });
      }
      
      yPosition -= 40;
      
      // Tableau des services
      const headerHeight = 30;
      const rowHeight = 25;
      const columnWidths = [80, 180, 100, 100, 85]; // Date, Service, Horaires, Type, Statut
      
      // En-têtes du tableau
      this.drawTableHeader(
        page, 
        margin, 
        yPosition, 
        columnWidths, 
        headerHeight, 
        helveticaBold
      );
      
      yPosition -= headerHeight;
      
      // Trier les services par date
      const shifts = planning.Shifts || [];
      shifts.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Lignes du tableau des services
      for (const shift of shifts) {
        // Vérifier s'il faut ajouter une nouvelle page
        if (yPosition < margin + rowHeight) {
          // Ajouter une nouvelle page
          page = pdfDoc.addPage([595, 842]);
          yPosition = height - margin;
          
          // Répéter l'en-tête du tableau sur la nouvelle page
          this.drawTableHeader(
            page, 
            margin, 
            yPosition, 
            columnWidths, 
            headerHeight, 
            helveticaBold
          );
          
          yPosition -= headerHeight;
        }
        
        // Formater la date
        const date = new Date(shift.date);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        // Formater le service
        const service = shift.shiftType === 'rest' ? 'Repos' : 
                        shift.shiftType === 'morning' ? 'Matin' :
                        shift.shiftType === 'afternoon' ? 'Après-midi' : 'Nuit';
        
        // Formater les horaires
        const hours = shift.startTime && shift.endTime ? 
                      `${shift.startTime.substring(0, 5)} - ${shift.endTime.substring(0, 5)}` : 
                      '';
        
        // Statut du service
        const status = shift.status === 'confirmed' ? 'Confirmé' :
                      shift.status === 'pending' ? 'En attente' :
                      shift.status === 'modified' ? 'Modifié' : '';
        
        // Dessiner la ligne du tableau
        let x = margin;
        
        // Date
        page.drawText(formattedDate, {
          x: x + 5,
          y: yPosition - rowHeight / 2 + 6,
          size: 10,
          font: helveticaFont
        });
        x += columnWidths[0];
        
        // Service
        page.drawText(shift.service || '', {
          x: x + 5,
          y: yPosition - rowHeight / 2 + 6,
          size: 10,
          font: helveticaFont
        });
        x += columnWidths[1];
        
        // Horaires
        page.drawText(hours, {
          x: x + 5,
          y: yPosition - rowHeight / 2 + 6,
          size: 10,
          font: helveticaFont
        });
        x += columnWidths[2];
        
        // Type de service
        page.drawText(service, {
          x: x + 5,
          y: yPosition - rowHeight / 2 + 6,
          size: 10,
          font: helveticaFont
        });
        x += columnWidths[3];
        
        // Statut
        page.drawText(status, {
          x: x + 5,
          y: yPosition - rowHeight / 2 + 6,
          size: 10,
          font: helveticaFont
        });
        
        // Dessiner la bordure de la ligne
        this.drawTableRow(
          page, 
          margin, 
          yPosition, 
          columnWidths, 
          rowHeight
        );
        
        yPosition -= rowHeight;
      }
      
      // Pied de page
      const footerText = `Généré le ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}`;
      page.drawText(footerText, {
        x: margin,
        y: margin / 2,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      // Informations signature
      if (planning.status === 'signed' && planning.signedAt) {
        const signatureText = `Planning signé électroniquement le ${new Date(planning.signedAt).toLocaleDateString()} à ${new Date(planning.signedAt).toLocaleTimeString()}`;
        const signatureWidth = helveticaBold.widthOfTextAtSize(signatureText, 10);
        
        page.drawText(signatureText, {
          x: width - margin - signatureWidth,
          y: margin / 2,
          size: 10,
          font: helveticaBold,
          color: rgb(0.1, 0.1, 0.7)
        });
      }
      
      // Enregistrer le PDF dans un fichier temporaire
      const pdfBytes = await pdfDoc.save();
      const tempFilePath = path.join(this.tempPath, `planning_${planning.month}_${planning.year}_${Date.now()}.pdf`);
      await fs.writeFile(tempFilePath, pdfBytes);
      
      return tempFilePath;
    } catch (error) {
      logger.error(`Erreur lors de la génération du PDF: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Dessine l'en-tête du tableau
   */
  drawTableHeader(page, x, y, columnWidths, height, font) {
    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    
    // Dessiner la bordure de l'en-tête
    page.drawRectangle({
      x,
      y: y - height,
      width: totalWidth,
      height,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
      color: rgb(0.9, 0.9, 0.9)
    });
    
    // Dessiner les titres des colonnes
    const titles = ['Date', 'Service', 'Horaires', 'Type', 'Statut'];
    let currentX = x;
    
    for (let i = 0; i < titles.length; i++) {
      // Dessiner la ligne verticale de séparation (sauf pour la première colonne)
      if (i > 0) {
        page.drawLine({
          start: { x: currentX, y },
          end: { x: currentX, y: y - height },
          thickness: 1,
          color: rgb(0, 0, 0)
        });
      }
      
      // Dessiner le titre de la colonne
      page.drawText(titles[i], {
        x: currentX + 5,
        y: y - height / 2 + 6,
        size: 12,
        font
      });
      
      currentX += columnWidths[i];
    }
  }
  
  /**
   * Dessine une ligne du tableau
   */
  drawTableRow(page, x, y, columnWidths, height) {
    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    
    // Dessiner la bordure de la ligne
    page.drawRectangle({
      x,
      y: y - height,
      width: totalWidth,
      height,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });
    
    // Dessiner les lignes verticales de séparation
    let currentX = x;
    
    for (let i = 0; i < columnWidths.length - 1; i++) {
      currentX += columnWidths[i];
      
      page.drawLine({
        start: { x: currentX, y },
        end: { x: currentX, y: y - height },
        thickness: 1,
        color: rgb(0, 0, 0)
      });
    }
  }
  
  /**
   * Obtient la taille d'un fichier en octets
   * @param {String} filePath - Chemin du fichier
   * @returns {Promise<Number>} Taille en octets
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
   */
  async deleteTempFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.debug(`Fichier temporaire supprimé: ${filePath}`);
    } catch (error) {
      logger.warn(`Erreur lors de la suppression du fichier temporaire: ${error.message}`);
    }
  }
}

module.exports = new PDFService();