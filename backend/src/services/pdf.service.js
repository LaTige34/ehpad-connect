const fs = require('fs').promises;
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const logger = require('../utils/logger');
const fileService = require('./file.service');
const { format } = require('date-fns');
const { fr } = require('date-fns/locale');

/**
 * Service de génération de documents PDF
 */
class PdfService {
  /**
   * Génère un PDF du planning mensuel
   * @param {Object} planning - Objet planning avec ses services
   * @returns {Promise<String>} Chemin du fichier PDF généré
   */
  async generatePlanningPDF(planning) {
    try {
      // Création d'un nouveau document PDF
      const pdfDoc = await PDFDocument.create();
      
      // Ajout d'une page
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 en points
      
      // Récupération des polices
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Largeur et hauteur de la page
      const { width, height } = page.getSize();
      
      // Informations sur l'employé et le planning
      const employeeName = planning.employee ? planning.employee.name : 'Employé';
      const monthName = format(new Date(planning.year, planning.month - 1), 'MMMM yyyy', { locale: fr });
      
      // Titre
      page.drawText('EHPAD Belleviste', {
        x: 50,
        y: height - 50,
        size: 20,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      // Sous-titre
      page.drawText(`Planning mensuel - ${monthName}`, {
        x: 50,
        y: height - 80,
        size: 16,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      // Informations sur l'employé
      page.drawText(`Employé : ${employeeName}`, {
        x: 50,
        y: height - 110,
        size: 12,
        font: helveticaFont,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      page.drawText(`Généré le : ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, {
        x: 50,
        y: height - 130,
        size: 10,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      // Légende
      const legendY = height - 160;
      page.drawText('Légende :', {
        x: 50,
        y: legendY,
        size: 10,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      // Rectangle pour Matin
      page.drawRectangle({
        x: 120,
        y: legendY - 5,
        width: 10,
        height: 10,
        color: rgb(0.9, 0.95, 1)
      });
      page.drawText('Matin', {
        x: 135,
        y: legendY,
        size: 10,
        font: helveticaFont,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      // Rectangle pour Après-midi
      page.drawRectangle({
        x: 180,
        y: legendY - 5,
        width: 10,
        height: 10,
        color: rgb(1, 0.9, 0.95)
      });
      page.drawText('Après-midi', {
        x: 195,
        y: legendY,
        size: 10,
        font: helveticaFont,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      // Rectangle pour Nuit
      page.drawRectangle({
        x: 270,
        y: legendY - 5,
        width: 10,
        height: 10,
        color: rgb(0.9, 0.9, 1)
      });
      page.drawText('Nuit', {
        x: 285,
        y: legendY,
        size: 10,
        font: helveticaFont,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      // Rectangle pour Repos
      page.drawRectangle({
        x: 330,
        y: legendY - 5,
        width: 10,
        height: 10,
        color: rgb(0.95, 0.95, 0.95)
      });
      page.drawText('Repos', {
        x: 345,
        y: legendY,
        size: 10,
        font: helveticaFont,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      // Tableau des services
      const tableTop = legendY - 30;
      const tableLeft = 50;
      const colWidth = 70;
      const rowHeight = 30;
      const cols = 7; // 7 jours par semaine
      const tableWidth = cols * colWidth;
      
      // En-têtes des jours de la semaine
      const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      
      // Dessiner l'en-tête du tableau
      for (let i = 0; i < cols; i++) {
        // Bord supérieur et inférieur de l'en-tête
        page.drawLine({
          start: { x: tableLeft + i * colWidth, y: tableTop },
          end: { x: tableLeft + (i + 1) * colWidth, y: tableTop },
          thickness: 1,
          color: rgb(0.5, 0.5, 0.5)
        });
        
        page.drawLine({
          start: { x: tableLeft + i * colWidth, y: tableTop - 20 },
          end: { x: tableLeft + (i + 1) * colWidth, y: tableTop - 20 },
          thickness: 1,
          color: rgb(0.5, 0.5, 0.5)
        });
        
        // Bords verticaux
        page.drawLine({
          start: { x: tableLeft + i * colWidth, y: tableTop },
          end: { x: tableLeft + i * colWidth, y: tableTop - 20 },
          thickness: 1,
          color: rgb(0.5, 0.5, 0.5)
        });
        
        // Texte des jours
        page.drawText(daysOfWeek[i], {
          x: tableLeft + i * colWidth + 5,
          y: tableTop - 15,
          size: 10,
          font: helveticaBold,
          color: rgb(0.1, 0.1, 0.1)
        });
      }
      
      // Bord vertical final de l'en-tête
      page.drawLine({
        start: { x: tableLeft + cols * colWidth, y: tableTop },
        end: { x: tableLeft + cols * colWidth, y: tableTop - 20 },
        thickness: 1,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      // Trier les services par date
      const shifts = planning.Shifts ? [...planning.Shifts].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      ) : [];
      
      // Calculer le nombre de semaines nécessaires
      const daysInMonth = new Date(planning.year, planning.month, 0).getDate();
      const firstDayOfMonth = new Date(planning.year, planning.month - 1, 1).getDay(); // 0 = dimanche
      const firstWeekdayOfMonth = firstDayOfMonth === 0 ? 7 : firstDayOfMonth; // Transformer dimanche en 7
      const weeksNeeded = Math.ceil((daysInMonth + firstWeekdayOfMonth - 1) / 7);
      
      // Dessiner le tableau des services
      for (let week = 0; week < weeksNeeded; week++) {
        // Déterminer le jour de début de la semaine
        const startDayOfWeek = week * 7 - firstWeekdayOfMonth + 2;
        
        // Dessiner les cellules de la semaine
        for (let i = 0; i < cols; i++) {
          const dayOfMonth = startDayOfWeek + i;
          const y = tableTop - 20 - week * rowHeight;
          
          // Bords verticaux
          page.drawLine({
            start: { x: tableLeft + i * colWidth, y },
            end: { x: tableLeft + i * colWidth, y: y - rowHeight },
            thickness: 1,
            color: rgb(0.5, 0.5, 0.5)
          });
          
          // Bord inférieur
          page.drawLine({
            start: { x: tableLeft + i * colWidth, y: y - rowHeight },
            end: { x: tableLeft + (i + 1) * colWidth, y: y - rowHeight },
            thickness: 1,
            color: rgb(0.5, 0.5, 0.5)
          });
          
          // Si le jour fait partie du mois
          if (dayOfMonth > 0 && dayOfMonth <= daysInMonth) {
            // Afficher le numéro du jour
            page.drawText(`${dayOfMonth}`, {
              x: tableLeft + i * colWidth + 5,
              y: y - 15,
              size: 10,
              font: helveticaBold,
              color: rgb(0.1, 0.1, 0.1)
            });
            
            // Trouver le service pour ce jour
            const dateString = `${planning.year}-${String(planning.month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
            const shift = shifts.find(s => s.date === dateString);
            
            if (shift) {
              // Fond coloré selon le type de service
              let fillColor;
              switch (shift.shiftType) {
                case 'morning':
                  fillColor = rgb(0.9, 0.95, 1);
                  break;
                case 'afternoon':
                  fillColor = rgb(1, 0.9, 0.95);
                  break;
                case 'night':
                  fillColor = rgb(0.9, 0.9, 1);
                  break;
                default:
                  fillColor = rgb(0.95, 0.95, 0.95);
              }
              
              // Rectangle de fond
              page.drawRectangle({
                x: tableLeft + i * colWidth + 1,
                y: y - rowHeight + 1,
                width: colWidth - 2,
                height: rowHeight - 1,
                color: fillColor,
                opacity: 0.5
              });
              
              // Informations du service
              if (shift.shiftType !== 'rest') {
                const shiftTypes = {
                  morning: 'Matin',
                  afternoon: 'Après-midi',
                  night: 'Nuit'
                };
                
                page.drawText(shiftTypes[shift.shiftType] || shift.shiftType, {
                  x: tableLeft + i * colWidth + 5,
                  y: y - 30,
                  size: 8,
                  font: helveticaBold,
                  color: rgb(0.1, 0.1, 0.1)
                });
                
                if (shift.startTime && shift.endTime) {
                  const hours = `${shift.startTime.substring(0, 5)}-${shift.endTime.substring(0, 5)}`;
                  page.drawText(hours, {
                    x: tableLeft + i * colWidth + 5,
                    y: y - 40,
                    size: 8,
                    font: helveticaFont,
                    color: rgb(0.3, 0.3, 0.3)
                  });
                }
                
                if (shift.service) {
                  page.drawText(shift.service, {
                    x: tableLeft + i * colWidth + 5,
                    y: y - 50,
                    size: 8,
                    font: helveticaFont,
                    color: rgb(0.3, 0.3, 0.3)
                  });
                }
              } else {
                page.drawText('Repos', {
                  x: tableLeft + i * colWidth + 5,
                  y: y - 30,
                  size: 8,
                  font: helveticaFont,
                  color: rgb(0.5, 0.5, 0.5)
                });
              }
            }
          }
        }
        
        // Bord vertical final
        page.drawLine({
          start: { x: tableLeft + cols * colWidth, y: tableTop - 20 - week * rowHeight },
          end: { x: tableLeft + cols * colWidth, y: tableTop - 20 - (week + 1) * rowHeight },
          thickness: 1,
          color: rgb(0.5, 0.5, 0.5)
        });
      }
      
      // Section de signature
      const signatureTop = tableTop - 20 - weeksNeeded * rowHeight - 50;
      
      page.drawText('Signature de l\'employé :', {
        x: 50,
        y: signatureTop,
        size: 12,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      // Rectangle pour la signature
      page.drawRectangle({
        x: 50,
        y: signatureTop - 80,
        width: 200,
        height: 70,
        borderColor: rgb(0.5, 0.5, 0.5),
        borderWidth: 1
      });
      
      // Texte pour la signature électronique
      if (planning.status === 'signed' && planning.signedAt) {
        const signatureDate = format(new Date(planning.signedAt), 'dd/MM/yyyy HH:mm');
        
        page.drawText('Document signé électroniquement', {
          x: 60,
          y: signatureTop - 30,
          size: 10,
          font: helveticaBold,
          color: rgb(0.1, 0.6, 0.1)
        });
        
        page.drawText(`Date : ${signatureDate}`, {
          x: 60,
          y: signatureTop - 45,
          size: 10,
          font: helveticaFont,
          color: rgb(0.1, 0.6, 0.1)
        });
        
        page.drawText(`ID : ${planning.signatureId || 'N/A'}`, {
          x: 60,
          y: signatureTop - 60,
          size: 10,
          font: helveticaFont,
          color: rgb(0.1, 0.6, 0.1)
        });
      }
      
      // Signature du responsable
      page.drawText('Signature du responsable :', {
        x: 300,
        y: signatureTop,
        size: 12,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      // Rectangle pour la signature du responsable
      page.drawRectangle({
        x: 300,
        y: signatureTop - 80,
        width: 200,
        height: 70,
        borderColor: rgb(0.5, 0.5, 0.5),
        borderWidth: 1
      });
      
      // Pied de page
      page.drawText('EHPAD Belleviste - Document généré par EHPAD Connect', {
        x: 50,
        y: 30,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      // Génération du PDF
      const pdfBytes = await pdfDoc.save();
      
      // Création d'un fichier temporaire
      const pdfPath = await fileService.createTempFile(pdfBytes, '.pdf');
      
      logger.info(`PDF du planning généré: ${pdfPath}`);
      return pdfPath;
    } catch (error) {
      logger.error(`Erreur lors de la génération du PDF: ${error.message}`);
      throw error;
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
   * Obtient la taille d'un fichier
   * @param {String} filePath - Chemin du fichier
   * @returns {Promise<Number>} Taille du fichier en octets
   */
  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      logger.warn(`Impossible d'obtenir la taille du fichier: ${error.message}`);
      return 0;
    }
  }
}

module.exports = new PdfService();