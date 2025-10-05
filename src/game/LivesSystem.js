/**
 * LivesSystem.js
 * Systeme de gestion des vies avec synchronisation backend
 * NASA Space Apps Challenge 2025
 */

import apiService from '../services/api.js';

// Configuration API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ilerise.onrender.com/api';

export class LivesSystem {
  constructor() {
    this.MAX_LIVES = 5;
    this.REGENERATION_TIME = 30 * 60 * 1000; // 30 minutes en ms (comme backend)
    this.RESET_HOUR = 0; // Minuit (00:00)

    // État backend
    this.useBackendSync = false;
    this.lastServerSync = null;
    this.syncInterval = null;
  }

  /**
   * Initialiser le système de vies
   * Charge depuis le serveur si authentifié
   */
  async initialize() {
    this.useBackendSync = apiService.isAuthenticated();

    if (this.useBackendSync) {
      console.log('💚 LivesSystem - Mode synchronisé avec serveur');
      await this.syncFromServer();
      this.startAutoSync();
    } else {
      console.log('💾 LivesSystem - Mode local');
    }
  }

  /**
   * Synchroniser depuis le serveur
   */
  async syncFromServer() {
    try {
      const response = await apiService.getProfile();

      if (response.success && response.data.user) {
        const serverLives = response.data.user.lives;
        const serverLastRegen = new Date(response.data.user.lastLifeRegen);

        // Mettre à jour localStorage avec données serveur
        const data = {
          lives: serverLives,
          lastRegenTime: serverLastRegen.getTime(),
          lastResetDate: new Date().toDateString(),
          syncedFromServer: true
        };

        this.saveLivesData(data);
        this.lastServerSync = new Date();

        console.log(`💚 Vies synchronisées depuis serveur: ${serverLives}/${this.MAX_LIVES}`);
        return data;
      }
    } catch (error) {
      console.error('❌ Erreur sync vies depuis serveur:', error);
      // Fallback sur localStorage
    }
  }

  /**
   * Synchroniser vers le serveur
   */
  async syncToServer(lives) {
    if (!this.useBackendSync) return;

    try {
      // Le backend gère automatiquement via User.save()
      // On met juste à jour le profil
      await apiService.syncProfile({
        // Les vies sont gérées côté serveur
        // On envoie juste un ping pour trigger la régénération
      });

      this.lastServerSync = new Date();
    } catch (error) {
      console.error('❌ Erreur sync vies vers serveur:', error);
    }
  }

  /**
   * Démarrer la synchronisation automatique
   */
  startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sync toutes les 60 secondes
    this.syncInterval = setInterval(async () => {
      await this.syncFromServer();
    }, 60000);
  }

  /**
   * Arrêter la synchronisation
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Recuperer l'etat actuel des vies
   * @returns {Object} { current, max, nextRegenTime, hearts }
   */
  getLivesState() {
    const data = this.loadLivesData();
    this.regenerateLives(data);

    return {
      current: data.lives,
      max: this.MAX_LIVES,
      nextRegenTime: this.getNextRegenTime(data),
      timeUntilNextLife: this.getTimeUntilNextLife(data),
      hearts: this.getHeartsDisplay(data.lives)
    };
  }

  /**
   * Obtenir la clé localStorage spécifique à l'utilisateur
   */
  getLivesStorageKey() {
    // Utiliser l'email de l'utilisateur connecté ou 'guest'
    const userStr = localStorage.getItem('ilerise_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return `ilerise_lives_${user.email || user.id || 'guest'}`;
      } catch (e) {
        return 'ilerise_lives_guest';
      }
    }
    return 'ilerise_lives_guest';
  }

  /**
   * Charger donnees de vies depuis localStorage
   */
  loadLivesData() {
    const storageKey = this.getLivesStorageKey();
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      return JSON.parse(saved);
    }

    // Initialisation
    return {
      lives: this.MAX_LIVES,
      lastRegenTime: Date.now(),
      lastResetDate: new Date().toDateString()
    };
  }

  /**
   * Sauvegarder donnees de vies
   */
  saveLivesData(data) {
    const storageKey = this.getLivesStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  /**
   * Regenerer les vies basees sur le temps ecoule
   */
  regenerateLives(data) {
    const now = Date.now();
    const currentDate = new Date().toDateString();

    // Reset complet a minuit
    if (data.lastResetDate !== currentDate) {
      data.lives = this.MAX_LIVES;
      data.lastRegenTime = now;
      data.lastResetDate = currentDate;
      this.saveLivesData(data);
      return;
    }

    // Regeneration progressive
    if (data.lives < this.MAX_LIVES) {
      const timeSinceRegen = now - data.lastRegenTime;
      const livesToAdd = Math.floor(timeSinceRegen / this.REGENERATION_TIME);

      if (livesToAdd > 0) {
        data.lives = Math.min(this.MAX_LIVES, data.lives + livesToAdd);
        data.lastRegenTime = now;
        this.saveLivesData(data);
      }
    }
  }

  /**
   * Utiliser une vie
   * @returns {boolean} True si vie utilisee, false si plus de vies
   */
  async useLife() {
    // Si mode backend, utiliser l'endpoint dédié
    if (this.useBackendSync) {
      try {
        const response = await fetch(`${API_BASE_URL}/user/use-life`, {
          method: 'POST',
          headers: apiService.getHeaders()
        });

        const result = await response.json();

        if (result.success) {
          // Mettre à jour localStorage
          const data = this.loadLivesData();
          data.lives = result.data.lives;
          data.lastRegenTime = new Date(result.data.lastLifeRegen).getTime();
          this.saveLivesData(data);

          console.log(`💚 Vie utilisée (serveur): ${data.lives}/${this.MAX_LIVES}`);
          return true;
        } else {
          console.warn('⚠️ Pas assez de vies sur le serveur');
          return false;
        }
      } catch (error) {
        console.error('❌ Erreur utilisation vie serveur, fallback local:', error);
        // Fallback sur local
      }
    }

    // Mode local ou fallback
    const data = this.loadLivesData();
    this.regenerateLives(data);

    if (data.lives > 0) {
      data.lives--;
      data.lastRegenTime = Date.now();
      this.saveLivesData(data);
      return true;
    }

    return false;
  }

  /**
   * Ajouter une vie (bonus, achat, etc.)
   * @param {number} amount - Nombre de vies a ajouter
   */
  addLives(amount = 1) {
    const data = this.loadLivesData();
    data.lives = Math.min(this.MAX_LIVES, data.lives + amount);
    this.saveLivesData(data);
    return data.lives;
  }

  /**
   * Verifier si le joueur a des vies disponibles
   */
  hasLives() {
    const data = this.loadLivesData();
    this.regenerateLives(data);
    return data.lives > 0;
  }

  /**
   * Obtenir le temps jusqu'a la prochaine vie
   */
  getTimeUntilNextLife(data) {
    if (data.lives >= this.MAX_LIVES) {
      return 0;
    }

    const now = Date.now();
    const timeSinceRegen = now - data.lastRegenTime;
    const timeRemaining = this.REGENERATION_TIME - (timeSinceRegen % this.REGENERATION_TIME);

    return timeRemaining;
  }

  /**
   * Obtenir l'heure de la prochaine regeneration
   */
  getNextRegenTime(data) {
    if (data.lives >= this.MAX_LIVES) {
      return null;
    }

    const timeUntilNext = this.getTimeUntilNextLife(data);
    return new Date(Date.now() + timeUntilNext);
  }

  /**
   * Affichage visuel des coeurs
   * @param {number} lives - Nombre de vies actuelles
   * @returns {string} Representation visuelle (ex: "❤️❤️❤️🖤🖤")
   */
  getHeartsDisplay(lives) {
    const fullHearts = '❤️'.repeat(lives);
    const emptyHearts = '🖤'.repeat(this.MAX_LIVES - lives);
    return fullHearts + emptyHearts;
  }

  /**
   * Formater le temps restant en format lisible
   * @param {number} ms - Millisecondes
   * @returns {string} Format "Xh Ym" ou "Ym Zs"
   */
  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Obtenir informations detaillees pour l'UI
   */
  getUIInfo() {
    const state = this.getLivesState();
    const timeUntil = this.formatTime(state.timeUntilNextLife);

    return {
      hearts: state.hearts,
      current: state.current,
      max: state.max,
      percentage: (state.current / state.max) * 100,
      timeUntilNext: state.current < state.max ? timeUntil : null,
      isFull: state.current === state.max,
      isEmpty: state.current === 0
    };
  }

  /**
   * Reset complet du systeme (debug uniquement)
   */
  reset() {
    const data = {
      lives: this.MAX_LIVES,
      lastRegenTime: Date.now(),
      lastResetDate: new Date().toDateString()
    };
    this.saveLivesData(data);
  }

  /**
   * Mode developpement - vies illimitees
   */
  enableDevMode() {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      const data = this.loadLivesData();
      data.lives = 99;
      this.saveLivesData(data);
      return true;
    }
    return false;
  }
}

export default LivesSystem;
