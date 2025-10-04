/**
 * SimulationEngine.js
 * Moteur de simulation agricole (inspiré DSSAT)
 * NASA Space Apps Challenge 2025
 */

export class SimulationEngine {
  constructor(crop, nasaData) {
    this.crop = crop;
    this.nasaData = nasaData;
  }

  /**
   * Calculer rendement final
   * @param {number} waterInput - Irrigation (0-100%)
   * @param {number} npkInput - Fertilisation NPK (0-150 kg/ha)
   * @param {number} phInput - pH du sol (4.0-8.0)
   * @returns {Object} - Résultats simulation
   */
  calculateYield(waterInput, npkInput, phInput) {
    // Facteurs de stress (0-1, où 1 = optimal)
    const waterStress = this.calculateWaterStress(waterInput);
    const nutrientStress = this.calculateNutrientStress(npkInput);
    const phStress = this.calculatePHStress(phInput);
    const tempStress = this.calculateTempStress();

    // Rendement potentiel de la culture
    const potentialYield = this.crop.maxYield;

    // Rendement réel = potentiel × produit des facteurs
    const actualYield = potentialYield * waterStress * nutrientStress * phStress * tempStress;

    // Score (0-1000)
    const score = this.calculateScore(actualYield, potentialYield, waterStress, nutrientStress, phStress, tempStress);

    // Étoiles (0-3)
    const stars = this.calculateStars(score);

    return {
      actualYield: Math.round(actualYield * 100) / 100,
      potentialYield,
      yieldPercentage: Math.round((actualYield / potentialYield) * 100),
      score,
      stars,
      stressFactor: {
        water: Math.round(waterStress * 100),
        nutrient: Math.round(nutrientStress * 100),
        ph: Math.round(phStress * 100),
        temperature: Math.round(tempStress * 100),
        overall: Math.round(waterStress * nutrientStress * phStress * tempStress * 100)
      },
      diagnosis: this.generateDiagnosis(waterStress, nutrientStress, phStress, tempStress)
    };
  }

  /**
   * Calculer stress hydrique
   */
  calculateWaterStress(waterInput) {
    const cropWaterNeed = this.crop.waterNeed; // { min, optimal, max }

    // Ajouter humidité du sol (SMAP)
    const soilMoisture = this.nasaData?.soilMoisture?.current_percent || 20;
    const totalWater = waterInput + soilMoisture;

    if (totalWater < cropWaterNeed.min) {
      // Sécheresse sévère
      return totalWater / cropWaterNeed.min;
    } else if (totalWater > cropWaterNeed.max) {
      // Excès d'eau
      const excess = totalWater - cropWaterNeed.max;
      return Math.max(0.3, 1 - (excess / 50));
    } else if (totalWater >= cropWaterNeed.optimal - 10 && totalWater <= cropWaterNeed.optimal + 10) {
      // Zone optimale
      return 1.0;
    } else {
      // Zone acceptable
      const distanceFromOptimal = Math.abs(totalWater - cropWaterNeed.optimal);
      return 1 - (distanceFromOptimal / 100);
    }
  }

  /**
   * Calculer stress nutritionnel (NPK)
   */
  calculateNutrientStress(npkInput) {
    const cropNPKNeed = this.crop.npkNeed; // { min, optimal, max }

    if (npkInput < cropNPKNeed.min) {
      // Carence
      return npkInput / cropNPKNeed.min;
    } else if (npkInput > cropNPKNeed.max) {
      // Excès (toxicité)
      const excess = npkInput - cropNPKNeed.max;
      return Math.max(0.3, 1 - (excess / 100));
    } else if (npkInput >= cropNPKNeed.optimal - 10 && npkInput <= cropNPKNeed.optimal + 10) {
      // Zone optimale
      return 1.0;
    } else {
      // Zone acceptable
      const distanceFromOptimal = Math.abs(npkInput - cropNPKNeed.optimal);
      return 1 - (distanceFromOptimal / 150);
    }
  }

  /**
   * Calculer stress pH
   */
  calculatePHStress(phInput) {
    const cropPHRange = this.crop.phRange; // { min, optimal, max }

    if (phInput < cropPHRange.min || phInput > cropPHRange.max) {
      // Hors plage tolérable
      return 0.2;
    } else if (phInput >= cropPHRange.optimal - 0.3 && phInput <= cropPHRange.optimal + 0.3) {
      // Zone optimale
      return 1.0;
    } else {
      // Zone acceptable
      const distanceFromOptimal = Math.abs(phInput - cropPHRange.optimal);
      return 1 - (distanceFromOptimal / 4);
    }
  }

  /**
   * Calculer stress température (données NASA MODIS)
   */
  calculateTempStress() {
    const currentTemp = this.nasaData?.temperature?.current_c || 28;
    const cropTempRange = this.crop.tempRange; // { min, optimal, max }

    if (currentTemp < cropTempRange.min) {
      // Trop froid
      const deficit = cropTempRange.min - currentTemp;
      return Math.max(0.2, 1 - (deficit / 20));
    } else if (currentTemp > cropTempRange.max) {
      // Trop chaud
      const excess = currentTemp - cropTempRange.max;
      return Math.max(0.2, 1 - (excess / 20));
    } else if (currentTemp >= cropTempRange.optimal - 3 && currentTemp <= cropTempRange.optimal + 3) {
      // Zone optimale
      return 1.0;
    } else {
      // Zone acceptable
      const distanceFromOptimal = Math.abs(currentTemp - cropTempRange.optimal);
      return 1 - (distanceFromOptimal / 30);
    }
  }

  /**
   * Calculer score final (0-1000)
   */
  calculateScore(actualYield, potentialYield, waterStress, nutrientStress, phStress, tempStress) {
    // Score basé sur :
    // - 60% rendement relatif
    // - 40% efficience (utilisation optimale ressources)

    const yieldScore = (actualYield / potentialYield) * 600;

    const efficiencyScore = (waterStress + nutrientStress + phStress + tempStress) / 4 * 400;

    return Math.min(1000, Math.round(yieldScore + efficiencyScore));
  }

  /**
   * Calculer étoiles (0-3)
   */
  calculateStars(score) {
    if (score >= 900) return 3;
    if (score >= 700) return 2;
    if (score >= 500) return 1;
    return 0;
  }

  /**
   * Générer diagnostic textuel
   */
  generateDiagnosis(waterStress, nutrientStress, phStress, tempStress) {
    const issues = [];
    const recommendations = [];

    // Analyser eau
    if (waterStress < 0.6) {
      issues.push('Stress hydrique détecté');
      recommendations.push('Augmenter irrigation ou attendre pluie');
    } else if (waterStress === 1.0) {
      recommendations.push('Niveau d\'eau optimal 👍');
    }

    // Analyser NPK
    if (nutrientStress < 0.6) {
      issues.push('Carence nutritionnelle (NPK)');
      recommendations.push('Ajouter engrais NPK');
    } else if (nutrientStress === 1.0) {
      recommendations.push('Fertilisation optimale 👍');
    }

    // Analyser pH
    if (phStress < 0.6) {
      issues.push('pH du sol inadapté');
      recommendations.push('Ajuster pH avec chaux ou soufre');
    } else if (phStress === 1.0) {
      recommendations.push('pH optimal pour cette culture 👍');
    }

    // Analyser température
    if (tempStress < 0.6) {
      issues.push('Stress thermique');
      recommendations.push('Température non optimale (facteur climatique)');
    } else if (tempStress === 1.0) {
      recommendations.push('Température idéale 👍');
    }

    return {
      issues: issues.length > 0 ? issues : ['Aucun problème majeur'],
      recommendations,
      summary: this.getSummary(waterStress, nutrientStress, phStress, tempStress)
    };
  }

  /**
   * Résumé général
   */
  getSummary(waterStress, nutrientStress, phStress, tempStress) {
    const overallStress = (waterStress + nutrientStress + phStress + tempStress) / 4;

    if (overallStress >= 0.9) {
      return {
        text: 'Excellente gestion ! Conditions optimales.',
        emoji: '🌟',
        audio: 'excellent_management'
      };
    } else if (overallStress >= 0.7) {
      return {
        text: 'Bonne gestion. Quelques ajustements possibles.',
        emoji: '✅',
        audio: 'good_management'
      };
    } else if (overallStress >= 0.5) {
      return {
        text: 'Gestion acceptable. Améliorations nécessaires.',
        emoji: '⚠️',
        audio: 'acceptable_management'
      };
    } else {
      return {
        text: 'Gestion à améliorer. Stress important détecté.',
        emoji: '❌',
        audio: 'poor_management'
      };
    }
  }

  /**
   * Simuler croissance jour par jour (animation)
   */
  simulateGrowth(waterInput, npkInput, phInput, days = 90) {
    const growthStages = [];

    for (let day = 0; day < days; day++) {
      const waterStress = this.calculateWaterStress(waterInput);
      const nutrientStress = this.calculateNutrientStress(npkInput);
      const phStress = this.calculatePHStress(phInput);
      const tempStress = this.calculateTempStress();

      const dailyGrowth = (waterStress + nutrientStress + phStress + tempStress) / 4;

      growthStages.push({
        day,
        growthRate: dailyGrowth,
        cumulativeGrowth: Math.min(100, (day / days) * 100 * dailyGrowth),
        status: this.getGrowthStatus(dailyGrowth)
      });
    }

    return growthStages;
  }

  /**
   * Statut croissance
   */
  getGrowthStatus(growthRate) {
    if (growthRate >= 0.9) return 'excellent';
    if (growthRate >= 0.7) return 'good';
    if (growthRate >= 0.5) return 'moderate';
    return 'poor';
  }
}
