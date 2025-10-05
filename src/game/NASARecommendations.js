/**
 * NASARecommendations.js
 * Système de recommandations intelligentes basées sur les données NASA
 * NASA Space Apps Challenge 2025
 */

export class NASARecommendations {
  constructor(crop, nasaData, levelData = null) {
    this.crop = crop;
    this.nasaData = nasaData;
    this.levelData = levelData;
  }

  /**
   * Générer toutes les recommandations
   */
  generateRecommendations() {
    return {
      temperature: this.analyzeTemperature(),
      moisture: this.analyzeMoisture(),
      ndvi: this.analyzeNDVI(),
      npk: this.analyzeNPK(),
      optimal: this.getOptimalSettings()
    };
  }

  /**
   * Analyser température
   */
  analyzeTemperature() {
    const currentTemp = this.nasaData?.temperature?.current_c || 28;
    const optimalTemp = this.crop.tempRange.optimal;
    const gap = currentTemp - optimalTemp;

    let status = 'optimal';
    let action = 'Température idéale pour cette culture';
    let badge = 'optimal';

    if (Math.abs(gap) <= 3) {
      status = 'optimal';
      badge = 'optimal';
      action = `Parfait ! Température dans la zone optimale (${optimalTemp}°C ±3°C)`;
    } else if (gap > 3 && gap <= 7) {
      status = 'warning';
      badge = 'warning';
      action = `Légèrement chaud. Augmenter irrigation de 10-15% pour compenser l'évaporation`;
    } else if (gap > 7) {
      status = 'critical';
      badge = 'critical';
      action = `Très chaud ! Irrigation intensive recommandée + ombrage si possible. Risque de stress thermique.`;
    } else if (gap < -3 && gap >= -7) {
      status = 'warning';
      badge = 'warning';
      action = `Légèrement froid. Croissance ralentie. Réduire irrigation de 10%.`;
    } else if (gap < -7) {
      status = 'critical';
      badge = 'critical';
      action = `Trop froid pour croissance optimale. Protéger la culture si possible.`;
    }

    return {
      current: currentTemp,
      optimal: optimalTemp,
      gap: gap,
      status: status,
      badge: badge,
      action: action,
      source: 'MODIS Terra'
    };
  }

  /**
   * Analyser humidité du sol
   */
  analyzeMoisture() {
    const currentMoisture = this.nasaData?.soilMoisture?.current_percent || 20;
    const optimalMoisture = this.crop.waterNeed.optimal;
    const gap = currentMoisture - optimalMoisture;

    // Calculer le multiplicateur de difficulté basé sur targetYield
    let difficultyMultiplier = 1.0;
    if (this.levelData?.targetYield) {
      // Utiliser levelData.maxYield si disponible, sinon crop.maxYield
      const levelMaxYield = this.levelData.maxYield || this.crop.maxYield;
      const targetRatio = this.levelData.targetYield / levelMaxYield;
      if (targetRatio >= 0.75) difficultyMultiplier = 1.4; // Niveau très difficile (>75% du max)
      else if (targetRatio >= 0.65) difficultyMultiplier = 1.25; // Niveau difficile (65-75%)
      else if (targetRatio >= 0.50) difficultyMultiplier = 1.15; // Niveau moyen (50-65%)
    }

    let status = 'optimal';
    let action = 'Humidité du sol parfaite';
    let badge = 'optimal';
    let irrigationRecommended = 0;

    if (Math.abs(gap) <= 5) {
      status = 'optimal';
      badge = 'optimal';
      action = `Excellent ! Sol à humidité optimale (${optimalMoisture}% ±5%)`;
      irrigationRecommended = 0;
    } else if (gap < 0 && gap >= -10) {
      status = 'warning';
      badge = 'warning';
      action = `Sol légèrement sec. Irrigation modérée nécessaire.`;
      irrigationRecommended = Math.abs(gap) * 2 * difficultyMultiplier; // Conversion en %
    } else if (gap < -10) {
      status = 'critical';
      badge = 'critical';
      action = `Sol très sec ! Irrigation urgente pour éviter stress hydrique sévère.`;
      irrigationRecommended = 100;
    } else if (gap > 5 && gap <= 15) {
      status = 'warning';
      badge = 'warning';
      action = `Sol humide. Réduire ou suspendre irrigation temporairement.`;
      irrigationRecommended = 0;
    } else if (gap > 15) {
      status = 'critical';
      badge = 'critical';
      action = `Sol saturé ! Arrêter irrigation. Risque de pourriture racinaire et lessivage NPK.`;
      irrigationRecommended = 0;
    }

    return {
      current: currentMoisture,
      optimal: optimalMoisture,
      gap: gap,
      status: status,
      badge: badge,
      action: action,
      irrigationRecommended: Math.min(100, Math.max(0, irrigationRecommended)),
      source: 'SMAP L4'
    };
  }

  /**
   * Analyser NDVI
   */
  analyzeNDVI() {
    const currentNDVI = this.nasaData?.ndvi?.current || 0.2;

    let status = '';
    let interpretation = '';
    let badge = '';

    if (currentNDVI < 0.2) {
      status = 'poor';
      badge = 'critical';
      interpretation = `NDVI très faible (${currentNDVI.toFixed(2)}). Sol nu ou végétation absente/morte. Vérifier germination et conditions de croissance.`;
    } else if (currentNDVI >= 0.2 && currentNDVI < 0.4) {
      status = 'moderate';
      badge = 'warning';
      interpretation = `NDVI moyen (${currentNDVI.toFixed(2)}). Végétation en début de croissance ou en stress. Vérifier eau et NPK.`;
    } else if (currentNDVI >= 0.4 && currentNDVI < 0.6) {
      status = 'good';
      badge = 'warning';
      interpretation = `NDVI correct (${currentNDVI.toFixed(2)}). Végétation en développement actif. Continuer suivi.`;
    } else if (currentNDVI >= 0.6 && currentNDVI < 0.8) {
      status = 'excellent';
      badge = 'optimal';
      interpretation = `NDVI excellent (${currentNDVI.toFixed(2)}) ! Végétation dense et en bonne santé. Conditions optimales.`;
    } else {
      status = 'excellent';
      badge = 'optimal';
      interpretation = `NDVI exceptionnel (${currentNDVI.toFixed(2)}) ! Végétation très dense et vigoureuse.`;
    }

    return {
      current: currentNDVI,
      status: status,
      badge: badge,
      interpretation: interpretation,
      source: 'MODIS NDVI'
    };
  }

  /**
   * Analyser besoins NPK
   */
  analyzeNPK() {
    const currentNDVI = this.nasaData?.ndvi?.current || 0.2;
    const optimalNPK = this.crop.npkNeed.optimal;

    // Calculer le multiplicateur de difficulté basé sur targetYield
    let difficultyMultiplier = 1.0;
    if (this.levelData?.targetYield) {
      // Utiliser levelData.maxYield si disponible, sinon crop.maxYield
      const levelMaxYield = this.levelData.maxYield || this.crop.maxYield;
      const targetRatio = this.levelData.targetYield / levelMaxYield;
      if (targetRatio >= 0.75) difficultyMultiplier = 1.3; // Niveau très difficile (>75% du max)
      else if (targetRatio >= 0.65) difficultyMultiplier = 1.2; // Niveau difficile (65-75%)
      else if (targetRatio >= 0.50) difficultyMultiplier = 1.1; // Niveau moyen (50-65%)
    }

    let recommendedNPK = optimalNPK * difficultyMultiplier;
    let action = `Appliquer ${Math.round(recommendedNPK)} kg/ha selon besoins de la culture`;

    // Ajuster selon NDVI (indicateur de santé)
    if (currentNDVI < 0.3) {
      // Végétation faible = besoin élevé en NPK
      recommendedNPK = Math.min(this.crop.npkNeed.max, optimalNPK * 1.2 * difficultyMultiplier);
      action = `NDVI faible détecté. Augmenter NPK à ${Math.round(recommendedNPK)} kg/ha pour stimuler croissance.`;
    } else if (currentNDVI >= 0.3 && currentNDVI < 0.5) {
      recommendedNPK = optimalNPK * difficultyMultiplier;
      action = `Appliquer dose de ${Math.round(recommendedNPK)} kg/ha. Végétation en développement.`;
    } else if (currentNDVI >= 0.5 && currentNDVI < 0.7) {
      recommendedNPK = optimalNPK * 0.9 * difficultyMultiplier;
      action = `Végétation en bonne santé. Dose de ${Math.round(recommendedNPK)} kg/ha recommandée.`;
    } else {
      // NDVI excellent = maintenance uniquement
      recommendedNPK = optimalNPK * 0.8 * difficultyMultiplier;
      action = `Excellente santé végétale ! Dose d'entretien de ${Math.round(recommendedNPK)} kg/ha recommandée.`;
    }

    // Ajuster selon stade phénologique (si disponible)
    // En floraison, besoin accru en P et K

    return {
      optimal: optimalNPK,
      recommended: Math.round(recommendedNPK),
      action: action,
      fractionner: `Fractionner : 40% plantation + 30% stade végétatif + 30% floraison`
    };
  }

  /**
   * Obtenir paramètres optimaux globaux
   */
  getOptimalSettings() {
    const moistureAnalysis = this.analyzeMoisture();
    const npkAnalysis = this.analyzeNPK();

    return {
      irrigation: moistureAnalysis.irrigationRecommended,
      npk: npkAnalysis.recommended,
      ph: this.crop.phRange.optimal,
      confidence: this.calculateConfidence()
    };
  }

  /**
   * Calculer indice de confiance des recommandations
   */
  calculateConfidence() {
    // Basé sur la qualité des données NASA disponibles
    let confidence = 100;

    if (!this.nasaData?.temperature) confidence -= 20;
    if (!this.nasaData?.soilMoisture) confidence -= 30;
    if (!this.nasaData?.ndvi) confidence -= 20;

    return Math.max(50, confidence);
  }

  /**
   * Générer texte explicatif pour l'utilisateur
   */
  generateEducationalExplanation(dataType) {
    const explanations = {
      temperature: {
        what: "La température de surface terrestre mesurée par satellite MODIS",
        why: "Influence directement la croissance des plantes, l'évapotranspiration et les besoins en eau",
        how: "Utilisez ces données pour ajuster l'irrigation selon la chaleur ambiante"
      },
      moisture: {
        what: "L'humidité du sol mesurée par SMAP (0-5cm de profondeur)",
        why: "Indicateur clé du stress hydrique des cultures",
        how: "Comparez avec les besoins de votre culture pour déterminer l'irrigation nécessaire"
      },
      ndvi: {
        what: "Normalized Difference Vegetation Index - indice de végétation",
        why: "Mesure la santé et la densité de la végétation via réflectance spectrale",
        how: "Valeurs 0.6-0.8 = excellente santé. Inférieur à 0.4 = stress ou début croissance"
      }
    };

    return explanations[dataType] || {};
  }
}
