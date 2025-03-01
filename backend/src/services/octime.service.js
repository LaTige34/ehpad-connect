const axios = require('axios');
const crypto = require('crypto');
const { Planning, Shift, User } = require('../models');
const logger = require('../utils/logger');

/**
 * Service d'intégration avec Octime Expresso
 */
class OctimeService {
  constructor() {
    this.apiUrl = process.env.OCTIME_API_URL;
    this.apiKey = process.env.OCTIME_API_KEY;
    this.companyId = process.env.OCTIME_COMPANY_ID;
    
    // Initialisation du client API
    this.initializeClient();
  }
  
  /**
   * Initialise le client API pour Octime
   */
  initializeClient() {
    if (this.apiUrl && this.apiKey) {
      this.client = axios.create({
        baseURL: this.apiUrl,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Company-Id': this.companyId
        }
      });
      
      logger.info('Client Octime initialisé');
    } else {
      logger.warn('Configuration Octime incomplète, mode simulé activé');
      this.client = null;
    }
  }
  
  /**
   * Synchronise le planning d'un employé pour un mois spécifique
   * @param {Number} employeeId - ID de l'employé
   * @param {Number} year - Année
   * @param {Number} month - Mois (1-12)
   * @returns {Promise<Object>} Résultat de la synchronisation
   */
  async syncEmployeePlanning(employeeId, year, month) {
    try {
      // Obtenir les informations de l'employé
      const employee = await User.findByPk(employeeId);
      if (!employee) {
        throw new Error('Employé non trouvé');
      }
      
      let planningData;
      
      // Si le client API est configuré, appeler l'API Octime
      if (this.client) {
        try {
          const response = await this.client.get('/planning', {
            params: {
              employeeId: employee.octimeId || employeeId,
              year,
              month
            }
          });
          
          planningData = response.data;
        } catch (apiError) {
          logger.error(`Erreur API Octime: ${apiError.message}`);
          // En cas d'erreur API, utiliser des données simulées
          planningData = this.generateMockPlanningData(employeeId, year, month);
        }
      } else {
        // Mode simulé
        planningData = this.generateMockPlanningData(employeeId, year, month);
      }
      
      // Traiter et enregistrer les données du planning
      return this.processAndSavePlanningData(employeeId, year, month, planningData);
    } catch (error) {
      logger.error(`Erreur lors de la synchronisation du planning: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Traite et enregistre les données du planning
   */
  async processAndSavePlanningData(employeeId, year, month, planningData) {
    // Rechercher un planning existant ou en créer un nouveau
    let planning = await Planning.findOne({
      where: {
        employeeId,
        year,
        month
      }
    });
    
    if (!planning) {
      planning = await Planning.create({
        employeeId,
        year,
        month,
        status: 'draft',
        octimeReference: planningData.reference || `OCT-${year}${month}-${employeeId}`
      });
    }
    
    // Compteurs pour le résumé
    const summary = {
      totalShifts: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      unchanged: 0
    };
    
    // Liste des jours du mois
    const daysInMonth = new Date(year, month, 0).getDate();
    const existingDates = new Set();
    
    // Pour chaque jour du planning reçu, créer ou mettre à jour le service
    for (const shift of planningData.shifts) {
      const shiftDate = shift.date;
      existingDates.add(shiftDate);
      
      // Chercher le service existant pour cette date
      let existingShift = await Shift.findOne({
        where: {
          employeeId,
          planningId: planning.id,
          date: shiftDate
        }
      });
      
      // Si le service existe, le mettre à jour
      if (existingShift) {
        // Vérifier si des changements sont nécessaires
        const needsUpdate = (
          existingShift.startTime !== shift.startTime ||
          existingShift.endTime !== shift.endTime ||
          existingShift.shiftType !== shift.shiftType ||
          existingShift.service !== shift.service ||
          existingShift.location !== shift.location ||
          existingShift.status !== shift.status
        );
        
        if (needsUpdate) {
          await existingShift.update({
            startTime: shift.startTime,
            endTime: shift.endTime,
            shiftType: shift.shiftType,
            service: shift.service,
            location: shift.location,
            status: shift.status,
            lastSync: new Date(),
            octimeId: shift.octimeId || existingShift.octimeId
          });
          
          summary.updated++;
        } else {
          summary.unchanged++;
        }
      } else {
        // Créer un nouveau service
        await Shift.create({
          employeeId,
          planningId: planning.id,
          date: shiftDate,
          startTime: shift.startTime,
          endTime: shift.endTime,
          shiftType: shift.shiftType,
          service: shift.service,
          location: shift.location,
          status: shift.status,
          lastSync: new Date(),
          octimeId: shift.octimeId
        });
        
        summary.created++;
      }
      
      summary.totalShifts++;
    }
    
    // Pour chaque jour du mois non présent dans les données reçues,
    // créer un service de type "repos" s'il n'existe pas déjà
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateString = date.toISOString().split('T')[0];
      
      if (!existingDates.has(dateString)) {
        // Vérifier si un service existe déjà pour cette date
        const existingShift = await Shift.findOne({
          where: {
            employeeId,
            planningId: planning.id,
            date: dateString
          }
        });
        
        if (existingShift) {
          // Si le service n'est pas déjà de type repos, le mettre à jour
          if (existingShift.shiftType !== 'rest') {
            await existingShift.update({
              shiftType: 'rest',
              startTime: null,
              endTime: null,
              service: null,
              location: null,
              status: 'confirmed',
              lastSync: new Date()
            });
            
            summary.updated++;
          } else {
            summary.unchanged++;
          }
        } else {
          // Créer un nouveau service de type repos
          await Shift.create({
            employeeId,
            planningId: planning.id,
            date: dateString,
            shiftType: 'rest',
            status: 'confirmed',
            lastSync: new Date()
          });
          
          summary.created++;
        }
        
        summary.totalShifts++;
      }
    }
    
    // Mettre à jour le planning avec la date de dernière synchronisation
    await planning.update({
      lastSync: new Date()
    });
    
    // Générer un ID de synchronisation
    const syncId = `sync_${crypto.randomBytes(8).toString('hex')}`;
    
    return {
      syncId,
      planning: {
        id: planning.id,
        month,
        year
      },
      summary
    };
  }
  
  /**
   * Génère des données de planning simulées pour le développement
   */
  generateMockPlanningData(employeeId, year, month) {
    logger.info(`Génération de données de planning simulées pour ${employeeId}, ${month}/${year}`);
    
    const daysInMonth = new Date(year, month, 0).getDate();
    const shifts = [];
    
    const shiftTypes = ['morning', 'afternoon', 'night', 'rest'];
    const services = ['Service A', 'Service B', 'Service C'];
    const locations = ['Étage 1', 'Étage 2', 'Étage 3'];
    
    // Pour chaque jour du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateString = date.toISOString().split('T')[0];
      
      // Générer des services aléatoires, avec repos les weekends (70% de chance)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isRest = isWeekend && Math.random() < 0.7;
      
      const shiftType = isRest ? 'rest' : shiftTypes[Math.floor(Math.random() * 3)]; // Exclure le repos hors weekend
      
      let startTime, endTime;
      
      switch (shiftType) {
        case 'morning':
          startTime = '07:00:00';
          endTime = '15:00:00';
          break;
        case 'afternoon':
          startTime = '15:00:00';
          endTime = '23:00:00';
          break;
        case 'night':
          startTime = '23:00:00';
          endTime = '07:00:00';
          break;
        default:
          startTime = null;
          endTime = null;
      }
      
      shifts.push({
        date: dateString,
        startTime,
        endTime,
        shiftType,
        service: shiftType === 'rest' ? null : services[Math.floor(Math.random() * services.length)],
        location: shiftType === 'rest' ? null : locations[Math.floor(Math.random() * locations.length)],
        status: 'confirmed',
        octimeId: `OCT-SHIFT-${dateString}-${employeeId}`
      });
    }
    
    return {
      reference: `OCT-${year}${month}-${employeeId}`,
      shifts
    };
  }
}

module.exports = new OctimeService();