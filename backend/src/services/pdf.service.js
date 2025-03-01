const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const fileService = require('./file.service');
const logger = require('../utils/logger');
const { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } = require('date-fns');
const { fr } = require('date-fns/locale');

/**
 * Service de génération de documents PDF
 */
class PDFService {
  /**
   * Génère un PDF du planning mensuel
   * @param {Object} planning - Objet planning avec les services associés
   * @returns {Promise<String>} Chemin du fichier PDF généré
   */
  async generatePlanningPDF(planning) {
    try {
      // Créer un nouveau document PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Planning ${planning.month}/${planning.year}`,
          Author: 'EHPAD Connect',
          Subject: `Planning mensuel - ${planning.month}/${planning.year}`,
          Keywords: 'planning, ehpad, octime'
        }
      });
      
      // Créer un flux pour écrire le PDF
      const tempPath = await fileService.createTempFile('', '.pdf');
      const stream = fs.createWriteStream(tempPath);
      
      // Promesse qui résout quand le document est écrit dans le fichier
      const writePromise = new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(tempPath));
        stream.on('error', reject);
      });
      
      // Pipe du document vers le fichier
      doc.pipe(stream);
      
      // Préparer les données pour le PDF
      const year = planning.year;
      const month = planning.month;
      const employeeName = planning.employee?.name || 'Employé';
      
      // En-tête du document
      this.addHeader(doc, `Planning mensuel - ${format(new Date(year, month - 1), 'MMMM yyyy', { locale: fr })}`);
      
      // Informations de l'employé
      doc.fontSize(12)
         .text(`Employé: ${employeeName}`)
         .moveDown(0.5);
      
      // Tableau des services
      this.addPlanningTable(doc, planning);
      
      // Zone de signature
      this.addSignatureSection(doc, planning);
      
      // Pied de page
      this.addFooter(doc);
      
      // Finaliser le document
      doc.end();
      
      // Attendre que le document soit écrit
      await writePromise;
      
      logger.info(`PDF de planning généré: ${tempPath}`);
      return tempPath;
    } catch (error) {
      logger.error(`Erreur lors de la génération du PDF de planning: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Ajoute l'en-tête au document PDF
   * @param {PDFDocument} doc - Document PDF
   * @param {String} title - Titre du document
   */
  addHeader(doc, title) {
    // Logo (simulé par un rectangle bleu)
    doc.save()
       .fillColor('#1976d2')
       .rect(50, 50, 60, 60)
       .fill()
       .fontSize(16)
       .fillColor('white')
       .text('EHPAD', 55, 70)
       .text('Connect', 55, 90)
       .restore();
    
    // Titre du document
    doc.fontSize(20)
       .fillColor('#333333')
       .text(title, 150, 65, { width: 400, align: 'center' })
       .moveDown(2);
    
    // Date de génération
    doc.fontSize(10)
       .fillColor('#666666')
       .text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`, { align: 'right' })
       .moveDown(1);
    
    // Ligne de séparation
    doc.strokeColor('#cccccc')
       .lineWidth(1)
       .moveTo(50, 150)
       .lineTo(doc.page.width - 50, 150)
       .stroke()
       .moveDown(1);
  }
  
  /**
   * Ajoute un tableau avec les services du planning
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} planning - Objet planning avec services
   */
  addPlanningTable(doc, planning) {
    const year = planning.year;
    const month = planning.month;
    
    // Créer un dictionnaire des services par date
    const shiftsByDate = {};
    if (planning.Shifts && planning.Shifts.length > 0) {
      planning.Shifts.forEach(shift => {
        shiftsByDate[shift.date] = shift;
      });
    }
    
    // Obtenez tous les jours du mois
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    const days = eachDayOfInterval({ start, end });
    
    // Configuration du tableau
    const tableTop = 200;
    const tableWidth = doc.page.width - 100;
    const cellPadding = 5;
    const rowHeight = 30;
    
    // En-têtes de colonnes
    const columns = [
      { title: 'Date', width: tableWidth * 0.2 },
      { title: 'Service', width: tableWidth * 0.3 },
      { title: 'Horaires', width: tableWidth * 0.3 },
      { title: 'Statut', width: tableWidth * 0.2 }
    ];
    
    // Dessiner les en-têtes
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor('#333333');
    
    let xPos = 50;
    columns.forEach(column => {
      doc.text(column.title, xPos + cellPadding, tableTop + cellPadding, {
        width: column.width - (2 * cellPadding),
        align: 'left'
      });
      xPos += column.width;
    });
    
    // Ligne sous les en-têtes
    doc.strokeColor('#333333')
       .lineWidth(1)
       .moveTo(50, tableTop + rowHeight)
       .lineTo(50 + tableWidth, tableTop + rowHeight)
       .stroke();
    
    // Dessiner les lignes de données
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#000000');
    
    let yPos = tableTop + rowHeight;
    
    days.forEach((day, index) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const shift = shiftsByDate[dateStr];
      
      // Alterner la couleur de fond des lignes
      if (index % 2 === 0) {
        doc.fillColor('#f5f5f5')
           .rect(50, yPos, tableWidth, rowHeight)
           .fill()
           .fillColor('#000000');
      }
      
      let xPos = 50;
      
      // Date
      doc.text(
        format(day, 'eeee dd/MM', { locale: fr }), 
        xPos + cellPadding, 
        yPos + cellPadding + 3,
        { width: columns[0].width - (2 * cellPadding) }
      );
      xPos += columns[0].width;
      
      // Service
      const shiftType = shift ? this.translateShiftType(shift.shiftType) : 'Repos';
      const service = shift && shift.service ? shift.service : '';
      doc.text(
        `${shiftType}${service ? ' - ' + service : ''}`, 
        xPos + cellPadding, 
        yPos + cellPadding + 3,
        { width: columns[1].width - (2 * cellPadding) }
      );
      xPos += columns[1].width;
      
      // Horaires
      const hours = shift && shift.startTime && shift.endTime 
        ? `${shift.startTime.substring(0, 5)} - ${shift.endTime.substring(0, 5)}` 
        : '';
      doc.text(
        hours, 
        xPos + cellPadding, 
        yPos + cellPadding + 3,
        { width: columns[2].width - (2 * cellPadding) }
      );
      xPos += columns[2].width;
      
      // Statut
      const status = shift ? this.translateStatus(shift.status) : 'Confirmé';
      doc.text(
        status, 
        xPos + cellPadding, 
        yPos + cellPadding + 3,
        { width: columns[3].width - (2 * cellPadding) }
      );
      
      // Lignes horizontales du tableau
      doc.strokeColor('#cccccc')
         .lineWidth(0.5)
         .moveTo(50, yPos + rowHeight)
         .lineTo(50 + tableWidth, yPos + rowHeight)
         .stroke();
      
      yPos += rowHeight;
      
      // Vérifier si on atteint la fin de la page
      if (yPos > doc.page.height - 150) {
        doc.addPage();
        yPos = 50;
        
        // Ajouter un en-tête simplifié sur la nouvelle page
        doc.fontSize(12)
           .fillColor('#333333')
           .text(`Planning - ${format(new Date(year, month - 1), 'MMMM yyyy', { locale: fr })} (suite)`, 50, yPos)
           .moveDown(1);
        
        yPos += 40;
      }
    });
    
    // Lignes verticales du tableau
    let x = 50;
    doc.strokeColor('#cccccc')
       .lineWidth(0.5);
    
    // Ligne gauche
    doc.moveTo(x, tableTop)
       .lineTo(x, yPos)
       .stroke();
    
    columns.forEach(column => {
      x += column.width;
      doc.moveTo(x, tableTop)
         .lineTo(x, yPos)
         .stroke();
    });
    
    doc.moveDown(2);
  }
  
  /**
   * Ajoute une section pour la signature
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} planning - Objet planning
   */
  addSignatureSection(doc, planning) {
    // Assurer qu'on est sur une nouvelle page ou qu'il y a assez d'espace
    if (doc.y > doc.page.height - 200) {
      doc.addPage();
    }
    
    doc.moveDown(2)
       .fontSize(12)
       .fillColor('#333333')
       .text('Validation du planning', { underline: true })
       .moveDown(1);
    
    // Informations sur le planning
    doc.fontSize(10)
       .text(`Ce planning a été généré le ${format(new Date(), 'dd/MM/yyyy')} et couvre la période du 1er au ${format(endOfMonth(new Date(planning.year, planning.month - 1)), 'dd')} ${format(new Date(planning.year, planning.month - 1), 'MMMM yyyy', { locale: fr })}.`)
       .moveDown(1);
    
    // Légende
    doc.fontSize(10)
       .text('Légende:', { underline: true })
       .moveDown(0.5)
       .text('Matin: 7h-15h')
       .text('Après-midi: 15h-23h')
       .text('Nuit: 23h-7h')
       .moveDown(1);
    
    // Zone de signature
    doc.fontSize(10)
       .text('Signature de l\'employé:')
       .moveDown(1);
    
    // Rectangle pour la signature
    doc.rect(50, doc.y, 200, 60)
       .stroke()
       .moveDown(4);
    
    // Texte "Lu et approuvé"
    doc.fontSize(10)
       .text('Date et mention "Lu et approuvé":')
       .moveDown(1);
    
    // Rectangle pour le texte
    doc.rect(50, doc.y, 200, 30)
       .stroke();
    
    // Si le planning est déjà signé, ajouter un tampon de signature
    if (planning.status === 'signed' && planning.signedAt) {
      doc.save()
         .translate(400, doc.y - 50)
         .rotate(-15)
         .fontSize(24)
         .fillColor('rgba(0, 128, 0, 0.5)')
         .text('SIGNÉ', 0, 0, { align: 'center' })
         .restore();
      
      doc.moveDown(2)
         .fontSize(10)
         .fillColor('#006400')
         .text(`Signé électroniquement le ${format(new Date(planning.signedAt), 'dd/MM/yyyy à HH:mm')}`);
      
      if (planning.signatureId) {
        doc.text(`ID de signature: ${planning.signatureId}`);
      }
    }
  }
  
  /**
   * Ajoute un pied de page au document
   * @param {PDFDocument} doc - Document PDF
   */
  addFooter(doc) {
    const pages = doc.bufferedPageRange();
    
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Position en bas de page
      const footerY = doc.page.height - 50;
      
      // Ligne de séparation
      doc.strokeColor('#cccccc')
         .lineWidth(1)
         .moveTo(50, footerY)
         .lineTo(doc.page.width - 50, footerY)
         .stroke();
      
      // Texte du pied de page
      doc.fontSize(8)
         .fillColor('#666666')
         .text(
           'EHPAD Belleviste - Document généré par EHPAD Connect',
           50,
           footerY + 10,
           { align: 'center', width: doc.page.width - 100 }
         )
         .text(
           `Page ${i + 1} sur ${pages.count}`,
           50,
           footerY + 20,
           { align: 'center', width: doc.page.width - 100 }
         );
    }
  }
  
  /**
   * Traduit le type de service en français
   * @param {String} shiftType - Type de service
   * @returns {String} Type traduit
   */
  translateShiftType(shiftType) {
    switch (shiftType) {
      case 'morning': return 'Matin';
      case 'afternoon': return 'Après-midi';
      case 'night': return 'Nuit';
      case 'rest': return 'Repos';
      default: return shiftType;
    }
  }
  
  /**
   * Traduit le statut en français
   * @param {String} status - Statut
   * @returns {String} Statut traduit
   */
  translateStatus(status) {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'modified': return 'Modifié';
      default: return status;
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