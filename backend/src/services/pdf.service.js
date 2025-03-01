const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');
const fileService = require('./file.service');

/**
 * Service de génération de PDF
 */
class PDFService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../uploads/temp');
    this.ensureTempDir();
  }

  /**
   * S'assure que le répertoire temporaire existe
   */
  async ensureTempDir() {
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
   * @param {Object} planning - Objet Planning avec ses services (shifts)
   * @returns {Promise<String>} Chemin du fichier PDF généré
   */
  async generatePlanningPDF(planning) {
    try {
      const fileName = `planning_${planning.month}_${planning.year}_${planning.employeeId}_${crypto.randomBytes(4).toString('hex')}.pdf`;
      const filePath = path.join(this.tempDir, fileName);
      
      // Créer un stream d'écriture pour le PDF
      const writeStream = fs.createWriteStream(filePath);
      
      // Créer le document PDF
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
          Author: 'EHPAD Connect',
          Subject: `Planning mensuel - ${planning.employee?.name || 'Employé'}`,
          Keywords: 'planning, ehpad, octime'
        }
      });

      // Pipe le document vers le stream d'écriture
      doc.pipe(writeStream);
      
      // Générer le contenu du PDF
      this.generatePlanningContent(doc, planning);
      
      // Finaliser le document
      doc.end();
      
      // Attendre que le fichier soit écrit
      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          logger.info(`PDF du planning généré: ${filePath}`);
          resolve(filePath);
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
   * Génère le contenu du PDF pour un planning
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} planning - Objet Planning avec ses services (shifts)
   */
  generatePlanningContent(doc, planning) {
    // En-tête
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text(`Planning - ${this.getMonthName(planning.month)} ${planning.year}`, {
         align: 'center'
       });
    
    // Informations de l'employé
    doc.moveDown()
       .fontSize(12)
       .font('Helvetica')
       .text(`Employé: ${planning.employee?.name || 'N/A'}`, {
         align: 'left'
       })
       .text(`Statut: ${this.getPlanningStatusText(planning.status)}`, {
         align: 'left'
       });
    
    doc.moveDown()
       .moveDown();
    
    // Préparation des données pour le tableau
    const shifts = planning.Shifts || [];
    
    // Si aucun service, afficher un message
    if (shifts.length === 0) {
      doc.text('Aucun service planifié pour ce mois.', {
        align: 'center'
      });
      return;
    }
    
    // Trier les services par date
    shifts.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Créer le tableau de services
    const startX = 50;
    const startY = doc.y;
    const colWidth = [80, 80, 80, 80, 170]; // Date, Type, Début, Fin, Service
    const rowHeight = 25;
    
    // En-têtes du tableau
    doc.font('Helvetica-Bold')
       .fontSize(10);
    
    const headers = ['Date', 'Type', 'Début', 'Fin', 'Service/Unité'];
    
    // Dessiner l'en-tête
    doc.rect(startX, startY, doc.page.width - 100, rowHeight).stroke();
    
    let currentX = startX;
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], currentX + 5, startY + 7, {
        width: colWidth[i],
        align: 'left'
      });
      
      currentX += colWidth[i];
      
      // Ligne verticale sauf pour la dernière colonne
      if (i < headers.length - 1) {
        doc.moveTo(currentX, startY)
           .lineTo(currentX, startY + rowHeight)
           .stroke();
      }
    }
    
    // Contenu du tableau
    doc.font('Helvetica')
       .fontSize(9);
    
    let currentY = startY + rowHeight;
    
    // Dessiner chaque ligne du tableau
    for (const shift of shifts) {
      currentX = startX;
      
      // Si on atteint le bas de la page, créer une nouvelle page
      if (currentY + rowHeight > doc.page.height - 50) {
        doc.addPage();
        currentY = 50;
        
        // Redessiner l'en-tête sur la nouvelle page
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .rect(startX, currentY, doc.page.width - 100, rowHeight)
           .stroke();
        
        let headerX = startX;
        for (let i = 0; i < headers.length; i++) {
          doc.text(headers[i], headerX + 5, currentY + 7, {
            width: colWidth[i],
            align: 'left'
          });
          
          headerX += colWidth[i];
          
          if (i < headers.length - 1) {
            doc.moveTo(headerX, currentY)
               .lineTo(headerX, currentY + rowHeight)
               .stroke();
          }
        }
        
        currentY += rowHeight;
        doc.font('Helvetica')
           .fontSize(9);
      }
      
      // Cadre de la ligne
      doc.rect(startX, currentY, doc.page.width - 100, rowHeight).stroke();
      
      // Date formatée
      const date = new Date(shift.date);
      const formattedDate = `${this.getDayName(date.getDay())} ${date.getDate()}`;
      
      // Informations de la ligne
      const shiftType = this.getShiftTypeText(shift.shiftType);
      const startTime = shift.startTime || '-';
      const endTime = shift.endTime || '-';
      const service = shift.service || (shift.shiftType === 'rest' ? 'Repos' : '-');
      
      // Colonne 1: Date
      doc.text(formattedDate, currentX + 5, currentY + 7, {
        width: colWidth[0],
        align: 'left'
      });
      currentX += colWidth[0];
      doc.moveTo(currentX, currentY)
         .lineTo(currentX, currentY + rowHeight)
         .stroke();
      
      // Colonne 2: Type de service
      doc.text(shiftType, currentX + 5, currentY + 7, {
        width: colWidth[1],
        align: 'left'
      });
      currentX += colWidth[1];
      doc.moveTo(currentX, currentY)
         .lineTo(currentX, currentY + rowHeight)
         .stroke();
      
      // Colonne 3: Heure de début
      doc.text(startTime, currentX + 5, currentY + 7, {
        width: colWidth[2],
        align: 'left'
      });
      currentX += colWidth[2];
      doc.moveTo(currentX, currentY)
         .lineTo(currentX, currentY + rowHeight)
         .stroke();
      
      // Colonne 4: Heure de fin
      doc.text(endTime, currentX + 5, currentY + 7, {
        width: colWidth[3],
        align: 'left'
      });
      currentX += colWidth[3];
      doc.moveTo(currentX, currentY)
         .lineTo(currentX, currentY + rowHeight)
         .stroke();
      
      // Colonne 5: Service/Unité
      doc.text(service, currentX + 5, currentY + 7, {
        width: colWidth[4],
        align: 'left'
      });
      
      currentY += rowHeight;
    }
    
    // Légende et pied de page
    doc.moveDown()
       .moveDown()
       .fontSize(10)
       .text('Légende:', {
         align: 'left'
       })
       .text('Matin: 7h-15h | Après-midi: 15h-23h | Nuit: 23h-7h', {
         align: 'left'
       });
    
    // Signature si le planning est signé
    if (planning.status === 'signed' && planning.signedAt) {
      doc.moveDown()
         .moveDown()
         .fontSize(10)
         .text(`Document signé électroniquement le ${new Date(planning.signedAt).toLocaleDateString('fr-FR')}`, {
           align: 'right'
         });
      
      if (planning.signatureId) {
        doc.text(`Référence de signature: ${planning.signatureId}`, {
          align: 'right'
        });
      }
    } else {
      // Espace pour signature
      doc.moveDown()
         .moveDown()
         .fontSize(10)
         .text('Signature employé:', {
           align: 'left'
         })
         .rect(doc.page.width - 200, doc.y, 150, 50)
         .stroke();
    }
    
    // Pied de page avec informations légales
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Ligne de séparation
      const footerY = doc.page.height - 40;
      doc.moveTo(50, footerY)
         .lineTo(doc.page.width - 50, footerY)
         .stroke();
      
      // Texte du pied de page
      doc.fontSize(8)
         .text(
           `EHPAD Belleviste - Planning généré le ${new Date().toLocaleDateString('fr-FR')} - Page ${i + 1} / ${pages.count}`,
           50,
           footerY + 10,
           { align: 'center', width: doc.page.width - 100 }
         );
    }
  }

  /**
   * Récupère le nom du mois en français
   * @param {Number} month - Numéro du mois (1-12)
   * @returns {String} Nom du mois
   */
  getMonthName(month) {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    return months[month - 1] || `Mois ${month}`;
  }

  /**
   * Récupère le nom du jour en français
   * @param {Number} day - Numéro du jour (0-6, où 0 est dimanche)
   * @returns {String} Nom du jour
   */
  getDayName(day) {
    const days = [
      'Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'
    ];
    
    return days[day] || `Jour ${day}`;
  }

  /**
   * Récupère le texte formaté pour le type de service
   * @param {String} shiftType - Type de service
   * @returns {String} Texte formaté
   */
  getShiftTypeText(shiftType) {
    const types = {
      'morning': 'Matin',
      'afternoon': 'Après-midi',
      'night': 'Nuit',
      'rest': 'Repos'
    };
    
    return types[shiftType] || shiftType;
  }

  /**
   * Récupère le texte formaté pour le statut du planning
   * @param {String} status - Statut du planning
   * @returns {String} Texte formaté
   */
  getPlanningStatusText(status) {
    const statuses = {
      'draft': 'Brouillon',
      'published': 'Publié',
      'signed': 'Signé'
    };
    
    return statuses[status] || status;
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
   * @param {String} filePath - Chemin du fichier à supprimer
   * @returns {Promise<Boolean>} Succès de la suppression
   */
  async deleteTempFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.debug(`Fichier temporaire supprimé: ${filePath}`);
      return true;
    } catch (error) {
      logger.warn(`Impossible de supprimer le fichier temporaire: ${error.message}`);
      return false;
    }
  }
}

module.exports = new PDFService();
