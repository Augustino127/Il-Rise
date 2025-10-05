/**
 * app-v3.js
 * Application principale IleRise V3 - Ferme Interactive
 * NASA Space Apps Challenge 2025
 */

import { FarmGame } from './game/FarmGame.js';
import { LocationSelector } from './location/LocationSelector.js';
import { FarmScene } from './3d/FarmScene.js';
import apiService from './services/api.js';

class IleRiseFarmApp {
  constructor() {
    this.farmGame = null;
    this.locationSelector = null;
    this.farmScene = null;
    this.currentSection = 'farm';
    this.activePlotId = 1;
    this.currentLocation = null;
    this.nasaDataFull = null;
    this.selectedCropId = null; // Culture sélectionnée pour plantation

    // Screens
    this.screens = {
      location: document.getElementById('screen-location'),
      farm: document.getElementById('screen-farm')
    };
  }

  /**
   * Initialiser l'application
   */
  async init() {
    console.log('🌾 Initialisation IleRise Farm V3...');

    try {
      // Charger données NASA réelles
      await this.loadNASAData();

      // Vérifier si localité déjà sélectionnée
      const savedLocation = localStorage.getItem('ilerise_v3_location');
      if (savedLocation) {
        this.currentLocation = JSON.parse(savedLocation);
        console.log('📍 Localité sauvegardée:', this.currentLocation.city);
        this.showScreen('farm');
        await this.initFarmGame();
      } else {
        // Afficher écran de sélection de localité
        this.showLocationSelection();
      }

      console.log('✅ IleRise Farm V3 initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation:', error);
      this.showToast('Erreur d\'initialisation', 'error');
    }
  }

  /**
   * Charger données NASA depuis les fichiers locaux
   */
  async loadNASAData() {
    try {
      console.log('📡 Chargement fichiers NASA...');

      const [temperature, ndvi, precipitation] = await Promise.all([
        fetch('/data/nasa-temperature-benin.json').then(r => {
          console.log('  ✓ Température chargée');
          return r.json();
        }),
        fetch('/data/nasa-ndvi-benin.json').then(r => {
          console.log('  ✓ NDVI chargé');
          return r.json();
        }),
        fetch('/data/nasa-precipitation-benin.json').then(r => {
          console.log('  ✓ Précipitations chargées');
          return r.json();
        })
      ]);

      // SMAP optionnel (peut ne pas exister)
      let smap = null;
      try {
        smap = await fetch('/data/nasa-smap-benin.json').then(r => r.json());
        console.log('  ✓ SMAP chargé');
      } catch {
        console.log('  ⚠️  SMAP non disponible (optionnel)');
      }

      this.nasaDataFull = {
        temperature,
        ndvi,
        precipitation,
        smap
      };

      console.log('✅ Données NASA chargées');
      return this.nasaDataFull;

    } catch (error) {
      console.error('❌ Erreur chargement données NASA:', error);
      throw error;
    }
  }

  /**
   * Afficher écran de sélection de localité
   */
  showLocationSelection() {
    this.showScreen('location');

    // Initialiser LocationSelector
    if (!this.locationSelector) {
      this.locationSelector = new LocationSelector(this.nasaDataFull);

      // Initialiser la carte après un court délai (DOM ready)
      setTimeout(() => {
        this.locationSelector.initMap('satellite-map');
      }, 100);

      // Bouton confirmer localité
      document.getElementById('btn-confirm-location')?.addEventListener('click', () => {
        this.confirmLocationSelection();
      });
    }

    // Exposer méthode pour les popups Leaflet
    window.app = this;
  }

  /**
   * Confirmer sélection de localité (appelé depuis popup ou bouton)
   */
  confirmLocationSelection(cityName) {
    if (cityName) {
      // Appelé depuis le bouton popup Leaflet
      const location = this.nasaDataFull.ndvi.locations.find(l => l.city === cityName);
      if (location) {
        this.locationSelector.selectLocation(location);
      }
    }

    // Vérifier qu'une localité est sélectionnée
    const locationData = this.locationSelector.getSelectedLocationData();
    if (!locationData) {
      this.showToast('Veuillez sélectionner une localité', 'warning');
      return;
    }

    // Sauvegarder localité
    this.currentLocation = locationData;
    localStorage.setItem('ilerise_v3_location', JSON.stringify(locationData));

    console.log('✅ Localité confirmée:', locationData.city);

    // Passer à l'écran de jeu
    this.showScreen('farm');
    this.initFarmGame();
  }

  /**
   * Initialiser le jeu de ferme avec la localité sélectionnée
   */
  async initFarmGame() {
    // Préparer données NASA pour FarmGame
    const nasaData = {
      soilMoisture: {
        current_percent: this.currentLocation.soilMoisture || 25,
        optimal: 65
      },
      ndvi: this.currentLocation.ndvi || 0.35,
      temperature: this.currentLocation.temperature || 28,
      precipitation: this.currentLocation.precipitation || 0,
      location: this.currentLocation.city
    };

    // Créer instance FarmGame
    this.farmGame = new FarmGame(nasaData, 1);

    // Configurer callbacks
    this.setupCallbacks();

    // Initialiser (charge sauvegarde si dispo)
    await this.farmGame.initialize({ loadSave: true });

    // Setup UI
    this.setupUI();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();

    // Initialiser scène 3D
    this.init3DScene();

    // Démarrer simulation
    this.farmGame.start();

    // Mise à jour initiale UI
    this.updateUI();

    console.log('✅ Jeu de ferme initialisé pour', nasaData.location);
  }

  /**
   * Initialiser la scène 3D
   */
  init3DScene() {
    const container = document.getElementById('farm-scene-container');
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
   * Afficher un écran
   */
  showScreen(screenName) {
    Object.values(this.screens).forEach(screen => {
      if (screen) screen.classList.remove('active');
    });

    const screen = this.screens[screenName];
    if (screen) {
      screen.classList.add('active');
    }
  }

  /**
   * Setup UI initiale
   */
  setupUI() {
    // Pas besoin de générer grille statique (remplacée par 3D)
    // Mettre à jour toutes les sections
    this.updateUI();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Bouton retour
    document.getElementById('btn-back-farm')?.addEventListener('click', () => {
      window.location.href = '/';
    });

    // Contrôles temps
    document.getElementById('btn-pause')?.addEventListener('click', () => {
      this.farmGame.togglePause();
      this.updatePauseButton();
    });

    document.getElementById('btn-next-day')?.addEventListener('click', () => {
      this.farmGame.skipToNextDay();
    });

    // Vitesse simulation
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const speed = parseInt(e.target.dataset.speed);
        this.farmGame.timeSimulation.setSpeed(speed);
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // Sélection parcelle
    document.querySelectorAll('.plot-mini').forEach(plotBtn => {
      plotBtn.addEventListener('click', (e) => {
        const plotId = parseInt(e.currentTarget.dataset.plotId);
        this.selectPlot(plotId);
      });
    });

    // Navigation sections
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        this.switchSection(section);
      });
    });

    // Sélecteur de culture
    document.getElementById('crop-select')?.addEventListener('change', (e) => {
      const cropId = e.target.value;
      if (cropId) {
        this.selectedCropId = cropId;
        const cropName = e.target.options[e.target.selectedIndex].text;
        this.showToast(`🌾 ${cropName} sélectionné`, 'info');
      }
    });

    // Actions agricoles
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const actionId = e.currentTarget.dataset.action;
        this.executeAction(actionId);
      });
    });

    // Actualiser données NASA
    document.getElementById('btn-refresh-nasa')?.addEventListener('click', () => {
      this.refreshNASAData();
    });

    // Débloquer poulailler
    document.getElementById('btn-unlock-coop')?.addEventListener('click', () => {
      this.unlockLivestock();
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
    // Si c'est une action de plantation, vérifier qu'une culture est sélectionnée
    if (actionId === 'plant') {
      if (!this.selectedCropId) {
        this.showToast('⚠️ Veuillez d\'abord sélectionner une culture', 'warning');
        return;
      }

      // Assigner la culture à la parcelle avant de planter
      const success = this.farmGame.plotManager.plantCrop(this.selectedCropId, this.activePlotId);
      if (!success) {
        this.showToast('❌ Impossible de planter cette culture', 'error');
        return;
      }

      // Mettre à jour scène 3D avec la nouvelle culture
      if (this.farmScene) {
        this.farmScene.clearPlants();
        this.farmScene.plantCrop(this.selectedCropId, 49);
        this.farmScene.animateGrowth(2000);
      }

      this.showToast(`🌱 ${this.selectedCropId.toUpperCase()} planté !`, 'success');
      this.updateUI();
      return;
    }

    // Exécuter autres actions normalement
    const result = this.farmGame.executeAction(actionId, this.activePlotId);

    if (result.success) {
      this.showToast(`✅ Action terminée`, 'success');

      // Si action terminera dans X jours
      if (result.completionDay) {
        const daysRemaining = result.completionDay - this.farmGame.timeSimulation.currentDay;
        if (daysRemaining > 0) {
          this.showToast(`⏰ Terminera dans ${daysRemaining} jour(s)`, 'info');
        }
      }
    } else {
      this.showToast(`❌ ${result.error || 'Action impossible'}`, 'error');
    }
  }

  /**
   * Sélectionner une parcelle
   */
  selectPlot(plotId) {
    const plot = this.farmGame.plotManager.getPlot(plotId);

    if (!plot) return;

    if (!plot.unlocked) {
      this.showToast('Parcelle verrouillée', 'warning');
      return;
    }

    this.activePlotId = plotId;
    this.farmGame.plotManager.setActivePlot(plotId);

    // Mettre à jour UI
    document.querySelectorAll('.plot-mini').forEach(p => p.classList.remove('active'));
    document.querySelector(`[data-plot-id="${plotId}"]`)?.classList.add('active');

    this.updatePlotInfo();
    this.updateSoilDisplay();
    this.updateActionsAvailability();

    // Mettre à jour scène 3D avec la nouvelle parcelle
    if (this.farmScene) {
      this.farmScene.clearPlants();
      if (plot.crop) {
        this.farmScene.plantCrop(plot.crop.id, 49);
        // Ne pas animer, juste afficher la croissance actuelle
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

    // Mettre à jour navigation
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

    // Afficher section correspondante
    document.querySelectorAll('.section-content').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${section}`)?.classList.add('active');

    // Charger contenu si nécessaire
    if (section === 'market') {
      this.loadMarketContent();
    } else if (section === 'stats') {
      this.loadStatsContent();
    } else if (section === 'livestock') {
      this.loadLivestockContent();
    }
  }

  /**
   * Mettre à jour toute l'UI
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
    const state = this.farmGame.timeSimulation.getState();

    document.getElementById('display-day').textContent = `Jour ${state.day}`;
    document.getElementById('display-time').textContent = `${state.hour.toString().padStart(2, '0')}:00`;
    document.getElementById('display-season').textContent = state.season;
    document.getElementById('weather-icon').textContent = this.farmGame.timeSimulation.getWeatherIcon();
  }

  /**
   * Mettre à jour affichage ressources
   */
  updateResourcesDisplay() {
    const resources = this.farmGame.resourceManager.resources;

    document.getElementById('display-money').textContent = resources.money;
    document.getElementById('display-water').textContent = `${resources.water}L`;
  }

  /**
   * Mettre à jour affichage parcelles
   */
  updatePlotsDisplay() {
    const plots = this.farmGame.plotManager.getSummary();

    plots.forEach(plot => {
      const plotIcon = document.getElementById(`plot-icon-${plot.id}`);
      if (plotIcon) {
        plotIcon.textContent = plot.cropIcon;
      }
    });
  }

  /**
   * Mettre à jour info parcelle active
   */
  updatePlotInfo() {
    const plot = this.farmGame.plotManager.getActivePlot();
    if (!plot) return;

    document.getElementById('active-plot-icon').textContent = plot.crop?.emoji || '🌾';
    document.getElementById('active-plot-name').textContent = `Parcelle ${plot.id}`;
    document.getElementById('active-plot-size').textContent = `${plot.size}m²`;
    document.getElementById('plot-crop').textContent = plot.crop?.name?.fr || 'Vide';
    document.getElementById('plot-progress').textContent = plot.crop
      ? `${plot.daysSincePlant}/${plot.crop.growthDuration} jours`
      : '-';
    document.getElementById('plot-health').querySelector('span:last-child').textContent = `${Math.round(plot.health)}%`;
    document.getElementById('plot-health').querySelector('.health-fill').style.width = `${plot.health}%`;
    document.getElementById('plot-stage').textContent = this.farmGame.plotManager.getGrowthStageName(plot.growthStage);
  }

  /**
   * Mettre à jour affichage sol
   */
  updateSoilDisplay() {
    const plot = this.farmGame.plotManager.getActivePlot();
    if (!plot) return;

    // Humidité
    document.getElementById('soil-moisture-value').textContent = `${Math.round(plot.soilMoisture)}%`;
    document.getElementById('soil-moisture-fill').style.width = `${plot.soilMoisture}%`;

    // NPK
    const npkPercent = (plot.npkLevel / 150) * 100;
    document.getElementById('soil-npk-value').textContent = `${Math.round(npkPercent)}%`;
    document.getElementById('soil-npk-fill').style.width = `${npkPercent}%`;

    // pH
    const phPercent = ((plot.ph - 4) / 4) * 100;
    document.getElementById('soil-ph-value').textContent = plot.ph.toFixed(1);
    document.getElementById('soil-ph-fill').style.width = `${phPercent}%`;

    // Mauvaises herbes
    document.getElementById('soil-weed-value').textContent = `${Math.round(plot.weedLevel)}%`;
    document.getElementById('soil-weed-fill').style.width = `${plot.weedLevel}%`;

    // Mettre à jour scène 3D avec conditions du sol
    if (this.farmScene) {
      this.farmScene.updatePlantConditions(
        plot.soilMoisture,
        plot.npkLevel,
        plot.ph
      );
    }
  }

  /**
   * Mettre à jour inventaire
   */
  updateInventoryDisplay() {
    const resources = this.farmGame.resourceManager.resources;

    // Total graines
    const totalSeeds = Object.values(resources.seeds).reduce((sum, val) => sum + val, 0);
    document.getElementById('inv-seeds-total').textContent = totalSeeds;

    document.getElementById('inv-npk').textContent = `${resources.fertilizers.npk}kg`;
    document.getElementById('inv-compost').textContent = `${resources.fertilizers.organic}kg`;

    const totalHarvest = Object.values(resources.harvest).reduce((sum, val) => sum + val, 0);
    document.getElementById('inv-harvest').textContent = `${totalHarvest.toFixed(1)}t`;
  }

  /**
   * Mettre à jour disponibilité actions
   */
  updateActionsAvailability() {
    const availableActions = this.farmGame.getAvailableActions();

    document.querySelectorAll('.action-btn').forEach(btn => {
      const actionId = btn.dataset.action;
      const actionInfo = availableActions.find(a => a.id === actionId);

      if (actionInfo && actionInfo.availability.available) {
        btn.disabled = false;
      } else {
        btn.disabled = true;
      }
    });
  }

  /**
   * Mettre à jour événements à venir
   */
  updateEventsDisplay() {
    const events = this.farmGame.timeSimulation.getUpcomingEvents(5);
    const container = document.getElementById('events-list');

    if (!container) return;

    container.innerHTML = '';

    if (events.length === 0) {
      container.innerHTML = '<p class="no-events">Aucun événement planifié</p>';
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
   * Charger contenu marché
   */
  loadMarketContent() {
    const catalog = this.farmGame.marketSystem.getCatalog();
    const container = document.getElementById('market-content');

    if (!container) return;

    container.innerHTML = `
      <div class="market-categories">
        <h4>Graines</h4>
        ${catalog.seeds.map(item => `
          <div class="market-item">
            <span>${item.name}</span>
            <span>${item.price}💰</span>
            <button class="btn-small btn-primary" onclick="app.buyItem('seeds', '${item.id}', 10)">
              Acheter 10
            </button>
          </div>
        `).join('')}

        <h4>Engrais</h4>
        ${catalog.fertilizers.map(item => `
          <div class="market-item">
            <span>${item.name}</span>
            <span>${item.price}💰/${item.unit}</span>
            <button class="btn-small btn-primary" onclick="app.buyItem('fertilizers', '${item.id}', 20)">
              Acheter 20kg
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Acheter un article au marché
   */
  buyItem(category, item, quantity) {
    const result = this.farmGame.buyFromMarket(category, item, quantity);

    if (result.success) {
      this.showToast(`✅ Acheté: ${quantity}x ${item} pour ${result.cost}💰`, 'success');
    } else {
      this.showToast(`❌ ${result.error}`, 'error');
    }
  }

  /**
   * Charger contenu élevage
   */
  loadLivestockContent() {
    const container = document.getElementById('livestock-content');
    if (!container) return;

    const livestock = this.farmGame.livestockManager;

    if (!livestock.infrastructure.chickenCoop.unlocked) {
      container.innerHTML = `
        <p class="unlock-message">Débloquez le poulailler pour commencer l'élevage</p>
        <button class="btn-primary" onclick="app.unlockLivestock()">Débloquer (100💰)</button>
      `;
    } else {
      const summary = livestock.getSummary();
      container.innerHTML = `
        <div class="livestock-stats">
          <p>Poulets: ${summary.chickens.count}</p>
          <p>Alimentation: ${summary.chickens.feedLevel}</p>
          <p>Santé: ${summary.chickens.health}</p>
          <p>Œufs produits: ${summary.production.eggs}</p>
        </div>
        <button class="btn-primary" onclick="app.farmGame.buyChickens(5)">Acheter 5 poulets (250💰)</button>
        <button class="btn-secondary" onclick="app.farmGame.feedChickens()">Nourrir</button>
      `;
    }
  }

  /**
   * Débloquer élevage
   */
  unlockLivestock() {
    const result = this.farmGame.livestockManager.unlockChickenCoop(1);
    if (result) {
      this.showToast('🐔 Poulailler débloqué !', 'success');
      this.loadLivestockContent();
    } else {
      this.showToast('Argent insuffisant', 'error');
    }
  }

  /**
   * Charger contenu stats
   */
  loadStatsContent() {
    const state = this.farmGame.getState();
    const container = document.getElementById('stats-content');

    if (!container) return;

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h4>Temps de jeu</h4>
          <p>${state.time.day} jours</p>
        </div>
        <div class="stat-card">
          <h4>Argent total</h4>
          <p>${state.resources.money}💰</p>
        </div>
        <div class="stat-card">
          <h4>Parcelles actives</h4>
          <p>${state.plots.filter(p => p.isPlanted).length}/4</p>
        </div>
      </div>
    `;
  }

  /**
   * Actualiser données NASA
   */
  refreshNASAData() {
    this.showToast('🛰️ Mise à jour données satellite...', 'info');

    // TODO: Appeler vraie API NASA
    setTimeout(() => {
      this.showToast('✅ Données NASA actualisées', 'success');
    }, 1000);
  }

  /**
   * Mettre à jour bouton pause
   */
  updatePauseButton() {
    const btn = document.getElementById('btn-pause');
    if (!btn) return;

    if (this.farmGame.isPaused) {
      btn.innerHTML = '<span>▶️</span> Reprendre';
    } else {
      btn.innerHTML = '<span>⏸️</span> Pause';
    }
  }

  /**
   * Afficher notification toast
   */
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Initialiser application
const app = new IleRiseFarmApp();
app.init();

// Exposer globalement pour debug
window.app = app;
window.farm = app.farmGame;
