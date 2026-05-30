/**
 * GameConditionsEngine.js
 * Génère des conditions météo dynamiques et des événements surprises
 * Générique — fonctionne pour n'importe quelle région tropicale/subtropicale
 */

// ─── Définition des événements surprises ────────────────────────────────────

const SURPRISE_EVENTS = [
  {
    id: 'heatwave',
    icon: '🌡️',
    title: 'Canicule !',
    desc: 'Température extrême. L\'humidité du sol s\'évapore 3× plus vite.',
    color: '#e74c3c',
    duration: 3,         // jours
    rarity: 0.06,        // probabilité par jour
    impact: {
      soilMoistureDelta: -8,   // par jour
      growthModifier: 0.6,
      pestDelta: +5,
    },
    sky: 0xFFCC88,
    sceneEffect: 'heat',
  },
  {
    id: 'storm',
    icon: '⛈️',
    title: 'Tempête violente !',
    desc: 'Pluies torrentielles. Sol saturé, risque de pourriture.',
    color: '#2980b9',
    duration: 2,
    rarity: 0.05,
    impact: {
      soilMoistureDelta: +20,  // instantané
      weedDelta: +10,
      healthDelta: -10,        // choc sur les plants
    },
    sky: 0x445566,
    sceneEffect: 'storm',
  },
  {
    id: 'pest_invasion',
    icon: '🪲',
    title: 'Invasion de parasites !',
    desc: 'Une colonie envahit tes parcelles. Applique le pesticide rapidement.',
    color: '#8e44ad',
    duration: 4,
    rarity: 0.05,
    impact: {
      pestDelta: +35,
      healthDelta: -8,
    },
    sky: 0x556644,
    sceneEffect: 'pest',
  },
  {
    id: 'drought',
    icon: '🏜️',
    title: 'Sécheresse !',
    desc: 'Pas une goutte de pluie prévue. Tes réserves d\'eau sont critiques.',
    color: '#e67e22',
    duration: 5,
    rarity: 0.04,
    impact: {
      soilMoistureDelta: -6,
      growthModifier: 0.5,
    },
    sky: 0xDDAA66,
    sceneEffect: 'drought',
  },
  {
    id: 'perfect_weather',
    icon: '🌤️',
    title: 'Météo parfaite !',
    desc: 'Conditions idéales. La croissance est doublée pendant 3 jours.',
    color: '#27ae60',
    duration: 3,
    rarity: 0.06,
    impact: {
      soilMoistureDelta: +2,
      growthModifier: 2.0,
      healthDelta: +5,
    },
    sky: 0xAADDFF,
    sceneEffect: 'perfect',
  },
  {
    id: 'locust',
    icon: '🦗',
    title: 'Nuée de criquets !',
    desc: 'Une nuée dévaste les cultures non protégées. Agis maintenant !',
    color: '#c0392b',
    duration: 2,
    rarity: 0.03,
    impact: {
      healthDelta: -25,
      pestDelta: +50,
    },
    sky: 0x887733,
    sceneEffect: 'pest',
  },
  {
    id: 'heavy_rain',
    icon: '🌧️',
    title: 'Pluies abondantes',
    desc: 'Bonne nouvelle : arrosage gratuit pendant 3 jours.',
    color: '#2980b9',
    duration: 3,
    rarity: 0.07,
    impact: {
      soilMoistureDelta: +5,
      weedDelta: +8,
    },
    sky: 0x6699AA,
    sceneEffect: 'rain',
  },
  {
    id: 'fertile_soil',
    icon: '✨',
    title: 'Sol exceptionnellement fertile !',
    desc: 'Une pluie minérale naturelle enrichit ton sol. +NPK sur toutes les parcelles.',
    color: '#27ae60',
    duration: 1,
    rarity: 0.04,
    impact: {
      npkDelta: +20,
      soilQualityDelta: +10,
    },
    sky: 0x99CCAA,
    sceneEffect: 'perfect',
  },
  {
    id: 'wind',
    icon: '💨',
    title: 'Vents violents',
    desc: 'L\'harmattan dessèche rapidement. L\'humidité s\'évapore plus vite.',
    color: '#95a5a6',
    duration: 3,
    rarity: 0.06,
    impact: {
      soilMoistureDelta: -4,
      growthModifier: 0.8,
    },
    sky: 0xCCBBAA,
    sceneEffect: 'wind',
  },
];

// ─── Saisons génériques ──────────────────────────────────────────────────────

const SEASONS = [
  { name: 'Saison sèche',    icon: '☀️',  moistureDecay: 3.5, rainChance: 0.05, growthBase: 0.9 },
  { name: 'Petite saison',   icon: '🌦️',  moistureDecay: 1.5, rainChance: 0.35, growthBase: 1.1 },
  { name: 'Saison des pluies', icon: '🌧️', moistureDecay: 0.5, rainChance: 0.60, growthBase: 1.2 },
  { name: 'Transition',      icon: '🍂',  moistureDecay: 2.0, rainChance: 0.20, growthBase: 1.0 },
];

export class GameConditionsEngine {
  constructor() {
    this.currentDay = 0;
    this.activeEvent = null;       // événement en cours
    this.eventDaysLeft = 0;
    this.season = SEASONS[0];
    this.seasonDayCounter = 0;
    this.SEASON_LENGTH = 25;       // jours par saison

    // Callbacks
    this.onEventStart = null;      // (event) => void
    this.onEventEnd   = null;      // (event) => void
    this.onDayUpdate  = null;      // (conditions) => void
  }

  /**
   * Avancer d'un jour — retourne les conditions du jour et l'événement actif
   */
  tick(day) {
    this.currentDay = day;
    this.seasonDayCounter++;

    // Changer de saison tous les SEASON_LENGTH jours
    if (this.seasonDayCounter >= this.SEASON_LENGTH) {
      this.seasonDayCounter = 0;
      const idx = SEASONS.indexOf(this.season);
      this.season = SEASONS[(idx + 1) % SEASONS.length];
    }

    // Gérer événement en cours
    if (this.activeEvent) {
      this.eventDaysLeft--;
      if (this.eventDaysLeft <= 0) {
        const ended = this.activeEvent;
        this.activeEvent = null;
        this.eventDaysLeft = 0;
        if (this.onEventEnd) this.onEventEnd(ended);
      }
    }

    // Tenter un nouvel événement surprise (seulement si pas d'événement actif)
    if (!this.activeEvent) {
      const triggered = this._rollForEvent();
      if (triggered) {
        this.activeEvent = triggered;
        this.eventDaysLeft = triggered.duration;
        if (this.onEventStart) this.onEventStart(triggered);
      }
    }

    // Conditions du jour
    const conditions = this._buildConditions();
    if (this.onDayUpdate) this.onDayUpdate(conditions);

    return conditions;
  }

  /**
   * Conditions courantes (sans avancer le temps)
   */
  getCurrentConditions() {
    return this._buildConditions();
  }

  /**
   * Appliquer l'impact de l'événement actif sur une parcelle
   */
  applyEventToPlot(plot) {
    if (!this.activeEvent) return;
    const imp = this.activeEvent.impact;

    if (imp.soilMoistureDelta)
      plot.soilMoisture = Math.max(0, Math.min(100, plot.soilMoisture + imp.soilMoistureDelta));
    if (imp.pestDelta)
      plot.pestLevel = Math.max(0, Math.min(100, (plot.pestLevel || 0) + imp.pestDelta));
    if (imp.weedDelta)
      plot.weedLevel = Math.max(0, Math.min(100, (plot.weedLevel || 0) + imp.weedDelta));
    if (imp.healthDelta && plot.isPlanted)
      plot.health = Math.max(0, Math.min(100, (plot.health || 100) + imp.healthDelta));
    if (imp.npkDelta)
      plot.npkLevel = Math.max(0, Math.min(150, (plot.npkLevel || 0) + imp.npkDelta));
    if (imp.soilQualityDelta)
      plot.soilQuality = Math.max(0, Math.min(100, (plot.soilQuality || 50) + imp.soilQualityDelta));
  }

  /**
   * Modificateur de croissance actuel (pour SimulationEngine)
   */
  getGrowthModifier() {
    let mod = this.season.growthBase;
    if (this.activeEvent?.impact.growthModifier)
      mod *= this.activeEvent.impact.growthModifier;
    return mod;
  }

  /**
   * Pluie naturelle du jour (en % d'humidité ajoutée)
   */
  getDailyRain() {
    if (this.activeEvent?.id === 'drought') return 0;
    if (Math.random() < this.season.rainChance) {
      return this.activeEvent?.id === 'storm' ? 20
           : this.activeEvent?.id === 'heavy_rain' ? 8
           : 3 + Math.random() * 4;
    }
    return 0;
  }

  /**
   * Évaporation du jour (en % d'humidité retirée)
   */
  getDailyEvaporation() {
    let base = this.season.moistureDecay;
    if (this.activeEvent?.id === 'heatwave') base *= 3;
    if (this.activeEvent?.id === 'wind')     base *= 2;
    if (this.activeEvent?.id === 'drought')  base *= 2;
    return base;
  }

  // ─── Privé ────────────────────────────────────────────────────────────────

  _rollForEvent() {
    for (const event of SURPRISE_EVENTS) {
      if (Math.random() < event.rarity) return event;
    }
    return null;
  }

  _buildConditions() {
    const rain = this.getDailyRain();
    const evap = this.getDailyEvaporation();
    const tempBase = 24 + Math.sin(this.currentDay / 15) * 6;
    const temp = Math.round(tempBase + (Math.random() - 0.5) * 3);

    return {
      season: this.season,
      temperature: temp,
      rainfall: Math.round(rain * 10) / 10,
      evaporation: Math.round(evap * 10) / 10,
      growthModifier: this.getGrowthModifier(),
      activeEvent: this.activeEvent,
      eventDaysLeft: this.eventDaysLeft,
    };
  }
}
