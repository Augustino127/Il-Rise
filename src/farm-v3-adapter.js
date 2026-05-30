/**
 * farm-v3-adapter.js
 * Adapter pour intégrer le système de Ferme V3 dans game.html
 * Adapte les ID pour éviter les conflits
 * 🆕 INTEGRATED WITH AAA SYSTEMS
 */

import * as THREE from 'three';
import { FarmGame } from './game/FarmGame.js';
import { FarmScene } from './3d/FarmScene.js';
import apiService from './services/api.js';

// 🆕 Import AAA Systems
import EventBus, { GameEvents } from './core/EventBus.js';
import GameState from './core/GameStateManager.js';
import NotificationSystem from './ui/NotificationSystem.js';
import AudioManager from './audio/AudioManager.js';
import FarmTutorial from './ui/FarmTutorial.js';
import ActionTooltips from './ui/ActionTooltips.js';

/**
 * Ajoute de l'XP et émet les événements EventBus appropriés.
 * Centralise l'émission ici pour garder GameStateManager sans dépendance.
 */
function awardXP(amount) {
  const result = GameState.addXP(amount);
  // addXP retourne maintenant un objet {leveledUp, newLevel, newXP, amount}
  // ou un boolean (ancien code) — on gère les deux
  if (result && typeof result === 'object') {
    // Différé d'un tick pour ne pas bloquer le thread de rendu
    setTimeout(() => {
      EventBus.emit(GameEvents.PLAYER_XP_GAINED, { amount: result.amount, newXP: result.newXP });
      if (result.leveledUp) {
        EventBus.emit(GameEvents.PLAYER_LEVEL_UP, { newLevel: result.newLevel });
      }
    }, 0);
    return result.leveledUp;
  }
  return !!result;
}

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

      // Créer instance FarmGame avec le vrai niveau du joueur
      const playerLevel = this.app.currentUser?.level || this.app.engine?.player?.level || 1;
      this.farmGame = new FarmGame(nasaData, playerLevel);

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
      this.updateConditionsDisplay();
    };

    // Événement surprise — alerte dramatique
    this.farmGame.onConditionEventCallback = (event, phase) => {
      if (phase === 'start') {
        this.showEventAlert(event);
        this.updateSoilDisplay(); // sol réagit immédiatement
        if (this.farmScene) {
          // Changer le ciel selon l'événement
          if (event.sky) this.farmScene.scene.background = new THREE.Color(event.sky);
          if (event.sceneEffect === 'storm' || event.sceneEffect === 'rain') {
            this.farmScene.effects.createRainEffect(event.id === 'storm' ? 1.0 : 0.5);
          }
        }
      } else {
        // Fin d'événement — retour à la normale
        if (this.farmScene) {
          this.farmScene.scene.background = new THREE.Color(0x87CEEB);
          this.farmScene.effects.stopRain();
        }
        this.showToast(`${event.icon} ${event.title} terminé — conditions normales`, 'info');
      }
    };

    this.farmGame.onResourceChangeCallback = (resources) => {
      this.updateResourcesDisplay();
      this.updateInventoryDisplay();
      this.updateActionsAvailability();
    };

    this.farmGame.onActionCompleteCallback = (action, changes) => {
      // Pour la récolte, déclencher la collecte réelle via PlotManager
      if (action.id === 'harvest') {
        const plot = this.farmGame.plotManager.getPlot(action.plot);
        if (plot && plot.isPlanted) {
          const harvestResult = this.farmGame.plotManager.harvestPlot(action.plot);
          if (harvestResult.success) {
            const xpReward = FARM_XP_REWARDS.harvest;
            awardXP(xpReward);
            this.farmStats.cropsHarvested++;
            this.farmStats.moneyEarned += harvestResult.revenue || 0;
            EventBus.emit('farm:crop:harvested', { plotId: action.plot, yield: harvestResult.yield });
            AudioManager.play('harvest');
            if (this.farmScene) this.farmScene.showActionComplete('harvest');
            this.completeActionOverlay('harvest');
            this.showToast(`🌾 Récolte: ${(harvestResult.yield || 0).toFixed(2)}t • +${xpReward} XP`, 'success');

            // Sync backend si authentifié
            if (apiService.isAuthenticated()) {
              apiService.recordHarvest(
                harvestResult.cropId,
                harvestResult.yield,
                harvestResult.revenue
              ).catch(err => console.warn('⚠️ Sync récolte échouée:', err));
            }
          } else {
            this.showToast(`❌ Récolte échouée: ${harvestResult.error}`, 'error');
          }
        }
      } else {
        // Effet 3D de complétion
        if (this.farmScene) this.farmScene.showActionComplete(action.id);
        this.completeActionOverlay(action.id);

        this.showToast(`✅ ${action.action.name.fr} terminé`);

        // Logger l'action sur le backend si authentifié
        if (apiService.isAuthenticated()) {
          apiService.logFarmAction(action.id, {
            plotId: action.plot,
            day: action.endDay,
            changes
          }).catch(err => console.warn('⚠️ Log action échoué:', err));
        }
      }
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
        const leveledUp = awardXP(xpReward);

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

        setTimeout(() => {
          try {
            if (this.farmScene) {
              this.farmScene.clearPlants();
              this.farmScene.plantCrop(this.selectedCropId, 49);
              this.farmScene.animateGrowth(2000);
              this.farmScene.showActionStart('plant');
            }
            this.showActionOverlay('plant', 0);
          } catch(e) {
            console.warn('⚠️ Effet visuel plantation échoué:', e.message);
          }
        }, 0);

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
        const leveledUp = awardXP(xpReward);

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
        AudioManager.play(actionId.split('_')[0]);

        // Effet 3D + overlay — différé pour ne pas bloquer le thread
        const durationDays = result.completionDay
          ? result.completionDay - this.farmGame.timeSimulation.currentDay
          : 0;
        setTimeout(() => {
          try {
            if (this.farmScene) this.farmScene.showActionStart(actionId);
            this.showActionOverlay(actionId, durationDays);
          } catch(e) {
            console.warn('⚠️ Effet visuel échoué:', e.message);
          }
        }, 0);

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
      this.showUnlockPlotModal(plotId, plot);
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
      // Sol 3D : couleur selon humidité + événement actif
      this._updateGroundColor(plot.soilMoisture);
    }

    // Colorer les barres selon les seuils
    this._colorSoilBars(plot);
  }

  /** Met à jour la couleur du sol 3D selon humidité + événement */
  _updateGroundColor(moisture) {
    if (!this.farmScene?.groundMesh) return;
    const event = this.farmGame.conditionsEngine?.activeEvent;

    let targetColor;
    if (event?.id === 'drought') {
      // Sol fissuré, très sec, beige
      targetColor = new THREE.Color(0xC4A265);
    } else if (event?.id === 'storm' || event?.id === 'heavy_rain') {
      // Sol gorgé d'eau, presque noir
      targetColor = new THREE.Color(0x2A1A0A);
    } else {
      // Gradation normale : sec (beige) → humide (brun foncé)
      const dry = new THREE.Color(0x9E7A4A);
      const wet = new THREE.Color(0x3A1E08);
      targetColor = dry.clone().lerp(wet, moisture / 100);
    }

    // Transition douce
    this.farmScene.groundMesh.material.color.lerp(targetColor, 0.08);
  }

  /** Colore les barres de sol selon les seuils critique/optimal */
  _colorSoilBars(plot) {
    const bars = {
      'soil-moisture-fill': { val: plot.soilMoisture, low: 20, high: 80 },
      'soil-npk-fill':      { val: (plot.npkLevel / 150) * 100, low: 20, high: 90 },
      'soil-weed-fill':     { val: plot.weedLevel, low: -1, high: 40, invert: true },
    };
    for (const [id, cfg] of Object.entries(bars)) {
      const el = document.getElementById(id);
      if (!el) continue;
      const bad = cfg.invert ? cfg.val > cfg.high : cfg.val < cfg.low;
      const good = cfg.invert ? cfg.val <= cfg.low + 10 : cfg.val >= cfg.high * 0.7;
      el.style.background = bad  ? 'linear-gradient(90deg,#e74c3c,#c0392b)'
                          : good ? 'linear-gradient(90deg,#27ae60,#2ecc71)'
                          :        'linear-gradient(90deg,#f39c12,#e67e22)';
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
   * Afficher le modal de débloquage d'une parcelle
   */
  showUnlockPlotModal(plotId, plot) {
    if (!plot) {
      this.showToast('Parcelle introuvable', 'error');
      return;
    }

    const cost = plot.unlockCost || 0;
    const level = plot.unlockLevel || 1;
    const playerMoney = Math.floor(this.farmGame.resourceManager.resources.money || 0);
    const playerLevel = this.app.currentUser?.level || this.app.engine?.player?.level || 1;

    // Remplir le modal existant (modal-unlock) avec les infos de la parcelle
    const modal = document.getElementById('modal-unlock');
    if (!modal) {
      this.showToast(`Parcelle ${plotId} nécessite niveau ${level} et ${cost}💰`, 'warning');
      return;
    }

    const h2 = modal.querySelector('h2');
    if (h2) h2.textContent = `🔒 Parcelle ${plotId} Verrouillée`;

    const icon = document.getElementById('unlock-crop-emoji');
    if (icon) icon.textContent = '🌱';

    const name = document.getElementById('unlock-crop-name');
    if (name) name.textContent = `Parcelle ${plotId} (Niv. ${level} requis)`;

    const costEl = document.getElementById('unlock-cost');
    if (costEl) costEl.textContent = cost;

    const balanceEl = document.getElementById('unlock-balance');
    if (balanceEl) balanceEl.textContent = playerMoney;

    // Stocker l'action de confirmation
    this._pendingPlotUnlock = { plotId, cost, level };

    // Afficher le modal et remplacer le handler du bouton confirmer
    modal.classList.add('active');

    const btnConfirm = document.getElementById('btn-confirm-unlock');
    const btnCancel = document.getElementById('btn-cancel-unlock');

    // Cloner pour supprimer les anciens listeners
    const newConfirm = btnConfirm.cloneNode(true);
    const newCancel = btnCancel.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newConfirm, btnConfirm);
    btnCancel.parentNode.replaceChild(newCancel, btnCancel);

    newCancel.addEventListener('click', () => {
      modal.classList.remove('active');
      this._pendingPlotUnlock = null;
    });

    newConfirm.addEventListener('click', () => {
      modal.classList.remove('active');
      if (this._pendingPlotUnlock) {
        this.doUnlockPlot(this._pendingPlotUnlock.plotId);
        this._pendingPlotUnlock = null;
      }
    });
  }

  /**
   * Effectuer le débloquage d'une parcelle
   */
  doUnlockPlot(plotId) {
    const plot = this.farmGame.plotManager.getPlot(plotId);
    if (!plot) return;

    const playerLevel = this.app.currentUser?.level || this.app.engine?.player?.level || 1;
    const success = this.farmGame.plotManager.unlockPlot(plotId, playerLevel);

    if (success) {
      const xpReward = FARM_XP_REWARDS.unlock_plot;
      awardXP(xpReward);
      AudioManager.play('success');
      this.updatePlotsDisplay();
      this.updateResourcesDisplay();
      this.showToast(`✅ Parcelle ${plotId} débloquée ! +${xpReward} XP`, 'success');
    } else {
      const plot2 = this.farmGame.plotManager.getPlot(plotId);
      const money = Math.floor(this.farmGame.resourceManager.resources.money || 0);
      if (money < (plot2?.unlockCost || 0)) {
        this.showToast(`❌ Pas assez d'argent (${plot2?.unlockCost || '?'}💰 requis)`, 'error');
      } else {
        this.showToast(`❌ Niveau ${plot2?.unlockLevel || '?'} requis`, 'error');
      }
    }
  }

  /**
   * Débloquer le poulailler
   */
  unlockCoop() {
    const coop = this.farmGame.livestockManager.infrastructure.chickenCoop;
    const cost = coop.upgradeCost?.[0] ?? 100;

    if (coop.unlocked) {
      this.showToast('⚠️ Poulailler déjà débloqué', 'warning');
      return;
    }

    // unlockChickenCoop gère lui-même la validation argent + débit
    const success = this.farmGame.livestockManager.unlockChickenCoop();
    if (!success) {
      this.showToast(`❌ Pas assez d'argent (${cost}💰 requis)`, 'error');
      return;
    }

    // 🆕 Récompenser avec XP
    const xpReward = FARM_XP_REWARDS.unlock_plot;
    awardXP(xpReward);

    // 🆕 Émettre événement
    EventBus.emit('farm:coop:unlocked', { cost, xpReward });

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
    // buyChickens gère lui-même la validation argent + débit
    const success = this.farmGame.livestockManager.buyChickens(1);

    if (!success) {
      const chickens = this.farmGame.livestockManager.animals.chickens;
      if (chickens.count >= chickens.maxCount) {
        this.showToast('❌ Poulailler plein', 'error');
      } else {
        this.showToast('❌ Pas assez d\'argent (50💰)', 'error');
      }
      return;
    }

    // Mettre à jour l'affichage
    const chickenCount = document.getElementById('chicken-count');
    const eggsPerDay = document.getElementById('eggs-per-day');
    const chickens = this.farmGame.livestockManager.animals.chickens;

    if (chickenCount) chickenCount.textContent = chickens.count;
    if (eggsPerDay) eggsPerDay.textContent = (chickens.count * 0.8).toFixed(1);

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
    const playerMoney = Math.floor(this.farmGame.resourceManager.resources.money || 0);
    const maxAffordable = price > 0 ? Math.floor(playerMoney / price) : 999;

    this._showInputModal({
      title: `Acheter — ${item}`,
      desc: `Prix : <strong>${price}💰</strong> / unité &nbsp;·&nbsp; Solde : <strong>${playerMoney}💰</strong>`,
      placeholder: '1',
      max: maxAffordable,
      unit: 'unités',
      onConfirm: (qty) => {
        qty = Math.floor(qty);
        const result = this.farmGame.marketSystem.buy(category, item, qty);
        if (result.success) {
          EventBus.emit('farm:market:bought', { category, item, quantity: qty, cost: result.cost });
          AudioManager.play('click');
          this.showToast(`✅ Acheté ${qty}× ${item} pour ${result.cost}💰`, 'success');
          this.updateResourcesDisplay();
          this.updateInventoryDisplay();
          this.renderMarketUI();
        } else {
          this.showToast(`❌ ${result.error}`, 'error');
        }
      }
    });
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

    const availableStr = typeof available === 'number' && !isNaN(available)
      ? available.toFixed(2) : '0';

    this._showInputModal({
      title: `Vendre — ${item}`,
      desc: `Prix : <strong>${price}💰</strong> / tonne &nbsp;·&nbsp; Stock : <strong>${availableStr}t</strong>`,
      placeholder: availableStr,
      max: available,
      unit: 't',
      onConfirm: (qty) => {
        const result = this.farmGame.marketSystem.sell(category, item, qty);
        if (result.success) {
          this.farmStats.moneyEarned += result.revenue;
          EventBus.emit('farm:market:sold', { category, item, quantity: qty, revenue: result.revenue });
          AudioManager.play('coin');
          this.showToast(`✅ Vendu ${qty}t ${item} pour ${result.revenue}💰`, 'success');
          this.updateResourcesDisplay();
          this.updateInventoryDisplay();
          this.renderMarketUI();
        } else {
          this.showToast(`❌ ${result.error}`, 'error');
        }
      }
    });
  }

  // ─── Conditions météo & Événements ───────────────────────────────────────

  /**
   * Afficher l'alerte d'un événement surprise — prend tout l'écran pendant 3s
   */
  showEventAlert(event) {
    // Créer l'overlay d'alerte
    let alert = document.getElementById('event-alert-overlay');
    if (!alert) {
      alert = document.createElement('div');
      alert.id = 'event-alert-overlay';
      document.getElementById('screen-farm-v3')?.appendChild(alert);
    }

    alert.innerHTML = `
      <div class="event-alert-box" style="border-color: ${event.color}; box-shadow: 0 0 40px ${event.color}66;">
        <div class="event-alert-icon">${event.icon}</div>
        <div class="event-alert-content">
          <h2 class="event-alert-title">${event.title}</h2>
          <p class="event-alert-desc">${event.desc}</p>
          <span class="event-alert-duration">Durée : ${event.duration} jour(s)</span>
        </div>
      </div>
    `;

    alert.classList.remove('hidden');
    alert.classList.add('visible');

    // Disparaît après 4s
    setTimeout(() => {
      alert.classList.remove('visible');
      alert.classList.add('hidden');
    }, 4000);

    // Toast persistant
    this.showToast(`${event.icon} ${event.title} — ${event.desc}`, 'warning', 6000);
  }

  /**
   * Mettre à jour l'affichage des conditions courantes dans le header
   */
  updateConditionsDisplay() {
    const conditions = this.farmGame.conditionsEngine.getCurrentConditions();
    if (!conditions) return;

    // Icône météo + saison dans le header
    const weatherIcon = document.getElementById('weather-icon');
    const seasonBadge = document.getElementById('display-season');

    if (weatherIcon) {
      weatherIcon.textContent = conditions.activeEvent
        ? conditions.activeEvent.icon
        : conditions.season.icon;
    }
    if (seasonBadge) {
      seasonBadge.textContent = conditions.activeEvent
        ? conditions.activeEvent.title.replace(' !', '')
        : conditions.season.name;
      seasonBadge.style.background = conditions.activeEvent
        ? `${conditions.activeEvent.color}99`
        : 'rgba(255,255,255,0.3)';
    }
  }

  // ─── Action Overlay ──────────────────────────────────────────────────────

  _overlayMeta = {
    plow:                    { icon: '🚜', label: 'Labourage' },
    plant:                   { icon: '🌱', label: 'Plantation' },
    water:                   { icon: '💧', label: 'Arrosage' },
    fertilize_npk:           { icon: '🧪', label: 'Fertilisation NPK' },
    fertilize_organic:       { icon: '💩', label: 'Compost' },
    weed:                    { icon: '🌿', label: 'Désherbage' },
    spray_pesticide_natural: { icon: '🪲', label: 'Pesticide' },
    harvest:                 { icon: '🌾', label: 'Récolte' },
  };

  /**
   * Afficher l'overlay "action en cours" sur le canvas 3D
   * @param {string} actionId
   * @param {number} durationDays - durée en jours de simulation (0 = instantané)
   */
  showActionOverlay(actionId, durationDays = 0) {
    const overlay = document.getElementById('action-overlay');
    const iconEl  = document.getElementById('action-overlay-icon');
    const labelEl = document.getElementById('action-overlay-label');
    const fillEl  = document.getElementById('action-overlay-fill');
    const statusEl= document.getElementById('action-overlay-status');
    if (!overlay) return;

    const meta = this._overlayMeta[actionId] || { icon: '⚙️', label: actionId };
    if (iconEl)  iconEl.textContent  = meta.icon;
    if (labelEl) labelEl.textContent = meta.label;
    if (fillEl)  { fillEl.classList.remove('complete'); fillEl.style.width = '10%'; }
    if (statusEl) statusEl.textContent = durationDays > 0
      ? `Durée : ${durationDays.toFixed(1)} jour(s)`
      : 'En cours...';

    overlay.classList.remove('hidden');
    overlay.classList.add('in-progress');

    // Si durée connue, animer la barre sur la durée réelle
    if (durationDays > 0 && fillEl) {
      const speed = this.farmGame?.timeSimulation?.speed;
      // Garde contre speed=0 ou NaN → fallback 2000ms/jour
      const msPerDay = (speed && isFinite(speed) && speed > 0)
        ? (1000 / speed)
        : 2000;
      const totalMs = Math.min(durationDays * msPerDay, 30000); // max 30s
      const start = Date.now();
      let rafId;
      const tick = () => {
        const elapsed = Date.now() - start;
        const pct = Math.min(90, (elapsed / totalMs) * 90);
        fillEl.style.width = pct + '%';
        if (pct < 90 && elapsed < totalMs + 500) {
          rafId = requestAnimationFrame(tick);
        }
      };
      rafId = requestAnimationFrame(tick);
      // Nettoyage de sécurité après totalMs + 1s
      setTimeout(() => cancelAnimationFrame(rafId), totalMs + 1000);
    }
  }

  /**
   * Passer l'overlay en état "terminé", puis le masquer
   */
  completeActionOverlay(actionId) {
    const overlay = document.getElementById('action-overlay');
    const fillEl  = document.getElementById('action-overlay-fill');
    const statusEl= document.getElementById('action-overlay-status');
    if (!overlay) return;

    overlay.classList.remove('in-progress');
    if (fillEl) fillEl.classList.add('complete');
    if (statusEl) statusEl.textContent = '✅ Terminé !';

    // Masquer après 2s
    setTimeout(() => {
      if (overlay) overlay.classList.add('hidden');
      if (fillEl) fillEl.classList.remove('complete');
    }, 2000);
  }

  // ─── Modal de saisie (remplace prompt natif) ─────────────────────────────

  /**
   * Affiche un modal avec champ de saisie numérique — remplace window.prompt()
   * @param {Object} cfg - { title, desc, placeholder, max, unit, onConfirm }
   */
  _showInputModal({ title, desc, placeholder = '1', max = null, unit = '', onConfirm }) {
    // Supprimer modal existant s'il y en a un
    document.getElementById('_farm-input-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.id = '_farm-input-modal';
    overlay.style.cssText = `
      position:fixed; inset:0; z-index:9999;
      background:rgba(0,0,0,0.65); backdrop-filter:blur(4px);
      display:flex; align-items:center; justify-content:center;
      animation: fadeIn .2s ease;
    `;

    overlay.innerHTML = `
      <div style="
        background:#1a2530; border:1px solid rgba(255,255,255,0.12);
        border-radius:16px; padding:28px 32px; min-width:320px; max-width:400px;
        color:#f0f0f0; box-shadow:0 20px 60px rgba(0,0,0,0.5);
        animation: popIn .25s cubic-bezier(0.34,1.56,0.64,1);
      ">
        <h3 style="margin:0 0 8px; font-size:1.1rem; font-weight:700;">${title}</h3>
        <p style="margin:0 0 18px; font-size:.85rem; opacity:.7; line-height:1.5;">${desc}</p>
        <div style="display:flex; gap:10px; align-items:center; margin-bottom:20px;">
          <input id="_farm-input-qty" type="number" min="0.01"
            ${max ? `max="${max}"` : ''}
            step="${unit === 't' ? '0.1' : '1'}"
            placeholder="${placeholder}"
            style="
              flex:1; background:#0d1a20; border:1px solid rgba(255,255,255,0.2);
              border-radius:8px; padding:10px 14px; color:#f0f0f0;
              font-size:1rem; outline:none;
            "
          />
          <span style="opacity:.6; font-size:.9rem;">${unit}</span>
        </div>
        <div style="display:flex; gap:10px;">
          <button id="_farm-input-cancel" style="
            flex:1; padding:10px; border:1px solid rgba(255,255,255,0.15);
            border-radius:8px; background:transparent; color:#f0f0f0;
            cursor:pointer; font-size:.9rem;
          ">Annuler</button>
          <button id="_farm-input-ok" style="
            flex:1; padding:10px; border:none; border-radius:8px;
            background:linear-gradient(135deg,#66bb6a,#2e7d32);
            color:white; cursor:pointer; font-weight:700; font-size:.9rem;
          ">Confirmer</button>
        </div>
      </div>
      <style>
        @keyframes popIn { from{transform:scale(.8);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        #_farm-input-qty:focus { border-color:rgba(102,187,106,.6); }
      </style>
    `;

    document.body.appendChild(overlay);

    const input = overlay.querySelector('#_farm-input-qty');
    const ok    = overlay.querySelector('#_farm-input-ok');
    const cancel= overlay.querySelector('#_farm-input-cancel');

    // Focus auto
    setTimeout(() => input.focus(), 50);

    const close = () => overlay.remove();

    cancel.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    const submit = () => {
      const val = parseFloat(input.value);
      if (!val || isNaN(val) || val <= 0) {
        input.style.borderColor = '#f44336';
        return;
      }
      close();
      onConfirm(val);
    };

    ok.addEventListener('click', submit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') submit();
      if (e.key === 'Escape') close();
    });
  }

  // ─── Toast ───────────────────────────────────────────────────────────────

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

    // Retourner à l'accueil
    this.app.showScreen('home');
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
