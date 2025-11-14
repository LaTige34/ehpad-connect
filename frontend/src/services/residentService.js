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
 * Service de gestion des résidents
 */
const residentService = {
  /**
   * Obtenir tous les résidents
   * @param {Object} params Paramètres de filtrage (page, limit, active, search, etc.)
   * @returns {Promise} Liste des résidents
   */
  getAllResidents: async (params = {}) => {
    try {
      const response = await api.get('/residents', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des résidents:', error);
      throw error;
    }
  },

  /**
   * Obtenir un résident par ID
   * @param {number} id ID du résident
   * @returns {Promise} Données du résident
   */
  getResidentById: async (id) => {
    try {
      const response = await api.get(`/residents/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du résident:', error);
      throw error;
    }
  },

  /**
   * Créer un nouveau résident
   * @param {Object} residentData Données du résident
   * @returns {Promise} Résident créé
   */
  createResident: async (residentData) => {
    try {
      const response = await api.post('/residents', residentData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du résident:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un résident
   * @param {number} id ID du résident
   * @param {Object} residentData Données à mettre à jour
   * @returns {Promise} Résident mis à jour
   */
  updateResident: async (id, residentData) => {
    try {
      const response = await api.put(`/residents/${id}`, residentData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du résident:', error);
      throw error;
    }
  },

  /**
   * Supprimer un résident
   * @param {number} id ID du résident
   * @returns {Promise} Confirmation de suppression
   */
  deleteResident: async (id) => {
    try {
      const response = await api.delete(`/residents/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du résident:', error);
      throw error;
    }
  },

  /**
   * Restaurer un résident supprimé
   * @param {number} id ID du résident
   * @returns {Promise} Résident restauré
   */
  restoreResident: async (id) => {
    try {
      const response = await api.post(`/residents/${id}/restore`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la restauration du résident:', error);
      throw error;
    }
  },

  /**
   * Upload d'une photo de résident
   * @param {number} id ID du résident
   * @param {File} photoFile Fichier photo
   * @returns {Promise} URL de la photo
   */
  uploadPhoto: async (id, photoFile) => {
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);

      const response = await api.post(`/residents/${id}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'upload de la photo:', error);
      throw error;
    }
  },

  /**
   * Obtenir les statistiques des résidents
   * @returns {Promise} Statistiques
   */
  getResidentStats: async () => {
    try {
      const response = await api.get('/residents/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
};

export default residentService;
