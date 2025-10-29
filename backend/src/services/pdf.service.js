const fs = require('fs').promises;
const path = require('path');
const { format } = require('date-fns');
const { fr } = require('date-fns/locale');
const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');

/**
 * Service de génération de documents PDF
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
      await fs.access(this.tempDir);
    } catch (error) {
      // Créer le dossier s'il n'existe pas
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(`Dossier temporaire créé: ${this.tempDir}`);
    }
  }
  
  /**
   * Génère un PDF du planning mensuel
   * @param {Object} planning - Données du planning avec les services
   * @returns {Promise<String>} Chemin du fichier PDF généré
   */
  async generatePlanningPDF(planning) {
    return new Promise(async (resolve, reject) => {
      try {
        // Créer un fichier temporaire pour le PDF
        const outputPath = path.join(this.tempDir, `planning_${planning.id}_${Date.now()}.pdf`);
        
        // Création du document PDF
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Planning ${planning.month}/${planning.year}`,
            Author: 'EHPAD Connect',
            Subject: 'Planning mensuel',
            Keywords: 'planning, ehpad, octime',
            Creator: 'EHPAD Connect'
          }
        });
        
        // Flux de sortie vers le fichier
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);
        
        // En-tête du document
        await this.addHeader(doc, planning);
        
        // Contenu du planning
        await this.addPlanningContent(doc, planning);
        
        // Pied de page avec informations légales
        await this.addFooter(doc, planning);
        
        // Finaliser le document
        doc.end();
        
        // Attendre que le flux soit fermé
        stream.on('finish', () => {
          logger.info(`PDF du planning généré: ${outputPath}`);
          resolve(outputPath);
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
   * Ajoute l'en-tête au document PDF
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} planning - Données du planning
   */
  async addHeader(doc, planning) {
    // Logo et titre
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('EHPAD Belleviste', { align: 'center' })
       .moveDown(0.5);
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text(`Planning Mensuel - ${this.getMonthName(planning.month)} ${planning.year}`, { align: 'center' })
       .moveDown(0.5);
    
    // Informations employé
    if (planning.employee) {
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Employé: ${planning.employee.name}`, { align: 'left' })
         .text(`ID: ${planning.employee.id}`, { align: 'left' })
         .moveDown(1);
    }
    
    // Date de génération
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Généré le: ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, { align: 'right' })
       .moveDown(2);
  }
  
  /**
   * Ajoute le contenu du planning au document PDF
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} planning - Données du planning avec les services
   */
  async addPlanningContent(doc, planning) {
    // Si le planning n'a pas de services, afficher un message
    if (!planning.Shifts || planning.Shifts.length === 0) {
      doc.fontSize(12)
         .font('Helvetica-Italic')
         .text('Aucun service programmé pour ce mois.', { align: 'center' })
         .moveDown(1);
      return;
    }
    
    // Trier les services par date
    const shifts = [...planning.Shifts].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Propriétés de la table
    const tableTop = doc.y;
    const tableLeft = 50;
    const columnWidths = [100, 120, 120, 150];
    const rowHeight = 30;
    
    // En-têtes de colonne
    doc.fontSize(12)
       .font('Helvetica-Bold');
    
    doc.text('Date', tableLeft, tableTop);
    doc.text('Horaires', tableLeft + columnWidths[0], tableTop);
    doc.text('Service', tableLeft + columnWidths[0] + columnWidths[1], tableTop);
    doc.text('Statut', tableLeft + columnWidths[0] + columnWidths[1] + columnWidths[2], tableTop);
    
    // Ligne de séparation après les en-têtes
    doc.moveTo(tableLeft, tableTop + 20)
       .lineTo(tableLeft + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], tableTop + 20)
       .stroke();
    
    // Contenu des lignes
    doc.font('Helvetica');
    let currentY = tableTop + 30;
    
    for (const shift of shifts) {
      // Date au format jour/mois
      const shiftDate = new Date(shift.date);
      const formattedDate = `${format(shiftDate, 'EEEE dd/MM', { locale: fr })}`;
      
      // Afficher les informations du service
      doc.text(formattedDate, tableLeft, currentY);
      
      if (shift.shiftType === 'rest') {
        doc.text('Repos', tableLeft + columnWidths[0], currentY);
        doc.text('', tableLeft + columnWidths[0] + columnWidths[1], currentY);
      } else {
        const hours = shift.startTime && shift.endTime ? 
          `${shift.startTime.substring(0, 5)} - ${shift.endTime.substring(0, 5)}` : 
          '';
        
        doc.text(hours, tableLeft + columnWidths[0], currentY);
        doc.text(shift.service || '', tableLeft + columnWidths[0] + columnWidths[1], currentY);
      }
      
      // Statut coloré
      const status = this.getStatusText(shift.status);
      doc.text(status, tableLeft + columnWidths[0] + columnWidths[1] + columnWidths[2], currentY);
      
      // Lignes de séparation entre les services
      currentY += rowHeight;
      doc.moveTo(tableLeft, currentY - 10)
         .lineTo(tableLeft + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], currentY - 10)
         .stroke('#DDDDDD');
      
      // Vérifier si nous devons passer à une nouvelle page
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }
    }
    
    // Résumé mensuel
    doc.moveDown(2);
    
    // Calculer des statistiques
    const workShifts = shifts.filter(s => s.shiftType !== 'rest');
    const morningShifts = shifts.filter(s => s.shiftType === 'morning');
    const afternoonShifts = shifts.filter(s => s.shiftType === 'afternoon');
    const nightShifts = shifts.filter(s => s.shiftType === 'night');
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Résumé du mois', { align: 'left' })
       .moveDown(0.5);
    
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Nombre total de jours travaillés: ${workShifts.length}`, { align: 'left' })
       .text(`Services du matin: ${morningShifts.length}`, { align: 'left' })
       .text(`Services de l'après-midi: ${afternoonShifts.length}`, { align: 'left' })
       .text(`Services de nuit: ${nightShifts.length}`, { align: 'left' })
       .moveDown(1);
  }
  
  /**
   * Ajoute le pied de page au document PDF
   * @param {PDFDocument} doc - Document PDF
   * @param {Object} planning - Données du planning
   */
  async addFooter(doc, planning) {
    // Ajouter une signature si le planning est signé
    if (planning.status === 'signed' && planning.signedAt) {
      doc.moveDown(2);
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Signature électronique', { align: 'left' })
         .moveDown(0.5);
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Document signé électroniquement le ${format(new Date(planning.signedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, { align: 'left' })
         .text(`ID de signature: ${planning.signatureId || 'Non disponible'}`, { align: 'left' })
         .moveDown(2);
    }
    
    // Ajouter un espace pour signature manuelle si non signé
    if (planning.status !== 'signed') {
      doc.moveDown(2);
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Signature de l\'employé:', { align: 'left' })
         .moveDown(3);
      
      doc.fontSize(10)
         .font('Helvetica')
         .text('Date: ________________        Signature: ________________', { align: 'left' })
         .moveDown(2);
    }
    
    // Informations légales en bas de page
    const currentPage = doc.page.number;
    
    doc.fontSize(8)
       .font('Helvetica')
       .text(
         'Ce document est généré automatiquement par EHPAD Connect. ' +
         'Pour toute question concernant ce planning, veuillez contacter le service RH.',
         50,
         doc.page.height - 50,
         { align: 'center', width: doc.page.width - 100 }
       );
       
    // Numéro de page
    doc.text(
      `Page ${currentPage}`,
      50,
      doc.page.height - 30,
      { align: 'center', width: doc.page.width - 100 }
    );
  }
  
  /**
   * Génère un PDF de la fiche de surveillance de température
   * @param {Object} data - Données de la fiche (refrigeratorId, year, month, stats, logs)
   * @returns {Promise<String>} Chemin du fichier PDF généré
   */
  async generateTemperaturePDF(data) {
    return new Promise(async (resolve, reject) => {
      try {
        const { refrigeratorId, year, month, stats, logs } = data;

        // Créer un fichier temporaire pour le PDF
        const outputPath = path.join(this.tempDir, `temperature_${refrigeratorId}_${year}_${month}_${Date.now()}.pdf`);

        // Création du document PDF
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Fiche de surveillance de température - ${month}/${year}`,
            Author: 'EHPAD Connect',
            Subject: 'Surveillance température produits thermosensibles',
            Keywords: 'température, surveillance, HAS, réfrigérateur, traçabilité',
            Creator: 'EHPAD Connect'
          }
        });

        // Flux de sortie vers le fichier
        const stream = require('fs').createWriteStream(outputPath);
        doc.pipe(stream);

        // En-tête du document
        await this.addTemperatureHeader(doc, { refrigeratorId, year, month, stats });

        // Contenu de la fiche
        await this.addTemperatureContent(doc, logs);

        // Pied de page
        await this.addTemperatureFooter(doc, stats);

        // Finaliser le document
        doc.end();

        // Attendre que le flux soit fermé
        stream.on('finish', () => {
          logger.info(`PDF de la fiche de température généré: ${outputPath}`);
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          logger.error(`Erreur lors de la génération du PDF de température: ${error.message}`);
          reject(error);
        });
      } catch (error) {
        logger.error(`Erreur lors de la génération du PDF de température: ${error.message}`);
        reject(error);
      }
    });
  }

  /**
   * Ajoute l'en-tête au document PDF de température
   */
  async addTemperatureHeader(doc, data) {
    const { refrigeratorId, year, month, stats } = data;

    // Titre principal
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text('FICHE DE SURVEILLANCE DE TEMPÉRATURE', { align: 'center' })
       .moveDown(0.3);

    doc.fontSize(12)
       .font('Helvetica')
       .text('Produits thermosensibles - Référentiel HAS', { align: 'center' })
       .moveDown(1);

    // Informations du réfrigérateur
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Informations du réfrigérateur', { align: 'left' })
       .moveDown(0.5);

    doc.fontSize(11)
       .font('Helvetica')
       .text(`Identifiant: ${refrigeratorId}`, { align: 'left' })
       .text(`Période: ${this.getMonthName(month)} ${year}`, { align: 'left' })
       .text(`Norme HAS: +2°C à +8°C`, { align: 'left' })
       .moveDown(0.5);

    // Statistiques du mois
    if (stats) {
      doc.fontSize(11)
         .font('Helvetica')
         .text(`Relevés effectués: ${stats.totalLogs}`, { align: 'left' })
         .text(`Température moyenne: ${stats.avgTemperature}°C`, { align: 'left' })
         .text(`Température min: ${stats.minTemperature}°C  |  Température max: ${stats.maxTemperature}°C`, { align: 'left' })
         .text(`Taux de conformité: ${stats.conformityRate}%`, { align: 'left' });

      // Alertes
      if (stats.criticalLogs > 0 || stats.warningLogs > 0) {
        doc.fillColor('red')
           .text(`⚠️ Anomalies: ${stats.criticalLogs} critiques, ${stats.warningLogs} avertissements`, { align: 'left' })
           .fillColor('black');
      }
    }

    doc.moveDown(1);

    // Date de génération
    doc.fontSize(9)
       .font('Helvetica-Italic')
       .text(`Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, { align: 'right' })
       .moveDown(1);

    // Ligne de séparation
    doc.moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();

    doc.moveDown(1);
  }

  /**
   * Ajoute le contenu de la fiche de température
   */
  async addTemperatureContent(doc, logs) {
    if (!logs || logs.length === 0) {
      doc.fontSize(12)
         .font('Helvetica-Italic')
         .text('Aucun relevé de température pour cette période.', { align: 'center' })
         .moveDown(1);
      return;
    }

    // Titre du tableau
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .text('Relevés de température', { align: 'left' })
       .moveDown(0.5);

    // Trier les relevés par date
    const sortedLogs = [...logs].sort((a, b) => {
      const dateA = new Date(a.measurementDate + ' ' + a.measurementTime);
      const dateB = new Date(b.measurementDate + ' ' + b.measurementTime);
      return dateA - dateB;
    });

    // Propriétés de la table
    const tableTop = doc.y;
    const tableLeft = 50;
    const columnWidths = [70, 50, 70, 80, 70, 150];
    const rowHeight = 25;

    // En-têtes de colonne
    doc.fontSize(9)
       .font('Helvetica-Bold');

    let xPos = tableLeft;
    doc.text('Date', xPos, tableTop);
    xPos += columnWidths[0];
    doc.text('Heure', xPos, tableTop);
    xPos += columnWidths[1];
    doc.text('Période', xPos, tableTop);
    xPos += columnWidths[2];
    doc.text('Temp. (°C)', xPos, tableTop);
    xPos += columnWidths[3];
    doc.text('Conformité', xPos, tableTop);
    xPos += columnWidths[4];
    doc.text('Agent / Observations', xPos, tableTop);

    // Ligne de séparation après les en-têtes
    doc.moveTo(tableLeft, tableTop + 15)
       .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), tableTop + 15)
       .stroke();

    // Contenu des lignes
    doc.font('Helvetica');
    let currentY = tableTop + 20;

    for (const log of sortedLogs) {
      // Vérifier si nous devons passer à une nouvelle page
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }

      // Date
      const logDate = new Date(log.measurementDate);
      const formattedDate = format(logDate, 'dd/MM/yyyy', { locale: fr });

      xPos = tableLeft;
      doc.fontSize(9).text(formattedDate, xPos, currentY);

      // Heure
      xPos += columnWidths[0];
      const formattedTime = log.measurementTime.substring(0, 5);
      doc.text(formattedTime, xPos, currentY);

      // Période
      xPos += columnWidths[1];
      doc.text(log.period.charAt(0).toUpperCase() + log.period.slice(1), xPos, currentY);

      // Température
      xPos += columnWidths[2];
      const tempColor = log.alertLevel === 'critical' ? 'red' :
                        log.alertLevel === 'warning' ? 'orange' : 'black';
      doc.fillColor(tempColor)
         .text(`${log.temperature}°C`, xPos, currentY)
         .fillColor('black');

      // Conformité
      xPos += columnWidths[3];
      const conformText = log.isWithinRange ? '✓ Conforme' : '✗ Non conforme';
      doc.fillColor(log.isWithinRange ? 'green' : 'red')
         .text(conformText, xPos, currentY)
         .fillColor('black');

      // Agent et observations
      xPos += columnWidths[4];
      const agentName = log.recordedBy ? log.recordedBy.name : 'N/A';
      let displayText = agentName;

      if (log.observations) {
        displayText += ` - ${log.observations.substring(0, 30)}${log.observations.length > 30 ? '...' : ''}`;
      }

      doc.fontSize(8).text(displayText, xPos, currentY, { width: columnWidths[5] });

      // Ligne de séparation
      currentY += rowHeight;
      doc.moveTo(tableLeft, currentY - 5)
         .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), currentY - 5)
         .stroke('#DDDDDD');
    }

    doc.moveDown(2);
  }

  /**
   * Ajoute le pied de page au document PDF de température
   */
  async addTemperatureFooter(doc, stats) {
    doc.moveDown(1);

    // Recommandations HAS
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('Recommandations HAS', { align: 'left' })
       .moveDown(0.5);

    doc.fontSize(9)
       .font('Helvetica')
       .text('• La température du réfrigérateur doit être maintenue entre +2°C et +8°C', { align: 'left' })
       .text('• Effectuer 2 relevés par jour minimum (matin et soir)', { align: 'left' })
       .text('• En cas de dépassement, contacter immédiatement le responsable', { align: 'left' })
       .text('• Vérifier la fermeture de la porte et l\'état du joint', { align: 'left' })
       .text('• Archiver les fiches mensuelles pendant 3 ans minimum', { align: 'left' })
       .moveDown(1);

    // Signature
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Validation du responsable:', { align: 'left' })
       .moveDown(2);

    doc.fontSize(9)
       .font('Helvetica')
       .text('Nom: _____________________    Date: ______________    Signature: ______________', { align: 'left' })
       .moveDown(2);

    // Informations légales en bas de page
    const currentPage = doc.page.number;

    doc.fontSize(7)
       .font('Helvetica-Italic')
       .text(
         'Document conforme au référentiel HAS - Bonnes pratiques de conservation des produits thermosensibles. ' +
         'Ce document doit être archivé et accessible pour tout contrôle.',
         50,
         doc.page.height - 50,
         { align: 'center', width: doc.page.width - 100 }
       );

    // Numéro de page
    doc.text(
      `Page ${currentPage}`,
      50,
      doc.page.height - 30,
      { align: 'center', width: doc.page.width - 100 }
    );
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
   * Obtient le texte du statut pour affichage
   * @param {String} status - Statut du service
   * @returns {String} Texte du statut
   */
  getStatusText(status) {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'modified': return 'Modifié';
      case 'draft': return 'Brouillon';
      default: return status;
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
      logger.warn(`Impossible de supprimer le fichier temporaire: ${error.message}`);
      return false;
    }
  }
}

module.exports = new PDFService();