/**
 * Level.js
 * Gestion des niveaux de jeu
 * NASA Space Apps Challenge 2025
 */

import { SimulationEngine } from './SimulationEngine.js';
import { NASARecommendations } from './NASARecommendations.js';

export class Level {
  constructor(levelId, crop, cityName, nasaData, levelData = null) {
    this.levelId = levelId;
    this.crop = crop;
    this.cityName = cityName;
    this.nasaData = nasaData;
    this.levelData = levelData; // 🆕 Stocker les données du niveau (targetYield, etc.)

    // État curseurs
    this.cursors = {
      water: 50,
      npk: 50,
      ph: 6.5
    };

    // Simulation
    this.simulationEngine = new SimulationEngine(crop, nasaData);
    this.nasaRecommendations = new NASARecommendations(crop, nasaData, levelData);
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
   * Obtenir recommandations NASA (utilise NASARecommendations.js)
   */
  getRecommendations() {
    const nasaRecs = this.nasaRecommendations.generateRecommendations();
    const recommendations = [];

    // Recommandation eau (basée SMAP + analyse intelligente)
    const moistureAnalysis = nasaRecs.moisture;
    recommendations.push({
      type: 'water',
      level: moistureAnalysis.status === 'critical' ? 'urgent' :
             moistureAnalysis.status === 'warning' ? 'warning' : 'ok',
      message: moistureAnalysis.action,
      suggestion: moistureAnalysis.irrigationRecommended
    });

    // Recommandation température (basée MODIS)
    const tempAnalysis = nasaRecs.temperature;
    recommendations.push({
      type: 'temperature',
      level: tempAnalysis.status === 'critical' ? 'urgent' :
             tempAnalysis.status === 'warning' ? 'warning' : 'ok',
      message: tempAnalysis.action,
      suggestion: null
    });

    // Recommandation NPK (basée NDVI + besoins culture)
    const npkAnalysis = nasaRecs.npk;
    recommendations.push({
      type: 'npk',
      level: 'info',
      message: npkAnalysis.action,
      suggestion: npkAnalysis.recommended
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
    const targetYield = this.levelData?.targetYield;
    const maxYield = this.levelData?.maxYield || this.crop?.maxYield;

    if (!targetYield) {
      console.error('⚠️ targetYield manquant dans levelData');
    }

    // ⚠️ IMPORTANT : Utiliser levelData.maxYield si disponible (change par niveau)
    // Sinon fallback sur crop.maxYield (valeur de base)
    if (maxYield && maxYield !== this.simulationEngine.crop.maxYield) {
      this.simulationEngine.crop.maxYield = maxYield;
    }

    this.results = this.simulationEngine.calculateYield(
      this.cursors.water,
      this.cursors.npk,
      this.cursors.ph,
      targetYield
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

    // ⚠️ IMPORTANT : Toujours utiliser levelData.targetYield (requis)
    // crop.targetYield est obsolète et ne correspond pas aux niveaux individuels
    const targetYield = this.levelData?.targetYield;
    if (!targetYield) {
      console.error('⚠️ targetYield manquant dans levelData');
      return false;
    }
    return this.results.actualYield >= targetYield;
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
