const Resident = require('../models/Resident');
const { Op } = require('sequelize');

/**
 * Contrôleur pour la gestion des résidents
 */

class ResidentController {

  /**
   * Obtenir tous les résidents
   * GET /api/residents
   */
  async getAllResidents(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        active = 'true',
        search = '',
        dietType = '',
        withPrecautions = ''
      } = req.query;

      const offset = (page - 1) * limit;

      // Construire les conditions de filtrage
      const where = {};

      // Filtre actif/inactif
      if (active !== 'all') {
        where.active = active === 'true';
      }

      // Recherche par nom
      if (search) {
        where[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { roomNumber: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Filtre par type de régime
      if (dietType) {
        where.dietType = dietType;
      }

      // Filtre résidents avec précautions
      if (withPrecautions === 'true') {
        where[Op.or] = [
          { chokingRisk: true },
          { medicationAdministration: true },
          { enhancedHydration: true },
          { foodAllergies: true }
        ];
      }

      const { count, rows } = await Resident.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [
          ['lastName', 'ASC'],
          ['firstName', 'ASC']
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
      console.error('Erreur getAllResidents:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des résidents',
        error: error.message
      });
    }
  }

  /**
   * Obtenir un résident par ID
   * GET /api/residents/:id
   */
  async getResidentById(req, res) {
    try {
      const { id } = req.params;

      const resident = await Resident.findByPk(id);

      if (!resident) {
        return res.status(404).json({
          success: false,
          message: 'Résident non trouvé'
        });
      }

      res.json({
        success: true,
        data: resident
      });

    } catch (error) {
      console.error('Erreur getResidentById:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du résident',
        error: error.message
      });
    }
  }

  /**
   * Créer un nouveau résident
   * POST /api/residents
   */
  async createResident(req, res) {
    try {
      const residentData = {
        ...req.body,
        createdBy: req.user.id
      };

      const resident = await Resident.create(residentData);

      res.status(201).json({
        success: true,
        message: 'Résident créé avec succès',
        data: resident
      });

    } catch (error) {
      console.error('Erreur createResident:', error);

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
        message: 'Erreur lors de la création du résident',
        error: error.message
      });
    }
  }

  /**
   * Mettre à jour un résident
   * PUT /api/residents/:id
   */
  async updateResident(req, res) {
    try {
      const { id } = req.params;

      const resident = await Resident.findByPk(id);

      if (!resident) {
        return res.status(404).json({
          success: false,
          message: 'Résident non trouvé'
        });
      }

      const updateData = {
        ...req.body,
        updatedBy: req.user.id
      };

      await resident.update(updateData);

      res.json({
        success: true,
        message: 'Résident mis à jour avec succès',
        data: resident
      });

    } catch (error) {
      console.error('Erreur updateResident:', error);

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
        message: 'Erreur lors de la mise à jour du résident',
        error: error.message
      });
    }
  }

  /**
   * Supprimer un résident (soft delete)
   * DELETE /api/residents/:id
   */
  async deleteResident(req, res) {
    try {
      const { id } = req.params;

      const resident = await Resident.findByPk(id);

      if (!resident) {
        return res.status(404).json({
          success: false,
          message: 'Résident non trouvé'
        });
      }

      await resident.destroy();

      res.json({
        success: true,
        message: 'Résident supprimé avec succès'
      });

    } catch (error) {
      console.error('Erreur deleteResident:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du résident',
        error: error.message
      });
    }
  }

  /**
   * Restaurer un résident supprimé
   * POST /api/residents/:id/restore
   */
  async restoreResident(req, res) {
    try {
      const { id } = req.params;

      const resident = await Resident.findByPk(id, {
        paranoid: false
      });

      if (!resident) {
        return res.status(404).json({
          success: false,
          message: 'Résident non trouvé'
        });
      }

      if (!resident.deletedAt) {
        return res.status(400).json({
          success: false,
          message: 'Le résident n\'est pas supprimé'
        });
      }

      await resident.restore();

      res.json({
        success: true,
        message: 'Résident restauré avec succès',
        data: resident
      });

    } catch (error) {
      console.error('Erreur restoreResident:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la restauration du résident',
        error: error.message
      });
    }
  }

  /**
   * Uploader une photo de résident
   * POST /api/residents/:id/photo
   */
  async uploadPhoto(req, res) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier fourni'
        });
      }

      const resident = await Resident.findByPk(id);

      if (!resident) {
        return res.status(404).json({
          success: false,
          message: 'Résident non trouvé'
        });
      }

      // Construire l'URL de la photo
      const photoUrl = `/uploads/residents/${req.file.filename}`;

      await resident.update({
        photoUrl,
        updatedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Photo uploadée avec succès',
        data: {
          photoUrl
        }
      });

    } catch (error) {
      console.error('Erreur uploadPhoto:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload de la photo',
        error: error.message
      });
    }
  }

  /**
   * Obtenir les statistiques des résidents
   * GET /api/residents/stats
   */
  async getResidentStats(req, res) {
    try {
      const total = await Resident.count({ where: { active: true } });

      const byDietType = await Resident.findAll({
        where: { active: true },
        attributes: [
          'dietType',
          [Resident.sequelize.fn('COUNT', 'id'), 'count']
        ],
        group: ['dietType']
      });

      const withPrecautions = await Resident.count({
        where: {
          active: true,
          [Op.or]: [
            { chokingRisk: true },
            { medicationAdministration: true },
            { enhancedHydration: true },
            { foodAllergies: true }
          ]
        }
      });

      const precautionsDetail = {
        chokingRisk: await Resident.count({ where: { active: true, chokingRisk: true } }),
        medicationAdministration: await Resident.count({ where: { active: true, medicationAdministration: true } }),
        enhancedHydration: await Resident.count({ where: { active: true, enhancedHydration: true } }),
        foodAllergies: await Resident.count({ where: { active: true, foodAllergies: true } })
      };

      res.json({
        success: true,
        data: {
          total,
          byDietType: byDietType.reduce((acc, item) => {
            acc[item.dietType] = parseInt(item.dataValues.count);
            return acc;
          }, {}),
          withPrecautions,
          precautionsDetail
        }
      });

    } catch (error) {
      console.error('Erreur getResidentStats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }
}

module.exports = new ResidentController();
