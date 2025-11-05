/**
 * EventBus.js
 * Système d'événements centralisé pour découplage des composants
 * Pattern Pub/Sub inspiré des meilleurs frameworks de jeux
 * NASA Space Apps Challenge 2025
 */

export class EventBus {
  static instance = null;

  constructor() {
    if (EventBus.instance) {
      return EventBus.instance;
    }

    this.events = new Map();
    this.onceEvents = new Map();
    this.wildcardListeners = new Set();
    this.eventHistory = [];
    this.maxHistorySize = 100;
    this.debugMode = false;

    EventBus.instance = this;
    console.log('📡 EventBus initialized');
  }

  static getInstance() {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * S'abonner à un événement
   * @param {string} eventName - Nom de l'événement
   * @param {function} callback - Fonction à exécuter
   * @param {object} context - Contexte (this) pour le callback
   */
  on(eventName, callback, context = null) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const listener = {
      callback,
      context,
      id: this.generateListenerId()
    };

    this.events.get(eventName).push(listener);

    if (this.debugMode) {
      console.log(`📡 Listener registered for '${eventName}'`);
    }

    // Retourner fonction de désabonnement
    return () => this.off(eventName, callback);
  }

  /**
   * S'abonner à un événement une seule fois
   * @param {string} eventName - Nom de l'événement
   * @param {function} callback - Fonction à exécuter
   * @param {object} context - Contexte (this) pour le callback
   */
  once(eventName, callback, context = null) {
    if (!this.onceEvents.has(eventName)) {
      this.onceEvents.set(eventName, []);
    }

    const listener = {
      callback,
      context,
      id: this.generateListenerId()
    };

    this.onceEvents.get(eventName).push(listener);

    if (this.debugMode) {
      console.log(`📡 One-time listener registered for '${eventName}'`);
    }

    return () => {
      const listeners = this.onceEvents.get(eventName);
      if (listeners) {
        const index = listeners.findIndex(l => l.callback === callback);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Se désabonner d'un événement
   * @param {string} eventName - Nom de l'événement
   * @param {function} callback - Fonction à retirer (optionnel)
   */
  off(eventName, callback = null) {
    if (!callback) {
      // Retirer tous les listeners pour cet événement
      this.events.delete(eventName);
      this.onceEvents.delete(eventName);
      if (this.debugMode) {
        console.log(`📡 All listeners removed for '${eventName}'`);
      }
      return;
    }

    // Retirer un listener spécifique
    const listeners = this.events.get(eventName);
    if (listeners) {
      const index = listeners.findIndex(l => l.callback === callback);
      if (index !== -1) {
        listeners.splice(index, 1);
        if (this.debugMode) {
          console.log(`📡 Listener removed for '${eventName}'`);
        }
      }
    }

    const onceListeners = this.onceEvents.get(eventName);
    if (onceListeners) {
      const index = onceListeners.findIndex(l => l.callback === callback);
      if (index !== -1) {
        onceListeners.splice(index, 1);
      }
    }
  }

  /**
   * Émettre un événement
   * @param {string} eventName - Nom de l'événement
   * @param {any} data - Données à passer
   */
  emit(eventName, data = null) {
    const event = {
      name: eventName,
      data,
      timestamp: Date.now()
    };

    // Sauvegarder dans l'historique
    this.saveToHistory(event);

    if (this.debugMode) {
      console.log(`📡 Event emitted: '${eventName}'`, data);
    }

    // Exécuter les listeners normaux
    const listeners = this.events.get(eventName);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          if (listener.context) {
            listener.callback.call(listener.context, data);
          } else {
            listener.callback(data);
          }
        } catch (error) {
          console.error(`❌ Error in listener for '${eventName}':`, error);
        }
      });
    }

    // Exécuter les listeners "once"
    const onceListeners = this.onceEvents.get(eventName);
    if (onceListeners && onceListeners.length > 0) {
      // Copier pour éviter les modifications pendant l'itération
      const listenersCopy = [...onceListeners];
      this.onceEvents.delete(eventName);

      listenersCopy.forEach(listener => {
        try {
          if (listener.context) {
            listener.callback.call(listener.context, data);
          } else {
            listener.callback(data);
          }
        } catch (error) {
          console.error(`❌ Error in once listener for '${eventName}':`, error);
        }
      });
    }

    // Exécuter les wildcard listeners
    this.wildcardListeners.forEach(listener => {
      try {
        listener.callback({ eventName, data });
      } catch (error) {
        console.error('❌ Error in wildcard listener:', error);
      }
    });
  }

  /**
   * S'abonner à tous les événements (wildcard)
   * @param {function} callback - Fonction à exécuter
   */
  onAny(callback) {
    const listener = {
      callback,
      id: this.generateListenerId()
    };

    this.wildcardListeners.add(listener);

    return () => {
      this.wildcardListeners.delete(listener);
    };
  }

  /**
   * Émettre un événement avec délai
   * @param {string} eventName - Nom de l'événement
   * @param {any} data - Données à passer
   * @param {number} delay - Délai en ms
   */
  emitLater(eventName, data = null, delay = 0) {
    setTimeout(() => {
      this.emit(eventName, data);
    }, delay);
  }

  /**
   * Attendre qu'un événement soit émis (Promise)
   * @param {string} eventName - Nom de l'événement
   * @param {number} timeout - Timeout en ms (optionnel)
   */
  waitFor(eventName, timeout = null) {
    return new Promise((resolve, reject) => {
      let timeoutId = null;

      const unsubscribe = this.once(eventName, (data) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        resolve(data);
      });

      if (timeout) {
        timeoutId = setTimeout(() => {
          unsubscribe();
          reject(new Error(`Timeout waiting for event '${eventName}'`));
        }, timeout);
      }
    });
  }

  /**
   * Vérifier si un événement a des listeners
   * @param {string} eventName - Nom de l'événement
   */
  hasListeners(eventName) {
    const regularListeners = this.events.get(eventName);
    const onceListeners = this.onceEvents.get(eventName);

    return (
      (regularListeners && regularListeners.length > 0) ||
      (onceListeners && onceListeners.length > 0) ||
      this.wildcardListeners.size > 0
    );
  }

  /**
   * Obtenir le nombre de listeners pour un événement
   * @param {string} eventName - Nom de l'événement
   */
  getListenerCount(eventName) {
    const regularCount = this.events.get(eventName)?.length || 0;
    const onceCount = this.onceEvents.get(eventName)?.length || 0;
    return regularCount + onceCount;
  }

  /**
   * Sauvegarder dans l'historique
   */
  saveToHistory(event) {
    this.eventHistory.push(event);

    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Obtenir l'historique des événements
   * @param {string} eventName - Filtrer par nom (optionnel)
   * @param {number} limit - Limite d'événements
   */
  getHistory(eventName = null, limit = 50) {
    let history = this.eventHistory;

    if (eventName) {
      history = history.filter(e => e.name === eventName);
    }

    return history.slice(-limit);
  }

  /**
   * Générer un ID unique pour un listener
   */
  generateListenerId() {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Activer le mode debug
   */
  enableDebug() {
    this.debugMode = true;
    console.log('🐛 EventBus debug mode enabled');
  }

  /**
   * Désactiver le mode debug
   */
  disableDebug() {
    this.debugMode = false;
  }

  /**
   * Effacer tous les listeners
   */
  clear() {
    this.events.clear();
    this.onceEvents.clear();
    this.wildcardListeners.clear();
    console.log('🧹 All event listeners cleared');
  }

  /**
   * Obtenir des statistiques
   */
  getStats() {
    const eventNames = Array.from(this.events.keys());
    const totalListeners = eventNames.reduce((sum, name) => {
      return sum + this.getListenerCount(name);
    }, 0);

    return {
      totalEvents: eventNames.length,
      totalListeners,
      wildcardListeners: this.wildcardListeners.size,
      historySize: this.eventHistory.length,
      events: eventNames.map(name => ({
        name,
        listenerCount: this.getListenerCount(name)
      }))
    };
  }

  /**
   * Debug: Afficher les statistiques
   */
  debug() {
    const stats = this.getStats();
    console.log('📡 EventBus Stats:', stats);
    return stats;
  }
}

// Événements prédéfinis du jeu (constantes)
export const GameEvents = {
  // Lifecycle
  GAME_INIT: 'game:init',
  GAME_READY: 'game:ready',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_QUIT: 'game:quit',

  // Screens
  SCREEN_CHANGE: 'screen:change',
  SCREEN_TRANSITION_START: 'screen:transition:start',
  SCREEN_TRANSITION_END: 'screen:transition:end',

  // Player
  PLAYER_LEVEL_UP: 'player:levelUp',
  PLAYER_XP_GAINED: 'player:xpGained',
  PLAYER_COINS_CHANGED: 'player:coinsChanged',
  PLAYER_LIVES_CHANGED: 'player:livesChanged',
  PLAYER_LIFE_REGENERATED: 'player:lifeRegenerated',

  // Game
  GAME_START: 'game:start',
  GAME_END: 'game:end',
  GAME_WIN: 'game:win',
  GAME_LOSE: 'game:lose',
  GAME_OVER: 'game:over',

  // Simulation
  SIMULATION_START: 'simulation:start',
  SIMULATION_PROGRESS: 'simulation:progress',
  SIMULATION_COMPLETE: 'simulation:complete',
  SIMULATION_ERROR: 'simulation:error',

  // Achievements
  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
  BADGE_EARNED: 'badge:earned',
  QUEST_COMPLETED: 'quest:completed',
  CHALLENGE_COMPLETED: 'challenge:completed',

  // Streak
  STREAK_UPDATED: 'streak:updated',
  STREAK_BROKEN: 'streak:broken',
  STREAK_MILESTONE: 'streak:milestone',

  // UI
  MODAL_OPEN: 'ui:modal:open',
  MODAL_CLOSE: 'ui:modal:close',
  NOTIFICATION_SHOW: 'ui:notification:show',
  TOAST_SHOW: 'ui:toast:show',
  LOADING_START: 'ui:loading:start',
  LOADING_END: 'ui:loading:end',

  // Audio
  AUDIO_PLAY: 'audio:play',
  AUDIO_STOP: 'audio:stop',
  MUSIC_PLAY: 'audio:music:play',
  MUSIC_STOP: 'audio:music:stop',

  // NASA Data
  NASA_DATA_LOADED: 'nasa:data:loaded',
  NASA_RECOMMENDATION_REQUESTED: 'nasa:recommendation:requested',
  NASA_RECOMMENDATION_SHOWN: 'nasa:recommendation:shown',

  // Farm
  FARM_CROP_PLANTED: 'farm:crop:planted',
  FARM_CROP_WATERED: 'farm:crop:watered',
  FARM_CROP_HARVESTED: 'farm:crop:harvested',
  FARM_PLOT_UNLOCKED: 'farm:plot:unlocked',

  // Tutorial
  TUTORIAL_START: 'tutorial:start',
  TUTORIAL_STEP: 'tutorial:step',
  TUTORIAL_COMPLETE: 'tutorial:complete',
  TUTORIAL_SKIP: 'tutorial:skip',

  // Auth
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_REGISTER: 'auth:register',
  AUTH_TOKEN_EXPIRED: 'auth:tokenExpired',

  // Network
  NETWORK_ONLINE: 'network:online',
  NETWORK_OFFLINE: 'network:offline',
  BACKEND_CONNECTED: 'backend:connected',
  BACKEND_DISCONNECTED: 'backend:disconnected',

  // Errors
  ERROR_OCCURRED: 'error:occurred',
  WARNING_SHOWN: 'warning:shown'
};

// Export singleton instance
export default EventBus.getInstance();
