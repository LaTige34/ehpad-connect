const TemperatureLog = require('../models/TemperatureLog');
const User = require('../models/User');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Service de gestion des relevés de température
 * Conforme aux recommandations HAS pour produits thermosensibles
 */
class TemperatureService {

  /**
   * Créer un nouveau relevé de température
   */
  async createTemperatureLog(data) {
    try {
      const {
        refrigeratorId,
        location,
        measurementDate,
        measurementTime,
        period,
        temperature,
        observations,
        correctiveActions,
        recordedById,
        metadata
      } = data;

      // Valider les données
      if (!refrigeratorId || !location || !measurementDate || !measurementTime || temperature === undefined) {
        throw new Error('Données manquantes pour créer le relevé de température');
      }

      // Créer le relevé
      const temperatureLog = await TemperatureLog.create({
        refrigeratorId,
        location,
        measurementDate,
        measurementTime,
        period: period || this._determinePeriod(measurementTime),
        temperature,
        observations,
        correctiveActions,
        recordedById,
        metadata
      });

      // Charger les relations
      await temperatureLog.reload({
        include: [
          {
            model: User,
            as: 'recordedBy',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      // Si anomalie, créer une notification
      if (temperatureLog.alertLevel !== 'none') {
        await this._createAnomalyNotification(temperatureLog);
      }

      logger.info(`Relevé de température créé: ${temperatureLog.id} - ${refrigeratorId} - ${temperature}°C`);

      return temperatureLog;
    } catch (error) {
      logger.error('Erreur lors de la création du relevé de température:', error);
      throw error;
    }
  }

  /**
   * Récupérer les relevés de température avec filtres
   */
  async getTemperatureLogs(filters = {}) {
    try {
      const {
        refrigeratorId,
        startDate,
        endDate,
        alertLevel,
        period,
        page = 1,
        limit = 50
      } = filters;

      const where = {};

      if (refrigeratorId) {
        where.refrigeratorId = refrigeratorId;
      }

      if (startDate && endDate) {
        where.measurementDate = {
          [Op.between]: [startDate, endDate]
        };
      } else if (startDate) {
        where.measurementDate = {
          [Op.gte]: startDate
        };
      } else if (endDate) {
        where.measurementDate = {
          [Op.lte]: endDate
        };
      }

      if (alertLevel) {
        where.alertLevel = alertLevel;
      }

      if (period) {
        where.period = period;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await TemperatureLog.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'recordedBy',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'validatedBy',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['measurementDate', 'DESC'], ['measurementTime', 'DESC']],
        limit,
        offset
      });

      return {
        logs: rows,
        pagination: {
          total: count,
          page,
          pages: Math.ceil(count / limit),
          limit
        }
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des relevés:', error);
      throw error;
    }
  }

  /**
   * Récupérer un relevé par ID
   */
  async getTemperatureLogById(id) {
    try {
      const log = await TemperatureLog.findByPk(id, {
        include: [
          {
            model: User,
            as: 'recordedBy',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'validatedBy',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      if (!log) {
        throw new Error('Relevé de température non trouvé');
      }

      return log;
    } catch (error) {
      logger.error('Erreur lors de la récupération du relevé:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un relevé de température
   */
  async updateTemperatureLog(id, data) {
    try {
      const log = await this.getTemperatureLogById(id);

      const {
        temperature,
        observations,
        correctiveActions,
        metadata
      } = data;

      // Mise à jour
      await log.update({
        temperature,
        observations,
        correctiveActions,
        metadata
      });

      await log.reload({
        include: [
          {
            model: User,
            as: 'recordedBy',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'validatedBy',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      logger.info(`Relevé de température mis à jour: ${id}`);

      return log;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du relevé:', error);
      throw error;
    }
  }

  /**
   * Valider un relevé (pour les anomalies)
   */
  async validateTemperatureLog(id, validatorId, correctiveActions) {
    try {
      const log = await this.getTemperatureLogById(id);

      if (log.alertLevel === 'none') {
        throw new Error('Ce relevé ne nécessite pas de validation');
      }

      await log.update({
        validatedById: validatorId,
        validatedAt: new Date(),
        correctiveActions: correctiveActions || log.correctiveActions
      });

      await log.reload({
        include: [
          {
            model: User,
            as: 'recordedBy',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'validatedBy',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      logger.info(`Relevé de température validé: ${id} par utilisateur ${validatorId}`);

      return log;
    } catch (error) {
      logger.error('Erreur lors de la validation du relevé:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques mensuelles
   */
  async getMonthlyStats(refrigeratorId, year, month) {
    try {
      const stats = await TemperatureLog.getMonthlyStats(refrigeratorId, year, month);
      return stats;
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Récupérer les anomalies récentes
   */
  async getAnomalies(refrigeratorId = null, days = 7) {
    try {
      const anomalies = await TemperatureLog.getAnomalies(refrigeratorId, days);
      return anomalies;
    } catch (error) {
      logger.error('Erreur lors de la récupération des anomalies:', error);
      throw error;
    }
  }

  /**
   * Récupérer la liste des réfrigérateurs
   */
  async getRefrigerators() {
    try {
      const refrigerators = await TemperatureLog.findAll({
        attributes: [
          'refrigeratorId',
          'location',
          [TemperatureLog.sequelize.fn('MAX', TemperatureLog.sequelize.col('measurementDate')), 'lastMeasurement'],
          [TemperatureLog.sequelize.fn('COUNT', TemperatureLog.sequelize.col('id')), 'totalLogs']
        ],
        group: ['refrigeratorId', 'location'],
        order: [['refrigeratorId', 'ASC']]
      });

      return refrigerators;
    } catch (error) {
      logger.error('Erreur lors de la récupération des réfrigérateurs:', error);
      throw error;
    }
  }

  /**
   * Vérifier les relevés manquants du jour
   */
  async checkMissingLogs(refrigeratorId, date = new Date()) {
    try {
      const dateStr = date.toISOString().split('T')[0];

      const logs = await TemperatureLog.findAll({
        where: {
          refrigeratorId,
          measurementDate: dateStr
        }
      });

      const periods = ['matin', 'soir'];
      const recordedPeriods = logs.map(log => log.period);
      const missingPeriods = periods.filter(p => !recordedPeriods.includes(p));

      return {
        date: dateStr,
        refrigeratorId,
        totalLogs: logs.length,
        missingPeriods,
        isComplete: missingPeriods.length === 0
      };
    } catch (error) {
      logger.error('Erreur lors de la vérification des relevés manquants:', error);
      throw error;
    }
  }

  /**
   * Déterminer la période en fonction de l'heure
   */
  _determinePeriod(timeString) {
    const hour = parseInt(timeString.split(':')[0]);

    if (hour >= 6 && hour < 14) {
      return 'matin';
    } else if (hour >= 14 && hour < 22) {
      return 'soir';
    } else {
      return 'nuit';
    }
  }

  /**
   * Créer une notification en cas d'anomalie
   */
  async _createAnomalyNotification(temperatureLog) {
    try {
      // Récupérer les admins et managers
      const recipients = await User.findAll({
        where: {
          role: {
            [Op.in]: ['admin', 'manager']
          },
          active: true
        }
      });

      const severity = temperatureLog.alertLevel === 'critical' ? 'high' : 'normal';

      const message = `Anomalie de température détectée: ${temperatureLog.refrigeratorId} - ${temperatureLog.temperature}°C (${temperatureLog.location})`;

      // Créer une notification pour chaque destinataire
      for (const recipient of recipients) {
        await Notification.create({
          userId: recipient.id,
          type: 'system',
          title: `⚠️ Alerte température - ${temperatureLog.alertLevel.toUpperCase()}`,
          message,
          priority: severity,
          link: `/temperature/${temperatureLog.id}`,
          metadata: {
            temperatureLogId: temperatureLog.id,
            refrigeratorId: temperatureLog.refrigeratorId,
            temperature: temperatureLog.temperature,
            alertLevel: temperatureLog.alertLevel
          }
        });
      }

      logger.warn(`Notification d'anomalie créée pour le relevé ${temperatureLog.id}`);
    } catch (error) {
      logger.error('Erreur lors de la création de la notification:', error);
      // Ne pas propager l'erreur pour ne pas bloquer la création du relevé
    }
  }
}

module.exports = new TemperatureService();
