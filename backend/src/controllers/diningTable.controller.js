const DiningTable = require('../models/DiningTable');

/**
 * Contrôleur pour la gestion des tables de la salle de restauration
 */

class DiningTableController {

  /**
   * Obtenir toutes les tables
   * GET /api/dining-tables
   */
  async getAllTables(req, res) {
    try {
      const { active = 'true' } = req.query;

      const where = {};
      if (active !== 'all') {
        where.active = active === 'true';
      }

      const tables = await DiningTable.findAll({
        where,
        order: [['tableNumber', 'ASC']]
      });

      res.json({
        success: true,
        data: tables
      });

    } catch (error) {
      console.error('Erreur getAllTables:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des tables',
        error: error.message
      });
    }
  }

  /**
   * Obtenir une table par ID
   * GET /api/dining-tables/:id
   */
  async getTableById(req, res) {
    try {
      const { id } = req.params;

      const table = await DiningTable.findByPk(id);

      if (!table) {
        return res.status(404).json({
          success: false,
          message: 'Table non trouvée'
        });
      }

      res.json({
        success: true,
        data: table
      });

    } catch (error) {
      console.error('Erreur getTableById:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la table',
        error: error.message
      });
    }
  }

  /**
   * Créer une nouvelle table
   * POST /api/dining-tables
   */
  async createTable(req, res) {
    try {
      const table = await DiningTable.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Table créée avec succès',
        data: table
      });

    } catch (error) {
      console.error('Erreur createTable:', error);

      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Ce numéro de table existe déjà'
        });
      }

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
        message: 'Erreur lors de la création de la table',
        error: error.message
      });
    }
  }

  /**
   * Mettre à jour une table
   * PUT /api/dining-tables/:id
   */
  async updateTable(req, res) {
    try {
      const { id } = req.params;

      const table = await DiningTable.findByPk(id);

      if (!table) {
        return res.status(404).json({
          success: false,
          message: 'Table non trouvée'
        });
      }

      await table.update(req.body);

      res.json({
        success: true,
        message: 'Table mise à jour avec succès',
        data: table
      });

    } catch (error) {
      console.error('Erreur updateTable:', error);

      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Ce numéro de table existe déjà'
        });
      }

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
        message: 'Erreur lors de la mise à jour de la table',
        error: error.message
      });
    }
  }

  /**
   * Supprimer une table (soft delete)
   * DELETE /api/dining-tables/:id
   */
  async deleteTable(req, res) {
    try {
      const { id } = req.params;

      const table = await DiningTable.findByPk(id);

      if (!table) {
        return res.status(404).json({
          success: false,
          message: 'Table non trouvée'
        });
      }

      await table.destroy();

      res.json({
        success: true,
        message: 'Table supprimée avec succès'
      });

    } catch (error) {
      console.error('Erreur deleteTable:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la table',
        error: error.message
      });
    }
  }

  /**
   * Créer plusieurs tables en une fois
   * POST /api/dining-tables/bulk
   */
  async bulkCreateTables(req, res) {
    try {
      const { count, startNumber = 1, capacity = 4, shape = 'rectangular' } = req.body;

      if (!count || count < 1 || count > 50) {
        return res.status(400).json({
          success: false,
          message: 'Le nombre de tables doit être entre 1 et 50'
        });
      }

      const tables = [];
      for (let i = 0; i < count; i++) {
        tables.push({
          tableNumber: startNumber + i,
          capacity,
          shape,
          active: true
        });
      }

      const createdTables = await DiningTable.bulkCreate(tables, {
        ignoreDuplicates: true
      });

      res.status(201).json({
        success: true,
        message: `${createdTables.length} table(s) créée(s) avec succès`,
        data: createdTables
      });

    } catch (error) {
      console.error('Erreur bulkCreateTables:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création en masse des tables',
        error: error.message
      });
    }
  }
}

module.exports = new DiningTableController();
