/**
 * SimulationEngine.js
 * Moteur de simulation agricole (inspiré DSSAT)
 * NASA Space Apps Challenge 2025
 *
 * DSSAT-like crop growth simulation with:
 * - Daily time-step simulation
 * - Phenological stages
 * - Biomass accumulation
 * - Water and nutrient stress
 * - NDVI-based growth monitoring
 */

export class SimulationEngine {
  constructor(crop, nasaData, weatherEngine = null) {
    this.crop = crop;
    this.nasaData = nasaData;
    this.weatherEngine = weatherEngine;

    // Constants DSSAT
    this.RUE = 3.0; // Radiation Use Efficiency (g biomass/MJ PAR)
    this.LAI_MAX = 6.0; // Maximum Leaf Area Index
    this.HARVEST_INDEX = crop.harvestIndex || 0.50; // Default 50%
    this.BASE_TEMP = crop.baseTemp || 8; // Base temperature (C)
    this.OPT_TEMP = crop.optTemp || 28; // Optimal temperature (C)
    this.MAX_TEMP = crop.maxTemp || 35; // Maximum temperature (C)

    // State variables
    this.currentDay = 0;
    this.phenologicalStage = 0;
    this.totalBiomass = 0;
    this.LAI = 0;
    this.rootDepth = 0.1; // meters
    this.soilWaterContent = 0.3; // volumetric (0-1)
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

  /**
   * ========================================
   * DSSAT-LIKE DAILY SIMULATION
   * ========================================
   */

  /**
   * Simulate full crop cycle (90 days) with daily time steps
   * @param {Object} managementInputs - { irrigation: 0-100, npk: 0-150, ph: 4-8 }
   * @returns {Object} Complete simulation results
   */
  runFullSimulation(managementInputs = {}) {
    const {
      irrigation = 50,
      npk = 80,
      ph = 6.5,
      duration = 90
    } = managementInputs;

    // Reset state
    this.resetSimulation();

    const dailyData = [];
    const events = [];
    const snapshots = [];

    // Phenological stages from crop data
    const phenoStages = this.crop.growth?.stages || this.getDefaultPhenoStages();

    for (let day = 1; day <= duration; day++) {
      this.currentDay = day;

      // Get daily weather
      const weather = this.weatherEngine
        ? this.weatherEngine.getDailyWeather(day)
        : this.generateSimpleWeather(day);

      // Update phenological stage
      const phenoStage = this.getPhenologicalStage(day, phenoStages);
      this.phenologicalStage = phenoStage.index;

      // Calculate daily thermal time (Growing Degree Days)
      const GDD = this.calculateGDD(weather.temp);

      // Calculate stress factors
      const waterStress = this.calculateDailyWaterStress(irrigation, weather);
      const nutrientStress = this.calculateNutrientStress(npk);
      const tempStress = this.calculateTemperatureStress(weather.temp);

      // Update LAI (Leaf Area Index)
      this.updateLAI(day, duration, waterStress, nutrientStress);

      // Calculate intercepted radiation
      const PAR = this.calculatePAR(weather.radiation, this.LAI);

      // Daily biomass accumulation (DSSAT formula)
      const dailyBiomass = this.RUE * PAR * waterStress * nutrientStress * tempStress;
      this.totalBiomass += dailyBiomass;

      // Calculate NDVI from LAI
      const ndvi = this.calculateNDVIFromLAI(this.LAI);

      // Update soil water
      const ET0 = this.calculateET0(weather);
      this.updateSoilWater(irrigation, weather.rain, ET0);

      // Check for weather events
      const weatherEvent = this.checkWeatherEvents(weather, day);
      if (weatherEvent) {
        events.push(weatherEvent);
      }

      // Store daily data
      dailyData.push({
        day,
        phenoStage: phenoStage.name,
        temp: weather.temp,
        rain: weather.rain,
        radiation: weather.radiation,
        gdd: GDD,
        biomass: this.totalBiomass,
        lai: this.LAI,
        ndvi,
        waterStress,
        nutrientStress,
        tempStress,
        soilMoisture: this.soilWaterContent * 100,
        weatherEvent: weatherEvent?.type || null
      });

      // Create snapshots every 10 days
      if (day % 10 === 0 || day === duration) {
        snapshots.push(this.createSnapshot(day, dailyData[dailyData.length - 1]));
      }
    }

    // Calculate final yield
    const finalYield = this.totalBiomass * this.HARVEST_INDEX / 1000; // kg/ha -> t/ha
    const yieldPercentage = (finalYield / this.crop.maxYield) * 100;

    return {
      summary: {
        finalYield: Math.round(finalYield * 100) / 100,
        potentialYield: this.crop.maxYield,
        yieldPercentage: Math.round(yieldPercentage),
        totalBiomass: Math.round(this.totalBiomass),
        harvestIndex: this.HARVEST_INDEX,
        duration,
        finalNDVI: dailyData[dailyData.length - 1].ndvi
      },
      dailyData,
      snapshots,
      events,
      phenoStages,
      performance: this.calculatePerformanceMetrics(dailyData)
    };
  }

  /**
   * Reset simulation state
   */
  resetSimulation() {
    this.currentDay = 0;
    this.phenologicalStage = 0;
    this.totalBiomass = 0;
    this.LAI = 0;
    this.rootDepth = 0.1;
    this.soilWaterContent = 0.3;
  }

  /**
   * Get phenological stage for current day
   */
  getPhenologicalStage(day, stages) {
    let cumulativeDays = 0;
    for (let i = 0; i < stages.length; i++) {
      cumulativeDays += stages[i].days;
      if (day <= cumulativeDays) {
        return {
          index: i,
          name: stages[i].name,
          description: stages[i].description,
          progress: ((day - (cumulativeDays - stages[i].days)) / stages[i].days) * 100
        };
      }
    }
    return {
      index: stages.length - 1,
      name: stages[stages.length - 1].name,
      description: 'Maturity',
      progress: 100
    };
  }

  /**
   * Get default phenological stages
   */
  getDefaultPhenoStages() {
    return [
      { name: 'Germination', days: 7, description: 'Seed germination' },
      { name: 'Vegetative', days: 35, description: 'Vegetative growth' },
      { name: 'Flowering', days: 20, description: 'Flowering and pollination' },
      { name: 'Grain Fill', days: 20, description: 'Grain filling' },
      { name: 'Maturity', days: 8, description: 'Physiological maturity' }
    ];
  }

  /**
   * Calculate Growing Degree Days (GDD)
   */
  calculateGDD(temp) {
    const avgTemp = temp;
    if (avgTemp < this.BASE_TEMP) return 0;
    if (avgTemp > this.MAX_TEMP) return this.MAX_TEMP - this.BASE_TEMP;
    return avgTemp - this.BASE_TEMP;
  }

  /**
   * Calculate daily water stress
   */
  calculateDailyWaterStress(irrigation, weather) {
    const availableWater = this.soilWaterContent * 100;
    const demand = this.crop.waterNeed?.optimal || 60;

    // Factor in irrigation and rain
    const totalWater = availableWater + (irrigation / 10) + (weather.rain / 10);

    if (totalWater < demand * 0.5) return 0.3; // Severe stress
    if (totalWater < demand * 0.7) return 0.6; // Moderate stress
    if (totalWater > demand * 1.3) return 0.7; // Waterlogging
    return 1.0; // Optimal
  }

  /**
   * Calculate temperature stress
   */
  calculateTemperatureStress(temp) {
    if (temp < this.BASE_TEMP) return 0.2;
    if (temp > this.MAX_TEMP) return 0.3;
    if (temp >= this.OPT_TEMP - 3 && temp <= this.OPT_TEMP + 3) return 1.0;

    // Linear interpolation
    if (temp < this.OPT_TEMP) {
      return 0.5 + 0.5 * ((temp - this.BASE_TEMP) / (this.OPT_TEMP - this.BASE_TEMP));
    } else {
      return 1.0 - 0.7 * ((temp - this.OPT_TEMP) / (this.MAX_TEMP - this.OPT_TEMP));
    }
  }

  /**
   * Update Leaf Area Index (LAI)
   */
  updateLAI(day, duration, waterStress, nutrientStress) {
    const relativeDay = day / duration;

    // Logistic curve for LAI development
    const potentialLAI = this.LAI_MAX / (1 + Math.exp(-10 * (relativeDay - 0.5)));

    // Apply stress
    this.LAI = potentialLAI * waterStress * nutrientStress;

    // Senescence in late season
    if (relativeDay > 0.75) {
      this.LAI *= (1 - (relativeDay - 0.75) * 2);
    }

    this.LAI = Math.max(0, Math.min(this.LAI_MAX, this.LAI));
  }

  /**
   * Calculate Photosynthetically Active Radiation intercepted
   */
  calculatePAR(radiation, lai) {
    // Beer's Law: PAR_intercepted = PAR_incident * (1 - exp(-k * LAI))
    const k = 0.6; // Extinction coefficient
    const PARfraction = 0.5; // PAR is ~50% of total radiation
    const intercepted = radiation * PARfraction * (1 - Math.exp(-k * lai));
    return intercepted;
  }

  /**
   * Calculate NDVI from LAI (empirical relationship)
   */
  calculateNDVIFromLAI(lai) {
    // NDVI = a * (1 - exp(-b * LAI))
    const a = 0.95; // Maximum NDVI
    const b = 0.6;  // Shape parameter
    return Math.round(a * (1 - Math.exp(-b * lai)) * 100) / 100;
  }

  /**
   * Calculate reference evapotranspiration (ET0) - Simplified Penman
   */
  calculateET0(weather) {
    // Simplified formula: ET0 = 0.0023 * (Tmean + 17.8) * sqrt(Tmax - Tmin) * Ra
    // For simulation, use simplified approach
    const temp = weather.temp;
    const radiation = weather.radiation;

    const ET0 = 0.0135 * temp * radiation / 10;
    return Math.max(0, Math.min(10, ET0)); // mm/day
  }

  /**
   * Update soil water content
   */
  updateSoilWater(irrigation, rain, ET0) {
    const waterIn = (rain + irrigation) / 100; // Convert to volumetric
    const waterOut = ET0 / 100;

    this.soilWaterContent += waterIn - waterOut;

    // Field capacity and wilting point constraints
    this.soilWaterContent = Math.max(0.1, Math.min(0.45, this.soilWaterContent));
  }

  /**
   * Generate simple weather if no WeatherEngine
   */
  generateSimpleWeather(day) {
    const season = Math.sin((day / 90) * Math.PI); // Seasonal variation

    return {
      temp: 26 + 6 * season + (Math.random() - 0.5) * 4,
      rain: Math.random() > 0.7 ? Math.random() * 20 : 0,
      radiation: 15 + 5 * season + (Math.random() - 0.5) * 3
    };
  }

  /**
   * Check for notable weather events
   */
  checkWeatherEvents(weather, day) {
    if (weather.temp > 38) {
      return {
        type: 'heatwave',
        day,
        severity: 'high',
        description: 'Canicule - stress thermique severe',
        impact: -0.3
      };
    }

    if (weather.rain > 50) {
      return {
        type: 'heavy_rain',
        day,
        severity: 'medium',
        description: 'Pluie abondante - risque de lessivage',
        impact: -0.1
      };
    }

    if (this.soilWaterContent < 0.15) {
      return {
        type: 'drought',
        day,
        severity: 'high',
        description: 'Secheresse - irrigation recommandee',
        impact: -0.4
      };
    }

    return null;
  }

  /**
   * Create snapshot for timeline
   */
  createSnapshot(day, dailyData) {
    return {
      day,
      title: `Jour ${day}`,
      phenoStage: dailyData.phenoStage,
      ndvi: dailyData.ndvi,
      biomass: Math.round(dailyData.biomass),
      lai: Math.round(dailyData.lai * 100) / 100,
      soilMoisture: Math.round(dailyData.soilMoisture),
      stresses: {
        water: Math.round(dailyData.waterStress * 100),
        nutrient: Math.round(dailyData.nutrientStress * 100),
        temperature: Math.round(dailyData.tempStress * 100)
      },
      status: this.getSnapshotStatus(dailyData)
    };
  }

  /**
   * Get snapshot status
   */
  getSnapshotStatus(data) {
    const avgStress = (data.waterStress + data.nutrientStress + data.tempStress) / 3;

    if (avgStress >= 0.85) return { text: 'Excellent', color: 'green' };
    if (avgStress >= 0.70) return { text: 'Bon', color: 'lightgreen' };
    if (avgStress >= 0.50) return { text: 'Moyen', color: 'yellow' };
    return { text: 'Stress', color: 'red' };
  }

  /**
   * Calculate performance metrics
   */
  calculatePerformanceMetrics(dailyData) {
    const avgWaterStress = dailyData.reduce((sum, d) => sum + d.waterStress, 0) / dailyData.length;
    const avgNutrientStress = dailyData.reduce((sum, d) => sum + d.nutrientStress, 0) / dailyData.length;
    const avgTempStress = dailyData.reduce((sum, d) => sum + d.tempStress, 0) / dailyData.length;

    const stressDays = dailyData.filter(d =>
      (d.waterStress < 0.6 || d.nutrientStress < 0.6 || d.tempStress < 0.6)
    ).length;

    return {
      avgWaterStress: Math.round(avgWaterStress * 100),
      avgNutrientStress: Math.round(avgNutrientStress * 100),
      avgTempStress: Math.round(avgTempStress * 100),
      overallHealth: Math.round(((avgWaterStress + avgNutrientStress + avgTempStress) / 3) * 100),
      stressDays,
      stressFreePercentage: Math.round(((dailyData.length - stressDays) / dailyData.length) * 100)
    };
  }
}
