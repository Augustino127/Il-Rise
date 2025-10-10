/**
 * API Service pour IleRise Backend
 * Gère toutes les communications avec le serveur backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ilerise.onrender.com/api';

class APIService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.refreshing = false; // Flag pour éviter les refreshs multiples
  }

  /**
   * Sauvegarder le token d'authentification
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);

      // Calculer et stocker l'expiration du token (JWT standard: exp en secondes)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp) {
          localStorage.setItem('authToken_expiry', payload.exp * 1000); // Convertir en millisecondes
        }
      } catch (e) {
        console.warn('⚠️ Impossible de parser le token JWT');
      }
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authToken_expiry');
    }
  }

  /**
   * Vérifier si le token est expiré ou expire bientôt
   * @param {Number} bufferMinutes - Minutes avant expiration pour considérer le token comme expirant
   * @returns {Boolean}
   */
  isTokenExpiring(bufferMinutes = 5) {
    const expiry = localStorage.getItem('authToken_expiry');
    if (!expiry) return false;

    const expiryTime = parseInt(expiry);
    const now = Date.now();
    const bufferMs = bufferMinutes * 60 * 1000;

    // Retourne true si le token expire dans moins de bufferMinutes
    return (expiryTime - now) < bufferMs;
  }

  /**
   * Rafraîchir automatiquement le token si nécessaire
   * @returns {Promise<Boolean>} - True si refresh réussi ou non nécessaire
   */
  async ensureValidToken() {
    // Si pas de token, pas besoin de refresh
    if (!this.isAuthenticated()) return true;

    // Si déjà en cours de refresh, attendre
    if (this.refreshing) {
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!this.refreshing) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
      return true;
    }

    // Vérifier si le token expire bientôt
    if (this.isTokenExpiring()) {
      this.refreshing = true;
      try {
        await this.refreshToken();
        this.refreshing = false;
        return true;
      } catch (error) {
        this.refreshing = false;
        console.error('❌ Auto-refresh failed:', error);
        return false;
      }
    }

    return true;
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
   * POST /api/auth/refresh
   * Rafraîchir le token d'accès avec le refresh token
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('ilerise_refresh_token') ||
                          sessionStorage.getItem('ilerise_refresh_token');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const data = await this.handleResponse(response);

      if (data.success && data.data.accessToken) {
        // Mettre à jour le token
        this.setToken(data.data.accessToken);

        // Mettre à jour dans le storage approprié
        if (localStorage.getItem('ilerise_token')) {
          localStorage.setItem('ilerise_token', data.data.accessToken);
        } else if (sessionStorage.getItem('ilerise_token')) {
          sessionStorage.setItem('ilerise_token', data.data.accessToken);
        }

        console.log('✅ Token rafraîchi avec succès');
        return data;
      }

      throw new Error('Failed to refresh token');
    } catch (error) {
      console.error('❌ Refresh token error:', error);
      // En cas d'échec, déclencher déconnexion
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw error;
    }
  }

  /**
   * POST /api/sync/profile
   * Synchroniser le profil complet vers le backend
   */
  async syncProfile(profileData) {
    try {
      await this.ensureValidToken();

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
      await this.ensureValidToken();

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
      await this.ensureValidToken();

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
  // USER API Methods
  // ============================================

  /**
   * POST /api/user/use-life
   * Utiliser une vie
   */
  async useLife() {
    try {
      await this.ensureValidToken();

      const response = await fetch(`${API_BASE_URL}/user/use-life`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('❌ Use life error:', error);
      throw error;
    }
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
      await this.ensureValidToken();

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
      await this.ensureValidToken();

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
      await this.ensureValidToken();

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
      await this.ensureValidToken();

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
      await this.ensureValidToken();

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
      await this.ensureValidToken();

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
      await this.ensureValidToken();

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
      await this.ensureValidToken();

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
