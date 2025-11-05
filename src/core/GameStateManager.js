/**
 * GameStateManager.js
 * Gestionnaire centralisé de l'état du jeu - Pattern Singleton
 * Inspiré des meilleurs jeux (Clash of Clans, Stardew Valley, Animal Crossing)
 * NASA Space Apps Challenge 2025
 */

export class GameStateManager {
  static instance = null;

  constructor() {
    if (GameStateManager.instance) {
      return GameStateManager.instance;
    }

    this.state = {
      // Écran actuel
      currentScreen: 'auth',
      previousScreen: null,

      // Session de jeu
      sessionId: this.generateSessionId(),
      sessionStartTime: Date.now(),
      sessionPlayTime: 0,

      // Mode de jeu actuel
      gameMode: null, // 'simulation', 'farm', 'challenge', 'sandbox'

      // Niveau en cours
      currentLevel: null,
      currentCrop: null,
      currentLocation: null,

      // État du joueur
      player: {
        id: null,
        username: null,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        coins: 0,
        lives: 5,
        premiumCurrency: 0, // Future: gems/diamonds

        // Statistiques
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          totalScore: 0,
          bestScore: 0,
          totalPlayTime: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastPlayDate: null
        },

        // Progression
        unlockedCrops: ['maize'],
        completedLevels: [],
        achievements: [],
        badges: [],

        // Quêtes et défis
        dailyQuests: [],
        weeklyQuests: [],
        challenges: [],

        // Préférences
        preferences: {
          language: 'fr',
          soundEnabled: true,
          musicEnabled: true,
          notificationsEnabled: true,
          tutorialCompleted: false,
          difficulty: 'normal' // easy, normal, hard, expert
        }
      },

      // État de la partie en cours
      currentGame: null,

      // UI State
      ui: {
        modalOpen: null,
        notificationQueue: [],
        tooltipActive: null,
        loadingVisible: false,
        loadingMessage: ''
      },

      // Flags
      flags: {
        isAuthenticated: false,
        isGuest: false,
        isPaused: false,
        isOnline: navigator.onLine,
        backendAvailable: false,
        tutorialActive: false,
        firstTimePlaying: true
      }
    };

    GameStateManager.instance = this;
    this.listeners = new Map();
    this.stateHistory = [];
    this.maxHistorySize = 50;

    console.log('🎮 GameStateManager initialized');
  }

  /**
   * Obtenir l'instance (Singleton)
   */
  static getInstance() {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  /**
   * Générer un ID de session unique
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtenir l'état complet
   */
  getState() {
    return this.state;
  }

  /**
   * Obtenir une partie de l'état
   */
  get(path) {
    const keys = path.split('.');
    let value = this.state;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Mettre à jour l'état (immutable)
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();

    // Sauvegarder l'historique
    this.saveToHistory();

    // Navigation jusqu'au parent
    let target = this.state;
    for (const key of keys) {
      if (!(key in target)) {
        target[key] = {};
      }
      target = target[key];
    }

    // Mise à jour
    const oldValue = target[lastKey];
    target[lastKey] = value;

    // Notifier les listeners
    this.notify(path, value, oldValue);

    // Auto-save pour certains chemins critiques
    if (path.startsWith('player.')) {
      this.autoSave();
    }
  }

  /**
   * Mettre à jour plusieurs valeurs
   */
  setBatch(updates) {
    this.saveToHistory();

    for (const [path, value] of Object.entries(updates)) {
      const keys = path.split('.');
      const lastKey = keys.pop();

      let target = this.state;
      for (const key of keys) {
        if (!(key in target)) {
          target[key] = {};
        }
        target = target[key];
      }

      target[lastKey] = value;
      this.notify(path, value);
    }

    this.autoSave();
  }

  /**
   * Incrémenter une valeur numérique
   */
  increment(path, amount = 1) {
    const current = this.get(path) || 0;
    this.set(path, current + amount);
  }

  /**
   * Décrémenter une valeur numérique
   */
  decrement(path, amount = 1) {
    const current = this.get(path) || 0;
    this.set(path, Math.max(0, current - amount));
  }

  /**
   * Ajouter à un tableau
   */
  push(path, item) {
    const array = this.get(path) || [];
    if (!Array.isArray(array)) {
      console.error(`${path} is not an array`);
      return;
    }
    this.set(path, [...array, item]);
  }

  /**
   * Retirer d'un tableau
   */
  remove(path, predicate) {
    const array = this.get(path) || [];
    if (!Array.isArray(array)) {
      console.error(`${path} is not an array`);
      return;
    }

    if (typeof predicate === 'function') {
      this.set(path, array.filter(item => !predicate(item)));
    } else {
      this.set(path, array.filter(item => item !== predicate));
    }
  }

  /**
   * S'abonner aux changements d'état
   */
  subscribe(path, callback) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    this.listeners.get(path).add(callback);

    // Retourner fonction de désabonnement
    return () => {
      const callbacks = this.listeners.get(path);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Notifier les listeners
   */
  notify(path, newValue, oldValue) {
    // Notifier les listeners exacts
    const exactListeners = this.listeners.get(path);
    if (exactListeners) {
      exactListeners.forEach(callback => {
        try {
          callback(newValue, oldValue, path);
        } catch (error) {
          console.error(`Error in listener for ${path}:`, error);
        }
      });
    }

    // Notifier les listeners wildcards (ex: 'player.*')
    const parts = path.split('.');
    for (let i = 1; i <= parts.length; i++) {
      const wildcardPath = parts.slice(0, i).join('.') + '.*';
      const wildcardListeners = this.listeners.get(wildcardPath);
      if (wildcardListeners) {
        wildcardListeners.forEach(callback => {
          try {
            callback(newValue, oldValue, path);
          } catch (error) {
            console.error(`Error in wildcard listener for ${wildcardPath}:`, error);
          }
        });
      }
    }
  }

  /**
   * Sauvegarder dans l'historique
   */
  saveToHistory() {
    const snapshot = JSON.parse(JSON.stringify(this.state));
    this.stateHistory.push({
      state: snapshot,
      timestamp: Date.now()
    });

    // Limiter la taille de l'historique
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  /**
   * Restaurer un état précédent (undo)
   */
  undo() {
    if (this.stateHistory.length > 0) {
      const previous = this.stateHistory.pop();
      this.state = previous.state;
      console.log('↩️ State restored to', new Date(previous.timestamp));
      return true;
    }
    return false;
  }

  /**
   * Sauvegarder l'état dans localStorage
   */
  save() {
    try {
      const saveData = {
        player: this.state.player,
        currentLocation: this.state.currentLocation,
        sessionStats: {
          totalPlayTime: this.state.sessionPlayTime,
          lastSaveTime: Date.now()
        }
      };

      const key = this.getSaveKey();
      localStorage.setItem(key, JSON.stringify(saveData));
      console.log('💾 Game state saved');
      return true;
    } catch (error) {
      console.error('❌ Error saving state:', error);
      return false;
    }
  }

  /**
   * Charger l'état depuis localStorage
   */
  load() {
    try {
      const key = this.getSaveKey();
      const saved = localStorage.getItem(key);

      if (saved) {
        const saveData = JSON.parse(saved);

        // Restaurer les données joueur
        if (saveData.player) {
          this.state.player = { ...this.state.player, ...saveData.player };
        }

        if (saveData.currentLocation) {
          this.state.currentLocation = saveData.currentLocation;
        }

        console.log('📦 Game state loaded');
        return true;
      }
    } catch (error) {
      console.error('❌ Error loading state:', error);
    }
    return false;
  }

  /**
   * Auto-save avec debounce
   */
  autoSave() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(() => {
      this.save();
    }, 2000); // Sauvegarder après 2s d'inactivité
  }

  /**
   * Obtenir la clé de sauvegarde
   */
  getSaveKey() {
    const userId = this.state.player.id || 'guest';
    return `ilerise_state_${userId}`;
  }

  /**
   * Réinitialiser l'état
   */
  reset() {
    const key = this.getSaveKey();
    localStorage.removeItem(key);

    // Garder certaines données
    const language = this.state.player.preferences.language;
    const tutorialCompleted = this.state.player.preferences.tutorialCompleted;

    // Réinitialiser
    this.state = new GameStateManager().state;
    this.state.player.preferences.language = language;
    this.state.player.preferences.tutorialCompleted = tutorialCompleted;

    console.log('🔄 Game state reset');
  }

  /**
   * Méthodes utilitaires pour le gameplay
   */

  // Ajouter de l'XP
  addXP(amount) {
    const currentXP = this.get('player.xp');
    const currentLevel = this.get('player.level');
    const xpToNext = this.get('player.xpToNextLevel');

    let newXP = currentXP + amount;
    let newLevel = currentLevel;
    let leveledUp = false;

    // Vérifier si level up
    while (newXP >= xpToNext) {
      newXP -= xpToNext;
      newLevel++;
      leveledUp = true;
    }

    this.setBatch({
      'player.xp': newXP,
      'player.level': newLevel,
      'player.xpToNextLevel': this.calculateXPForNextLevel(newLevel)
    });

    if (leveledUp) {
      this.notify('player.levelUp', { oldLevel: currentLevel, newLevel });
    }

    return leveledUp;
  }

  // Calculer XP nécessaire pour level suivant
  calculateXPForNextLevel(level) {
    // Formule exponentielle: 100 * (1.5 ^ (level - 1))
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  // Ajouter des coins
  addCoins(amount, source = 'unknown') {
    this.increment('player.coins', amount);
    this.increment('player.stats.totalCoinsEarned', amount);

    // Analytics
    this.trackEvent('coins_earned', { amount, source });
  }

  // Retirer des coins
  spendCoins(amount, purpose = 'unknown') {
    const current = this.get('player.coins');
    if (current >= amount) {
      this.decrement('player.coins', amount);
      this.trackEvent('coins_spent', { amount, purpose });
      return true;
    }
    return false;
  }

  // Vérifier et mettre à jour le streak
  updateStreak() {
    const today = new Date().toDateString();
    const lastPlay = this.get('player.stats.lastPlayDate');

    if (!lastPlay) {
      // Premier jour
      this.setBatch({
        'player.stats.currentStreak': 1,
        'player.stats.longestStreak': 1,
        'player.stats.lastPlayDate': today
      });
      return;
    }

    const lastDate = new Date(lastPlay);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Déjà joué aujourd'hui
      return;
    } else if (diffDays === 1) {
      // Streak continue
      const newStreak = this.get('player.stats.currentStreak') + 1;
      const longest = Math.max(newStreak, this.get('player.stats.longestStreak'));

      this.setBatch({
        'player.stats.currentStreak': newStreak,
        'player.stats.longestStreak': longest,
        'player.stats.lastPlayDate': today
      });

      this.notify('streak.updated', { streak: newStreak, isRecord: newStreak === longest });
    } else {
      // Streak cassé
      this.setBatch({
        'player.stats.currentStreak': 1,
        'player.stats.lastPlayDate': today
      });

      this.notify('streak.broken', {});
    }
  }

  // Démarrer une partie
  startGame(mode, level, crop) {
    this.state.currentGame = {
      id: `game_${Date.now()}`,
      mode,
      level,
      crop,
      startTime: Date.now(),
      score: 0,
      actions: [],
      events: []
    };

    this.set('gameMode', mode);
    this.set('currentLevel', level);
    this.set('currentCrop', crop);

    this.trackEvent('game_started', { mode, level, crop });
  }

  // Terminer une partie
  endGame(result) {
    const game = this.state.currentGame;
    if (!game) return;

    game.endTime = Date.now();
    game.duration = game.endTime - game.startTime;
    game.result = result;

    // Mettre à jour stats
    this.increment('player.stats.gamesPlayed');
    if (result.won) {
      this.increment('player.stats.gamesWon');
    }

    this.increment('player.stats.totalScore', result.score || 0);

    if (result.score > this.get('player.stats.bestScore')) {
      this.set('player.stats.bestScore', result.score);
    }

    this.trackEvent('game_ended', {
      mode: game.mode,
      level: game.level,
      score: result.score,
      won: result.won,
      duration: game.duration
    });

    this.state.currentGame = null;
  }

  // Système d'analytics basique
  trackEvent(eventName, data = {}) {
    const event = {
      name: eventName,
      timestamp: Date.now(),
      sessionId: this.state.sessionId,
      ...data
    };

    // Stocker localement pour analyse
    const eventsKey = 'ilerise_analytics_events';
    const stored = localStorage.getItem(eventsKey);
    const events = stored ? JSON.parse(stored) : [];

    events.push(event);

    // Garder seulement les 1000 derniers événements
    if (events.length > 1000) {
      events.shift();
    }

    localStorage.setItem(eventsKey, JSON.stringify(events));

    console.log('📊 Event tracked:', eventName, data);
  }

  /**
   * Debug helpers
   */
  debug() {
    console.log('🎮 GameState:', this.state);
    return this.state;
  }

  debugListeners() {
    console.log('👂 Active listeners:', this.listeners);
    return this.listeners;
  }
}

// Export singleton instance
export default GameStateManager.getInstance();
