const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

/**
 * Service de génération de PDF pour les plans de table
 * Génère des PDF au format A3 paysage avec la charte graphique de l'EHPAD
 */

// Charte graphique EHPAD Belle Viste
const COLORS = {
  VERT_SAUGE: '#8B9D83',    // En-têtes
  VERT_SAPIN: '#2E5339',    // Titres
  VERT_MENTHE: '#C8E6C9',   // Zones de mise en évidence
  ROUGE: '#FF6B6B',         // Texture modifiée
  ORANGE: '#FFA726',        // Diabétique
  BLEU: '#64B5F6',          // Sans sel
  BLANC: '#FFFFFF',
  GRIS_CLAIR: '#F5F5F5',
  NOIR: '#000000'
};

// Format A3 paysage (en points: 1 inch = 72 points)
const PAGE_SIZE = {
  width: 1190.55,   // 420mm en points
  height: 841.89    // 297mm en points
};

const MARGINS = {
  top: 50,
  bottom: 50,
  left: 50,
  right: 50
};

class SeatingPlanPdfService {

  /**
   * Génère un PDF pour un plan de table
   * @param {Object} seatingPlan - Plan de table
   * @param {Array} tables - Liste des tables avec résidents
   * @param {Array} residents - Liste complète des résidents
   * @returns {Promise<string>} - Chemin du fichier PDF généré
   */
  async generateSeatingPlanPDF(seatingPlan, tables, residents) {
    return new Promise(async (resolve, reject) => {
      try {
        // Créer le dossier temp s'il n'existe pas
        const tempDir = path.join(__dirname, '../../uploads/temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Nom du fichier
        const fileName = `plan-de-table-${seatingPlan.id}-${Date.now()}.pdf`;
        const filePath = path.join(tempDir, fileName);

        // Créer le document PDF
        const doc = new PDFDocument({
          size: [PAGE_SIZE.width, PAGE_SIZE.height],
          margins: MARGINS,
          info: {
            Title: `Plan de Table - ${seatingPlan.name}`,
            Author: 'EHPAD Belle Viste',
            Subject: 'Plan de table de la salle de restauration',
            Keywords: 'plan de table, EHPAD, restauration'
          }
        });

        // Pipe vers le fichier
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Générer le contenu du PDF
        await this.generateHeader(doc, seatingPlan);
        await this.generateLegend(doc);
        await this.generateTablesLayout(doc, tables, residents);

        if (seatingPlan.temporaryInstructions) {
          await this.generateInstructions(doc, seatingPlan.temporaryInstructions);
        }

        await this.generateFooter(doc, seatingPlan);

        // Finaliser le PDF
        doc.end();

        // Attendre la fin de l'écriture
        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', (err) => {
          reject(err);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Génère l'en-tête du PDF
   */
  async generateHeader(doc, seatingPlan) {
    const y = MARGINS.top;

    // Rectangle d'en-tête
    doc.rect(MARGINS.left, y, PAGE_SIZE.width - MARGINS.left - MARGINS.right, 80)
       .fill(COLORS.VERT_SAUGE);

    // Titre principal
    doc.fillColor(COLORS.BLANC)
       .font('Helvetica-Bold')
       .fontSize(28)
       .text('EHPAD BELLE VISTE', MARGINS.left + 20, y + 15, {
         width: PAGE_SIZE.width - MARGINS.left - MARGINS.right - 40,
         align: 'center'
       });

    // Sous-titre
    doc.fontSize(20)
       .text('Plan de Table - Salle de Restauration', MARGINS.left + 20, y + 50, {
         width: PAGE_SIZE.width - MARGINS.left - MARGINS.right - 40,
         align: 'center'
       });

    // Informations du plan
    doc.fillColor(COLORS.NOIR)
       .font('Helvetica')
       .fontSize(12);

    const infoY = y + 100;

    doc.fillColor(COLORS.VERT_SAPIN)
       .font('Helvetica-Bold')
       .fontSize(16)
       .text(seatingPlan.name, MARGINS.left, infoY);

    doc.fillColor(COLORS.NOIR)
       .font('Helvetica')
       .fontSize(11)
       .text(`Date d'application: ${this.formatDate(seatingPlan.effectiveDate)}`, MARGINS.left, infoY + 25);

    doc.text(`Dernière mise à jour: ${this.formatDate(new Date())}`, MARGINS.left, infoY + 42);

    return infoY + 60;
  }

  /**
   * Génère la légende des codes couleurs et pictogrammes
   */
  async generateLegend(doc) {
    const startY = 200;
    const legendX = PAGE_SIZE.width - MARGINS.right - 280;

    // Titre de la légende
    doc.fillColor(COLORS.VERT_SAPIN)
       .font('Helvetica-Bold')
       .fontSize(14)
       .text('LÉGENDE', legendX, startY);

    // Régimes alimentaires
    doc.fillColor(COLORS.NOIR)
       .font('Helvetica-Bold')
       .fontSize(11)
       .text('Régimes alimentaires:', legendX, startY + 25);

    const dietItems = [
      { color: COLORS.VERT_MENTHE, label: 'Normal' },
      { color: COLORS.ROUGE, label: 'Texture modifiée/mixée' },
      { color: COLORS.ORANGE, label: 'Diabétique' },
      { color: COLORS.BLEU, label: 'Sans sel' }
    ];

    let y = startY + 45;
    dietItems.forEach(item => {
      doc.rect(legendX, y, 20, 15)
         .fill(item.color);

      doc.fillColor(COLORS.NOIR)
         .font('Helvetica')
         .fontSize(10)
         .text(item.label, legendX + 25, y + 2);

      y += 20;
    });

    // Pictogrammes
    y += 10;
    doc.fillColor(COLORS.NOIR)
       .font('Helvetica-Bold')
       .fontSize(11)
       .text('Précautions:', legendX, y);

    const precautions = [
      { icon: '⚠️', label: 'Risque de fausse route' },
      { icon: '💊', label: 'Administration médicamenteuse' },
      { icon: '🥤', label: 'Hydratation renforcée' },
      { icon: '🚫', label: 'Allergies alimentaires' }
    ];

    y += 20;
    precautions.forEach(item => {
      doc.fontSize(12)
         .text(item.icon, legendX, y);

      doc.font('Helvetica')
         .fontSize(10)
         .text(item.label, legendX + 25, y + 2);

      y += 20;
    });
  }

  /**
   * Génère le layout des tables avec les résidents
   */
  async generateTablesLayout(doc, tables, residents) {
    const startY = 250;
    const startX = MARGINS.left;
    const tableWidth = 350;
    const tableHeight = 200;
    const gap = 30;
    const tablesPerRow = 3;

    let currentX = startX;
    let currentY = startY;
    let tableCount = 0;

    // Créer un map des résidents pour un accès rapide
    const residentMap = {};
    residents.forEach(r => {
      residentMap[r.id] = r;
    });

    for (const table of tables) {
      // Vérifier si on doit passer à la ligne suivante
      if (tableCount > 0 && tableCount % tablesPerRow === 0) {
        currentX = startX;
        currentY += tableHeight + gap;

        // Vérifier si on doit ajouter une nouvelle page
        if (currentY + tableHeight > PAGE_SIZE.height - MARGINS.bottom - 50) {
          doc.addPage({
            size: [PAGE_SIZE.width, PAGE_SIZE.height],
            margins: MARGINS
          });
          currentY = MARGINS.top;
        }
      }

      await this.drawTable(doc, table, residentMap, currentX, currentY, tableWidth, tableHeight);

      currentX += tableWidth + gap;
      tableCount++;
    }
  }

  /**
   * Dessine une table avec ses résidents
   */
  async drawTable(doc, table, residentMap, x, y, width, height) {
    // Cadre de la table
    doc.rect(x, y, width, height)
       .stroke(COLORS.VERT_SAPIN);

    // En-tête de la table
    doc.rect(x, y, width, 35)
       .fill(COLORS.VERT_SAPIN);

    doc.fillColor(COLORS.BLANC)
       .font('Helvetica-Bold')
       .fontSize(16)
       .text(`TABLE ${table.number}`, x, y + 10, {
         width: width,
         align: 'center'
       });

    // Liste des résidents
    let residentY = y + 45;
    const residents = table.residents || [];

    if (residents.length === 0) {
      doc.fillColor(COLORS.NOIR)
         .font('Helvetica-Oblique')
         .fontSize(11)
         .text('Table libre', x + 10, residentY);
    } else {
      residents.forEach((residentData, index) => {
        const resident = residentMap[residentData.residentId];

        if (resident) {
          this.drawResident(doc, resident, x + 10, residentY, width - 20);
          residentY += 35;
        }
      });
    }

    // Invités s'il y en a
    if (table.guests && table.guests.length > 0) {
      residentY += 5;
      doc.fillColor(COLORS.VERT_SAPIN)
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('Invités:', x + 10, residentY);

      residentY += 15;
      table.guests.forEach(guest => {
        doc.fillColor(COLORS.NOIR)
           .font('Helvetica')
           .fontSize(10)
           .text(`👤 ${guest.name}`, x + 10, residentY);
        residentY += 15;
      });
    }
  }

  /**
   * Dessine les informations d'un résident
   */
  drawResident(doc, resident, x, y, maxWidth) {
    // Couleur de fond selon le régime
    const bgColor = this.getDietColor(resident.dietType);

    doc.rect(x, y, maxWidth, 30)
       .fill(bgColor);

    // Nom et prénom (nom en majuscules)
    doc.fillColor(COLORS.NOIR)
       .font('Helvetica-Bold')
       .fontSize(14)
       .text(`${resident.lastName.toUpperCase()} ${resident.firstName}`, x + 5, y + 5, {
         width: maxWidth - 80,
         ellipsis: true
       });

    // Numéro de chambre
    doc.font('Helvetica')
       .fontSize(11)
       .text(`Ch. ${resident.roomNumber}`, x + 5, y + 20);

    // Pictogrammes de précaution
    let iconX = x + maxWidth - 75;
    const iconY = y + 7;

    if (resident.chokingRisk) {
      doc.fontSize(12).text('⚠️', iconX, iconY);
      iconX += 18;
    }

    if (resident.medicationAdministration) {
      doc.fontSize(12).text('💊', iconX, iconY);
      iconX += 18;
    }

    if (resident.enhancedHydration) {
      doc.fontSize(12).text('🥤', iconX, iconY);
      iconX += 18;
    }

    if (resident.foodAllergies) {
      doc.fontSize(12).text('🚫', iconX, iconY);
    }
  }

  /**
   * Génère la section des consignes temporaires
   */
  async generateInstructions(doc, instructions) {
    const y = PAGE_SIZE.height - MARGINS.bottom - 100;

    doc.rect(MARGINS.left, y, PAGE_SIZE.width - MARGINS.left - MARGINS.right, 60)
       .fill(COLORS.GRIS_CLAIR);

    doc.fillColor(COLORS.VERT_SAPIN)
       .font('Helvetica-Bold')
       .fontSize(12)
       .text('CONSIGNES TEMPORAIRES:', MARGINS.left + 10, y + 10);

    doc.fillColor(COLORS.NOIR)
       .font('Helvetica')
       .fontSize(10)
       .text(instructions, MARGINS.left + 10, y + 28, {
         width: PAGE_SIZE.width - MARGINS.left - MARGINS.right - 20,
         align: 'left'
       });
  }

  /**
   * Génère le pied de page avec QR code
   */
  async generateFooter(doc, seatingPlan) {
    const y = PAGE_SIZE.height - MARGINS.bottom - 30;

    // Ligne de séparation
    doc.moveTo(MARGINS.left, y)
       .lineTo(PAGE_SIZE.width - MARGINS.right, y)
       .stroke(COLORS.VERT_SAUGE);

    // Texte de pied de page
    doc.fillColor(COLORS.NOIR)
       .font('Helvetica')
       .fontSize(9)
       .text(
         'Document généré automatiquement - EHPAD Belle Viste - 70 lits',
         MARGINS.left,
         y + 10,
         {
           width: PAGE_SIZE.width - MARGINS.left - MARGINS.right - 100,
           align: 'left'
         }
       );

    // QR Code (si URL disponible)
    if (process.env.APP_URL) {
      try {
        const qrCodeUrl = `${process.env.APP_URL}/seating-plans/${seatingPlan.id}`;
        const qrCodeData = await QRCode.toDataURL(qrCodeUrl, {
          width: 60,
          margin: 1
        });

        doc.image(qrCodeData, PAGE_SIZE.width - MARGINS.right - 70, y - 60, {
          width: 60,
          height: 60
        });
      } catch (error) {
        console.error('Erreur génération QR code:', error);
      }
    }
  }

  /**
   * Retourne la couleur selon le type de régime
   */
  getDietColor(dietType) {
    const colors = {
      normal: COLORS.VERT_MENTHE,
      modified: COLORS.ROUGE,
      diabetic: COLORS.ORANGE,
      low_sodium: COLORS.BLEU
    };
    return colors[dietType] || COLORS.VERT_MENTHE;
  }

  /**
   * Formate une date en français
   */
  formatDate(date) {
    const d = new Date(date);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('fr-FR', options);
  }

  /**
   * Supprime un fichier temporaire
   */
  deleteTempFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      return false;
    }
  }

  /**
   * Obtient la taille d'un fichier
   */
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      console.error('Erreur lors de la lecture de la taille du fichier:', error);
      return 0;
    }
  }
}

module.exports = new SeatingPlanPdfService();
