/**
 * PlotManager.js
 * Gestionnaire de parcelles agricoles
 * IleRise V3 - NASA Space Apps Challenge 2025
 */

import { SimulationEngine } from './SimulationEngine.js';
import { CROPS } from './CropDatabase.js';

export class PlotManager {
  constructor(resourceManager, timeSimulation, nasaData) {
    this.resourceManager = resourceManager;
    this.timeSimulation = timeSimulation;
    this.nasaData = nasaData;

    // Parcelles disponibles
    this.plots = this.initializePlots();

    // Parcelle active (sélectionnée)
    this.activePlotId = 1;
  }

  /**
   * Initialiser les parcelles
   * @returns {Array}
   */
  initializePlots() {
    return [
      {
        id: 1,
        name: 'Parcelle 1',
        size: 100, // m²
        unlocked: true,
        isPlanted: false,
        isPlowed: false,
        crop: null,
        daysSincePlant: 0,
        growthStage: 0, // 0: rien, 1: germination, 2: végétatif, 3: floraison, 4: maturation
        plantCount: 0,
        health: 100,

        // État du sol
        soilMoisture: 30,
        npkLevel: 50,
        ph: 6.5,
        soilQuality: 70,
        soilOrganic: 50,
        weedLevel: 0,
        pestLevel: 0,
        pestResistance: 0,

        // Biomasse et LAI (pour simulation DSSAT)
        biomass: 0,
        LAI: 0,

        // Historique
        actionsHistory: [],

        // Moteur de simulation
        simulationEngine: null
      },

      {
        id: 2,
        name: 'Parcelle 2',
        size: 100,
        unlocked: false, // Débloquer niveau 3
        unlockLevel: 3,
        unlockCost: 200,
        isPlanted: false,
        isPlowed: false,
        crop: null,
        daysSincePlant: 0,
        growthStage: 0,
        plantCount: 0,
        health: 100,
        soilMoisture: 30,
        npkLevel: 50,
        ph: 6.5,
        soilQuality: 70,
        soilOrganic: 50,
        weedLevel: 0,
        pestLevel: 0,
        pestResistance: 0,
        biomass: 0,
        LAI: 0,
        actionsHistory: [],
        simulationEngine: null
      },

      {
        id: 3,
        name: 'Parcelle 3',
        size: 150,
        unlocked: false,
        unlockLevel: 7,
        unlockCost: 500,
        isPlanted: false,
        isPlowed: false,
        crop: null,
        daysSincePlant: 0,
        growthStage: 0,
        plantCount: 0,
        health: 100,
        soilMoisture: 30,
        npkLevel: 50,
        ph: 6.5,
        soilQuality: 70,
        soilOrganic: 50,
        weedLevel: 0,
        pestLevel: 0,
        pestResistance: 0,
        biomass: 0,
        LAI: 0,
        actionsHistory: [],
        simulationEngine: null
      },

      {
        id: 4,
        name: 'Parcelle 4',
        size: 150,
        unlocked: false,
        unlockLevel: 10,
        unlockCost: 1000,
        isPlanted: false,
        isPlowed: false,
        crop: null,
        daysSincePlant: 0,
        growthStage: 0,
        plantCount: 0,
        health: 100,
        soilMoisture: 30,
        npkLevel: 50,
        ph: 6.5,
        soilQuality: 70,
        soilOrganic: 50,
        weedLevel: 0,
        pestLevel: 0,
        pestResistance: 0,
        biomass: 0,
        LAI: 0,
        actionsHistory: [],
        simulationEngine: null
      }
    ];
  }

  /**
   * Obtenir une parcelle par ID
   * @param {Number} plotId
   * @returns {Object}
   */
  getPlot(plotId) {
    return this.plots.find(p => p.id === plotId);
  }

  /**
   * Obtenir la parcelle active
   * @returns {Object}
   */
  getActivePlot() {
    return this.getPlot(this.activePlotId);
  }

  /**
   * Sélectionner une parcelle
   * @param {Number} plotId
   */
  setActivePlot(plotId) {
    const plot = this.getPlot(plotId);
    if (plot && plot.unlocked) {
      this.activePlotId = plotId;
      console.log(`✅ Parcelle ${plotId} sélectionnée`);
      return true;
    }
    console.warn(`⚠️ Parcelle ${plotId} non disponible`);
    return false;
  }

  /**
   * Débloquer une parcelle
   * @param {Number} plotId
   * @param {Number} playerLevel
   * @returns {Boolean}
   */
  unlockPlot(plotId, playerLevel) {
    const plot = this.getPlot(plotId);
    if (!plot) return false;

    if (plot.unlocked) {
      console.log(`ℹ️ Parcelle ${plotId} déjà débloquée`);
      return true;
    }

    // Vérifier niveau requis
    if (playerLevel < plot.unlockLevel) {
      console.warn(`⚠️ Niveau ${plot.unlockLevel} requis`);
      return false;
    }

    // Vérifier coût
    if (!this.resourceManager.hasResources({ money: plot.unlockCost })) {
      console.warn('⚠️ Argent insuffisant');
      return false;
    }

    // Débloquer
    this.resourceManager.consume({ money: plot.unlockCost }, `Déblocage parcelle ${plotId}`);
    plot.unlocked = true;

    console.log(`🎉 Parcelle ${plotId} débloquée !`);
    return true;
  }

  /**
   * Planter une culture sur une parcelle
   * @param {Number} plotId
   * @param {String} cropId
   * @returns {Boolean}
   */
  plantCrop(plotId, cropId) {
    const plot = this.getPlot(plotId);
    if (!plot || !plot.unlocked) return false;

    if (plot.isPlanted) {
      console.warn('⚠️ Parcelle déjà plantée');
      return false;
    }

    const crop = CROPS[cropId];
    if (!crop) {
      console.warn('⚠️ Culture inconnue');
      return false;
    }

    // Initialiser le moteur de simulation pour cette parcelle
    plot.crop = crop;
    plot.simulationEngine = new SimulationEngine(crop, this.nasaData);
    plot.isPlanted = true;
    plot.daysSincePlant = 0;
    plot.growthStage = 1; // Germination
    plot.plantCount = 100;

    console.log(`🌱 ${crop.name.fr} planté sur parcelle ${plotId}`);
    return true;
  }

  /**
   * Mettre à jour toutes les parcelles (appelé chaque jour)
   * @param {Number} currentDay
   */
  updateAllPlots(currentDay) {
    for (const plot of this.plots) {
      if (plot.isPlanted && plot.crop) {
        this.updatePlot(plot, currentDay);
      }
    }
  }

  /**
   * Mettre à jour une parcelle
   * @param {Object} plot
   * @param {Number} currentDay
   */
  updatePlot(plot, currentDay) {
    plot.daysSincePlant++;

    // Dégradation naturelle
    this.applyNaturalDegradation(plot);

    // Mise à jour du stade de croissance
    this.updateGrowthStage(plot);

    // Calcul de la santé
    plot.health = this.calculateHealth(plot);

    // Mise à jour biomasse et LAI (utiliser SimulationEngine)
    if (plot.simulationEngine) {
      this.updateBiomassAndLAI(plot);
    }
  }

  /**
   * Appliquer la dégradation naturelle
   * @param {Object} plot
   */
  applyNaturalDegradation(plot) {
    const envModifiers = this.timeSimulation.getEnvironmentModifiers();

    // Évaporation de l'eau
    plot.soilMoisture -= envModifiers.evaporation * 2;
    plot.soilMoisture = Math.max(0, plot.soilMoisture);

    // Pluie
    if (envModifiers.rainfall > 0) {
      plot.soilMoisture += envModifiers.rainfall;
      plot.soilMoisture = Math.min(100, plot.soilMoisture);
    }

    // Consommation NPK par la plante
    if (plot.growthStage >= 2) {
      plot.npkLevel -= 1;
      plot.npkLevel = Math.max(0, plot.npkLevel);
    }

    // Croissance des mauvaises herbes
    if (plot.weedLevel < 100) {
      plot.weedLevel += Math.random() * 3;
      plot.weedLevel = Math.min(100, plot.weedLevel);
    }

    // Apparition de ravageurs (probabilité)
    if (Math.random() < 0.05 && plot.pestResistance < 30) {
      plot.pestLevel += Math.random() * 10;
      plot.pestLevel = Math.min(100, plot.pestLevel);
    } else if (plot.pestResistance > 0) {
      plot.pestLevel -= 2;
      plot.pestLevel = Math.max(0, plot.pestLevel);
      plot.pestResistance -= 5;
      plot.pestResistance = Math.max(0, plot.pestResistance);
    }
  }

  /**
   * Mettre à jour le stade de croissance
   * @param {Object} plot
   */
  updateGrowthStage(plot) {
    const crop = plot.crop;
    if (!crop) return;

    const progress = plot.daysSincePlant / crop.growthDuration;

    if (progress < 0.15) {
      plot.growthStage = 1; // Germination
    } else if (progress < 0.50) {
      plot.growthStage = 2; // Végétatif
    } else if (progress < 0.75) {
      plot.growthStage = 3; // Floraison
    } else if (progress < 1.0) {
      plot.growthStage = 4; // Maturation
    } else {
      plot.growthStage = 5; // Sur-mature (perte de qualité)
    }
  }

  /**
   * Calculer la santé de la parcelle
   * @param {Object} plot
   * @returns {Number} 0-100
   */
  calculateHealth(plot) {
    let health = 100;

    // Stress hydrique
    const waterStress = Math.abs(plot.soilMoisture - plot.crop?.waterNeed?.optimal || 65);
    health -= waterStress * 0.5;

    // Stress nutritionnel
    const npkStress = Math.max(0, (plot.crop?.npkNeed?.optimal || 100) - plot.npkLevel);
    health -= npkStress * 0.3;

    // Mauvaises herbes
    health -= plot.weedLevel * 0.2;

    // Ravageurs
    health -= plot.pestLevel * 0.4;

    // pH stress
    const phOptimal = plot.crop?.phRange?.optimal || 6.5;
    const phStress = Math.abs(plot.ph - phOptimal);
    health -= phStress * 5;

    return Math.max(0, Math.min(100, health));
  }

  /**
   * Mettre à jour biomasse et LAI
   * @param {Object} plot
   */
  updateBiomassAndLAI(plot) {
    // Utiliser le SimulationEngine existant pour calculer
    const waterStress = plot.soilMoisture / 100;
    const nutrientStress = plot.npkLevel / 100;
    const healthFactor = plot.health / 100;

    // LAI augmente jusqu'au stade floraison
    if (plot.growthStage <= 3) {
      plot.LAI += 0.2 * waterStress * nutrientStress * healthFactor;
      plot.LAI = Math.min(6.0, plot.LAI); // LAI max = 6.0
    }

    // Biomasse augmente avec LAI
    plot.biomass += plot.LAI * 5 * healthFactor; // g/m²/jour
  }

  /**
   * Récolter une parcelle
   * @param {Number} plotId
   * @returns {Object} { success: Boolean, yield: Number }
   */
  harvestPlot(plotId) {
    const plot = this.getPlot(plotId);
    if (!plot || !plot.isPlanted) {
      return { success: false, error: 'Aucune culture à récolter' };
    }

    if (plot.growthStage < 4) {
      return { success: false, error: 'Culture pas encore mature' };
    }

    // Utiliser SimulationEngine pour calculer le rendement
    const results = plot.simulationEngine.calculateYield(
      plot.soilMoisture,
      plot.npkLevel,
      plot.ph
    );

    const actualYield = results.actualYield * (plot.size / 10000); // Conversion m² → ha

    // Ajouter récolte aux ressources
    this.resourceManager.add(
      { harvest: { [plot.crop.id]: actualYield } },
      `Récolte parcelle ${plotId}`
    );

    // Réinitialiser la parcelle
    this.resetPlot(plot);

    console.log(`🌾 Récolte: ${actualYield.toFixed(2)} tonnes de ${plot.crop.name.fr}`);

    return {
      success: true,
      yield: actualYield,
      results
    };
  }

  /**
   * Réinitialiser une parcelle après récolte
   * @param {Object} plot
   */
  resetPlot(plot) {
    plot.isPlanted = false;
    plot.crop = null;
    plot.daysSincePlant = 0;
    plot.growthStage = 0;
    plot.plantCount = 0;
    plot.health = 100;
    plot.biomass = 0;
    plot.LAI = 0;
    plot.actionsHistory = [];
    plot.simulationEngine = null;

    // Réduction légère qualité sol après récolte
    plot.soilQuality -= 5;
    plot.soilOrganic -= 10;
    plot.npkLevel = Math.max(20, plot.npkLevel - 20);
  }

  /**
   * Obtenir le résumé de toutes les parcelles
   * @returns {Array}
   */
  getSummary() {
    return this.plots.map(plot => ({
      id: plot.id,
      name: plot.name,
      unlocked: plot.unlocked,
      isPlanted: plot.isPlanted,
      crop: plot.crop?.name?.fr || 'Vide',
      cropIcon: plot.crop?.emoji || '🔒',
      progress: plot.crop ? `${plot.daysSincePlant}/${plot.crop.growthDuration}` : '-',
      health: plot.health,
      growthStage: this.getGrowthStageName(plot.growthStage)
    }));
  }

  /**
   * Obtenir le nom du stade de croissance
   * @param {Number} stage
   * @returns {String}
   */
  getGrowthStageName(stage) {
    const stages = {
      0: 'Vide',
      1: 'Germination',
      2: 'Végétatif',
      3: 'Floraison',
      4: 'Maturation',
      5: 'Sur-mature'
    };
    return stages[stage] || 'Inconnu';
  }

  /**
   * Sauvegarder l'état
   * @param {String} key
   */
  save(key = 'ilerise_plots') {
    const data = {
      plots: this.plots.map(plot => ({
        ...plot,
        crop: plot.crop?.id || null, // Sauver uniquement l'ID
        simulationEngine: null // Ne pas sauver le moteur
      })),
      activePlotId: this.activePlotId
    };

    localStorage.setItem(key, JSON.stringify(data));
    console.log('💾 Parcelles sauvegardées');
  }

  /**
   * Charger l'état
   * @param {String} key
   */
  load(key = 'ilerise_plots') {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        this.activePlotId = data.activePlotId;

        // Restaurer les parcelles
        data.plots.forEach((savedPlot, index) => {
          this.plots[index] = { ...savedPlot };

          // Recréer le crop et simulation engine si planté
          if (savedPlot.crop && savedPlot.isPlanted) {
            this.plots[index].crop = CROPS[savedPlot.crop];
            this.plots[index].simulationEngine = new SimulationEngine(
              this.plots[index].crop,
              this.nasaData
            );
          }
        });

        console.log('📦 Parcelles chargées');
        return true;
      }
    } catch (e) {
      console.error('❌ Erreur chargement parcelles:', e);
    }
    return false;
  }
}
