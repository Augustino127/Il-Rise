/**
 * farm-v3-adapter.js
 * Adapter pour intégrer le système de Ferme V3 dans game.html
 * Adapte les ID pour éviter les conflits
 * 🆕 INTEGRATED WITH AAA SYSTEMS
 */

import { FarmGame } from './game/FarmGame.js';
import { FarmScene } from './3d/FarmScene.js';

// 🆕 Import AAA Systems
import EventBus, { GameEvents } from './core/EventBus.js';
import GameState from './core/GameStateManager.js';
import NotificationSystem from './ui/NotificationSystem.js';
import AudioManager from './audio/AudioManager.js';
import FarmTutorial from './ui/FarmTutorial.js';
import ActionTooltips from './ui/ActionTooltips.js';

// 🆕 XP Rewards for farm actions
const FARM_XP_REWARDS = {
  plow: 5,
  plant: 10,
  water: 3,
  fertilize_npk: 8,
  fertilize_organic: 8,
  weed: 5,
  spray_pesticide_natural: 7,
  harvest: 20,
  unlock_plot: 50,
  complete_season: 100
};

export class FarmV3Adapter {
  constructor(app) {
    this.app = app; // Référence à l'application principale
    this.farmGame = null;
    this.farmScene = null;
    this.currentSection = 'farm';
    this.activePlotId = 1;
    this.selectedCropId = null;
    this.isInitialized = false;

    // 🆕 Farm statistics for progression
    this.farmStats = {
      totalActionsPerformed: 0,
      cropsPlanted: 0,
      cropsHarvested: 0,
      daysPlayed: 0,
      moneyEarned: 0
    };

    // 🆕 Track session start time
    this.sessionStartTime = Date.now();
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

      // 🆕 Initialiser les tooltips d'actions
      ActionTooltips.injectStyles();
      setTimeout(() => {
        ActionTooltips.init();
      }, 500); // Délai pour que les boutons soient rendus

      // Initialiser scène 3D
      this.init3DScene();

      // Démarrer simulation
      this.farmGame.start();

      // Mise à jour initiale UI
      this.updateUI();

      this.isInitialized = true;
      console.log('✅ Mode Ferme V3 initialisé');

      // 🆕 Émettre événement d'initialisation
      EventBus.emit('farm:initialized', {
        hasNASAData: !!nasaData,
        location: nasaData.location
      });

      // 🆕 Démarrer le tutoriel si première visite
      setTimeout(() => {
        const hasCompletedTutorial = GameState.get('tutorial.farmCompleted');
        if (!hasCompletedTutorial) {
          console.log('📚 Première visite - Démarrage du tutoriel');
          FarmTutorial.start();
        } else {
          // Afficher astuce raccourcis
          NotificationSystem.toast({
            type: 'info',
            icon: '⌨️',
            title: 'Astuce',
            message: 'Utilisez les raccourcis clavier : L=Labour, S=Planter, W=Arroser, etc.',
            duration: 4000
          });
        }
      }, 1000); // Délai pour laisser l'UI se charger

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

    this.farmGame.onNotificationCallback = (message, type) => {
      this.showToast(message, type);
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
    console.log('🎮 [FarmV3Adapter] Configuration des event listeners...');

    // Bouton retour
    const btnBack = document.getElementById('btn-back-farm');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        this.exitFarmMode();
      });
      console.log('✅ Bouton retour configuré');
    } else {
      console.warn('⚠️ Bouton retour non trouvé');
    }

    // Sélecteur de culture
    const cropSelect = document.getElementById('crop-select');
    if (cropSelect) {
      cropSelect.addEventListener('change', (e) => {
        const cropId = e.target.value;
        if (cropId) {
          this.selectedCropId = cropId;
          const cropName = e.target.options[e.target.selectedIndex].text;
          this.showToast(`🌾 ${cropName} sélectionné`, 'info');
          console.log(`🌾 Culture sélectionnée: ${cropId}`);

          // 🆕 CORRECTIF : Mettre à jour la disponibilité des actions après sélection
          this.updateActionsAvailability();
        }
      });
      console.log('✅ Sélecteur de culture configuré');
    }

    // Contrôles temps
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        this.farmGame.togglePause();
        console.log('⏸️ Pause toggled');
      });
      console.log('✅ Bouton pause configuré');
    }

    const btnNextDay = document.getElementById('btn-next-day');
    if (btnNextDay) {
      btnNextDay.addEventListener('click', () => {
        this.farmGame.skipToNextDay();
        console.log('⏭️ Jour suivant');
      });
      console.log('✅ Bouton jour suivant configuré');
    }

    // Vitesse simulation
    const speedBtns = document.querySelectorAll('#screen-farm-v3 .speed-btn');
    console.log(`📊 Boutons de vitesse trouvés: ${speedBtns.length}`);
    speedBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const speed = parseInt(e.target.dataset.speed);
        this.farmGame.timeSimulation.setSpeed(speed);
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        console.log(`⏱️ Vitesse changée à ${speed}x`);
      });
    });

    // Sélection parcelle
    const plotBtns = document.querySelectorAll('#screen-farm-v3 .plot-mini');
    console.log(`🗺️ Boutons de parcelle trouvés: ${plotBtns.length}`);
    plotBtns.forEach(plotBtn => {
      plotBtn.addEventListener('click', (e) => {
        const plotId = parseInt(e.currentTarget.dataset.plotId);
        console.log(`🗺️ Clic sur parcelle ${plotId}`);
        this.selectPlot(plotId);
      });
    });

    // Navigation sections
    const navBtns = document.querySelectorAll('#screen-farm-v3 .nav-btn');
    console.log(`🧭 Boutons de navigation trouvés: ${navBtns.length}`);
    navBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        console.log(`🧭 Navigation vers: ${section}`);
        this.switchSection(section);
      });
    });

    // Actions agricoles
    const actionBtns = document.querySelectorAll('#screen-farm-v3 .action-btn');
    console.log(`🎬 Boutons d'action trouvés: ${actionBtns.length}`);
    actionBtns.forEach((btn, index) => {
      const actionId = btn.dataset.action;
      console.log(`  ✓ Action #${index + 1}: ${actionId || 'UNDEFINED'}`);

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const clickedActionId = e.currentTarget.dataset.action;
        console.log(`🎯 [CLIC] Action: ${clickedActionId}`);

        if (!clickedActionId) {
          console.error('❌ Action ID manquant sur le bouton');
          this.showToast('⚠️ Erreur: action non définie', 'error');
          return;
        }

        this.executeAction(clickedActionId);
      });
    });

    // Déblocage poulailler
    const btnUnlockCoop = document.getElementById('btn-unlock-coop');
    if (btnUnlockCoop) {
      btnUnlockCoop.addEventListener('click', () => {
        this.unlockCoop();
      });
      console.log('✅ Bouton poulailler configuré');
    }

    console.log('✅ Tous les event listeners configurés');
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
    console.log(`🎬 [FarmV3Adapter] Exécution action: ${actionId} sur parcelle ${this.activePlotId}`);

    try {
      // Vérifier que le jeu est initialisé
      if (!this.farmGame || !this.farmGame.isInitialized) {
        console.error('❌ Jeu non initialisé');
        this.showToast('⚠️ Jeu non initialisé', 'error');
        return;
      }

      // Vérifier qu'une parcelle est active
      const activePlot = this.farmGame.plotManager.getActivePlot();
      if (!activePlot) {
        console.error('❌ Aucune parcelle active');
        this.showToast('⚠️ Veuillez sélectionner une parcelle', 'warning');
        return;
      }

      console.log(`📦 Parcelle active: ${activePlot.id}, plantée: ${activePlot.isPlanted}, labourée: ${activePlot.isPlowed}`);
      console.log(`💰 Ressources avant action:`, this.farmGame.resourceManager.resources);

      // Si c'est une action de plantation
      if (actionId === 'plant') {
        if (!this.selectedCropId) {
          console.warn('⚠️ Aucune culture sélectionnée');
          this.showToast('⚠️ Veuillez d\'abord sélectionner une culture', 'warning');
          return;
        }

        console.log(`🌱 Tentative de plantation: ${this.selectedCropId} sur parcelle ${this.activePlotId}`);

        // Utiliser la nouvelle méthode FarmGame.plantCrop() avec cropId
        const result = this.farmGame.plantCrop(this.selectedCropId, this.activePlotId);

        if (!result.success) {
          console.error('❌ Échec plantation:', result.error);
          this.showToast(`❌ ${result.error}`, 'error');
          return;
        }

        // 🆕 Récompenser avec XP
        const xpReward = FARM_XP_REWARDS.plant;
        const leveledUp = GameState.addXP(xpReward);

        // 🆕 Mettre à jour les stats
        this.farmStats.totalActionsPerformed++;
        this.farmStats.cropsPlanted++;

        // 🆕 Émettre événement
        EventBus.emit(GameEvents.FARM_CROP_PLANTED, {
          cropId: this.selectedCropId,
          plotId: this.activePlotId,
          xpReward,
          leveledUp
        });

        // 🆕 Jouer son
        AudioManager.play('plant');

        if (this.farmScene) {
          this.farmScene.clearPlants();
          this.farmScene.plantCrop(this.selectedCropId, 49);
          this.farmScene.animateGrowth(2000);
        }

        console.log('✅ Plantation réussie');

        // Notification avec XP
        const cropNames = {
          'maize': 'Maïs',
          'cowpea': 'Niébé',
          'rice': 'Riz',
          'cassava': 'Manioc',
          'cacao': 'Cacao',
          'cotton': 'Coton'
        };
        const cropName = cropNames[this.selectedCropId] || this.selectedCropId.toUpperCase();
        this.showToast(`🌱 ${cropName} planté • +${xpReward} XP`, 'success');

        this.updateUI();
        return;
      }

      // Exécuter autres actions
      console.log(`🎯 Exécution action via FarmGame.executeAction`);
      const result = this.farmGame.executeAction(actionId, this.activePlotId);
      console.log(`📊 Résultat:`, result);
      console.log(`💰 Ressources après action:`, this.farmGame.resourceManager.resources);

      if (result.success) {
        // 🆕 Récompenser avec XP
        const xpReward = FARM_XP_REWARDS[actionId] || 5;
        const leveledUp = GameState.addXP(xpReward);

        // 🆕 Mettre à jour les stats
        this.farmStats.totalActionsPerformed++;
        if (actionId === 'harvest') {
          this.farmStats.cropsHarvested++;
        }

        // 🆕 Émettre événement spécifique selon l'action
        const eventMap = {
          'water': GameEvents.FARM_CROP_WATERED,
          'harvest': GameEvents.FARM_CROP_HARVESTED,
          'plow': 'farm:plot:plowed',
          'fertilize_npk': 'farm:fertilizer:applied',
          'fertilize_organic': 'farm:fertilizer:applied',
          'weed': 'farm:weeding:done',
          'spray_pesticide_natural': 'farm:pesticide:applied'
        };

        const eventName = eventMap[actionId];
        if (eventName) {
          EventBus.emit(eventName, {
            actionId,
            plotId: this.activePlotId,
            xpReward,
            leveledUp
          });
        }

        // 🆕 Jouer son
        AudioManager.play(actionId.split('_')[0]); // 'fertilize_npk' -> 'fertilize'

        // Afficher notification de succès
        const actionNames = {
          'plow': 'Labour',
          'water': 'Arrosage',
          'fertilize_npk': 'Fertilisation NPK',
          'fertilize_organic': 'Compost',
          'weed': 'Désherbage',
          'spray_pesticide_natural': 'Pesticide naturel',
          'harvest': 'Récolte'
        };

        this.showToast(`✅ ${actionNames[actionId] || actionId} effectué • +${xpReward} XP`, 'success');

        // Si action terminera dans X jours
        if (result.completionDay) {
          const daysRemaining = result.completionDay - this.farmGame.timeSimulation.currentDay;
          if (daysRemaining > 0) {
            this.showToast(`⏰ Terminera dans ${daysRemaining} jour(s)`, 'info', 2000);
          }
        }

        // Mettre à jour l'UI
        this.updateUI();
      } else {
        console.warn(`⚠️ Action échouée: ${result.error}`);
        this.showToast(`❌ ${result.error || 'Action impossible'}`, 'error');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution de l\'action:', error);
      this.showToast(`❌ Erreur: ${error.message}`, 'error');
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
    console.log(`🔀 Changement de section vers: ${section}`);

    document.querySelectorAll('#screen-farm-v3 .nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`#screen-farm-v3 .nav-btn[data-section="${section}"]`)?.classList.add('active');

    document.querySelectorAll('#screen-farm-v3 .section-content').forEach(s => s.classList.remove('active'));
    const sectionElement = document.getElementById(`section-${section}`);
    if (sectionElement) {
      sectionElement.classList.add('active');
      console.log(`✅ Section "${section}" activée`);

      // Générer l'UI du marché si on navigue vers cette section
      if (section === 'market') {
        this.renderMarketUI();
      }
    } else {
      console.warn(`⚠️ Section "${section}" non trouvée`);
    }
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
    document.querySelectorAll('#screen-farm-v3 .action-btn').forEach(btn => {
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

    // 🆕 Marquer l'action recommandée selon l'état du sol
    this.highlightRecommendedActions(plot);
  }

  /**
   * Highlight les actions recommandées (🆕)
   */
  highlightRecommendedActions(plot) {
    if (!plot) return;

    // Retirer tous les highlights
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.classList.remove('action-recommended');
    });

    // Ajouter highlights selon les besoins
    let recommendedAction = null;

    if (!plot.isPlowed && !plot.isPlanted) {
      recommendedAction = 'plow';
    } else if (plot.isPlowed && !plot.isPlanted) {
      recommendedAction = 'plant';
    } else if (plot.isPlanted) {
      // Priorités pour parcelles plantées
      if (plot.soilMoisture < 30) {
        recommendedAction = 'water';
      } else if (plot.weedLevel > 40) {
        recommendedAction = 'weed';
      } else if (plot.npkLevel < 50) {
        recommendedAction = 'fertilize_npk';
      } else if (plot.growthStage === 'mature') {
        recommendedAction = 'harvest';
      }
    }

    if (recommendedAction) {
      const btn = document.querySelector(`[data-action="${recommendedAction}"]`);
      if (btn && !btn.disabled) {
        btn.classList.add('action-recommended');
      }
    }
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
      const plotBtn = document.querySelector(`#screen-farm-v3 [data-plot-id="${plot.id}"]`);
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

    // 🆕 Récompenser avec XP
    const xpReward = FARM_XP_REWARDS.unlock_plot;
    GameState.addXP(xpReward);

    // 🆕 Émettre événement
    EventBus.emit('farm:coop:unlocked', {
      cost,
      xpReward
    });

    // 🆕 Jouer son de succès
    AudioManager.play('success');

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
   * Afficher l'interface du marché
   */
  renderMarketUI() {
    const container = document.getElementById('market-content');
    if (!container) {
      console.warn('⚠️ Conteneur marché non trouvé');
      return;
    }

    const catalog = this.farmGame.marketSystem.getCatalog();
    const resources = this.farmGame.resourceManager.resources;

    // Tabs du marché
    const tabs = document.querySelectorAll('.market-tab');
    let activeTab = 'buy';
    tabs.forEach(tab => {
      if (tab.classList.contains('active')) {
        activeTab = tab.dataset.tab;
      }
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.renderMarketUI();
      });
    });

    // Noms français pour affichage
    const itemNames = {
      maize: 'Maïs', cowpea: 'Niébé', rice: 'Riz', cassava: 'Manioc', cacao: 'Cacao', cotton: 'Coton',
      npk: 'Engrais NPK', organic: 'Compost', urea: 'Urée', phosphate: 'Phosphate',
      natural: 'Pesticide naturel', chemical: 'Pesticide chimique',
      chicken: 'Poule', goat: 'Chèvre',
      eggs: 'Œufs', milk: 'Lait', manure: 'Fumier'
    };

    const emojis = {
      maize: '🌽', cowpea: '🫘', rice: '🍚', cassava: '🥔', cacao: '🍫', cotton: '☁️',
      npk: '🧪', organic: '💩', urea: '⚗️', phosphate: '🪨',
      natural: '🌿', chemical: '☠️',
      chicken: '🐔', goat: '🐐',
      eggs: '🥚', milk: '🥛', manure: '💩'
    };

    let html = '';

    if (activeTab === 'buy') {
      // ONGLET ACHETER
      html = '<div class="market-grid">';

      // Graines
      html += '<div class="market-category"><h4>🌱 Graines</h4><div class="market-items">';
      catalog.seeds.forEach(item => {
        const stock = resources.seeds[item.id] || 0;
        html += `
          <div class="market-item">
            <div class="item-icon">${emojis[item.id]}</div>
            <div class="item-info">
              <div class="item-name">${itemNames[item.id]}</div>
              <div class="item-price">${item.price}💰 / ${item.unit}</div>
              <div class="item-stock">En stock: ${stock}</div>
            </div>
            <div class="item-actions">
              <button class="btn-buy-item btn-secondary btn-small" data-category="seeds" data-item="${item.id}" data-price="${item.price}">
                Acheter
              </button>
            </div>
          </div>
        `;
      });
      html += '</div></div>';

      // Engrais
      html += '<div class="market-category"><h4>🧪 Engrais</h4><div class="market-items">';
      catalog.fertilizers.forEach(item => {
        const stock = resources.fertilizers[item.id] || 0;
        html += `
          <div class="market-item">
            <div class="item-icon">${emojis[item.id]}</div>
            <div class="item-info">
              <div class="item-name">${itemNames[item.id]}</div>
              <div class="item-price">${item.price}💰 / ${item.unit}</div>
              <div class="item-stock">En stock: ${stock}kg</div>
            </div>
            <div class="item-actions">
              <button class="btn-buy-item btn-secondary btn-small" data-category="fertilizers" data-item="${item.id}" data-price="${item.price}">
                Acheter
              </button>
            </div>
          </div>
        `;
      });
      html += '</div></div>';

      // Pesticides
      html += '<div class="market-category"><h4>🪲 Pesticides</h4><div class="market-items">';
      catalog.pesticides.forEach(item => {
        const stock = resources.pesticides?.[item.id] || 0;
        html += `
          <div class="market-item">
            <div class="item-icon">${emojis[item.id]}</div>
            <div class="item-info">
              <div class="item-name">${itemNames[item.id]}</div>
              <div class="item-price">${item.price}💰 / ${item.unit}</div>
              <div class="item-stock">En stock: ${stock}L</div>
            </div>
            <div class="item-actions">
              <button class="btn-buy-item btn-secondary btn-small" data-category="pesticides" data-item="${item.id}" data-price="${item.price}">
                Acheter
              </button>
            </div>
          </div>
        `;
      });
      html += '</div></div>';

      html += '</div>';
    } else {
      // ONGLET VENDRE
      html = '<div class="market-grid">';

      // Récoltes
      html += '<div class="market-category"><h4>🌾 Récoltes</h4><div class="market-items">';
      catalog.harvest.forEach(item => {
        const stock = item.stock || 0;
        const canSell = stock > 0;
        html += `
          <div class="market-item ${!canSell ? 'disabled' : ''}">
            <div class="item-icon">${emojis[item.id]}</div>
            <div class="item-info">
              <div class="item-name">${itemNames[item.id]}</div>
              <div class="item-price">${item.price}💰 / ${item.unit}</div>
              <div class="item-stock">Disponible: ${stock.toFixed(2)}t</div>
            </div>
            <div class="item-actions">
              <button class="btn-sell-item btn-success btn-small" data-category="harvest" data-item="${item.id}" data-price="${item.price}" ${!canSell ? 'disabled' : ''}>
                Vendre
              </button>
            </div>
          </div>
        `;
      });
      html += '</div></div>';

      html += '</div>';
    }

    container.innerHTML = html;

    // Attacher les événements
    document.querySelectorAll('.btn-buy-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        const item = e.target.dataset.item;
        const price = parseInt(e.target.dataset.price);
        this.buyMarketItem(category, item, price);
      });
    });

    document.querySelectorAll('.btn-sell-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        const item = e.target.dataset.item;
        const price = parseInt(e.target.dataset.price);
        this.sellMarketItem(category, item, price);
      });
    });
  }

  /**
   * Acheter un article au marché
   */
  buyMarketItem(category, item, price) {
    // Demander la quantité
    const quantity = prompt(`Combien de ${item} voulez-vous acheter ?\n(Prix: ${price}💰 par unité)`);
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
      return;
    }

    const qty = parseInt(quantity);
    const result = this.farmGame.marketSystem.buy(category, item, qty);

    if (result.success) {
      // 🆕 Émettre événement
      EventBus.emit('farm:market:bought', {
        category,
        item,
        quantity: qty,
        cost: result.cost
      });

      // 🆕 Jouer son
      AudioManager.play('click');

      this.showToast(`✅ Acheté ${qty}x ${item} pour ${result.cost}💰`, 'success');
      this.updateResourcesDisplay();
      this.updateInventoryDisplay();
      this.renderMarketUI();
    } else {
      this.showToast(`❌ ${result.error}`, 'error');
    }
  }

  /**
   * Vendre un article au marché
   */
  sellMarketItem(category, item, price) {
    const available = this.farmGame.resourceManager.get(category, item);

    if (available <= 0) {
      this.showToast('❌ Aucun stock disponible', 'error');
      return;
    }

    const quantity = prompt(`Combien de ${item} voulez-vous vendre ?\n(Prix: ${price}💰 par tonne)\nDisponible: ${available.toFixed(2)}t`);
    if (!quantity || isNaN(quantity) || parseFloat(quantity) <= 0) {
      return;
    }

    const qty = parseFloat(quantity);
    const result = this.farmGame.marketSystem.sell(category, item, qty);

    if (result.success) {
      // 🆕 Tracker l'argent gagné
      this.farmStats.moneyEarned += result.revenue;

      // 🆕 Émettre événement
      EventBus.emit('farm:market:sold', {
        category,
        item,
        quantity: qty,
        revenue: result.revenue
      });

      // 🆕 Jouer son de succès
      AudioManager.play('coin');

      this.showToast(`✅ Vendu ${qty}t ${item} pour ${result.revenue}💰`, 'success');
      this.updateResourcesDisplay();
      this.updateInventoryDisplay();
      this.renderMarketUI();
    } else {
      this.showToast(`❌ ${result.error}`, 'error');
    }
  }

  /**
   * Afficher un toast (🆕 Utilise NotificationSystem)
   */
  showToast(message, type = 'info', duration = 3000) {
    // Mapper les types de toast vers NotificationSystem
    const typeMap = {
      'info': 'info',
      'success': 'success',
      'warning': 'warning',
      'error': 'error'
    };

    const notifType = typeMap[type] || 'info';

    NotificationSystem.toast({
      type: notifType,
      message: message,
      duration: duration
    });
  }

  /**
   * Quitter le mode Ferme (🆕 Avec statistiques et événements)
   */
  exitFarmMode() {
    // Sauvegarder avant de quitter
    if (this.farmGame) {
      this.farmGame.save(1);
    }

    // 🆕 Afficher résumé de session
    if (this.farmStats.totalActionsPerformed > 0) {
      NotificationSystem.toast({
        type: 'info',
        title: 'Session Ferme Terminée',
        message: `${this.farmStats.totalActionsPerformed} actions • ${this.farmStats.cropsPlanted} plantées • ${this.farmStats.cropsHarvested} récoltées`,
        duration: 5000
      });
    }

    // 🆕 Émettre événement de sortie
    EventBus.emit('farm:exited', {
      stats: this.farmStats,
      sessionDuration: Date.now() - (this.sessionStartTime || Date.now())
    });

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
