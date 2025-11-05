/**
 * AudioManager.js
 * Gestionnaire audio centralisé pour sons et musique
 * Support Web Audio API avec fallback HTML5 Audio
 * NASA Space Apps Challenge 2025
 */

import EventBus, { GameEvents } from '../core/EventBus.js';
import GameState from '../core/GameStateManager.js';

export class AudioManager {
  static instance = null;

  constructor() {
    if (AudioManager.instance) {
      return AudioManager.instance;
    }

    this.audioContext = null;
    this.sounds = new Map();
    this.music = new Map();
    this.currentMusic = null;
    this.musicVolume = 0.5;
    this.sfxVolume = 0.7;
    this.initialized = false;

    // Audio pools pour les sons fréquents
    this.pools = new Map();
    this.maxPoolSize = 5;

    AudioManager.instance = this;
  }

  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialiser le système audio
   */
  async init() {
    if (this.initialized) return;

    try {
      // Créer le contexte audio (nécessite interaction utilisateur)
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Charger les préférences
      this.loadPreferences();

      // Pré-charger les sons essentiels
      await this.preloadSounds();

      this.initialized = true;
      console.log('🔊 AudioManager initialized');

      // Setup event listeners
      this.setupEventListeners();
    } catch (error) {
      console.warn('⚠️ AudioManager init failed, using fallback:', error);
      this.initialized = true; // Continuer sans audio
    }
  }

  /**
   * Charger les préférences audio
   */
  loadPreferences() {
    const soundEnabled = GameState.get('player.preferences.soundEnabled');
    const musicEnabled = GameState.get('player.preferences.musicEnabled');

    if (soundEnabled === false) {
      this.sfxVolume = 0;
    }

    if (musicEnabled === false) {
      this.musicVolume = 0;
    }
  }

  /**
   * Pré-charger les sons essentiels
   */
  async preloadSounds() {
    // Définir les sons du jeu
    const soundDefinitions = {
      // UI Sounds
      'click': { url: '/assets/audio/ui/click.mp3', volume: 0.3 },
      'hover': { url: '/assets/audio/ui/hover.mp3', volume: 0.2 },
      'success': { url: '/assets/audio/ui/success.mp3', volume: 0.5 },
      'error': { url: '/assets/audio/ui/error.mp3', volume: 0.5 },
      'notification': { url: '/assets/audio/ui/notification.mp3', volume: 0.4 },

      // Game Sounds
      'coin': { url: '/assets/audio/game/coin.mp3', volume: 0.6, pool: true },
      'xp': { url: '/assets/audio/game/xp.mp3', volume: 0.5 },
      'levelUp': { url: '/assets/audio/game/level-up.mp3', volume: 0.7 },
      'achievement': { url: '/assets/audio/game/achievement.mp3', volume: 0.7 },

      // Farm Sounds
      'plant': { url: '/assets/audio/farm/plant.mp3', volume: 0.5 },
      'water': { url: '/assets/audio/farm/water.mp3', volume: 0.5 },
      'harvest': { url: '/assets/audio/farm/harvest.mp3', volume: 0.6 },
      'fertilize': { url: '/assets/audio/farm/fertilize.mp3', volume: 0.5 },

      // Ambiance
      'birds': { url: '/assets/audio/ambient/birds.mp3', volume: 0.3, loop: true },
      'wind': { url: '/assets/audio/ambient/wind.mp3', volume: 0.2, loop: true },
      'rain': { url: '/assets/audio/ambient/rain.mp3', volume: 0.4, loop: true }
    };

    // Note: Les fichiers audio n'existent pas encore, on créera des placeholders
    // Pour l'instant, le système est prêt à les charger

    for (const [name, def] of Object.entries(soundDefinitions)) {
      this.registerSound(name, def);
    }
  }

  /**
   * Enregistrer un son
   */
  registerSound(name, definition) {
    this.sounds.set(name, {
      ...definition,
      loaded: false,
      buffer: null,
      instances: []
    });

    // Créer un pool si nécessaire
    if (definition.pool) {
      this.createPool(name);
    }
  }

  /**
   * Créer un pool d'instances audio
   */
  createPool(soundName) {
    const pool = [];
    for (let i = 0; i < this.maxPoolSize; i++) {
      const audio = new Audio();
      audio.preload = 'auto';
      pool.push({
        audio,
        playing: false
      });
    }
    this.pools.set(soundName, pool);
  }

  /**
   * Obtenir une instance audio disponible du pool
   */
  getFromPool(soundName) {
    const pool = this.pools.get(soundName);
    if (!pool) return null;

    // Trouver une instance libre
    const available = pool.find(item => !item.playing);
    if (available) {
      return available;
    }

    // Sinon, réutiliser la plus ancienne
    return pool[0];
  }

  /**
   * Jouer un son
   */
  play(soundName, options = {}) {
    if (!this.initialized) {
      console.warn('AudioManager not initialized');
      return null;
    }

    const sound = this.sounds.get(soundName);
    if (!sound) {
      console.warn(`Sound '${soundName}' not found`);
      return null;
    }

    // Vérifier si les SFX sont activés
    if (this.sfxVolume === 0 && !sound.loop) {
      return null;
    }

    try {
      // Utiliser le pool si disponible
      if (this.pools.has(soundName)) {
        return this.playFromPool(soundName, sound, options);
      }

      // Sinon, créer une nouvelle instance
      return this.playNew(soundName, sound, options);
    } catch (error) {
      console.error(`Error playing sound '${soundName}':`, error);
      return null;
    }
  }

  /**
   * Jouer un son depuis le pool
   */
  playFromPool(soundName, sound, options) {
    const poolItem = this.getFromPool(soundName);
    if (!poolItem) return null;

    const { audio } = poolItem;
    audio.volume = (options.volume !== undefined ? options.volume : sound.volume) * this.sfxVolume;
    audio.currentTime = 0;

    poolItem.playing = true;

    audio.onended = () => {
      poolItem.playing = false;
    };

    audio.play().catch(e => console.warn('Audio play failed:', e));

    return audio;
  }

  /**
   * Jouer un nouveau son
   */
  playNew(soundName, sound, options) {
    const audio = new Audio(sound.url);
    audio.volume = (options.volume !== undefined ? options.volume : sound.volume) * this.sfxVolume;
    audio.loop = options.loop || sound.loop || false;

    audio.play().catch(e => console.warn('Audio play failed:', e));

    return audio;
  }

  /**
   * Jouer de la musique
   */
  playMusic(musicName, options = {}) {
    if (!this.initialized) {
      console.warn('AudioManager not initialized');
      return;
    }

    // Arrêter la musique actuelle
    if (this.currentMusic) {
      this.stopMusic(options.fadeOut || 1000);
    }

    // Créer la nouvelle musique
    const music = new Audio();
    music.src = `/assets/audio/music/${musicName}.mp3`;
    music.loop = true;
    music.volume = 0;

    this.currentMusic = {
      name: musicName,
      audio: music,
      targetVolume: this.musicVolume
    };

    music.play().catch(e => console.warn('Music play failed:', e));

    // Fade in
    this.fadeIn(music, this.musicVolume, options.fadeIn || 2000);

    EventBus.emit(GameEvents.MUSIC_PLAY, { name: musicName });
  }

  /**
   * Arrêter la musique
   */
  stopMusic(fadeOut = 1000) {
    if (!this.currentMusic) return;

    const { audio } = this.currentMusic;

    if (fadeOut > 0) {
      this.fadeOut(audio, fadeOut, () => {
        audio.pause();
        audio.currentTime = 0;
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }

    this.currentMusic = null;
    EventBus.emit(GameEvents.MUSIC_STOP);
  }

  /**
   * Fade in
   */
  fadeIn(audio, targetVolume, duration) {
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = targetVolume / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(volumeStep * currentStep, targetVolume);

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);
  }

  /**
   * Fade out
   */
  fadeOut(audio, duration, callback) {
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = audio.volume / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(audio.volume - volumeStep, 0);

      if (currentStep >= steps) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, stepDuration);
  }

  /**
   * Définir le volume des SFX
   */
  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    GameState.set('player.preferences.soundEnabled', volume > 0);
  }

  /**
   * Définir le volume de la musique
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));

    if (this.currentMusic) {
      this.currentMusic.audio.volume = this.musicVolume;
      this.currentMusic.targetVolume = this.musicVolume;
    }

    GameState.set('player.preferences.musicEnabled', volume > 0);
  }

  /**
   * Activer/désactiver les sons
   */
  toggleSound() {
    const enabled = this.sfxVolume > 0;
    this.setSFXVolume(enabled ? 0 : 0.7);
    return !enabled;
  }

  /**
   * Activer/désactiver la musique
   */
  toggleMusic() {
    const enabled = this.musicVolume > 0;
    this.setMusicVolume(enabled ? 0 : 0.5);
    return !enabled;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Jouer des sons sur certains événements
    EventBus.on(GameEvents.PLAYER_COINS_CHANGED, (data) => {
      if (data.delta > 0) {
        this.play('coin');
      }
    });

    EventBus.on(GameEvents.PLAYER_XP_GAINED, () => {
      this.play('xp');
    });

    EventBus.on(GameEvents.PLAYER_LEVEL_UP, () => {
      this.play('levelUp');
    });

    EventBus.on(GameEvents.ACHIEVEMENT_UNLOCKED, () => {
      this.play('achievement');
    });

    EventBus.on(GameEvents.FARM_CROP_PLANTED, () => {
      this.play('plant');
    });

    EventBus.on(GameEvents.FARM_CROP_WATERED, () => {
      this.play('water');
    });

    EventBus.on(GameEvents.FARM_CROP_HARVESTED, () => {
      this.play('harvest');
    });

    // Musique selon l'écran
    EventBus.on(GameEvents.SCREEN_CHANGE, (data) => {
      this.handleScreenChange(data.screen);
    });
  }

  /**
   * Gérer le changement d'écran
   */
  handleScreenChange(screen) {
    const musicMap = {
      'home': 'menu',
      'game': 'gameplay',
      'farmV3': 'farm',
      'results': 'victory'
    };

    const musicName = musicMap[screen];
    if (musicName && this.currentMusic?.name !== musicName) {
      // Commenté pour l'instant car les fichiers n'existent pas
      // this.playMusic(musicName);
    }
  }

  /**
   * Créer des sons synthétiques (pour prototypage rapide)
   */
  createSyntheticSound(frequency = 440, duration = 200, type = 'sine') {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }

  /**
   * Sons synthétiques prédéfinis
   */
  playClickSound() {
    this.createSyntheticSound(800, 50, 'square');
  }

  playSuccessSound() {
    this.createSyntheticSound(523, 100, 'sine'); // C5
    setTimeout(() => this.createSyntheticSound(659, 100, 'sine'), 100); // E5
    setTimeout(() => this.createSyntheticSound(784, 200, 'sine'), 200); // G5
  }

  playErrorSound() {
    this.createSyntheticSound(200, 200, 'sawtooth');
  }

  playNotificationSound() {
    this.createSyntheticSound(880, 100, 'sine');
    setTimeout(() => this.createSyntheticSound(1046, 150, 'sine'), 150);
  }
}

// Export singleton instance
export default AudioManager.getInstance();
