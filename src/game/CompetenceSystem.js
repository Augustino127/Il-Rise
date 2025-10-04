/**
 * CompetenceSystem.js
 * Systeme de progression base sur 5 competences
 * NASA Space Apps Challenge 2025
 */

export class CompetenceSystem {
  constructor() {
    this.competences = {
      water: { name: 'Water Management', weight: 0.25, emoji: '💧' },
      npk: { name: 'NPK Management', weight: 0.25, emoji: '🌱' },
      soil: { name: 'Soil Management', weight: 0.20, emoji: '🏜️' },
      rotation: { name: 'Crop Rotation', weight: 0.15, emoji: '🔄' },
      nasa: { name: 'NASA Data Usage', weight: 0.15, emoji: '🛰️' }
    };

    this.starThresholds = {
      1: { min: 0, max: 50 },   // 1 etoile - Echec
      2: { min: 50, max: 75 },  // 2 etoiles - Moyen
      3: { min: 75, max: 100 }  // 3 etoiles - Excellent
    };
  }

  /**
   * Calcul du score global base sur les 5 competences
   * @param {Object} gameData - Donnees de la partie jouee
   * @returns {Object} { scores, globalScore, stars }
   */
  calculateCompetenceScore(gameData) {
    const scores = {
      water: this.calculateWaterScore(gameData),
      npk: this.calculateNPKScore(gameData),
      soil: this.calculateSoilScore(gameData),
      rotation: this.calculateRotationScore(gameData),
      nasa: this.calculateNASAScore(gameData)
    };

    // Score global pondere
    const globalScore =
      scores.water * this.competences.water.weight +
      scores.npk * this.competences.npk.weight +
      scores.soil * this.competences.soil.weight +
      scores.rotation * this.competences.rotation.weight +
      scores.nasa * this.competences.nasa.weight;

    const stars = this.calculateStars(globalScore);

    return {
      scores,
      globalScore: Math.round(globalScore * 10) / 10, // Arrondi a 1 decimale
      stars,
      details: this.getScoreDetails(scores, globalScore)
    };
  }

  /**
   * 1. WATER MANAGEMENT (25%)
   * Evaluation de la gestion de l'irrigation
   */
  calculateWaterScore(gameData) {
    const { crop, irrigation, weather, soilMoisture } = gameData;

    if (!crop || !crop.water_requirements) {
      console.warn('Donnees de culture manquantes pour Water Score');
      return 0;
    }

    const optimalMin = crop.water_requirements.min_mm || 400;
    const optimalMax = crop.water_requirements.max_mm || 800;
    const actualIrrigation = irrigation || 0;
    const actualMoisture = soilMoisture || 20;

    let score = 0;

    // 1. Verification irrigation dans la plage optimale (60 points)
    if (actualIrrigation >= optimalMin && actualIrrigation <= optimalMax) {
      score += 60;
    } else if (actualIrrigation < optimalMin) {
      // Penalite si deficit
      const deficit = optimalMin - actualIrrigation;
      score += Math.max(0, 60 - (deficit / optimalMin) * 60);
    } else {
      // Penalite si exces
      const excess = actualIrrigation - optimalMax;
      score += Math.max(0, 60 - (excess / optimalMax) * 60);
    }

    // 2. Humidite du sol optimale (30 points)
    const optimalMoisture = 40; // 40% ideal
    const moistureDiff = Math.abs(actualMoisture - optimalMoisture);
    score += Math.max(0, 30 - (moistureDiff / optimalMoisture) * 30);

    // 3. Adaptation aux conditions meteorologiques (10 points)
    if (weather === 'dry' && actualIrrigation > optimalMin) {
      score += 10;
    } else if (weather === 'rainy' && actualIrrigation < optimalMax) {
      score += 10;
    } else if (weather === 'optimal') {
      score += 5;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * 2. NPK MANAGEMENT (25%)
   * Evaluation de la gestion des nutriments
   */
  calculateNPKScore(gameData) {
    const { crop, npk, budget } = gameData;

    if (!crop || !crop.nutrient_requirements) {
      console.warn('Donnees de culture manquantes pour NPK Score');
      return 0;
    }

    const optimalN = crop.nutrient_requirements.nitrogen?.optimal || 100;
    const optimalP = crop.nutrient_requirements.phosphorus?.optimal || 50;
    const optimalK = crop.nutrient_requirements.potassium?.optimal || 80;

    const actualN = npk?.nitrogen || 0;
    const actualP = npk?.phosphorus || 0;
    const actualK = npk?.potassium || 0;

    let score = 0;

    // 1. Azote (N) - 35 points
    const nDiff = Math.abs(actualN - optimalN);
    score += Math.max(0, 35 - (nDiff / optimalN) * 35);

    // 2. Phosphore (P) - 30 points
    const pDiff = Math.abs(actualP - optimalP);
    score += Math.max(0, 30 - (pDiff / optimalP) * 30);

    // 3. Potassium (K) - 25 points
    const kDiff = Math.abs(actualK - optimalK);
    score += Math.max(0, 25 - (kDiff / optimalK) * 25);

    // 4. Efficience budgetaire (10 points)
    if (budget && budget.spent !== undefined && budget.max !== undefined) {
      const efficiency = 1 - (budget.spent / budget.max);
      score += efficiency * 10;
    } else {
      score += 5; // Score par defaut si pas de budget
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * 3. SOIL MANAGEMENT (20%)
   * Evaluation de la gestion du sol
   */
  calculateSoilScore(gameData) {
    const { crop, soil } = gameData;

    if (!crop || !crop.soil_requirements) {
      console.warn('Donnees de culture manquantes pour Soil Score');
      return 0;
    }

    const optimalPH_min = crop.soil_requirements.ph?.min || 6.0;
    const optimalPH_max = crop.soil_requirements.ph?.max || 7.0;
    const actualPH = soil?.ph || 6.5;
    const actualTexture = soil?.texture || 'unknown';
    const preferredTextures = crop.soil_requirements.texture?.preferred || ['loam'];

    let score = 0;

    // 1. pH optimal (60 points)
    if (actualPH >= optimalPH_min && actualPH <= optimalPH_max) {
      score += 60;
    } else {
      const phDiff = Math.min(
        Math.abs(actualPH - optimalPH_min),
        Math.abs(actualPH - optimalPH_max)
      );
      score += Math.max(0, 60 - (phDiff / 2) * 60); // Penalite progressive
    }

    // 2. Texture du sol adaptee (40 points)
    if (preferredTextures.includes(actualTexture)) {
      score += 40;
    } else if (actualTexture !== 'unknown') {
      score += 15; // Score partiel si texture connue mais non optimale
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * 4. CROP ROTATION (15%)
   * Evaluation de la rotation des cultures
   */
  calculateRotationScore(gameData) {
    const { crop, previousCrops, seasonNumber } = gameData;

    if (!crop) {
      return 0;
    }

    const cropFamily = crop.family || 'unknown';
    const previousCropsList = previousCrops || [];

    let score = 50; // Score de base

    // 1. Verification rotation (50 points)
    if (previousCropsList.length === 0) {
      // Premiere culture - score de base
      score += 20;
    } else {
      const lastCrop = previousCropsList[previousCropsList.length - 1];

      // Penalite si meme famille de culture consecutive
      if (lastCrop.family === cropFamily) {
        score -= 30;
      } else {
        score += 30; // Bonus pour rotation correcte
      }

      // Bonus si rotation inclut des legumineuses
      const hasLegume = previousCropsList.some(c => c.family === 'legume');
      if (hasLegume && cropFamily !== 'legume') {
        score += 20; // Bonus pour benefice azote
      }
    }

    // 2. Diversite des cultures (30 points)
    const uniqueFamilies = new Set(previousCropsList.map(c => c.family));
    const diversityBonus = Math.min(30, uniqueFamilies.size * 10);
    score += diversityBonus;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * 5. NASA DATA USAGE (15%)
   * Evaluation de l'utilisation des donnees NASA
   */
  calculateNASAScore(gameData) {
    const { nasaDataUsed, nasaUsageCount, maxNASAUsage } = gameData;

    let score = 0;
    const maxUsage = maxNASAUsage || 3; // Max 3 utilisations par niveau

    // 1. Donnees NASA utilisees (70 points)
    if (nasaDataUsed) {
      score += 70;

      // Bonus si utilisation optimale (pas de surconsommation)
      const usageCount = nasaUsageCount || 1;
      if (usageCount <= maxUsage) {
        score += 20;
      } else {
        // Penalite si depassement
        const excess = usageCount - maxUsage;
        score += Math.max(0, 20 - (excess * 5));
      }
    }

    // 2. Types de donnees utilisees (10 points)
    const typesUsed = nasaDataUsed?.types || [];
    const diversityBonus = Math.min(10, typesUsed.length * 3);
    score += diversityBonus;

    return Math.min(100, Math.round(score));
  }

  /**
   * Calcul du nombre d'etoiles base sur le score global
   */
  calculateStars(globalScore) {
    if (globalScore >= this.starThresholds[3].min) return 3;
    if (globalScore >= this.starThresholds[2].min) return 2;
    return 1;
  }

  /**
   * Details des scores pour feedback joueur
   */
  getScoreDetails(scores, globalScore) {
    const details = {
      global: globalScore,
      breakdown: []
    };

    Object.keys(scores).forEach(key => {
      const comp = this.competences[key];
      details.breakdown.push({
        competence: comp.name,
        emoji: comp.emoji,
        score: scores[key],
        weight: comp.weight * 100,
        contribution: Math.round(scores[key] * comp.weight * 10) / 10
      });
    });

    return details;
  }

  /**
   * Feedback textuel base sur le score
   */
  getScoreFeedback(competence, score) {
    const feedbacks = {
      water: {
        excellent: "Excellente gestion de l'irrigation ! Vos cultures sont parfaitement hydratees.",
        good: "Bonne gestion de l'eau, mais vous pouvez optimiser davantage.",
        poor: "Attention : vos cultures manquent d'eau ou sont sur-irriguees."
      },
      npk: {
        excellent: "Fertilisation parfaite ! Equilibre NPK optimal.",
        good: "Bon apport en nutriments, quelques ajustements possibles.",
        poor: "Deficit ou exces d'engrais. Ajustez vos apports NPK."
      },
      soil: {
        excellent: "Sol parfaitement adapte a votre culture !",
        good: "Sol correct, mais le pH pourrait etre ameliore.",
        poor: "Le pH ou la texture du sol ne conviennent pas a cette culture."
      },
      rotation: {
        excellent: "Excellente rotation ! Vos cultures beneficient de la diversite.",
        good: "Rotation correcte, mais plus de diversite serait benefique.",
        poor: "Rotation inadequate. Evitez de replanter la meme famille."
      },
      nasa: {
        excellent: "Utilisation optimale des donnees NASA !",
        good: "Bonnes donnees utilisees, continuez ainsi.",
        poor: "Vous n'avez pas utilise les donnees NASA disponibles."
      }
    };

    const level = score >= 75 ? 'excellent' : score >= 50 ? 'good' : 'poor';
    return feedbacks[competence][level];
  }
}

export default CompetenceSystem;
