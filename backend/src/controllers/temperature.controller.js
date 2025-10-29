const temperatureService = require('../services/temperature.service');
const pdfService = require('../services/pdf.service');
const logger = require('../utils/logger');

/**
 * Contrôleur pour la gestion des relevés de température
 */
class TemperatureController {

  /**
   * Créer un nouveau relevé de température
   * POST /api/temperature
   */
  async createTemperatureLog(req, res) {
    try {
      const userId = req.user.id;

      const data = {
        ...req.body,
        recordedById: userId
      };

      const temperatureLog = await temperatureService.createTemperatureLog(data);

      res.status(201).json({
        success: true,
        message: 'Relevé de température créé avec succès',
        data: temperatureLog
      });
    } catch (error) {
      logger.error('Erreur dans createTemperatureLog:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la création du relevé'
      });
    }
  }

  /**
   * Récupérer les relevés de température avec filtres
   * GET /api/temperature
   */
  async getTemperatureLogs(req, res) {
    try {
      const filters = {
        refrigeratorId: req.query.refrigeratorId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        alertLevel: req.query.alertLevel,
        period: req.query.period,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await temperatureService.getTemperatureLogs(filters);

      res.status(200).json({
        success: true,
        data: result.logs,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Erreur dans getTemperatureLogs:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des relevés'
      });
    }
  }

  /**
   * Récupérer un relevé par ID
   * GET /api/temperature/:id
   */
  async getTemperatureLogById(req, res) {
    try {
      const { id } = req.params;

      const temperatureLog = await temperatureService.getTemperatureLogById(id);

      res.status(200).json({
        success: true,
        data: temperatureLog
      });
    } catch (error) {
      logger.error('Erreur dans getTemperatureLogById:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Relevé non trouvé'
      });
    }
  }

  /**
   * Mettre à jour un relevé de température
   * PUT /api/temperature/:id
   */
  async updateTemperatureLog(req, res) {
    try {
      const { id } = req.params;

      const temperatureLog = await temperatureService.updateTemperatureLog(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Relevé mis à jour avec succès',
        data: temperatureLog
      });
    } catch (error) {
      logger.error('Erreur dans updateTemperatureLog:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du relevé'
      });
    }
  }

  /**
   * Valider un relevé de température (pour anomalies)
   * POST /api/temperature/:id/validate
   */
  async validateTemperatureLog(req, res) {
    try {
      const { id } = req.params;
      const validatorId = req.user.id;
      const { correctiveActions } = req.body;

      const temperatureLog = await temperatureService.validateTemperatureLog(
        id,
        validatorId,
        correctiveActions
      );

      res.status(200).json({
        success: true,
        message: 'Relevé validé avec succès',
        data: temperatureLog
      });
    } catch (error) {
      logger.error('Erreur dans validateTemperatureLog:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la validation du relevé'
      });
    }
  }

  /**
   * Récupérer les statistiques mensuelles
   * GET /api/temperature/stats/:refrigeratorId/:year/:month
   */
  async getMonthlyStats(req, res) {
    try {
      const { refrigeratorId, year, month } = req.params;

      const stats = await temperatureService.getMonthlyStats(
        refrigeratorId,
        parseInt(year),
        parseInt(month)
      );

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Erreur dans getMonthlyStats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  /**
   * Récupérer les anomalies récentes
   * GET /api/temperature/anomalies
   */
  async getAnomalies(req, res) {
    try {
      const refrigeratorId = req.query.refrigeratorId || null;
      const days = parseInt(req.query.days) || 7;

      const anomalies = await temperatureService.getAnomalies(refrigeratorId, days);

      res.status(200).json({
        success: true,
        data: anomalies
      });
    } catch (error) {
      logger.error('Erreur dans getAnomalies:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des anomalies'
      });
    }
  }

  /**
   * Récupérer la liste des réfrigérateurs
   * GET /api/temperature/refrigerators
   */
  async getRefrigerators(req, res) {
    try {
      const refrigerators = await temperatureService.getRefrigerators();

      res.status(200).json({
        success: true,
        data: refrigerators
      });
    } catch (error) {
      logger.error('Erreur dans getRefrigerators:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des réfrigérateurs'
      });
    }
  }

  /**
   * Vérifier les relevés manquants
   * GET /api/temperature/check-missing/:refrigeratorId
   */
  async checkMissingLogs(req, res) {
    try {
      const { refrigeratorId } = req.params;
      const date = req.query.date ? new Date(req.query.date) : new Date();

      const result = await temperatureService.checkMissingLogs(refrigeratorId, date);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erreur dans checkMissingLogs:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des relevés manquants'
      });
    }
  }

  /**
   * Supprimer un relevé de température (soft delete)
   * DELETE /api/temperature/:id
   */
  async deleteTemperatureLog(req, res) {
    try {
      const { id } = req.params;

      const temperatureLog = await temperatureService.getTemperatureLogById(id);
      await temperatureLog.destroy();

      res.status(200).json({
        success: true,
        message: 'Relevé supprimé avec succès'
      });
    } catch (error) {
      logger.error('Erreur dans deleteTemperatureLog:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la suppression du relevé'
      });
    }
  }

  /**
   * Générer le PDF de la fiche mensuelle
   * GET /api/temperature/pdf/:refrigeratorId/:year/:month
   */
  async generateMonthlyPDF(req, res) {
    try {
      const { refrigeratorId, year, month } = req.params;

      // Récupérer les statistiques et les relevés
      const { stats, logs } = await temperatureService.getMonthlyStats(
        refrigeratorId,
        parseInt(year),
        parseInt(month)
      );

      // Générer le PDF
      const pdfPath = await pdfService.generateTemperaturePDF({
        refrigeratorId,
        year: parseInt(year),
        month: parseInt(month),
        stats,
        logs
      });

      // Envoyer le fichier PDF
      res.download(pdfPath, `Fiche_Temperature_${refrigeratorId}_${month}_${year}.pdf`, async (err) => {
        if (err) {
          logger.error('Erreur lors de l\'envoi du PDF:', err);
          res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi du PDF'
          });
        }

        // Supprimer le fichier temporaire après envoi
        try {
          await pdfService.deleteTempFile(pdfPath);
        } catch (deleteError) {
          logger.warn('Impossible de supprimer le fichier temporaire:', deleteError);
        }
      });
    } catch (error) {
      logger.error('Erreur dans generateMonthlyPDF:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la génération du PDF'
      });
    }
  }
}

module.exports = new TemperatureController();
