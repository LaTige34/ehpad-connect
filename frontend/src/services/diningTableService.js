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
 * Service de gestion des tables de restauration
 */
const diningTableService = {
  /**
   * Obtenir toutes les tables
   * @param {Object} params Paramètres de filtrage (active)
   * @returns {Promise} Liste des tables
   */
  getAllTables: async (params = {}) => {
    try {
      const response = await api.get('/dining-tables', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des tables:', error);
      throw error;
    }
  },

  /**
   * Obtenir une table par ID
   * @param {number} id ID de la table
   * @returns {Promise} Données de la table
   */
  getTableById: async (id) => {
    try {
      const response = await api.get(`/dining-tables/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la table:', error);
      throw error;
    }
  },

  /**
   * Créer une nouvelle table
   * @param {Object} tableData Données de la table
   * @returns {Promise} Table créée
   */
  createTable: async (tableData) => {
    try {
      const response = await api.post('/dining-tables', tableData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la table:', error);
      throw error;
    }
  },

  /**
   * Créer plusieurs tables en une fois
   * @param {Object} bulkData Données pour la création en masse
   * @returns {Promise} Tables créées
   */
  bulkCreateTables: async (bulkData) => {
    try {
      const response = await api.post('/dining-tables/bulk', bulkData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création en masse des tables:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour une table
   * @param {number} id ID de la table
   * @param {Object} tableData Données à mettre à jour
   * @returns {Promise} Table mise à jour
   */
  updateTable: async (id, tableData) => {
    try {
      const response = await api.put(`/dining-tables/${id}`, tableData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la table:', error);
      throw error;
    }
  },

  /**
   * Supprimer une table
   * @param {number} id ID de la table
   * @returns {Promise} Confirmation de suppression
   */
  deleteTable: async (id) => {
    try {
      const response = await api.delete(`/dining-tables/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la table:', error);
      throw error;
    }
  }
};

export default diningTableService;
