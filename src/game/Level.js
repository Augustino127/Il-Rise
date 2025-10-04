/**
 * Level.js
 * Gestion des niveaux de jeu
 * NASA Space Apps Challenge 2025
 */

import { SimulationEngine } from './SimulationEngine.js';

export class Level {
  constructor(levelId, crop, cityName, nasaData) {
    this.levelId = levelId;
    this.crop = crop;
    this.cityName = cityName;
    this.nasaData = nasaData;

    // État curseurs
    this.cursors = {
      water: 50,
      npk: 50,
      ph: 6.5
    };

    // Simulation
    this.simulationEngine = new SimulationEngine(crop, nasaData);
    this.results = null;
    this.isCompleted = false;
  }

  /**
   * Mettre à jour curseur eau
   */
  setWater(value) {
    this.cursors.water = Math.max(0, Math.min(100, value));
  }

  /**
   * Mettre à jour curseur NPK
   */
  setNPK(value) {
    this.cursors.npk = Math.max(0, Math.min(150, value));
  }

  /**
   * Mettre à jour curseur pH
   */
  setPH(value) {
    this.cursors.ph = Math.max(4.0, Math.min(8.0, value));
  }

  /**
   * Obtenir valeurs curseurs
   */
  getCursors() {
    return { ...this.cursors };
  }

  /**
   * Obtenir recommandations NASA
   */
  getRecommendations() {
    const recommendations = [];

    // Recommandation eau (basée SMAP)
    const soilMoisture = this.nasaData?.soilMoisture?.current_percent || 20;

    if (soilMoisture < 20) {
      recommendations.push({
        type: 'water',
        level: 'urgent',
        message: `Sol très sec (${soilMoisture}%). Irrigation urgente recommandée.`,
        suggestion: this.crop.waterNeed.optimal - soilMoisture
      });
    } else if (soilMoisture < this.crop.waterNeed.min) {
      recommendations.push({
        type: 'water',
        level: 'warning',
        message: `Sol sec (${soilMoisture}%). Irrigation recommandée.`,
        suggestion: this.crop.waterNeed.optimal - soilMoisture
      });
    } else {
      recommendations.push({
        type: 'water',
        level: 'ok',
        message: `Humidité du sol acceptable (${soilMoisture}%).`,
        suggestion: Math.max(0, this.crop.waterNeed.optimal - soilMoisture)
      });
    }

    // Recommandation température (basée MODIS)
    const currentTemp = this.nasaData?.temperature?.current_c || 28;

    if (currentTemp > this.crop.tempRange.max) {
      recommendations.push({
        type: 'temperature',
        level: 'warning',
        message: `Température élevée (${currentTemp}°C). Augmenter irrigation pour compenser stress thermique.`,
        suggestion: null
      });
    } else if (currentTemp < this.crop.tempRange.min) {
      recommendations.push({
        type: 'temperature',
        level: 'warning',
        message: `Température basse (${currentTemp}°C). Croissance ralentie possible.`,
        suggestion: null
      });
    } else {
      recommendations.push({
        type: 'temperature',
        level: 'ok',
        message: `Température idéale (${currentTemp}°C) pour ${this.crop.name.fr}.`,
        suggestion: null
      });
    }

    // Recommandation NPK
    recommendations.push({
      type: 'npk',
      level: 'info',
      message: `Apport optimal pour ${this.crop.name.fr} : ${this.crop.npkNeed.optimal} kg/ha.`,
      suggestion: this.crop.npkNeed.optimal
    });

    // Recommandation pH
    recommendations.push({
      type: 'ph',
      level: 'info',
      message: `pH optimal : ${this.crop.phRange.optimal}`,
      suggestion: this.crop.phRange.optimal
    });

    return recommendations;
  }

  /**
   * Lancer simulation
   */
  runSimulation() {
    this.results = this.simulationEngine.calculateYield(
      this.cursors.water,
      this.cursors.npk,
      this.cursors.ph
    );

    this.isCompleted = true;

    return this.results;
  }

  /**
   * Obtenir résultats
   */
  getResults() {
    return this.results;
  }

  /**
   * Vérifier si niveau réussi
   */
  isSuccess() {
    if (!this.results) return false;

    return this.results.actualYield >= this.crop.targetYield;
  }

  /**
   * Obtenir score
   */
  getScore() {
    return this.results?.score || 0;
  }

  /**
   * Obtenir étoiles
   */
  getStars() {
    return this.results?.stars || 0;
  }

  /**
   * Réinitialiser niveau
   */
  reset() {
    this.cursors = {
      water: 50,
      npk: 50,
      ph: 6.5
    };
    this.results = null;
    this.isCompleted = false;
  }

  /**
   * Obtenir résumé pour affichage
   */
  getSummary() {
    return {
      levelId: this.levelId,
      cropName: this.crop.name.fr,
      cropEmoji: this.crop.emoji,
      city: this.cityName,
      targetYield: this.crop.targetYield,
      maxYield: this.crop.maxYield,
      cursors: this.getCursors(),
      recommendations: this.getRecommendations(),
      nasaData: {
        temperature: this.nasaData?.temperature?.current_c,
        soilMoisture: this.nasaData?.soilMoisture?.current_percent,
        ndvi: this.nasaData?.ndvi?.current,
        precipitation: this.nasaData?.precipitation?.total_mm
      }
    };
  }
}
