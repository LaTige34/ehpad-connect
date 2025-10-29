import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * Service pour la gestion des relevés de température
 */
class TemperatureService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/temperature`;
  }

  /**
   * Récupère le token d'authentification
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Créer un nouveau relevé de température
   */
  async createTemperatureLog(data) {
    try {
      const response = await axios.post(
        this.baseURL,
        data,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer les relevés de température avec filtres
   */
  async getTemperatureLogs(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.refrigeratorId) params.append('refrigeratorId', filters.refrigeratorId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.alertLevel) params.append('alertLevel', filters.alertLevel);
      if (filters.period) params.append('period', filters.period);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await axios.get(
        `${this.baseURL}?${params.toString()}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer un relevé par ID
   */
  async getTemperatureLogById(id) {
    try {
      const response = await axios.get(
        `${this.baseURL}/${id}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Mettre à jour un relevé
   */
  async updateTemperatureLog(id, data) {
    try {
      const response = await axios.put(
        `${this.baseURL}/${id}`,
        data,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Valider un relevé (pour anomalies)
   */
  async validateTemperatureLog(id, correctiveActions) {
    try {
      const response = await axios.post(
        `${this.baseURL}/${id}/validate`,
        { correctiveActions },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer les statistiques mensuelles
   */
  async getMonthlyStats(refrigeratorId, year, month) {
    try {
      const response = await axios.get(
        `${this.baseURL}/stats/${refrigeratorId}/${year}/${month}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer les anomalies récentes
   */
  async getAnomalies(refrigeratorId = null, days = 7) {
    try {
      const params = new URLSearchParams();
      if (refrigeratorId) params.append('refrigeratorId', refrigeratorId);
      params.append('days', days);

      const response = await axios.get(
        `${this.baseURL}/anomalies?${params.toString()}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer la liste des réfrigérateurs
   */
  async getRefrigerators() {
    try {
      const response = await axios.get(
        `${this.baseURL}/refrigerators`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Vérifier les relevés manquants
   */
  async checkMissingLogs(refrigeratorId, date = null) {
    try {
      const params = date ? `?date=${date}` : '';
      const response = await axios.get(
        `${this.baseURL}/check-missing/${refrigeratorId}${params}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Télécharger le PDF de la fiche mensuelle
   */
  async downloadMonthlyPDF(refrigeratorId, year, month) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${this.baseURL}/pdf/${refrigeratorId}/${year}/${month}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Fiche_Temperature_${refrigeratorId}_${month}_${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      return { success: true };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Supprimer un relevé
   */
  async deleteTemperatureLog(id) {
    try {
      const response = await axios.delete(
        `${this.baseURL}/${id}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gestion des erreurs
   */
  handleError(error) {
    if (error.response) {
      // Erreur de réponse du serveur
      const message = error.response.data?.message || 'Une erreur est survenue';
      return new Error(message);
    } else if (error.request) {
      // Pas de réponse du serveur
      return new Error('Impossible de contacter le serveur');
    } else {
      // Erreur lors de la configuration de la requête
      return new Error(error.message);
    }
  }
}

export default new TemperatureService();
