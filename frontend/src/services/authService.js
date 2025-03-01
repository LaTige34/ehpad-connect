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

// Service d'authentification
const authService = {
  /**
   * Connexion utilisateur
   * @param {string} email Email de l'utilisateur
   * @param {string} password Mot de passe
   * @returns {Promise} Réponse de l'API
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Stockage du token pour les futures requêtes
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return response;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  },
  
  /**
   * Déconnexion utilisateur
   * @returns {Promise} Réponse de l'API
   */
  logout: async () => {
    // Suppression du token
    localStorage.removeItem('token');
    
    // Si une API de déconnexion est disponible
    try {
      const response = await api.post('/auth/logout');
      return response;
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      // Même en cas d'erreur, on considère l'utilisateur déconnecté localement
      return { data: { success: true } };
    }
  },
  
  /**
   * Demande de réinitialisation de mot de passe
   * @param {string} email Email de l'utilisateur
   * @returns {Promise} Réponse de l'API
   */
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response;
    } catch (error) {
      console.error('Erreur de demande de réinitialisation:', error);
      throw error;
    }
  },
  
  /**
   * Réinitialisation de mot de passe
   * @param {string} token Token de réinitialisation
   * @param {string} password Nouveau mot de passe
   * @returns {Promise} Réponse de l'API
   */
  resetPassword: async (token, password) => {
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      return response;
    } catch (error) {
      console.error('Erreur de réinitialisation:', error);
      throw error;
    }
  },
  
  /**
   * Vérification de l'état d'authentification
   * @returns {Promise} Réponse de l'API
   */
  checkAuth: async () => {
    try {
      const response = await api.get('/auth/me');
      return response;
    } catch (error) {
      console.error('Erreur de vérification d\'authentification:', error);
      throw error;
    }
  }
};

export default authService;
