/**
 * API Service pour IleRise Backend
 * Gère toutes les communications avec le serveur backend
 */

const API_BASE_URL = 'http://localhost:5000/api';

class APIService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  /**
   * Sauvegarder le token d'authentification
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  /**
   * Récupérer le token actuel
   */
  getToken() {
    return this.token || localStorage.getItem('authToken');
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Headers par défaut avec authentification
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Gérer les erreurs de requêtes
   */
  async handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
      // Si erreur 401, token invalide - déconnecter
      if (response.status === 401) {
        this.setToken(null);

        // Déclencher événement de déconnexion
        window.dispatchEvent(new CustomEvent('auth:expired'));

        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      throw new Error(data.message || data.error || 'Erreur serveur');
    }

    return data;
  }

  /**
   * POST /api/auth/register
   */
  async register(username, email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await this.handleResponse(response);

      if (data.token) {
        this.setToken(data.token);
      }

      return data;
    } catch (error) {
      console.error('❌ Register error:', error);
      throw error;
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await this.handleResponse(response);

      if (data.token) {
        this.setToken(data.token);
      }

      return data;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  /**
   * POST /api/sync/profile
   * Synchroniser le profil complet vers le backend
   */
  async syncProfile(profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/sync/profile`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(profileData)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('❌ Sync profile error:', error);
      throw error;
    }
  }

  /**
   * GET /api/sync/profile
   * Récupérer le profil complet depuis le backend
   */
  async getProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/sync/profile`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('❌ Get profile error:', error);
      throw error;
    }
  }

  /**
   * POST /api/sync/game
   * Sauvegarder une session de jeu
   */
  async saveGameSession(gameData) {
    try {
      const response = await fetch(`${API_BASE_URL}/sync/game`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(gameData)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('❌ Save game session error:', error);
      throw error;
    }
  }

  /**
   * Déconnexion
   */
  logout() {
    this.setToken(null);
  }

  // ============================================
  // FARM V3 API Methods
  // ============================================

  /**
   * POST /api/farm/init
   * Initialiser la ferme pour un utilisateur
   */
  async initializeFarm(locationData) {
    try {
      const response = await fetch(`${API_BASE_URL}/farm/init`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ location: locationData })
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('❌ Initialize farm error:', error);
      throw error;
    }
  }

  /**
   * POST /api/farm/save
   * Sauvegarder l'état complet de la ferme
   */
  async saveFarm(farmState) {
    try {
      const response = await fetch(`${API_BASE_URL}/farm/save`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(farmState)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('❌ Save farm error:', error);
      throw error;
    }
  }

  /**
   * GET /api/farm/load
   * Charger l'état de la ferme depuis le serveur
   */
  async loadFarm() {
    try {
      const response = await fetch(`${API_BASE_URL}/farm/load`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('❌ Load farm error:', error);
      throw error;
    }
  }

  /**
   * PATCH /api/farm/update
   * Mise à jour partielle de la ferme (quick save)
   */
  async updateFarm(updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/farm/update`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('❌ Update farm error:', error);
      throw error;
    }
  }

  /**
   * POST /api/farm/action
   * Logger une action agricole
   */
  async logFarmAction(actionType, actionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/farm/action`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ actionType, actionData })
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('❌ Log farm action error:', error);
      throw error;
    }
  }

  /**
   * POST /api/farm/harvest
   * Enregistrer une récolte et mettre à jour les pièces
   */
  async recordHarvest(cropId, yieldAmount, revenue) {
    try {
      const response = await fetch(`${API_BASE_URL}/farm/harvest`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ cropId, yield: yieldAmount, revenue })
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('❌ Record harvest error:', error);
      throw error;
    }
  }

  /**
   * GET /api/farm/stats
   * Obtenir les statistiques de la ferme
   */
  async getFarmStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/farm/stats`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('❌ Get farm stats error:', error);
      throw error;
    }
  }

  /**
   * DELETE /api/farm/reset
   * Réinitialiser la ferme
   */
  async resetFarm() {
    try {
      const response = await fetch(`${API_BASE_URL}/farm/reset`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('❌ Reset farm error:', error);
      throw error;
    }
  }
}

// Singleton instance
const apiService = new APIService();

export default apiService;
