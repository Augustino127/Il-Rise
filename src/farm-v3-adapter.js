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

      // Configurer callback pour les erreurs de sync
      this.farmGame.onSyncErrorCallback = (message, type) => {
        this.showToast(message, type || 'error', 5000);
      };

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
   * Setup event listeners
   */
  setupEventListeners() {
    // Bouton retour
    document.getElementById('btn-back-farm')?.addEventListener('click', () => {
      this.exitFarmMode();
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

    // Contrôles temps
    document.getElementById('btn-pause')?.addEventListener('click', () => {
      this.farmGame.togglePause();
    });

    document.getElementById('btn-next-day')?.addEventListener('click', () => {
      this.farmGame.skipToNextDay();
    });

    // Vitesse simulation
    document.querySelectorAll('#screen-farm .speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const speed = parseInt(e.target.dataset.speed);
        this.farmGame.timeSimulation.setSpeed(speed);
        document.querySelectorAll('#screen-farm .speed-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // Sélection parcelle
    document.querySelectorAll('#screen-farm .plot-mini').forEach(plotBtn => {
      plotBtn.addEventListener('click', (e) => {
        const plotId = parseInt(e.currentTarget.dataset.plotId);
        this.selectPlot(plotId);
      });
    });

    // Navigation sections
    document.querySelectorAll('#screen-farm .nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        this.switchSection(section);
      });
    });

    // Actions agricoles
    document.querySelectorAll('#screen-farm .action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const actionId = e.currentTarget.dataset.action;
        this.executeAction(actionId);
      });
    });

    // Déblocage poulailler
    document.getElementById('btn-unlock-coop')?.addEventListener('click', () => {
      this.unlockCoop();
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
      const farmScreen = document.getElementById('screen-farm');
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

    document.querySelectorAll('#screen-farm .plot-mini').forEach(p => p.classList.remove('active'));
    document.querySelector(`#screen-farm [data-plot-id="${plotId}"]`)?.classList.add('active');

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
    this.updateNASARecommendations();
  }

  /**
   * Mettre à jour affichage temps
   */
  updateTimeDisplay() {
    const time = this.farmGame.timeSimulation;
    document.getElementById('display-day').textContent = `Jour ${time.currentDay}`;
    document.getElementById('display-time').textContent = `${time.currentHour}:00`;
    document.getElementById('display-season').textContent = time.currentSeason;
  }

  /**
   * Mettre à jour affichage ressources
   */
  updateResourcesDisplay() {
    const resources = this.farmGame.resourceManager.resources;
    document.getElementById('display-money').textContent = Math.floor(resources.money);
    document.getElementById('display-water').textContent = `${Math.floor(resources.water)}L`;
  }

  /**
   * Mettre à jour info parcelle
   */
  updatePlotInfo() {
    const plot = this.farmGame.plotManager.getActivePlot();
    if (!plot) return;

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

    document.getElementById('soil-moisture-value').textContent = `${Math.round(plot.soilMoisture)}%`;
    document.getElementById('soil-moisture-fill').style.width = `${plot.soilMoisture}%`;

    const npkPercent = (plot.npkLevel / 150) * 100;
    document.getElementById('soil-npk-value').textContent = `${Math.round(npkPercent)}%`;
    document.getElementById('soil-npk-fill').style.width = `${npkPercent}%`;

    const phPercent = ((plot.ph - 4) / 4) * 100;
    document.getElementById('soil-ph-value').textContent = plot.ph.toFixed(1);
    document.getElementById('soil-ph-fill').style.width = `${phPercent}%`;

    document.getElementById('soil-weed-value').textContent = `${Math.round(plot.weedLevel)}%`;
    document.getElementById('soil-weed-fill').style.width = `${plot.weedLevel}%`;

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
    document.getElementById('inv-seeds-total').textContent = totalSeeds;
    document.getElementById('inv-npk').textContent = `${resources.fertilizers.npk}kg`;
    document.getElementById('inv-compost').textContent = `${resources.fertilizers.organic}kg`;

    const totalHarvest = Object.values(resources.harvest).reduce((a, b) => a + b, 0);
    document.getElementById('inv-harvest').textContent = `${totalHarvest.toFixed(1)}t`;
  }

  /**
   * Mettre à jour disponibilité des actions
   */
  updateActionsAvailability() {
    const plot = this.farmGame.plotManager.getActivePlot();
    const resources = this.farmGame.resourceManager.resources;

    if (!plot) return;

    // Parcourir tous les boutons d'actions
    document.querySelectorAll('#screen-farm .action-btn').forEach(btn => {
      const actionId = btn.dataset.action;
      let canExecute = true;
      let reason = '';

      // Vérifier selon le type d'action
      switch(actionId) {
        case 'plow':
          if (plot.isPlanted) {
            canExecute = false;
            reason = 'Parcelle déjà plantée';
          } else if (resources.money < 20) {
            canExecute = false;
            reason = 'Pas assez d\'argent (20💰)';
          }
          break;

        case 'plant':
          if (!plot.isPlowed) {
            canExecute = false;
            reason = 'Labour requis';
          } else if (plot.isPlanted) {
            canExecute = false;
            reason = 'Déjà planté';
          } else if (!this.selectedCropId) {
            canExecute = false;
            reason = 'Sélectionnez une culture';
          }
          break;

        case 'water':
          if (!plot.isPlanted) {
            canExecute = false;
            reason = 'Aucune culture';
          } else if (resources.water < 100) {
            canExecute = false;
            reason = 'Pas assez d\'eau (100L)';
          } else if (plot.soilMoisture >= 80) {
            canExecute = false;
            reason = 'Sol déjà humide';
          }
          break;

        case 'fertilize_npk':
          if (!plot.isPlanted) {
            canExecute = false;
            reason = 'Aucune culture';
          } else if (resources.fertilizers.npk < 20) {
            canExecute = false;
            reason = 'Pas assez de NPK (20kg)';
          }
          break;

        case 'fertilize_organic':
          if (!plot.isPlanted) {
            canExecute = false;
            reason = 'Aucune culture';
          } else if (resources.fertilizers.organic < 30) {
            canExecute = false;
            reason = 'Pas assez de compost (30kg)';
          }
          break;

        case 'weed':
          if (!plot.isPlanted) {
            canExecute = false;
            reason = 'Aucune culture';
          } else if (plot.weedLevel < 10) {
            canExecute = false;
            reason = 'Pas de mauvaises herbes';
          } else if (resources.money < 10) {
            canExecute = false;
            reason = 'Pas assez d\'argent (10💰)';
          }
          break;

        case 'spray_pesticide_natural':
          if (!plot.isPlanted) {
            canExecute = false;
            reason = 'Aucune culture';
          } else if (resources.pesticides?.natural < 2) {
            canExecute = false;
            reason = 'Pas assez de pesticide (2L)';
          }
          break;

        case 'harvest':
          if (!plot.isPlanted) {
            canExecute = false;
            reason = 'Aucune culture';
          } else if (plot.growthStage !== 'mature') {
            canExecute = false;
            reason = 'Culture pas mature';
          } else if (resources.money < 20) {
            canExecute = false;
            reason = 'Pas assez d\'argent (20💰)';
          }
          break;
      }

      // Appliquer l'état au bouton
      if (canExecute) {
        btn.disabled = false;
        btn.classList.remove('disabled');
        btn.title = '';
      } else {
        btn.disabled = true;
        btn.classList.add('disabled');
        btn.title = reason;
      }
    });
  }

  /**
   * Mettre à jour affichage événements
   */
  updateEventsDisplay() {
    const events = this.farmGame.timeSimulation.getUpcomingEvents();
    const container = document.getElementById('events-list');
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
    const plots = this.farmGame.plotManager.plots;

    plots.forEach(plot => {
      const plotBtn = document.querySelector(`#screen-farm [data-plot-id="${plot.id}"]`);
      if (!plotBtn) return;

      const iconSpan = plotBtn.querySelector('.plot-icon');
      if (!iconSpan) return;

      // Mettre à jour l'icône selon l'état
      if (!plot.unlocked) {
        iconSpan.textContent = '🔒';
        plotBtn.classList.add('locked');
        plotBtn.classList.remove('active');
      } else if (plot.crop) {
        // Afficher l'icône de la culture
        const cropIcons = {
          'maize': '🌽',
          'cowpea': '🫘',
          'rice': '🍚',
          'cassava': '🥔',
          'cacao': '🍫',
          'cotton': '☁️'
        };
        iconSpan.textContent = cropIcons[plot.crop.id] || '🌾';
        plotBtn.classList.remove('locked');
      } else if (plot.isPlowed) {
        iconSpan.textContent = '🚜';
        plotBtn.classList.remove('locked');
      } else {
        iconSpan.textContent = '🟫';
        plotBtn.classList.remove('locked');
      }
    });
  }

  /**
   * Mettre à jour recommandations NASA
   */
  updateNASARecommendations() {
    const plot = this.farmGame.plotManager.getActivePlot();
    const nasaData = this.farmGame.nasaData;
    const container = document.getElementById('nasa-recommendations-content');

    if (!container || !plot) return;

    const recommendations = [];

    // Analyser humidité du sol
    if (plot.soilMoisture < 30) {
      recommendations.push({
        icon: '💧',
        text: 'Sol sec détecté - Irrigation recommandée',
        priority: 'high'
      });
    } else if (plot.soilMoisture > 80) {
      recommendations.push({
        icon: '⚠️',
        text: 'Sol trop humide - Risque de pourriture',
        priority: 'medium'
      });
    }

    // Analyser NPK
    if (plot.npkLevel < 50) {
      recommendations.push({
        icon: '🧪',
        text: 'Niveau NPK faible - Fertilisation conseillée',
        priority: 'high'
      });
    }

    // Analyser pH
    if (plot.ph < 5.5) {
      recommendations.push({
        icon: '⚗️',
        text: 'Sol acide - Application de chaux recommandée',
        priority: 'medium'
      });
    } else if (plot.ph > 7.5) {
      recommendations.push({
        icon: '⚗️',
        text: 'Sol alcalin - Ajout de soufre recommandé',
        priority: 'medium'
      });
    }

    // Analyser mauvaises herbes
    if (plot.weedLevel > 40) {
      recommendations.push({
        icon: '🌿',
        text: 'Mauvaises herbes élevées - Désherbage urgent',
        priority: 'high'
      });
    }

    // Analyser NDVI (vigueur végétative)
    if (nasaData.ndvi < 0.3 && plot.isPlanted) {
      recommendations.push({
        icon: '🛰️',
        text: 'NDVI faible - Culture en stress',
        priority: 'high'
      });
    }

    // Analyser température
    if (nasaData.temperature > 35) {
      recommendations.push({
        icon: '🌡️',
        text: 'Température élevée - Augmenter fréquence d\'arrosage',
        priority: 'medium'
      });
    }

    // Afficher les recommandations
    container.innerHTML = '';

    if (recommendations.length === 0) {
      container.innerHTML = `
        <p class="recommendation-item">
          <span class="rec-icon">✅</span>
          <span class="rec-text">Conditions optimales - Continuez ainsi !</span>
        </p>
      `;
    } else {
      // Trier par priorité (high d'abord)
      recommendations.sort((a, b) => a.priority === 'high' ? -1 : 1);

      recommendations.forEach(rec => {
        const recDiv = document.createElement('p');
        recDiv.className = 'recommendation-item';
        recDiv.innerHTML = `
          <span class="rec-icon">${rec.icon}</span>
          <span class="rec-text">${rec.text}</span>
        `;
        container.appendChild(recDiv);
      });
    }
  }

  /**
   * Débloquer le poulailler
   */
  unlockCoop() {
    const cost = 100;
    const resources = this.farmGame.resourceManager.resources;

    if (resources.money < cost) {
      this.showToast('❌ Pas assez d\'argent (100💰 requis)', 'error');
      return;
    }

    if (this.farmGame.livestockManager.coopUnlocked) {
      this.showToast('⚠️ Poulailler déjà débloqué', 'warning');
      return;
    }

    // Débiter l'argent
    this.farmGame.resourceManager.spend('money', cost);

    // Débloquer le poulailler
    this.farmGame.livestockManager.unlockCoop();

    // Mettre à jour l'affichage
    const livestockContent = document.getElementById('livestock-content');
    if (livestockContent) {
      livestockContent.innerHTML = `
        <div class="livestock-stats">
          <div class="stat-card">
            <span class="stat-icon">🐔</span>
            <div class="stat-details">
              <span class="stat-label">Poules</span>
              <span class="stat-value" id="chicken-count">0</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🥚</span>
            <div class="stat-details">
              <span class="stat-label">Œufs/jour</span>
              <span class="stat-value" id="eggs-per-day">0</span>
            </div>
          </div>
        </div>
        <button class="btn-primary" id="btn-buy-chicken">Acheter une poule (50💰)</button>
      `;

      // Ajouter écouteur pour acheter des poules
      document.getElementById('btn-buy-chicken')?.addEventListener('click', () => {
        this.buyChicken();
      });
    }

    this.showToast('✅ Poulailler débloqué !', 'success');
    this.updateResourcesDisplay();
  }

  /**
   * Acheter une poule
   */
  buyChicken() {
    const cost = 50;
    const resources = this.farmGame.resourceManager.resources;

    if (resources.money < cost) {
      this.showToast('❌ Pas assez d\'argent (50💰)', 'error');
      return;
    }

    this.farmGame.resourceManager.spend('money', cost);
    this.farmGame.livestockManager.addChicken();

    // Mettre à jour l'affichage
    const chickenCount = document.getElementById('chicken-count');
    const eggsPerDay = document.getElementById('eggs-per-day');

    if (chickenCount) {
      chickenCount.textContent = this.farmGame.livestockManager.livestock.chicken.count;
    }
    if (eggsPerDay) {
      eggsPerDay.textContent = this.farmGame.livestockManager.livestock.chicken.count * 0.8;
    }

    this.showToast('🐔 Poule ajoutée !', 'success');
    this.updateResourcesDisplay();
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
