const SeatingPlan = require('../models/SeatingPlan');
const DiningTable = require('../models/DiningTable');
const Resident = require('../models/Resident');
const seatingPlanPdfService = require('../services/seatingPlanPdf.service');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

/**
 * Contrôleur pour la gestion des plans de table
 */

class SeatingPlanController {

  /**
   * Obtenir tous les plans de table
   * GET /api/seating-plans
   */
  async getAllSeatingPlans(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status = '',
        search = ''
      } = req.query;

      const offset = (page - 1) * limit;

      // Construire les conditions de filtrage
      const where = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.name = { [Op.iLike]: `%${search}%` };
      }

      const { count, rows } = await SeatingPlan.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['effectiveDate', 'DESC']],
        include: [
          {
            model: require('../models/user.model'),
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });

    } catch (error) {
      console.error('Erreur getAllSeatingPlans:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des plans de table',
        error: error.message
      });
    }
  }

  /**
   * Obtenir un plan de table par ID
   * GET /api/seating-plans/:id
   */
  async getSeatingPlanById(req, res) {
    try {
      const { id } = req.params;

      const seatingPlan = await SeatingPlan.findByPk(id, {
        include: [
          {
            model: require('../models/user.model'),
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: require('../models/user.model'),
            as: 'updater',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      if (!seatingPlan) {
        return res.status(404).json({
          success: false,
          message: 'Plan de table non trouvé'
        });
      }

      res.json({
        success: true,
        data: seatingPlan
      });

    } catch (error) {
      console.error('Erreur getSeatingPlanById:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du plan de table',
        error: error.message
      });
    }
  }

  /**
   * Obtenir le plan de table actif
   * GET /api/seating-plans/active/current
   */
  async getActiveSeatingPlan(req, res) {
    try {
      const seatingPlan = await SeatingPlan.findOne({
        where: { status: 'active' },
        order: [['effectiveDate', 'DESC']],
        include: [
          {
            model: require('../models/user.model'),
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      if (!seatingPlan) {
        return res.status(404).json({
          success: false,
          message: 'Aucun plan de table actif'
        });
      }

      res.json({
        success: true,
        data: seatingPlan
      });

    } catch (error) {
      console.error('Erreur getActiveSeatingPlan:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du plan de table actif',
        error: error.message
      });
    }
  }

  /**
   * Créer un nouveau plan de table
   * POST /api/seating-plans
   */
  async createSeatingPlan(req, res) {
    try {
      const seatingPlanData = {
        ...req.body,
        createdBy: req.user.id
      };

      const seatingPlan = await SeatingPlan.create(seatingPlanData);

      res.status(201).json({
        success: true,
        message: 'Plan de table créé avec succès',
        data: seatingPlan
      });

    } catch (error) {
      console.error('Erreur createSeatingPlan:', error);

      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: error.errors.map(e => ({
            field: e.path,
            message: e.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du plan de table',
        error: error.message
      });
    }
  }

  /**
   * Mettre à jour un plan de table
   * PUT /api/seating-plans/:id
   */
  async updateSeatingPlan(req, res) {
    try {
      const { id } = req.params;

      const seatingPlan = await SeatingPlan.findByPk(id);

      if (!seatingPlan) {
        return res.status(404).json({
          success: false,
          message: 'Plan de table non trouvé'
        });
      }

      // Ne pas permettre la modification d'un plan archivé
      if (seatingPlan.status === 'archived') {
        return res.status(400).json({
          success: false,
          message: 'Impossible de modifier un plan de table archivé'
        });
      }

      const updateData = {
        ...req.body,
        updatedBy: req.user.id
      };

      await seatingPlan.update(updateData);

      res.json({
        success: true,
        message: 'Plan de table mis à jour avec succès',
        data: seatingPlan
      });

    } catch (error) {
      console.error('Erreur updateSeatingPlan:', error);

      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: error.errors.map(e => ({
            field: e.path,
            message: e.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du plan de table',
        error: error.message
      });
    }
  }

  /**
   * Activer un plan de table
   * POST /api/seating-plans/:id/activate
   */
  async activateSeatingPlan(req, res) {
    try {
      const { id } = req.params;

      const seatingPlan = await SeatingPlan.findByPk(id);

      if (!seatingPlan) {
        return res.status(404).json({
          success: false,
          message: 'Plan de table non trouvé'
        });
      }

      if (seatingPlan.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Ce plan de table est déjà actif'
        });
      }

      // Archiver tous les plans actifs actuels
      await SeatingPlan.update(
        { status: 'archived' },
        { where: { status: 'active' } }
      );

      // Activer le nouveau plan
      await seatingPlan.activate(req.user.id);

      res.json({
        success: true,
        message: 'Plan de table activé avec succès',
        data: seatingPlan
      });

    } catch (error) {
      console.error('Erreur activateSeatingPlan:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'activation du plan de table',
        error: error.message
      });
    }
  }

  /**
   * Archiver un plan de table
   * POST /api/seating-plans/:id/archive
   */
  async archiveSeatingPlan(req, res) {
    try {
      const { id } = req.params;

      const seatingPlan = await SeatingPlan.findByPk(id);

      if (!seatingPlan) {
        return res.status(404).json({
          success: false,
          message: 'Plan de table non trouvé'
        });
      }

      if (seatingPlan.status === 'archived') {
        return res.status(400).json({
          success: false,
          message: 'Ce plan de table est déjà archivé'
        });
      }

      await seatingPlan.archive();

      res.json({
        success: true,
        message: 'Plan de table archivé avec succès',
        data: seatingPlan
      });

    } catch (error) {
      console.error('Erreur archiveSeatingPlan:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'archivage du plan de table',
        error: error.message
      });
    }
  }

  /**
   * Supprimer un plan de table (soft delete)
   * DELETE /api/seating-plans/:id
   */
  async deleteSeatingPlan(req, res) {
    try {
      const { id } = req.params;

      const seatingPlan = await SeatingPlan.findByPk(id);

      if (!seatingPlan) {
        return res.status(404).json({
          success: false,
          message: 'Plan de table non trouvé'
        });
      }

      // Ne pas permettre la suppression d'un plan actif
      if (seatingPlan.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Impossible de supprimer un plan de table actif. Veuillez d\'abord l\'archiver.'
        });
      }

      await seatingPlan.destroy();

      res.json({
        success: true,
        message: 'Plan de table supprimé avec succès'
      });

    } catch (error) {
      console.error('Erreur deleteSeatingPlan:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du plan de table',
        error: error.message
      });
    }
  }

  /**
   * Générer un PDF pour un plan de table
   * GET /api/seating-plans/:id/pdf
   */
  async generatePDF(req, res) {
    try {
      const { id } = req.params;

      const seatingPlan = await SeatingPlan.findByPk(id);

      if (!seatingPlan) {
        return res.status(404).json({
          success: false,
          message: 'Plan de table non trouvé'
        });
      }

      // Récupérer toutes les tables
      const tables = await DiningTable.findAll({
        where: { active: true },
        order: [['tableNumber', 'ASC']]
      });

      // Récupérer tous les résidents
      const residents = await Resident.findAll({
        where: { active: true }
      });

      // Organiser les données par table
      const tablesWithResidents = tables.map(table => {
        const tableData = table.toJSON();

        // Filtrer les résidents de cette table
        tableData.residents = seatingPlan.seatingArrangement.filter(
          seat => seat.tableId === table.id
        );

        // Filtrer les invités de cette table
        tableData.guests = (seatingPlan.guests || []).filter(
          guest => guest.tableId === table.id
        );

        tableData.number = table.tableNumber;

        return tableData;
      });

      // Générer le PDF
      const pdfPath = await seatingPlanPdfService.generateSeatingPlanPDF(
        seatingPlan,
        tablesWithResidents,
        residents
      );

      // Envoyer le fichier
      res.download(pdfPath, `plan-de-table-${seatingPlan.name}.pdf`, (err) => {
        if (err) {
          console.error('Erreur lors de l\'envoi du PDF:', err);
        }

        // Supprimer le fichier temporaire après l'envoi
        seatingPlanPdfService.deleteTempFile(pdfPath);
      });

    } catch (error) {
      console.error('Erreur generatePDF:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du PDF',
        error: error.message
      });
    }
  }

  /**
   * Dupliquer un plan de table
   * POST /api/seating-plans/:id/duplicate
   */
  async duplicateSeatingPlan(req, res) {
    try {
      const { id } = req.params;
      const { name, effectiveDate } = req.body;

      const originalPlan = await SeatingPlan.findByPk(id);

      if (!originalPlan) {
        return res.status(404).json({
          success: false,
          message: 'Plan de table non trouvé'
        });
      }

      const newPlan = await SeatingPlan.create({
        name: name || `${originalPlan.name} (copie)`,
        description: originalPlan.description,
        effectiveDate: effectiveDate || new Date(),
        status: 'draft',
        seatingArrangement: originalPlan.seatingArrangement,
        guests: [],
        temporaryInstructions: null,
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Plan de table dupliqué avec succès',
        data: newPlan
      });

    } catch (error) {
      console.error('Erreur duplicateSeatingPlan:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la duplication du plan de table',
        error: error.message
      });
    }
  }
}

module.exports = new SeatingPlanController();
