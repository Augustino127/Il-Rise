/**
 * TimeSimulation.js
 * Système de simulation temporelle avec cycle jour/nuit
 * IleRise V3 - NASA Space Apps Challenge 2025
 */

export class TimeSimulation {
  constructor(startDay = 0) {
    this.currentDay = startDay;
    this.currentHour = 6; // Commence à 6h du matin
    this.speed = 1; // Vitesse simulation (1x, 2x, 4x, 8x)
    this.isPaused = false;
    this.isRunning = false;

    // Saisons
    this.seasons = ['dry', 'transition', 'rainy'];
    this.currentSeason = this.calculateSeason(startDay);

    // Périodes de la journée
    this.timeOfDay = this.calculateTimeOfDay(this.currentHour);

    // Événements planifiés
    this.scheduledEvents = [];

    // Callbacks
    this.onDayChange = null;
    this.onHourChange = null;
    this.onSeasonChange = null;

    // Timer pour la simulation
    this.intervalId = null;
  }

  /**
   * Démarrer la simulation temporelle
   * @param {Number} tickRate - Millisecondes entre chaque tick (défaut: 1000ms = 1 heure de jeu/seconde)
   */
  start(tickRate = 1000) {
    if (this.isRunning) {
      console.warn('⚠️ Simulation déjà en cours');
      return;
    }

    this.isRunning = true;
    this.isPaused = false;

    this.intervalId = setInterval(() => {
      if (!this.isPaused) {
        this.tick();
      }
    }, tickRate / this.speed);

    console.log(`▶️ Simulation temporelle démarrée (${this.speed}x)`);
  }

  /**
   * Arrêter la simulation
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('⏹️ Simulation temporelle arrêtée');
    }
  }

  /**
   * Mettre en pause/reprendre
   */
  togglePause() {
    this.isPaused = !this.isPaused;
    console.log(this.isPaused ? '⏸️ Pause' : '▶️ Reprise');
  }

  /**
   * Changer la vitesse de simulation
   * @param {Number} speed - 1, 2, 4, ou 8
   */
  setSpeed(speed) {
    const validSpeeds = [1, 2, 4, 8];
    if (!validSpeeds.includes(speed)) {
      console.warn('⚠️ Vitesse invalide. Utilisez 1, 2, 4 ou 8');
      return;
    }

    this.speed = speed;

    // Redémarrer avec nouvelle vitesse si en cours
    if (this.isRunning) {
      this.stop();
      this.start();
    }

    console.log(`⏩ Vitesse: ${speed}x`);
  }

  /**
   * Tick de simulation (1 heure de jeu)
   */
  tick() {
    const previousHour = this.currentHour;
    const previousDay = this.currentDay;
    const previousSeason = this.currentSeason;

    // Avancer d'une heure
    this.currentHour++;

    // Nouveau jour à 24h
    if (this.currentHour >= 24) {
      this.currentHour = 0;
      this.currentDay++;

      // Callback changement de jour
      if (this.onDayChange) {
        this.onDayChange(this.currentDay);
      }

      // Vérifier changement de saison
      const newSeason = this.calculateSeason(this.currentDay);
      if (newSeason !== previousSeason) {
        this.currentSeason = newSeason;
        if (this.onSeasonChange) {
          this.onSeasonChange(newSeason);
        }
      }

      // Traiter événements planifiés
      this.processScheduledEvents();
    }

    // Mettre à jour période de la journée
    this.timeOfDay = this.calculateTimeOfDay(this.currentHour);

    // Callback changement d'heure
    if (this.onHourChange) {
      this.onHourChange(this.currentHour);
    }
  }

  /**
   * Passer au jour suivant immédiatement
   */
  skipToNextDay() {
    const hoursToSkip = 24 - this.currentHour;
    this.currentHour = 0;
    this.currentDay++;

    console.log(`⏭️ Passage au jour ${this.currentDay}`);

    if (this.onDayChange) {
      this.onDayChange(this.currentDay);
    }

    this.processScheduledEvents();
  }

  /**
   * Calculer la saison selon le jour
   * @param {Number} day
   * @returns {String} 'dry', 'transition', 'rainy'
   */
  calculateSeason(day) {
    const dayOfYear = day % 365;

    // Bénin: saison sèche (nov-mars), transition (avril-mai), rainy (juin-oct)
    if (dayOfYear >= 305 || dayOfYear < 90) return 'dry';       // Nov-Mars
    if (dayOfYear >= 90 && dayOfYear < 150) return 'transition'; // Avril-Mai
    return 'rainy';                                              // Juin-Oct
  }

  /**
   * Calculer la période de la journée
   * @param {Number} hour
   * @returns {String}
   */
  calculateTimeOfDay(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Planifier un événement
   * @param {Number} day - Jour d'exécution
   * @param {Function} callback
   * @param {String} description
   */
  scheduleEvent(day, callback, description = 'Event') {
    this.scheduledEvents.push({
      day,
      callback,
      description,
      executed: false
    });

    this.scheduledEvents.sort((a, b) => a.day - b.day);
    console.log(`📅 Événement planifié: ${description} (Jour ${day})`);
  }

  /**
   * Traiter les événements du jour actuel
   */
  processScheduledEvents() {
    const eventsToday = this.scheduledEvents.filter(
      e => e.day === this.currentDay && !e.executed
    );

    for (const event of eventsToday) {
      console.log(`🎬 Exécution événement: ${event.description}`);
      event.callback();
      event.executed = true;
    }

    // Nettoyer les événements passés
    this.scheduledEvents = this.scheduledEvents.filter(e => e.day >= this.currentDay);
  }

  /**
   * Obtenir les prochains événements
   * @param {Number} limit
   * @returns {Array}
   */
  getUpcomingEvents(limit = 5) {
    return this.scheduledEvents
      .filter(e => e.day > this.currentDay)
      .slice(0, limit)
      .map(e => ({
        day: e.day,
        daysRemaining: e.day - this.currentDay,
        description: e.description
      }));
  }

  /**
   * Obtenir l'état actuel
   * @returns {Object}
   */
  getState() {
    return {
      day: this.currentDay,
      hour: this.currentHour,
      timeOfDay: this.timeOfDay,
      season: this.currentSeason,
      speed: this.speed,
      isPaused: this.isPaused,
      isRunning: this.isRunning,
      formattedTime: this.getFormattedTime(),
      upcomingEvents: this.getUpcomingEvents(3)
    };
  }

  /**
   * Obtenir le temps formaté
   * @returns {String}
   */
  getFormattedTime() {
    const hour = this.currentHour.toString().padStart(2, '0');
    return `Jour ${this.currentDay} - ${hour}:00`;
  }

  /**
   * Obtenir l'icône météo selon la saison
   * @returns {String}
   */
  getWeatherIcon() {
    const icons = {
      dry: '☀️',
      transition: '⛅',
      rainy: '🌧️'
    };
    return icons[this.currentSeason] || '🌤️';
  }

  /**
   * Calculer les modificateurs environnementaux
   * Basé sur l'heure et la saison
   * @returns {Object}
   */
  getEnvironmentModifiers() {
    const modifiers = {
      temperature: 28,
      sunlight: 1.0,
      rainfall: 0,
      evaporation: 1.0
    };

    // Modifications selon l'heure
    if (this.timeOfDay === 'night') {
      modifiers.temperature -= 8;
      modifiers.sunlight = 0;
      modifiers.evaporation = 0.3;
    } else if (this.timeOfDay === 'morning' || this.timeOfDay === 'evening') {
      modifiers.temperature -= 3;
      modifiers.sunlight = 0.7;
      modifiers.evaporation = 0.7;
    } else if (this.timeOfDay === 'afternoon') {
      modifiers.temperature += 2;
      modifiers.sunlight = 1.0;
      modifiers.evaporation = 1.5;
    }

    // Modifications selon la saison
    if (this.currentSeason === 'dry') {
      modifiers.evaporation *= 1.5;
      modifiers.rainfall = 0;
    } else if (this.currentSeason === 'rainy') {
      modifiers.evaporation *= 0.7;
      modifiers.rainfall = Math.random() > 0.6 ? 10 : 0; // 40% de pluie
    } else {
      modifiers.rainfall = Math.random() > 0.8 ? 5 : 0; // 20% de pluie
    }

    return modifiers;
  }

  /**
   * Sauvegarder l'état
   * @param {String} key
   */
  save(key = 'ilerise_time') {
    const data = {
      currentDay: this.currentDay,
      currentHour: this.currentHour,
      speed: this.speed,
      currentSeason: this.currentSeason,
      scheduledEvents: this.scheduledEvents.filter(e => !e.executed)
    };

    localStorage.setItem(key, JSON.stringify(data));
    console.log('💾 État temporel sauvegardé');
  }

  /**
   * Charger l'état
   * @param {String} key
   */
  load(key = 'ilerise_time') {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        this.currentDay = data.currentDay;
        this.currentHour = data.currentHour;
        this.speed = data.speed;
        this.currentSeason = data.currentSeason;
        this.scheduledEvents = data.scheduledEvents || [];
        this.timeOfDay = this.calculateTimeOfDay(this.currentHour);

        console.log('📦 État temporel chargé');
        return true;
      }
    } catch (e) {
      console.error('❌ Erreur chargement état temporel:', e);
    }
    return false;
  }

  /**
   * Réinitialiser
   */
  reset() {
    this.stop();
    this.currentDay = 0;
    this.currentHour = 6;
    this.speed = 1;
    this.isPaused = false;
    this.currentSeason = 'dry';
    this.scheduledEvents = [];
    console.log('🔄 Simulation temporelle réinitialisée');
  }
}
