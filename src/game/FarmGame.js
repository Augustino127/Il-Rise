/**
 * FarmGame.js
 * Contrôleur principal du système de ferme interactive V3
 * IleRise V3 - NASA Space Apps Challenge 2025
 *
 * Orchestre tous les systèmes:
 * - ResourceManager
 * - TimeSimulation
 * - PlotManager
 * - FarmActionSystem
 * - LivestockManager
 * - MarketSystem
 */

import { ResourceManager } from './ResourceManager.js';
import { TimeSimulation } from './TimeSimulation.js';
import { PlotManager } from './PlotManager.js';
import { FarmActionSystem } from './FarmActionSystem.js';
import { LivestockManager } from './LivestockManager.js';
import { MarketSystem } from './MarketSystem.js';
import apiService from '../services/api.js';

export class FarmGame {
  constructor(nasaData, playerLevel = 1) {
    this.playerLevel = playerLevel;
    this.nasaData = nasaData;

    // Initialiser tous les systèmes
    this.resourceManager = new ResourceManager();
    this.timeSimulation = new TimeSimulation();
    this.plotManager = new PlotManager(this.resourceManager, this.timeSimulation, nasaData);
    this.actionSystem = new FarmActionSystem(this.resourceManager);
    this.livestockManager = new LivestockManager(this.resourceManager, this.timeSimulation);
    this.marketSystem = new MarketSystem(this.resourceManager, this.timeSimulation);

    // État du jeu
    this.isInitialized = false;
    this.isPaused = false;

    // Callbacks pour l'UI
    this.onDayChangeCallback = null;
    this.onResourceChangeCallback = null;
    this.onActionCompleteCallback = null;
    this.onSyncErrorCallback = null; // Callback pour afficher les erreurs de sync

    // Synchronisation backend
    this.useBackendSync = apiService.isAuthenticated();
    this.autoSaveInterval = null;
    this.lastServerSync = null;

    console.log('🌾 FarmGame initialisé');
    console.log(this.useBackendSync ? '🔐 Mode authentifié - Sync backend activée' : '💾 Mode local - Sync localStorage uniquement');
  }

  /**
   * Initialiser le jeu
   * @param {Object} options - Options de démarrage
   */
  async initialize(options = {}) {
    // Charger sauvegarde
    if (options.loadSave) {
      if (this.useBackendSync) {
        await this.loadFromServer();
      } else {
        this.load(); // localStorage fallback
      }
    }

    // Configurer les callbacks de temps
    this.timeSimulation.onDayChange = (day) => this.handleDayChange(day);
    this.timeSimulation.onHourChange = (hour) => this.handleHourChange(hour);

    // Démarrer auto-save périodique (toutes les 2 minutes si backend, 30s si local)
    if (this.useBackendSync) {
      this.startAutoSync(120000); // 2 min
    } else {
      this.startAutoSync(30000); // 30s
    }

    this.isInitialized = true;
    console.log('✅ FarmGame prêt');
  }

  /**
   * Démarrer la simulation
   */
  start() {
    if (!this.isInitialized) {
      console.warn('⚠️ Appeler initialize() avant start()');
      return;
    }

    this.timeSimulation.start();
    console.log('▶️ Simulation démarrée');
  }

  /**
   * Arrêter la simulation
   */
  async stop() {
    this.timeSimulation.stop();

    // Arrêter auto-save
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    // Sauvegarder une dernière fois
    if (this.useBackendSync) {
      await this.saveToServer();
    } else {
      this.save();
    }

    console.log('⏹️ Simulation arrêtée');
  }

  /**
   * Mettre en pause/reprendre
   */
  togglePause() {
    this.timeSimulation.togglePause();
    this.isPaused = this.timeSimulation.isPaused;
  }

  /**
   * Passer au jour suivant
   */
  skipToNextDay() {
    this.timeSimulation.skipToNextDay();
  }

  /**
   * Gérer le changement de jour
   * @param {Number} day
   */
  handleDayChange(day) {
    console.log(`📅 Nouveau jour: ${day}`);

    // Mettre à jour toutes les parcelles
    this.plotManager.updateAllPlots(day);

    // Mettre à jour l'élevage
    this.livestockManager.update(day);

    // Mettre à jour le marché (tous les 3 jours)
    if (day % 3 === 0) {
      this.marketSystem.updateMarket();
    }

    // Mettre à jour les actions en cours
    const completedActions = this.actionSystem.updateActions(day);
    for (const action of completedActions) {
      const plot = this.plotManager.getPlot(action.plot);
      if (plot) {
        const changes = this.actionSystem.applyEffects(action, plot);
        console.log(`✅ Effets appliqués:`, changes);

        if (this.onActionCompleteCallback) {
          this.onActionCompleteCallback(action, changes);
        }
      }
    }

    // Callback personnalisé
    if (this.onDayChangeCallback) {
      this.onDayChangeCallback(day);
    }

    // Sauvegarde automatique tous les 5 jours
    if (day % 5 === 0) {
      if (this.useBackendSync) {
        this.saveToServer().catch(err => console.error('Auto-save error:', err));
      } else {
        this.save();
      }
    }
  }

  /**
   * Gérer le changement d'heure
   * @param {Number} hour
   */
  handleHourChange(hour) {
    // Logique spécifique aux heures si nécessaire
    // Ex: collecte automatique des œufs à 6h
    if (hour === 6 && this.livestockManager.animals.chickens.count > 0) {
      this.livestockManager.collectEggs();
    }
  }

  /**
   * Exécuter une action agricole
   * @param {String} actionId
   * @param {Number} plotId
   * @returns {Object}
   */
  executeAction(actionId, plotId = null) {
    const targetPlot = plotId
      ? this.plotManager.getPlot(plotId)
      : this.plotManager.getActivePlot();

    if (!targetPlot) {
      return { success: false, error: 'Parcelle non trouvée' };
    }

    // Vérifier disponibilité
    const availability = this.actionSystem.isAvailable(actionId, targetPlot, this.playerLevel);
    if (!availability.available) {
      return { success: false, error: availability.reason };
    }

    // Exécuter
    const result = this.actionSystem.executeAction(
      actionId,
      targetPlot,
      this.timeSimulation.currentDay
    );

    if (result.success && this.onResourceChangeCallback) {
      this.onResourceChangeCallback(this.resourceManager.getSummary());
    }

    return result;
  }

  /**
   * Planter une culture
   * @param {String} cropId
   * @param {Number} plotId
   * @returns {Boolean}
   */
  plantCrop(cropId, plotId = null) {
    const targetPlot = plotId
      ? this.plotManager.getPlot(plotId)
      : this.plotManager.getActivePlot();

    if (!targetPlot) return false;

    // Utiliser FarmActionSystem pour l'action 'plant'
    return this.executeAction('plant', targetPlot.id);
  }

  /**
   * Récolter une parcelle
   * @param {Number} plotId
   * @returns {Object}
   */
  harvestPlot(plotId = null) {
    const targetPlot = plotId
      ? this.plotManager.getPlot(plotId)
      : this.plotManager.getActivePlot();

    if (!targetPlot) {
      return { success: false, error: 'Parcelle non trouvée' };
    }

    // Exécuter d'abord l'action 'harvest' pour consommer ressources
    const actionResult = this.executeAction('harvest', targetPlot.id);
    if (!actionResult.success) {
      return actionResult;
    }

    // Puis récolter via PlotManager
    return this.plotManager.harvestPlot(targetPlot.id);
  }

  /**
   * Acheter au marché
   * @param {String} category
   * @param {String} item
   * @param {Number} quantity
   * @returns {Object}
   */
  buyFromMarket(category, item, quantity) {
    const result = this.marketSystem.buy(category, item, quantity);

    if (result.success && this.onResourceChangeCallback) {
      this.onResourceChangeCallback(this.resourceManager.getSummary());
    }

    return result;
  }

  /**
   * Vendre au marché
   * @param {String} category
   * @param {String} item
   * @param {Number} quantity
   * @returns {Object}
   */
  sellToMarket(category, item, quantity) {
    const result = this.marketSystem.sell(category, item, quantity);

    if (result.success && this.onResourceChangeCallback) {
      this.onResourceChangeCallback(this.resourceManager.getSummary());
    }

    return result;
  }

  /**
   * Acheter des poulets
   * @param {Number} count
   * @returns {Boolean}
   */
  buyChickens(count) {
    const result = this.livestockManager.buyChickens(count);

    if (result && this.onResourceChangeCallback) {
      this.onResourceChangeCallback(this.resourceManager.getSummary());
    }

    return result;
  }

  /**
   * Nourrir les poulets
   * @returns {Boolean}
   */
  feedChickens() {
    const result = this.livestockManager.feedChickens();

    if (result && this.onResourceChangeCallback) {
      this.onResourceChangeCallback(this.resourceManager.getSummary());
    }

    return result;
  }

  /**
   * Démarrer le compostage
   * @param {Number} manureAmount
   * @returns {Boolean}
   */
  startComposting(manureAmount) {
    return this.livestockManager.startComposting(
      manureAmount,
      this.timeSimulation.currentDay
    );
  }

  /**
   * Débloquer une parcelle
   * @param {Number} plotId
   * @returns {Boolean}
   */
  unlockPlot(plotId) {
    const result = this.plotManager.unlockPlot(plotId, this.playerLevel);

    if (result && this.onResourceChangeCallback) {
      this.onResourceChangeCallback(this.resourceManager.getSummary());
    }

    return result;
  }

  /**
   * Obtenir l'état complet du jeu
   * @returns {Object}
   */
  getState() {
    return {
      time: this.timeSimulation.getState(),
      resources: this.resourceManager.getSummary(),
      plots: this.plotManager.getSummary(),
      livestock: this.livestockManager.getSummary(),
      marketTrends: this.marketSystem.getTrends(),
      activePlot: this.plotManager.getActivePlot(),
      playerLevel: this.playerLevel
    };
  }

  /**
   * Obtenir les actions disponibles pour la parcelle active
   * @returns {Array}
   */
  getAvailableActions() {
    const activePlot = this.plotManager.getActivePlot();
    if (!activePlot) return [];

    return this.actionSystem.getAvailableActions(activePlot, this.playerLevel);
  }

  /**
   * Sérialiser l'état complet de la ferme pour envoi au serveur
   * @returns {Object}
   */
  serializeFarmState() {
    return {
      location: {
        city: this.nasaData.location,
        ndvi: this.nasaData.ndvi,
        temperature: this.nasaData.temperature,
        precipitation: this.nasaData.precipitation,
        soilMoisture: this.nasaData.soilMoisture?.current_percent
      },
      time: this.timeSimulation.getState(),
      playerLevel: this.playerLevel,
      plots: this.plotManager.plots.map(plot => ({
        id: plot.id,
        name: plot.name,
        size: plot.size,
        unlocked: plot.unlocked,
        isPlanted: plot.isPlanted,
        isPlowed: plot.isPlowed,
        crop: plot.crop ? {
          id: plot.crop.id,
          name: plot.crop.name,
          growthDuration: plot.crop.growthDuration,
          emoji: plot.crop.emoji
        } : null,
        daysSincePlant: plot.daysSincePlant,
        growthStage: plot.growthStage,
        plantCount: plot.plantCount,
        health: plot.health,
        soilMoisture: plot.soilMoisture,
        npkLevel: plot.npkLevel,
        ph: plot.ph,
        soilQuality: plot.soilQuality,
        soilOrganic: plot.soilOrganic,
        weedLevel: plot.weedLevel,
        pestLevel: plot.pestLevel,
        pestResistance: plot.pestResistance,
        biomass: plot.biomass,
        LAI: plot.LAI,
        actionsHistory: plot.actionsHistory || []
      })),
      resources: this.resourceManager.resources,
      livestock: {
        infrastructure: this.livestockManager.infrastructure,
        animals: this.livestockManager.animals,
        production: this.livestockManager.production
      },
      market: {
        priceModifiers: Object.fromEntries(
          Object.entries(this.marketSystem.priceModifiers).map(([category, items]) => [
            category,
            typeof items === 'object' ? Object.fromEntries(Object.entries(items)) : items
          ])
        ),
        trends: Object.fromEntries(Object.entries(this.marketSystem.trends))
      },
      activeActions: this.actionSystem.activeActions,
      isPaused: this.isPaused
    };
  }

  /**
   * Sauvegarder l'état vers le serveur
   */
  async saveToServer() {
    try {
      const farmState = this.serializeFarmState();
      const response = await apiService.saveFarm(farmState);

      this.lastServerSync = new Date();
      console.log('☁️ Ferme sauvegardée sur le serveur');

      return response;
    } catch (error) {
      console.error('❌ Erreur sauvegarde serveur, fallback localStorage:', error);

      // Notifier l'utilisateur de l'échec de synchronisation
      if (this.onSyncErrorCallback) {
        this.onSyncErrorCallback('Échec de la sauvegarde en ligne. Vos données sont sauvegardées localement.', 'warning');
      }

      // Fallback sur localStorage en cas d'erreur
      this.save();
      throw error;
    }
  }

  /**
   * Charger l'état depuis le serveur
   */
  async loadFromServer() {
    try {
      const response = await apiService.loadFarm();

      if (response.success && response.data) {
        this.loadFarmState(response.data);
        this.lastServerSync = new Date();
        console.log('☁️ Ferme chargée depuis le serveur');
        return true;
      }

      // Pas de ferme sur le serveur - initialiser pour la première fois
      console.log('🌱 Aucune ferme trouvée sur le serveur, initialisation...');

      try {
        const initResponse = await apiService.initializeFarm({
          city: this.nasaData.location,
          ndvi: this.nasaData.ndvi,
          temperature: this.nasaData.temperature,
          precipitation: this.nasaData.precipitation,
          soilMoisture: this.nasaData.soilMoisture?.current_percent
        });

        if (initResponse.success) {
          console.log('✅ Ferme initialisée sur le serveur');
          // Sauvegarder l'état initial
          await this.saveToServer();
          return true;
        }
      } catch (initError) {
        console.warn('⚠️ Impossible d\'initialiser la ferme sur le serveur:', initError.message);

        // Notifier l'utilisateur
        if (this.onSyncErrorCallback) {
          this.onSyncErrorCallback('Impossible d\'initialiser la ferme en ligne. Mode local activé.', 'warning');
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Erreur chargement serveur, fallback localStorage:', error);

      // Notifier l'utilisateur
      if (this.onSyncErrorCallback) {
        this.onSyncErrorCallback('Échec du chargement en ligne. Utilisation des données locales.', 'warning');
      }

      // Fallback sur localStorage
      return this.load();
    }
  }

  /**
   * Charger un état de ferme sérialisé
   * @param {Object} farmState
   */
  loadFarmState(farmState) {
    // Charger les données de temps
    if (farmState.time) {
      this.timeSimulation.currentDay = farmState.time.day || farmState.time.currentDay || 0;
      this.timeSimulation.currentHour = farmState.time.hour || farmState.time.currentHour || 6;
      this.timeSimulation.speed = farmState.time.speed || 2;
    }

    // Charger niveau joueur
    this.playerLevel = farmState.playerLevel || 1;

    // Charger parcelles
    if (farmState.plots) {
      this.plotManager.plots = farmState.plots;
    }

    // Charger ressources
    if (farmState.resources) {
      this.resourceManager.resources = farmState.resources;
    }

    // Charger élevage
    if (farmState.livestock) {
      Object.assign(this.livestockManager.infrastructure, farmState.livestock.infrastructure || {});
      Object.assign(this.livestockManager.animals, farmState.livestock.animals || {});
      Object.assign(this.livestockManager.production, farmState.livestock.production || {});
    }

    // Charger marché
    if (farmState.market) {
      if (farmState.market.priceModifiers) {
        this.marketSystem.priceModifiers = farmState.market.priceModifiers;
      }
      if (farmState.market.trends) {
        this.marketSystem.trends = farmState.market.trends;
      }
    }

    // Charger actions actives
    if (farmState.activeActions) {
      this.actionSystem.activeActions = farmState.activeActions;
    }

    // État pause
    this.isPaused = farmState.isPaused || false;
  }

  /**
   * Démarrer l'auto-synchronisation périodique
   * @param {Number} interval - Intervalle en millisecondes
   */
  startAutoSync(interval = 120000) {
    // Nettoyer l'ancien interval s'il existe
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(async () => {
      if (!this.isPaused && this.isInitialized) {
        if (this.useBackendSync) {
          try {
            await this.saveToServer();
          } catch (error) {
            // Erreur déjà loggée dans saveToServer
          }
        } else {
          this.save();
        }
      }
    }, interval);

    console.log(`⏰ Auto-save activée (${interval / 1000}s)`);
  }

  /**
   * Sauvegarder tout l'état du jeu (localStorage)
   * @param {String} slot - Slot de sauvegarde (ex: 'save1', 'autosave')
   */
  save(slot = 'autosave') {
    try {
      const saveData = {
        version: '3.0',
        timestamp: Date.now(),
        playerLevel: this.playerLevel
      };

      // Sauvegarder chaque système
      this.resourceManager.save(`${slot}_resources`);
      this.timeSimulation.save(`${slot}_time`);
      this.plotManager.save(`${slot}_plots`);
      this.livestockManager.save(`${slot}_livestock`);
      this.marketSystem.save(`${slot}_market`);

      // Sauvegarder métadonnées
      localStorage.setItem(`ilerise_${slot}_meta`, JSON.stringify(saveData));

      console.log(`💾 Jeu sauvegardé (${slot})`);
      return true;
    } catch (e) {
      console.error('❌ Erreur sauvegarde:', e);
      return false;
    }
  }

  /**
   * Charger l'état du jeu
   * @param {String} slot
   */
  load(slot = 'autosave') {
    try {
      const metaKey = `ilerise_${slot}_meta`;
      const meta = localStorage.getItem(metaKey);

      if (!meta) {
        console.log('ℹ️ Aucune sauvegarde trouvée');
        return false;
      }

      const saveData = JSON.parse(meta);
      this.playerLevel = saveData.playerLevel;

      // Charger chaque système
      this.resourceManager.load(`${slot}_resources`);
      this.timeSimulation.load(`${slot}_time`);
      this.plotManager.load(`${slot}_plots`);
      this.livestockManager.load(`${slot}_livestock`);
      this.marketSystem.load(`${slot}_market`);

      console.log(`📦 Jeu chargé (${slot}, ${new Date(saveData.timestamp).toLocaleString()})`);
      return true;
    } catch (e) {
      console.error('❌ Erreur chargement:', e);
      return false;
    }
  }

  /**
   * Réinitialiser complètement le jeu
   */
  reset() {
    this.stop();

    this.resourceManager.reset();
    this.timeSimulation.reset();
    this.plotManager = new PlotManager(this.resourceManager, this.timeSimulation, this.nasaData);
    this.livestockManager = new LivestockManager(this.resourceManager, this.timeSimulation);
    this.marketSystem = new MarketSystem(this.resourceManager, this.timeSimulation);
    this.playerLevel = 1;

    console.log('🔄 Jeu réinitialisé');
  }
}
