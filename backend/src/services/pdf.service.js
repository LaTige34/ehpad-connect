const fs = require('fs').promises;
const path = require('path');
const { createReport } = require('docx-templates');
const logger = require('../utils/logger');
const fileService = require('./file.service');

/**
 * Service de génération de documents PDF
 */
class PDFService {
  constructor() {
    this.templatesDir = process.env.PDF_TEMPLATES_DIR || path.join(__dirname, '../../templates');
    
    // Initialiser le dossier de templates si nécessaire
    this.initializeTemplatesDir();
  }
  
  /**
   * Crée le dossier de templates s'il n'existe pas
   */
  async initializeTemplatesDir() {
    try {
      await fs.access(this.templatesDir);
    } catch (error) {
      await fs.mkdir(this.templatesDir, { recursive: true });
      logger.info(`Dossier de templates créé: ${this.templatesDir}`);
      
      // Créer des templates par défaut si nécessaire
      await this.createDefaultTemplates();
    }
  }
  
  /**
   * Crée des templates par défaut
   */
  async createDefaultTemplates() {
    // Le template par défaut pour les plannings sera créé quand nécessaire
    logger.info('Templates par défaut initialisés');
  }
  
  /**
   * Génère un PDF de planning mensuel
   * @param {Object} planning - Objet planning avec ses services
   * @returns {Promise<String>} Chemin du fichier PDF généré
   */
  async generatePlanningPDF(planning) {
    try {
      // Vérifier que le planning contient les données nécessaires
      if (!planning || !planning.Shifts) {
        throw new Error('Planning invalide ou incomplet');
      }
      
      // Préparer les données pour le template
      const data = {
        title: `Planning ${planning.month}/${planning.year}`,
        employeeName: planning.employee?.name || 'Employé',
        month: planning.month,
        year: planning.year,
        shifts: planning.Shifts.map(shift => ({
          date: new Date(shift.date).toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          day: new Date(shift.date).getDate(),
          weekday: new Date(shift.date).toLocaleDateString('fr-FR', { weekday: 'long' }),
          startTime: shift.startTime,
          endTime: shift.endTime,
          type: this.getShiftTypeName(shift.shiftType),
          service: shift.service || '',
          location: shift.location || '',
          status: this.getStatusName(shift.status)
        })),
        generatedAt: new Date().toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      
      // Créer le tableau des jours du mois
      const daysInMonth = new Date(planning.year, planning.month, 0).getDate();
      data.days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      
      // Créer un tableau organisé par semaine pour l'affichage calendrier
      data.calendar = this.organizeCalendarByWeek(planning.year, planning.month, planning.Shifts);
      
      // Chemin du template
      const templatePath = path.join(this.templatesDir, 'planning_template.docx');
      
      // Vérifier si le template existe, sinon utiliser le template par défaut
      try {
        await fs.access(templatePath);
      } catch (error) {
        // Créer le template par défaut
        await this.createDefaultPlanningTemplate();
      }
      
      // Générer le rapport DOCX
      const buffer = await createReport({
        template: templatePath,
        data
      });
      
      // Créer un fichier temporaire
      const docxPath = await fileService.createTempFile(buffer, '.docx');
      
      // Convertir DOCX en PDF
      // Note: Dans une vraie implémentation, nous utiliserions une librairie comme
      // libreoffice-convert, unoconv, docx-pdf ou un service comme Gotenberg
      // Pour l'exemple, on va simplement renommer le fichier
      const pdfPath = docxPath.replace('.docx', '.pdf');
      await fs.rename(docxPath, pdfPath);
      
      logger.info(`PDF de planning généré: ${pdfPath}`);
      return pdfPath;
    } catch (error) {
      logger.error(`Erreur lors de la génération du PDF de planning: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Crée un template de planning par défaut
   */
  async createDefaultPlanningTemplate() {
    try {
      // Dans une vraie implémentation, nous créerions un fichier DOCX avec
      // les balises de template appropriées (docx-templates)
      
      // Pour l'exemple, on copie un template par défaut s'il existe
      const defaultTemplatePath = path.join(__dirname, '../templates/default_planning_template.docx');
      const targetPath = path.join(this.templatesDir, 'planning_template.docx');
      
      try {
        await fs.access(defaultTemplatePath);
        await fs.copyFile(defaultTemplatePath, targetPath);
        logger.info(`Template de planning par défaut copié vers: ${targetPath}`);
      } catch (error) {
        // Créer un template minimal
        const content = Buffer.from(
          'PK\u0003\u0004\u0014\u0000\u0000\u0000\b\u0000�+�V���\u0018X\u0000\u0000\u0012\u0000\u0000\u0013\u0000\u0000\u0000[Content_Types].xml���N�0E�|E�-J��@5��*Q>�ؓ�=�䔼#!�\u0015�ѼB�3�0�kֲK��|�*-�l���{���z�Em\u000e\u001e�.�˹H��*k��\u0016���QFֹ��8N�J�t��Qg�\u0017@\u0018�\u0018ަm�^|Q�2\u0012�y\u0014�*x���n��!���\u0014�c�\u000f�\u000f�y*%쐳,\n?�_:VFJ����U�|��@�(�)��\u0017�Q>������{��;�*�̠�4`�˙�]\u0000�z\u0012�-���S\u0018���U<�~���\u0000�X�\u0004���\u0000����\u0000-��PK\u0001\u0002\u0014\u0000\u0014\u0000\u0000\u0000\b\u0000�+�V���\u0018X\u0000\u0000\u0012\u0000\u0000\u0013\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000 \u0000��\u0000\u0000\u0000\u0000[Content_Types].xmlPK\u0005\u0006\u0000\u0000\u0000\u0000\u0001\u0000\u0001\u00003\u0000\u0000\u0000[\u0000\u0000\u0000\u0000\u0000',
          'binary'
        );
        await fs.writeFile(targetPath, content);
        logger.info(`Template de planning minimal créé: ${targetPath}`);
      }
    } catch (error) {
      logger.error(`Erreur lors de la création du template de planning par défaut: ${error.message}`);
      throw error;
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
   * Organise les services par semaine pour l'affichage calendrier
   */
  organizeCalendarByWeek(year, month, shifts) {
    // Obtenir le premier jour du mois
    const firstDay = new Date(year, month - 1, 1);
    // Jour de la semaine (0-6, 0 = Dimanche)
    let firstDayOfWeek = firstDay.getDay();
    // En France, la semaine commence le lundi (1)
    if (firstDayOfWeek === 0) firstDayOfWeek = 7;
    
    // Nombre de jours dans le mois
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Créer un mapping des services par date
    const shiftsByDate = {};
    shifts.forEach(shift => {
      const day = new Date(shift.date).getDate();
      shiftsByDate[day] = shift;
    });
    
    // Organiser les jours en semaines
    const calendar = [];
    let week = [];
    
    // Ajouter les jours vides au début
    for (let i = 1; i < firstDayOfWeek; i++) {
      week.push(null);
    }
    
    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const shift = shiftsByDate[day] || {
        date: new Date(year, month - 1, day).toISOString().split('T')[0],
        shiftType: 'rest',
        status: 'confirmed'
      };
      
      week.push({
        day,
        shift: {
          ...shift,
          typeName: this.getShiftTypeName(shift.shiftType),
          statusName: this.getStatusName(shift.status)
        }
      });
      
      // Si c'est la fin de la semaine ou le dernier jour du mois, ajouter la semaine au calendrier
      if (week.length === 7 || day === daysInMonth) {
        // Remplir la dernière semaine avec des jours vides si nécessaire
        while (week.length < 7) {
          week.push(null);
        }
        
        calendar.push(week);
        week = [];
      }
    }
    
    return calendar;
  }
  
  /**
   * Obtient le nom lisible du type de service
   * @param {String} shiftType - Type de service (morning, afternoon, night, rest)
   * @returns {String} Nom lisible
   */
  getShiftTypeName(shiftType) {
    switch (shiftType) {
      case 'morning':
        return 'Matin';
      case 'afternoon':
        return 'Après-midi';
      case 'night':
        return 'Nuit';
      case 'rest':
        return 'Repos';
      default:
        return shiftType;
    }
  }
  
  /**
   * Obtient le nom lisible du statut
   * @param {String} status - Statut (draft, confirmed, pending, modified)
   * @returns {String} Nom lisible
   */
  getStatusName(status) {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'modified':
        return 'Modifié';
      default:
        return status;
    }
  }
}

module.exports = new PDFService();