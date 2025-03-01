const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const emailService = require('./emailService');

/**
 * Service d'intégration avec Octime Expresso
 * Gère la synchronisation des plannings avec le système Octime
 */
class OctimeService {
  constructor() {
    this.apiUrl = process.env.OCTIME_API_URL || 'https://api.octime.fr/';
    this.apiKey = process.env.OCTIME_API_KEY;
    this.companyId = process.env.OCTIME_COMPANY_ID;
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `ApiKey ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-Company-Id': this.companyId
      },
      timeout: 30000 // 30 secondes de timeout
    });
    
    // Chemin où stocker les plannings téléchargés
    this.planningsDir = path.resolve(__dirname, '../../data/plannings');
    
    // Créer le répertoire s'il n'existe pas
    this.initStorage();
  }

  /**
   * Initialise le stockage des plannings
   */
  async initStorage() {
    try {
      await fs.mkdir(this.planningsDir, { recursive: true });
      logger.info(`Répertoire de stockage des plannings initialisé: ${this.planningsDir}`);
    } catch (error) {
      logger.error(`Erreur lors de l'initialisation du stockage: ${error.message}`);
    }
  }

  /**
   * Récupère les plannings de tous les employés pour une période donnée
   * @param {string} startDate - Date de début au format YYYY-MM-DD
   * @param {string} endDate - Date de fin au format YYYY-MM-DD
   * @returns {Promise<Array>} - Liste des plannings
   */
  async getAllPlannings(startDate, endDate) {
    try {
      logger.info(`Récupération des plannings du ${startDate} au ${endDate}`);
      
      if (process.env.NODE_ENV === 'production') {
        const response = await this.client.get('/v1/schedules', {
          params: {
            start_date: startDate,
            end_date: endDate,
            include_details: 'true'
          }
        });
        
        logger.info(`${response.data.schedules.length} plannings récupérés avec succès`);
        
        return response.data.schedules;
      } else {
        // Simulation de données pour le développement
        logger.info(`[DEV] Simulation de la récupération des plannings du ${startDate} au ${endDate}`);
        
        // Attendre un peu pour simuler le temps de réponse API
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Génération de données simulées
        const mockData = this.generateMockPlannings(startDate, endDate);
        
        logger.info(`[DEV] ${mockData.length} plannings simulés générés`);
        
        return mockData;
      }
    } catch (error) {
      logger.error(`Erreur lors de la récupération des plannings: ${error.message}`);
      throw new Error(`Erreur lors de la récupération des plannings: ${error.message}`);
    }
  }

  /**
   * Récupère le planning d'un employé spécifique
   * @param {string} employeeId - Identifiant de l'employé
   * @param {string} startDate - Date de début au format YYYY-MM-DD
   * @param {string} endDate - Date de fin au format YYYY-MM-DD
   * @returns {Promise<Object>} - Planning de l'employé
   */
  async getEmployeePlanning(employeeId, startDate, endDate) {
    try {
      logger.info(`Récupération du planning de l'employé ${employeeId} du ${startDate} au ${endDate}`);
      
      if (process.env.NODE_ENV === 'production') {
        const response = await this.client.get(`/v1/employees/${employeeId}/schedule`, {
          params: {
            start_date: startDate,
            end_date: endDate,
            include_details: 'true'
          }
        });
        
        logger.info(`Planning de l'employé ${employeeId} récupéré avec succès`);
        
        return response.data;
      } else {
        // Simulation de données pour le développement
        logger.info(`[DEV] Simulation de la récupération du planning de l'employé ${employeeId}`);
        
        // Attendre un peu pour simuler le temps de réponse API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Génération de données simulées pour un employé
        const mockData = this.generateMockPlanningForEmployee(employeeId, startDate, endDate);
        
        return mockData;
      }
    } catch (error) {
      logger.error(`Erreur lors de la récupération du planning de l'employé ${employeeId}: ${error.message}`);
      throw new Error(`Erreur lors de la récupération du planning de l'employé: ${error.message}`);
    }
  }

  /**
   * Exporte un planning au format PDF
   * @param {string} employeeId - Identifiant de l'employé
   * @param {string} startDate - Date de début au format YYYY-MM-DD
   * @param {string} endDate - Date de fin au format YYYY-MM-DD
   * @returns {Promise<string>} - Chemin du fichier PDF généré
   */
  async exportPlanningToPdf(employeeId, startDate, endDate) {
    try {
      logger.info(`Export du planning de l'employé ${employeeId} au format PDF`);
      
      if (process.env.NODE_ENV === 'production') {
        const response = await this.client.get(`/v1/employees/${employeeId}/schedule/export`, {
          params: {
            start_date: startDate,
            end_date: endDate,
            format: 'pdf'
          },
          responseType: 'arraybuffer'
        });
        
        // Générer un nom de fichier unique
        const fileName = `planning_${employeeId}_${startDate}_${endDate}_${Date.now()}.pdf`;
        const filePath = path.join(this.planningsDir, fileName);
        
        // Enregistrer le fichier
        await fs.writeFile(filePath, response.data);
        
        logger.info(`Planning exporté avec succès: ${filePath}`);
        
        return filePath;
      } else {
        // Simulation pour le développement
        logger.info(`[DEV] Simulation de l'export du planning de l'employé ${employeeId} au format PDF`);
        
        // Attendre un peu pour simuler le temps de génération
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // On va utiliser un fichier PDF de placeholder pour la démo
        const fileName = `planning_${employeeId}_${startDate}_${endDate}_${Date.now()}.txt`;
        const filePath = path.join(this.planningsDir, fileName);
        
        // Créer un fichier texte simulé
        const planningData = this.generateMockPlanningForEmployee(employeeId, startDate, endDate);
        await fs.writeFile(filePath, JSON.stringify(planningData, null, 2));
        
        logger.info(`[DEV] Planning simulé exporté: ${filePath}`);
        
        return filePath;
      }
    } catch (error) {
      logger.error(`Erreur lors de l'export du planning au format PDF: ${error.message}`);
      throw new Error(`Erreur lors de l'export du planning au format PDF: ${error.message}`);
    }
  }

  /**
   * Synchronise les plannings avec Octime Expresso
   * @param {string} startDate - Date de début au format YYYY-MM-DD
   * @param {string} endDate - Date de fin au format YYYY-MM-DD
   * @param {boolean} notifyUsers - Si vrai, envoie des notifications aux utilisateurs
   * @returns {Promise<Object>} - Résultat de la synchronisation
   */
  async synchronizePlannings(startDate, endDate, notifyUsers = true) {
    try {
      logger.info(`Démarrage de la synchronisation des plannings du ${startDate} au ${endDate}`);
      
      // Récupérer tous les plannings
      const plannings = await this.getAllPlannings(startDate, endDate);
      
      // Simuler le traitement des plannings
      const results = {
        total: plannings.length,
        synchronized: 0,
        errors: 0,
        notifications: 0,
        details: []
      };
      
      // Pour chaque planning, faire le traitement nécessaire
      for (const planning of plannings) {
        try {
          // Traitement du planning (stockage en BDD, etc.)
          // Dans une application réelle, nous aurions ici le code pour mettre à jour la base de données
          
          // Simuler un traitement réussi
          results.synchronized++;
          results.details.push({
            employeeId: planning.employeeId,
            status: 'success',
            message: 'Planning synchronisé avec succès'
          });
          
          // Envoyer une notification si demandé
          if (notifyUsers && planning.email) {
            await emailService.sendPlanningUpdateNotification(planning.email, {
              period: `${startDate} au ${endDate}`,
              updatedBy: 'Système',
              updateDate: new Date().toISOString()
            });
            
            results.notifications++;
          }
        } catch (error) {
          logger.error(`Erreur lors de la synchronisation du planning de l'employé ${planning.employeeId}: ${error.message}`);
          
          results.errors++;
          results.details.push({
            employeeId: planning.employeeId,
            status: 'error',
            message: error.message
          });
        }
      }
      
      logger.info(`Synchronisation terminée: ${results.synchronized}/${results.total} plannings synchronisés`);
      
      return results;
    } catch (error) {
      logger.error(`Erreur lors de la synchronisation des plannings: ${error.message}`);
      throw new Error(`Erreur lors de la synchronisation des plannings: ${error.message}`);
    }
  }

  /**
   * Génère des données simulées de plannings pour le développement
   * @param {string} startDate - Date de début au format YYYY-MM-DD
   * @param {string} endDate - Date de fin au format YYYY-MM-DD
   * @returns {Array} - Liste simulée de plannings
   */
  generateMockPlannings(startDate, endDate) {
    // Générer des données pour 5 employés
    const employees = [
      { id: '101', name: 'Martin Dupont', email: 'martin.dupont@ehpadbelleviste.fr' },
      { id: '102', name: 'Sophie Lefevre', email: 'sophie.lefevre@ehpadbelleviste.fr' },
      { id: '103', name: 'Thomas Bernard', email: 'thomas.bernard@ehpadbelleviste.fr' },
      { id: '104', name: 'Emma Petit', email: 'emma.petit@ehpadbelleviste.fr' },
      { id: '105', name: 'Lucas Moreau', email: 'lucas.moreau@ehpadbelleviste.fr' }
    ];
    
    return employees.map(employee => this.generateMockPlanningForEmployee(employee.id, startDate, endDate, employee));
  }

  /**
   * Génère un planning simulé pour un employé spécifique
   * @param {string} employeeId - Identifiant de l'employé
   * @param {string} startDate - Date de début au format YYYY-MM-DD
   * @param {string} endDate - Date de fin au format YYYY-MM-DD
   * @param {Object} employeeInfo - Informations sur l'employé (optionnel)
   * @returns {Object} - Planning simulé
   */
  generateMockPlanningForEmployee(employeeId, startDate, endDate, employeeInfo = null) {
    // Générer des infos par défaut si non fournies
    if (!employeeInfo) {
      employeeInfo = {
        id: employeeId,
        name: `Employé ${employeeId}`,
        email: `employe${employeeId}@ehpadbelleviste.fr`
      };
    }
    
    // Convertir les dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculer le nombre de jours
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    // Générer un shift pour chaque jour
    const shifts = [];
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Le weekend (samedi=6, dimanche=0), 70% de chance de repos
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      const isRest = isWeekend && Math.random() < 0.7;
      
      if (isRest) {
        shifts.push({
          date: dateStr,
          type: 'rest',
          label: 'Repos',
          startTime: null,
          endTime: null,
          service: null,
          location: null
        });
      } else {
        // Générer un service aléatoire
        const shiftTypes = [
          {
            type: 'morning',
            label: 'Matin',
            startTime: '07:00',
            endTime: '15:00',
            hours: 8
          },
          {
            type: 'day',
            label: 'Journée',
            startTime: '09:00',
            endTime: '17:00',
            hours: 8
          },
          {
            type: 'afternoon',
            label: 'Après-midi',
            startTime: '15:00',
            endTime: '23:00',
            hours: 8
          },
          {
            type: 'night',
            label: 'Nuit',
            startTime: '23:00',
            endTime: '07:00',
            hours: 8
          }
        ];
        
        const serviceTypes = ['Service A', 'Service B', 'Service C'];
        const locationTypes = ['Étage 1', 'Étage 2', 'Étage 3'];
        
        const shiftType = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];
        const service = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
        const location = locationTypes[Math.floor(Math.random() * locationTypes.length)];
        
        shifts.push({
          date: dateStr,
          type: shiftType.type,
          label: shiftType.label,
          startTime: shiftType.startTime,
          endTime: shiftType.endTime,
          hours: shiftType.hours,
          service,
          location
        });
      }
    }
    
    return {
      employeeId: employeeInfo.id,
      employeeName: employeeInfo.name,
      email: employeeInfo.email,
      startDate,
      endDate,
      shifts,
      totalHours: shifts.reduce((total, shift) => total + (shift.hours || 0), 0),
      totalDays: shifts.filter(shift => shift.type !== 'rest').length
    };
  }
}

module.exports = new OctimeService();
