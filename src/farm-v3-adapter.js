/**
 * farm-v3-adapter.js
 * Adapter pour intégrer le système de Ferme V3 dans game.html
 * Adapte les ID pour éviter les conflits
 */

import { FarmGame } from './game/FarmGame.js';
import { FarmScene } from './3d/FarmScene.js';

export class FarmV3Adapter {
  constructor(app) {
    this.app = app; // Référence à l'application principale
    this.farmGame = null;
    this.farmScene = null;
    this.currentSection = 'farm';
    this.activePlotId = 1;
    this.selectedCropId = null;
    this.isInitialized = false;
  }

  /**
   * Initialiser le mode Ferme V3
   */
  async init() {
    if (this.isInitialized) {
      console.log('⚠️ Mode Ferme déjà initialisé');
      return;
    }

    console.log('🌾 Initialisation Mode Ferme V3...');

    try {
      // Récupérer les données NASA depuis l'app principale
      const locationData = this.app.currentLocation || {
        city: 'Parakou',
        ndvi: 0.35,
        temperature: 28,
        soilMoisture: 25,
        precipitation: 0
      };

      // Préparer données NASA pour FarmGame
      const nasaData = {
        soilMoisture: {
          current_percent: locationData.soilMoisture || 25,
          optimal: 65
        },
        ndvi: locationData.ndvi || 0.35,
        temperature: locationData.temperature || 28,
        precipitation: locationData.precipitation || 0,
        location: locationData.city
      };

      // Créer instance FarmGame
      this.farmGame = new FarmGame(nasaData, 1);

      // Configurer callbacks
      this.setupCallbacks();

      // Initialiser (charge sauvegarde si dispo)
      await this.farmGame.initialize({ loadSave: true });

      // Setup UI
      this.setupEventListeners();
      this.setupKeyboardShortcuts();

      // Initialiser scène 3D
      this.init3DScene();

      // Démarrer simulation
      this.farmGame.start();

      // Mise à jour initiale UI
      this.updateUI();

      this.isInitialized = true;
      console.log('✅ Mode Ferme V3 initialisé');

    } catch (error) {
      console.error('❌ Erreur initialisation Mode Ferme:', error);
      this.showToast('Erreur d\'initialisation du mode Ferme', 'error');
    }
  }

  /**
   * Configurer les callbacks du jeu
   */
  setupCallbacks() {
    this.farmGame.onDayChangeCallback = (day) => {
      this.updateTimeDisplay();
      this.updatePlotsDisplay();
      this.updateSoilDisplay();
      this.updateEventsDisplay();
    };

    this.farmGame.onResourceChangeCallback = (resources) => {
      this.updateResourcesDisplay();
      this.updateInventoryDisplay();
      this.updateActionsAvailability();
    };

    this.farmGame.onActionCompleteCallback = (action, changes) => {
      this.showToast(`✅ ${action.action.name.fr} terminé`);
      this.updateUI();
    };
  }

  /**
   * Initialiser la scène 3D
   */
  init3DScene() {
    const container = document.getElementById('farm-scene-container-v3');
    if (!container) {
      console.warn('⚠️ Conteneur 3D non trouvé');
      return;
    }

    // Créer scène 3D
    this.farmScene = new FarmScene(container);

    // Planter culture initiale si une parcelle a une culture
    const activePlot = this.farmGame.plotManager.getPlot(this.activePlotId);
    if (activePlot && activePlot.crop) {
      this.farmScene.plantCrop(activePlot.crop.id, 49);
      this.farmScene.animateGrowth(2000);
    }

    console.log('✅ Scène 3D initialisée');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Bouton retour
    document.getElementById('btn-back-farm-v3')?.addEventListener('click', () => {
      this.exitFarmMode();
    });

    // Sélecteur de culture
    document.getElementById('crop-select-v3')?.addEventListener('change', (e) => {
      const cropId = e.target.value;
      if (cropId) {
        this.selectedCropId = cropId;
        const cropName = e.target.options[e.target.selectedIndex].text;
        this.showToast(`🌾 ${cropName} sélectionné`, 'info');
      }
    });

    // Contrôles temps
    document.getElementById('btn-pause-v3')?.addEventListener('click', () => {
      this.farmGame.togglePause();
    });

    document.getElementById('btn-next-day-v3')?.addEventListener('click', () => {
      this.farmGame.skipToNextDay();
    });

    // Vitesse simulation
    document.querySelectorAll('#screen-farm-v3 .speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const speed = parseInt(e.target.dataset.speed);
        this.farmGame.timeSimulation.setSpeed(speed);
        document.querySelectorAll('#screen-farm-v3 .speed-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // Sélection parcelle
    document.querySelectorAll('#screen-farm-v3 .plot-mini').forEach(plotBtn => {
      plotBtn.addEventListener('click', (e) => {
        const plotId = parseInt(e.currentTarget.dataset.plotId);
        this.selectPlot(plotId);
      });
    });

    // Navigation sections
    document.querySelectorAll('#screen-farm-v3 .nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        this.switchSection(section);
      });
    });

    // Actions agricoles
    document.querySelectorAll('#screen-farm-v3 .action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const actionId = e.currentTarget.dataset.action;
        this.executeAction(actionId);
      });
    });
  }

  /**
   * Setup raccourcis clavier
   */
  setupKeyboardShortcuts() {
    const shortcuts = {
      'l': 'plow',
      's': 'plant',
      'w': 'water',
      'f': 'fertilize_npk',
      'c': 'fertilize_organic',
      'd': 'weed',
      'p': 'spray_pesticide_natural',
      'h': 'harvest'
    };

    document.addEventListener('keydown', (e) => {
      // Uniquement si on est dans l'écran ferme V3
      const farmScreen = document.getElementById('screen-farm-v3');
      if (!farmScreen || !farmScreen.classList.contains('active')) return;

      // Ignorer si dans un input, textarea ou select
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      const actionId = shortcuts[e.key.toLowerCase()];
      if (actionId) {
        e.preventDefault();
        this.executeAction(actionId);
      }
    });
  }

  /**
   * Exécuter une action agricole
   */
  executeAction(actionId) {
    // Si c'est une action de plantation
    if (actionId === 'plant') {
      if (!this.selectedCropId) {
        this.showToast('⚠️ Veuillez d\'abord sélectionner une culture', 'warning');
        return;
      }

      const success = this.farmGame.plotManager.plantCrop(this.selectedCropId, this.activePlotId);
      if (!success) {
        this.showToast('❌ Impossible de planter cette culture', 'error');
        return;
      }

      if (this.farmScene) {
        this.farmScene.clearPlants();
        this.farmScene.plantCrop(this.selectedCropId, 49);
        this.farmScene.animateGrowth(2000);
      }

      this.showToast(`🌱 ${this.selectedCropId.toUpperCase()} planté !`, 'success');
      this.updateUI();
      return;
    }

    // Exécuter autres actions
    const result = this.farmGame.executeAction(actionId, this.activePlotId);

    if (result.success) {
      this.showToast(`✅ Action terminée`, 'success');
    } else {
      this.showToast(`❌ ${result.error || 'Action impossible'}`, 'error');
    }
  }

  /**
   * Sélectionner une parcelle
   */
  selectPlot(plotId) {
    const plot = this.farmGame.plotManager.getPlot(plotId);
    if (!plot || !plot.unlocked) {
      this.showToast('Parcelle verrouillée', 'warning');
      return;
    }

    this.activePlotId = plotId;
    this.farmGame.plotManager.setActivePlot(plotId);

    document.querySelectorAll('#screen-farm-v3 .plot-mini').forEach(p => p.classList.remove('active'));
    document.querySelector(`#screen-farm-v3 [data-plot-id="${plotId}"]`)?.classList.add('active');

    this.updatePlotInfo();
    this.updateSoilDisplay();

    if (this.farmScene) {
      this.farmScene.clearPlants();
      if (plot.crop) {
        this.farmScene.plantCrop(plot.crop.id, 49);
        const growthProgress = plot.daysSincePlant / plot.crop.growthDuration;
        this.farmScene.plants.forEach(plant => {
          plant.scale.set(growthProgress, growthProgress, growthProgress);
        });
      }
    }
  }

  /**
   * Changer de section
   */
  switchSection(section) {
    this.currentSection = section;

    document.querySelectorAll('#screen-farm-v3 .nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`#screen-farm-v3 .nav-btn[data-section="${section}"]`)?.classList.add('active');

    document.querySelectorAll('#screen-farm-v3 .section-content').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${section}-v3`)?.classList.add('active');
  }

  /**
   * Mettre à jour l'UI complète
   */
  updateUI() {
    this.updateTimeDisplay();
    this.updateResourcesDisplay();
    this.updatePlotsDisplay();
    this.updatePlotInfo();
    this.updateSoilDisplay();
    this.updateInventoryDisplay();
    this.updateActionsAvailability();
    this.updateEventsDisplay();
  }

  /**
   * Mettre à jour affichage temps
   */
  updateTimeDisplay() {
    const time = this.farmGame.timeSimulation;
    document.getElementById('display-day-v3').textContent = `Jour ${time.currentDay}`;
    document.getElementById('display-time-v3').textContent = `${time.currentHour}:00`;
    document.getElementById('display-season-v3').textContent = time.currentSeason;
  }

  /**
   * Mettre à jour affichage ressources
   */
  updateResourcesDisplay() {
    const resources = this.farmGame.resourceManager.resources;
    document.getElementById('display-money-v3').textContent = Math.floor(resources.money);
    document.getElementById('display-water-v3').textContent = `${Math.floor(resources.water)}L`;
  }

  /**
   * Mettre à jour info parcelle
   */
  updatePlotInfo() {
    const plot = this.farmGame.plotManager.getActivePlot();
    if (!plot) return;

    document.getElementById('plot-crop-v3').textContent = plot.crop?.name?.fr || 'Vide';
    document.getElementById('plot-progress-v3').textContent = plot.crop
      ? `${plot.daysSincePlant}/${plot.crop.growthDuration} jours`
      : '-';
    document.getElementById('plot-health-v3').querySelector('span:last-child').textContent = `${Math.round(plot.health)}%`;
    document.getElementById('plot-health-v3').querySelector('.health-fill').style.width = `${plot.health}%`;
    document.getElementById('plot-stage-v3').textContent = this.farmGame.plotManager.getGrowthStageName(plot.growthStage);
  }

  /**
   * Mettre à jour affichage sol
   */
  updateSoilDisplay() {
    const plot = this.farmGame.plotManager.getActivePlot();
    if (!plot) return;

    document.getElementById('soil-moisture-value-v3').textContent = `${Math.round(plot.soilMoisture)}%`;
    document.getElementById('soil-moisture-fill-v3').style.width = `${plot.soilMoisture}%`;

    const npkPercent = (plot.npkLevel / 150) * 100;
    document.getElementById('soil-npk-value-v3').textContent = `${Math.round(npkPercent)}%`;
    document.getElementById('soil-npk-fill-v3').style.width = `${npkPercent}%`;

    const phPercent = ((plot.ph - 4) / 4) * 100;
    document.getElementById('soil-ph-value-v3').textContent = plot.ph.toFixed(1);
    document.getElementById('soil-ph-fill-v3').style.width = `${phPercent}%`;

    document.getElementById('soil-weed-value-v3').textContent = `${Math.round(plot.weedLevel)}%`;
    document.getElementById('soil-weed-fill-v3').style.width = `${plot.weedLevel}%`;

    if (this.farmScene) {
      this.farmScene.updatePlantConditions(plot.soilMoisture, plot.npkLevel, plot.ph);
    }
  }

  /**
   * Mettre à jour inventaire
   */
  updateInventoryDisplay() {
    const resources = this.farmGame.resourceManager.resources;

    const totalSeeds = Object.values(resources.seeds).reduce((a, b) => a + b, 0);
    document.getElementById('inv-seeds-total-v3').textContent = totalSeeds;
    document.getElementById('inv-npk-v3').textContent = `${resources.fertilizers.npk}kg`;
    document.getElementById('inv-compost-v3').textContent = `${resources.fertilizers.organic}kg`;

    const totalHarvest = Object.values(resources.harvest).reduce((a, b) => a + b, 0);
    document.getElementById('inv-harvest-v3').textContent = `${totalHarvest.toFixed(1)}t`;
  }

  /**
   * Mettre à jour disponibilité des actions
   */
  updateActionsAvailability() {
    // À implémenter si besoin
  }

  /**
   * Mettre à jour affichage événements
   */
  updateEventsDisplay() {
    const events = this.farmGame.timeSimulation.getUpcomingEvents();
    const container = document.getElementById('events-list-v3');
    if (!container) return;

    container.innerHTML = '';
    if (events.length === 0) {
      container.innerHTML = '<div class="event-item"><span class="event-day">-</span><span class="event-desc">Aucun événement</span></div>';
      return;
    }

    events.forEach(event => {
      const eventDiv = document.createElement('div');
      eventDiv.className = 'event-item';
      eventDiv.innerHTML = `
        <span class="event-day">J+${event.daysRemaining}</span>
        <span class="event-desc">${event.description}</span>
      `;
      container.appendChild(eventDiv);
    });
  }

  /**
   * Mettre à jour parcelles
   */
  updatePlotsDisplay() {
    // Mise à jour visuelle des parcelles
  }

  /**
   * Afficher un toast
   */
  showToast(message, type = 'info') {
    // Réutiliser le système de toast de l'app principale
    if (this.app && this.app.showToast) {
      this.app.showToast(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Quitter le mode Ferme
   */
  exitFarmMode() {
    // Sauvegarder avant de quitter
    if (this.farmGame) {
      this.farmGame.save(1);
    }

    // Retourner à l'écran de jeu
    this.app.showScreen('game');
  }

  /**
   * Nettoyer lors de la fermeture
   */
  dispose() {
    if (this.farmScene) {
      this.farmScene.dispose();
    }
    if (this.farmGame) {
      this.farmGame.save(1);
      this.farmGame.stop();
    }
    this.isInitialized = false;
  }
}

export default FarmV3Adapter;
