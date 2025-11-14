import axios from 'axios';
import { API_URL } from '../config';

// Configuration de base pour axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interception des requêtes pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Service de gestion des plans de table
 */
const seatingPlanService = {
  /**
   * Obtenir tous les plans de table
   * @param {Object} params Paramètres de filtrage (page, limit, status, search)
   * @returns {Promise} Liste des plans de table
   */
  getAllSeatingPlans: async (params = {}) => {
    try {
      const response = await api.get('/seating-plans', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des plans de table:', error);
      throw error;
    }
  },

  /**
   * Obtenir un plan de table par ID
   * @param {number} id ID du plan de table
   * @returns {Promise} Données du plan de table
   */
  getSeatingPlanById: async (id) => {
    try {
      const response = await api.get(`/seating-plans/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du plan de table:', error);
      throw error;
    }
  },

  /**
   * Obtenir le plan de table actif
   * @returns {Promise} Plan de table actif
   */
  getActiveSeatingPlan: async () => {
    try {
      const response = await api.get('/seating-plans/active/current');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du plan actif:', error);
      throw error;
    }
  },

  /**
   * Créer un nouveau plan de table
   * @param {Object} planData Données du plan de table
   * @returns {Promise} Plan de table créé
   */
  createSeatingPlan: async (planData) => {
    try {
      const response = await api.post('/seating-plans', planData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du plan de table:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un plan de table
   * @param {number} id ID du plan de table
   * @param {Object} planData Données à mettre à jour
   * @returns {Promise} Plan de table mis à jour
   */
  updateSeatingPlan: async (id, planData) => {
    try {
      const response = await api.put(`/seating-plans/${id}`, planData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du plan de table:', error);
      throw error;
    }
  },

  /**
   * Dupliquer un plan de table
   * @param {number} id ID du plan de table à dupliquer
   * @param {Object} duplicateData Données pour la duplication (name, effectiveDate)
   * @returns {Promise} Nouveau plan de table
   */
  duplicateSeatingPlan: async (id, duplicateData) => {
    try {
      const response = await api.post(`/seating-plans/${id}/duplicate`, duplicateData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la duplication du plan de table:', error);
      throw error;
    }
  },

  /**
   * Activer un plan de table
   * @param {number} id ID du plan de table
   * @returns {Promise} Plan de table activé
   */
  activateSeatingPlan: async (id) => {
    try {
      const response = await api.post(`/seating-plans/${id}/activate`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'activation du plan de table:', error);
      throw error;
    }
  },

  /**
   * Archiver un plan de table
   * @param {number} id ID du plan de table
   * @returns {Promise} Plan de table archivé
   */
  archiveSeatingPlan: async (id) => {
    try {
      const response = await api.post(`/seating-plans/${id}/archive`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'archivage du plan de table:', error);
      throw error;
    }
  },

  /**
   * Supprimer un plan de table
   * @param {number} id ID du plan de table
   * @returns {Promise} Confirmation de suppression
   */
  deleteSeatingPlan: async (id) => {
    try {
      const response = await api.delete(`/seating-plans/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du plan de table:', error);
      throw error;
    }
  },

  /**
   * Télécharger le PDF d'un plan de table
   * @param {number} id ID du plan de table
   * @returns {Promise} Blob du PDF
   */
  downloadPDF: async (id) => {
    try {
      const response = await api.get(`/seating-plans/${id}/pdf`, {
        responseType: 'blob'
      });

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `plan-de-table-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      return { success: true, message: 'PDF téléchargé avec succès' };
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error);
      throw error;
    }
  }
};

export default seatingPlanService;
