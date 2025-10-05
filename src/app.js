/**
 * app.js
 * Application principale IleRise
 * NASA Space Apps Challenge 2025
 */

import { GameEngine } from './game/GameEngine.js';
import { getAllCropSystems, getCropSystem, getCropLevel } from './game/LevelSystem.js';
import { getCrop } from './game/CropDatabase.js';
import { Level } from './game/Level.js';
import { SimulationEngine } from './game/SimulationEngine.js';
import { CursorControls } from './ui/CursorControls.js';
import { FarmScene } from './3d/FarmScene.js';
import { TutorialSystem } from './tutorial/TutorialSystem.js';
import { EducationCards } from './education/EducationCards.js';
import { LocationSelector } from './location/LocationSelector.js';
import { I18nManager } from './i18n/I18nManager.js';
import { FarmV3Adapter } from './farm-v3-adapter.js';
import apiService from './services/api.js';

// Configuration API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ilerise.onrender.com/api';

class IleRiseApp {
  constructor() {
    this.engine = new GameEngine();
    this.currentCrop = null;
    this.currentLevel = null;
    this.currentLevelObj = null;
    this.cursorControls = null;
    this.farmScene = null;
    this.tutorial = null;
    this.educationCards = new EducationCards();
    this.locationSelector = null;
    this.currentLocation = null;
    this.i18n = new I18nManager();
    this.isInitialized = false;

    // Farm V3 Adapter
    this.farmV3 = null;

    // Knowledge cards
    this.knowledgeCards = [];
    this.filteredCards = [];
    this.currentCardIndex = 0;
    this.currentFilter = 'all';
    this.currentLevelFilter = 'all';

    this.screens = {
      home: document.getElementById('screen-home'),
      location: document.getElementById('screen-location'),
      cropSelect: document.getElementById('screen-crop-select'),
      levelSelect: document.getElementById('screen-level-select'),
      game: document.getElementById('screen-game'),
      farmV3: document.getElementById('screen-farm-v3'),
      results: document.getElementById('screen-results'),
      profile: document.getElementById('screen-profile'),
      knowledge: document.getElementById('screen-knowledge'),
      auth: document.getElementById('screen-auth')
    };

    // Auth state
    this.isAuthenticated = false;
    this.currentUser = null;

    this.modal = document.getElementById('modal-unlock');
    this.modalKnowledgeCard = document.getElementById('modal-knowledge-card');
    this.modalMessage = document.getElementById('modal-message');
    this.modalConfirm = document.getElementById('modal-confirm');
    this.loading = document.getElementById('loading');

    // Confirmation callback
    this.confirmCallback = null;
  }

  /**
   * Initialiser l'application
   */
  async init() {
    console.log('🚀 Initialisation IleRise...');
    this.showLoading(true);

    try {
      // Charger données NASA
      await this.engine.loadNASAData();

      // Initialiser i18n
      this.i18n.init();

      // Ajouter le sélecteur de langue sur l'écran d'accueil
      const languageSwitcher = this.i18n.createLanguageSwitcher();
      const homeContainer = document.getElementById('language-switcher-home');
      if (homeContainer) {
        homeContainer.appendChild(languageSwitcher);
      }

      // Initialiser LocationSelector avec données NASA
      this.locationSelector = new LocationSelector(this.engine.nasaData);

      // Charger localité sauvegardée
      const savedLocation = localStorage.getItem('ilerise_location');
      if (savedLocation) {
        this.currentLocation = JSON.parse(savedLocation);
        console.log('📍 Localité sauvegardée:', this.currentLocation.city);
      }

      // Vérifier vies
      this.engine.checkLives();

      // Initialiser tutoriel
      this.tutorial = new TutorialSystem();
      await this.tutorial.init();

      // Charger cartes éducatives
      await this.loadKnowledgeCards();

      this.isInitialized = true;

      // Attacher événements
      this.attachEventListeners();

      // Écouter changement de langue
      window.addEventListener('languagechange', (e) => {
        console.log('🌍 Langue changée:', e.detail.lang);
        this.onLanguageChange();
      });

      // Mettre à jour UI
      this.updatePlayerUI();

      // Vérifier authentification
      if (await this.checkAuth()) {
        // Utilisateur déjà connecté
        console.log('✅ Utilisateur connecté:', this.currentUser.username);

        // 🆕 Synchroniser le profil depuis le backend
        await this.syncProfileFromBackend();

        this.showScreen('home');
      } else {
        // Rediriger vers authentification
        console.log('⚠️ Utilisateur non connecté');
        this.showAuth();
      }

      console.log('✅ IleRise initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation:', error);
      this.showMessage(
        'Erreur de chargement',
        'Vérifiez que les données NASA sont disponibles.',
        'error'
      );
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Attacher événements
   */
  attachEventListeners() {
    // Écouter expiration du token
    window.addEventListener('auth:expired', () => {
      console.warn('🔴 Token expiré - Déconnexion automatique');
      this.logout();
      this.showMessage(
        'Session expirée',
        'Votre session a expiré. Veuillez vous reconnecter.',
        'warning'
      );
    });

    // Écran d'accueil - Nouveau menu avec image
    const btnJouer = document.getElementById('btn-jouer');
    if (btnJouer) {
      btnJouer.addEventListener('click', () => {
        this.showCropSelection();
      });
    }

    const btnParametres = document.getElementById('btn-parametres');
    if (btnParametres) {
      btnParametres.addEventListener('click', () => {
        this.showParametres();
      });
    }

    const btnCredits = document.getElementById('btn-credits');
    if (btnCredits) {
      btnCredits.addEventListener('click', () => {
        this.showCredits();
      });
    }

    const btnQuitter = document.getElementById('btn-quitter');
    if (btnQuitter) {
      btnQuitter.addEventListener('click', () => {
        this.showConfirm(
          'Quitter IleRise',
          'Voulez-vous vraiment quitter le jeu ?',
          (confirmed) => {
            if (confirmed) {
              window.close();
            }
          }
        );
      });
    }

    // Ancien bouton (pour compatibilité)
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        this.showCropSelection();
      });
    }

    // Boutons de localité
    const btnBackLocation = document.getElementById('btn-back-location');
    if (btnBackLocation) {
      btnBackLocation.addEventListener('click', () => {
        this.showScreen('home');
      });
    }

    const btnConfirmLocation = document.getElementById('btn-confirm-location');
    if (btnConfirmLocation) {
      btnConfirmLocation.addEventListener('click', () => {
        this.confirmLocationSelection();
      });
    }

    // Tutoriel
    const btnTutorial = document.getElementById('btn-tutorial');
    if (btnTutorial) {
      btnTutorial.addEventListener('click', () => {
        if (this.tutorial) {
          this.tutorial.start();
        }
      });
    }

    // Profil
    const btnProfile = document.getElementById('btn-profile');
    if (btnProfile) {
      btnProfile.addEventListener('click', () => {
        this.showProfile();
      });
    }

    // Déconnexion
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        this.showConfirm(
          this.i18n.translate('auth.logout'),
          this.i18n.translate('auth.logoutConfirm'),
          (confirmed) => {
            if (confirmed) {
              this.logout();
            }
          }
        );
      });
    }

    const btnBackProfile = document.getElementById('btn-back-profile');
    if (btnBackProfile) {
      btnBackProfile.addEventListener('click', () => {
        this.showScreen('home');
      });
    }

    const btnExportProfile = document.getElementById('btn-export-profile');
    if (btnExportProfile) {
      btnExportProfile.addEventListener('click', () => {
        this.exportProfile();
      });
    }

    // Sélection culture
    document.getElementById('btn-back-crop').addEventListener('click', () => {
      this.showScreen('home');
    });

    // Bouton cartes éducatives
    const btnKnowledgeCards = document.getElementById('btn-knowledge-cards');
    if (btnKnowledgeCards) {
      btnKnowledgeCards.addEventListener('click', () => {
        this.showKnowledgeCards();
      });
    }

    // Sélection niveau
    document.getElementById('btn-back-level').addEventListener('click', () => {
      this.showCropSelection();
    });

    // Bouton changer de localité (dans l'écran de jeu)
    const btnChangeLocation = document.getElementById('btn-change-location');
    if (btnChangeLocation) {
      btnChangeLocation.addEventListener('click', () => {
        this.showLocationSelection();
      });
    }

    // Bouton audio Fon
    const btnAudioFon = document.getElementById('btn-audio-fon');
    if (btnAudioFon) {
      btnAudioFon.addEventListener('click', () => {
        this.showAudioFonInstructions();
      });
    }

    // Écran de jeu
    document.getElementById('btn-back-game').addEventListener('click', () => {
      this.showConfirm(
        'Quitter le niveau',
        'Vous perdrez votre progression actuelle. Continuer ?',
        (confirmed) => {
          if (confirmed) {
            if (this.farmScene) {
              this.farmScene.dispose();
              this.farmScene = null;
            }
            this.showLevelSelection(this.currentCrop);
          }
        }
      );
    });

    document.getElementById('btn-recommendations').addEventListener('click', () => {
      this.applyNASARecommendations();
    });

    document.getElementById('btn-simulate').addEventListener('click', () => {
      this.runSimulation();
    });

    // Bouton Mode Ferme Interactive V3
    const btnFarmMode = document.getElementById('btn-switch-farm-mode');
    if (btnFarmMode) {
      btnFarmMode.addEventListener('click', () => {
        this.switchToFarmMode();
      });
    }

    // Écran résultats
    document.getElementById('btn-retry').addEventListener('click', () => {
      this.startLevel(this.currentCrop, this.currentLevel);
    });

    document.getElementById('btn-next-level').addEventListener('click', () => {
      const nextLevel = this.currentLevel + 1;
      const cropSystem = getCropSystem(this.currentCrop);

      if (cropSystem.levels.find(l => l.id === nextLevel)) {
        this.startLevel(this.currentCrop, nextLevel);
      } else {
        this.showCropSelection();
      }
    });

    document.getElementById('btn-main-menu').addEventListener('click', () => {
      this.showScreen('home');
    });

    // Auth events
    this.attachAuthEventListeners();

    // Modals génériques
    this.attachModalEventListeners();

    // Modal unlock
    document.getElementById('btn-cancel-unlock').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('btn-confirm-unlock').addEventListener('click', () => {
      this.confirmUnlock();
    });
  }

  /**
   * Afficher écran
   */
  showScreen(screenName) {
    console.log(`🖥️ showScreen('${screenName}') appelé`);

    // Vérifier si l'écran existe
    if (!this.screens[screenName]) {
      console.error(`❌ Écran '${screenName}' n'existe pas!`);
      console.log('Écrans disponibles:', Object.keys(this.screens));
      return;
    }

    // Masquer tous les écrans
    Object.values(this.screens).forEach(screen => {
      if (screen) screen.classList.remove('active');
    });

    // Afficher l'écran demandé
    this.screens[screenName].classList.add('active');
    console.log(`✅ Écran '${screenName}' affiché`);
  }

  /**
   * Afficher/masquer loading
   */
  showLoading(show) {
    if (show) {
      this.loading.classList.add('active');
    } else {
      this.loading.classList.remove('active');
    }
  }

  /**
   * Mettre à jour UI joueur
   */
  updatePlayerUI() {
    const status = this.engine.player;
    const livesState = this.engine.getLivesUI(); // 🆕 Utiliser LivesSystem pour l'affichage

    // Écran d'accueil
    document.getElementById('home-lives').textContent = livesState.current;
    document.getElementById('home-coins').textContent = status.coins;

    // Sélection culture
    document.getElementById('crop-coins').textContent = status.coins;

    // Sélection niveau
    document.getElementById('level-coins').textContent = status.coins;

    // Écran de jeu
    document.getElementById('game-lives').textContent = livesState.current;
    document.getElementById('game-coins').textContent = status.coins;
  }

  /**
   * Afficher sélection culture
   */
  showCropSelection() {
    // Si pas de localité sélectionnée, montrer écran localité
    if (!this.currentLocation) {
      this.showLocationSelection();
      return;
    }

    this.updatePlayerUI();

    const crops = getAllCropSystems();
    const grid = document.getElementById('crop-grid');
    grid.innerHTML = '';

    crops.forEach(crop => {
      const isUnlocked = this.engine.player.coins >= crop.unlockCost ||
                         crop.unlockCost === 0;

      const card = document.createElement('div');
      card.className = `crop-card ${!isUnlocked ? 'locked' : ''}`;

      const cropName = crop.name[this.i18n.currentLang] || crop.name.fr;
      const costText = crop.unlockCost > 0
        ? this.i18n.translate('cropSelect.unlockCost', { cost: crop.unlockCost })
        : this.i18n.translate('cropSelect.unlockCost', { cost: 0 });
      const levelsText = this.i18n.currentLang === 'en'
        ? `${crop.levels.length} levels available`
        : `${crop.levels.length} niveaux disponibles`;

      card.innerHTML = `
        <span class="crop-emoji">${crop.emoji}</span>
        <h3 class="crop-name">${cropName}</h3>
        ${crop.unlockCost > 0 ? `<p class="crop-unlock-cost">${costText}</p>` : `<p class="crop-unlock-cost">${this.i18n.currentLang === 'en' ? 'Free' : 'Gratuit'}</p>`}
        <div class="crop-stats">
          ${levelsText}
        </div>
      `;

      card.addEventListener('click', () => {
        if (isUnlocked) {
          this.showLevelSelection(crop.id);
        } else {
          this.showUnlockModal(crop);
        }
      });

      grid.appendChild(card);
    });

    this.showScreen('cropSelect');
  }

  /**
   * Afficher sélection niveau
   */
  showLevelSelection(cropId) {
    this.currentCrop = cropId;
    this.updatePlayerUI();

    const cropSystem = getCropSystem(cropId);
    const grid = document.getElementById('level-grid');

    // Mettre à jour titre
    const cropName = cropSystem.name[this.i18n.currentLang] || cropSystem.name.fr;
    document.getElementById('level-crop-title').textContent =
      `${cropSystem.emoji} ${cropName}`;

    const descriptionText = this.i18n.currentLang === 'en'
      ? `Progress through ${cropSystem.levels.length} levels of increasing difficulty`
      : `Progressez à travers ${cropSystem.levels.length} niveaux de difficulté croissante`;
    document.getElementById('level-crop-description').textContent = descriptionText;

    // Générer cartes de niveaux
    grid.innerHTML = '';

    cropSystem.levels.forEach(level => {
      const isCompleted = this.engine.player.completedLevels.includes(`${cropId}-${level.id}`);
      const highScore = this.engine.player.highScores[`${cropId}-${level.id}`] || null;

      // Vérifier si le niveau est débloqué
      let isUnlocked = true;
      if (level.id === 2) {
        // Niveau 2 : débloqué si niveau 1 complété
        isUnlocked = this.engine.player.completedLevels.includes(`${cropId}-1`);
      } else if (level.id === 3) {
        // Niveau 3 : débloqué si niveau 2 complété
        isUnlocked = this.engine.player.completedLevels.includes(`${cropId}-2`);
      }

      const card = document.createElement('div');
      card.className = `level-card ${!isUnlocked ? 'locked' : ''}`;

      const levelText = this.i18n.currentLang === 'en' ? 'Level' : 'Niveau';
      const budgetText = this.i18n.currentLang === 'en' ? 'Budget' : 'Budget';
      const completedText = this.i18n.currentLang === 'en' ? 'Completed' : 'Complété';
      const lockedText = this.i18n.currentLang === 'en' ? 'Locked' : 'Verrouillé';
      const unlockRequiredText = this.i18n.currentLang === 'en'
        ? `Complete Level ${level.id - 1} to unlock`
        : `Complétez le Niveau ${level.id - 1} pour débloquer`;
      const difficultyText = this.i18n.translate(`levelSelect.${level.difficulty}`);

      card.innerHTML = `
        <div class="level-badge-icon">
          ${!isUnlocked ? '🔒' : level.id}
        </div>
        <div class="level-details">
          <div class="level-header">
            <span class="level-number">${levelText} ${level.id}</span>
            <span class="level-name">${level.name}</span>
            <span class="difficulty-badge ${level.difficulty}">${difficultyText}</span>
          </div>
          <p class="level-description">${level.description}</p>
          <div class="level-stats">
            ${!isUnlocked ? `<span class="level-stat locked-message">🔒 ${unlockRequiredText}</span>` : `
              <span class="level-stat">🎯 ${level.targetYield} t/ha</span>
              ${level.constraints.budget ? `<span class="level-stat">💰 ${budgetText}: ${level.constraints.budget}</span>` : ''}
              ${isCompleted ? `<span class="level-stat">✅ ${completedText}</span>` : ''}
            `}
          </div>
        </div>
        <div class="level-stars">
          ${highScore && isUnlocked ? '⭐'.repeat(highScore.stars) : ''}
        </div>
      `;

      card.addEventListener('click', () => {
        if (isUnlocked) {
          this.startLevel(cropId, level.id);
        } else {
          // Afficher message de déverrouillage
          this.showMessage(
            'info',
            this.i18n.currentLang === 'en' ? 'Level Locked' : 'Niveau Verrouillé',
            unlockRequiredText
          );
        }
      });

      grid.appendChild(card);
    });

    this.showScreen('levelSelect');
  }

  /**
   * Démarrer niveau
   */
  async startLevel(cropId, levelId) {
    console.log('🎯 startLevel appelé:', cropId, levelId);

    // Vérifier et utiliser une vie
    const livesState = this.engine.getLivesUI();
    console.log('❤️ Vies disponibles:', livesState.current, '/', livesState.max);

    if (livesState.current <= 0) {
      const message = livesState.timeUntilNext
        ? `Revenez dans ${livesState.timeUntilNext} ou attendez demain.`
        : 'Revenez demain ou attendez la recharge des vies.';

      this.showMessage(
        'Plus de vies',
        message,
        'warning'
      );
      return;
    }

    // Consommer une vie pour démarrer la partie
    const lifeUsed = await this.engine.useLife();
    if (!lifeUsed) {
      this.showMessage(
        'Erreur',
        'Pas assez de vies. Attendez la régénération ou achetez des vies.',
        'error'
      );
      return;
    }

    console.log('✅ Vie utilisée, vies restantes:', this.engine.checkLives());

    this.currentCrop = cropId;
    this.currentLevel = levelId;

    console.log('📦 Chargement données culture...');
    const cropSystem = getCropSystem(cropId);
    const levelData = getCropLevel(cropId, levelId);
    const cropData = getCrop(cropId);

    console.log('Crop system:', cropSystem);
    console.log('Level data:', levelData);
    console.log('Crop data:', cropData);

    // Récupérer données NASA (utiliser la localité sélectionnée)
    const cityName = this.currentLocation ? this.currentLocation.city : 'Parakou';
    console.log('🌍 Chargement données NASA pour:', cityName);
    const nasaData = this.engine.getCityData(cityName);
    console.log('NASA data:', nasaData);

    // Mettre à jour l'affichage de la localité
    this.updateLocationDisplay();

    // Créer objet niveau
    console.log('📊 Création objet niveau...');
    try {
      this.currentLevelObj = new Level(
        `${cropId}-${levelId}`,
        cropData,
        cityName,
        nasaData,
        levelData  // 🆕 Passer levelData pour avoir targetYield
      );
      console.log('✅ Niveau créé');
    } catch (error) {
      console.error('❌ Erreur création niveau:', error);
      this.showMessage(
        'Erreur',
        'Erreur lors de la création du niveau: ' + error.message,
        'error'
      );
      return;
    }

    // Mettre à jour UI
    console.log('🎨 Mise à jour UI...');
    document.getElementById('game-crop-emoji').textContent = cropSystem.emoji;
    document.getElementById('game-crop-name').textContent = cropSystem.name.fr;
    document.getElementById('game-level-badge').textContent = `Niveau ${levelId}`;

    document.getElementById('target-yield').textContent = `${levelData.targetYield} t/ha`;

    // Contraintes
    let constraints = [];
    if (levelData.constraints.budget) {
      constraints.push(`Budget NPK: ${levelData.constraints.budget} pièces max`);
    }
    if (levelData.constraints.weather !== 'optimal') {
      constraints.push(`Météo: ${levelData.constraints.weather}`);
    }
    document.getElementById('game-constraints').textContent = constraints.join(' • ');

    // Données NASA
    document.getElementById('nasa-temp').textContent =
      `${nasaData.temperature.current_c || '--'}°C`;
    document.getElementById('nasa-moisture').textContent =
      `${nasaData.soilMoisture.current_percent || '--'}%`;
    document.getElementById('nasa-ndvi').textContent =
      nasaData.ndvi.current || '--';

    // Créer curseurs
    if (this.cursorControls) {
      this.cursorControls.reset();
    } else {
      this.cursorControls = new CursorControls(this.currentLevelObj, 'cursor-container');
    }

    // Événement changement curseurs → Mettre à jour plants 3D
    document.getElementById('cursor-container').addEventListener('cursorChange', (e) => {
      if (this.farmScene) {
        const cursors = this.currentLevelObj.getCursors();
        this.farmScene.updatePlantConditions(cursors.water, cursors.npk, cursors.ph);
      }
    });

    // Créer scène 3D
    console.log('🎬 Création scène 3D...');
    try {
      this.create3DScene(cropId);
      console.log('✅ Scène 3D créée');
    } catch (error) {
      console.error('❌ Erreur création scène 3D:', error);
      this.showMessage(
        'Erreur 3D',
        'Erreur lors de la création de la scène 3D: ' + error.message,
        'error'
      );
    }

    this.updatePlayerUI();
    console.log('🎮 Affichage écran de jeu...');
    this.showScreen('game');
  }

  /**
   * Créer scène 3D avec loader optimisé
   */
  create3DScene(cropId) {
    console.log('  📦 Récupération container...');
    const container = document.getElementById('game-canvas-container');
    const loader = document.getElementById('canvas-loading');

    if (!container) {
      throw new Error('Container game-canvas-container non trouvé');
    }

    // Afficher loader
    if (loader) {
      loader.classList.remove('hidden');
    }

    // Utiliser setTimeout pour permettre au loader de s'afficher
    setTimeout(() => {
      try {
        // Nettoyer scène précédente
        if (this.farmScene) {
          console.log('  🧹 Nettoyage scène précédente...');
          this.farmScene.dispose();
        }

        // Créer nouvelle scène
        console.log('  🌾 Création FarmScene...');
        this.farmScene = new FarmScene(container);

        // Planter culture avec moins de plants pour performance
        console.log(`  🌱 Plantation ${cropId}...`);
        this.farmScene.plantCrop(cropId, 25); // 5x5 grille au lieu de 7x7

        // Masquer loader après création
        setTimeout(() => {
          if (loader) {
            loader.classList.add('hidden');
          }
        }, 500);

        // Animer croissance
        console.log('  📈 Animation croissance...');
        setTimeout(() => {
          this.farmScene.animateGrowth(1500); // Réduit de 2000ms à 1500ms
        }, 600);

      } catch (error) {
        console.error('❌ Erreur création 3D:', error);
        if (loader) {
          loader.classList.add('hidden');
        }
      }
    }, 100); // Petit délai pour afficher le loader
  }

  /**
   * Appliquer recommandations NASA
   */
  applyNASARecommendations() {
    if (!this.cursorControls) return;

    // Récupérer les valeurs AVANT
    const beforeValues = this.currentLevelObj.getCursors();
    console.log('Valeurs AVANT aide NASA:', beforeValues);

    // Appliquer les recommandations
    this.cursorControls.applyRecommendations();

    // Récupérer les valeurs APRÈS
    const afterValues = this.currentLevelObj.getCursors();
    console.log('Valeurs APRÈS aide NASA:', afterValues);

    // Afficher une modal avec les changements
    this.showNASARecommendationsModal(beforeValues, afterValues);
  }

  /**
   * Afficher la modal des recommandations NASA appliquées
   */
  showNASARecommendationsModal(before, after) {
    // Créer la modal
    const modal = document.createElement('div');
    modal.className = 'modal-nasa-help active';
    modal.innerHTML = `
      <div class="modal-content nasa-help-modal">
        <div class="nasa-help-header">
          <span class="nasa-icon">🛰️</span>
          <h2>Recommandations NASA Appliquées</h2>
        </div>

        <p class="nasa-help-intro">
          Les données satellites ont été analysées pour optimiser vos paramètres de culture.
        </p>

        <div class="adjustments-list">
          ${this.generateAdjustmentItem('💧 Irrigation', before.water, after.water, '%')}
          ${this.generateAdjustmentItem('🌿 NPK', before.npk, after.npk, ' kg/ha')}
          ${this.generateAdjustmentItem('⚗️ pH du sol', before.ph, after.ph, '')}
        </div>

        <div class="nasa-help-footer">
          <p class="nasa-source">
            📡 Données basées sur: SMAP (humidité), MODIS (NDVI), NASA Terra (température)
          </p>
          <button class="btn-primary" id="btn-close-nasa-help">Compris !</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Fermer la modal
    const btnClose = modal.querySelector('#btn-close-nasa-help');
    btnClose.addEventListener('click', () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    });

    // Enregistrer l'utilisation de l'aide NASA
    this.engine.useNASAData(['SMAP', 'MODIS', 'Terra']);
  }

  /**
   * Générer un item d'ajustement pour la modal
   */
  generateAdjustmentItem(label, before, after, unit) {
    const change = after - before;
    const hasChanged = Math.abs(change) > 0.01;

    if (!hasChanged) {
      return `
        <div class="adjustment-item no-change">
          <div class="adjustment-label">${label}</div>
          <div class="adjustment-values">
            <span class="value-before">${before}${unit}</span>
            <span class="arrow">→</span>
            <span class="value-after same">${after}${unit}</span>
          </div>
          <div class="adjustment-status">
            <span class="badge-neutral">Déjà optimal</span>
          </div>
        </div>
      `;
    }

    const changePercent = ((change / before) * 100).toFixed(0);
    const changeClass = change > 0 ? 'increase' : 'decrease';
    const changeIcon = change > 0 ? '📈' : '📉';
    const changeText = change > 0 ? `+${change.toFixed(1)}${unit}` : `${change.toFixed(1)}${unit}`;

    return `
      <div class="adjustment-item ${changeClass}">
        <div class="adjustment-label">${label}</div>
        <div class="adjustment-values">
          <span class="value-before">${before}${unit}</span>
          <span class="arrow">→</span>
          <span class="value-after">${after}${unit}</span>
        </div>
        <div class="adjustment-change">
          <span class="change-badge ${changeClass}">
            ${changeIcon} ${changeText} (${changePercent > 0 ? '+' : ''}${changePercent}%)
          </span>
        </div>
      </div>
    `;
  }

  /**
   * Lancer simulation
   */
  async runSimulation() {
    if (!this.currentLevelObj) return;

    // Vérifier vies
    if (this.engine.player.lives <= 0) {
      this.showMessage(
        'Plus de vies',
        'Vous n\'avez plus de vies disponibles !',
        'warning'
      );
      return;
    }

    // 🆕 Démarrer la partie dans le GameEngine
    const levelKey = `${this.currentCrop}-${this.currentLevel}`;
    this.engine.startGame(levelKey, this.currentCrop, this.currentLevel);
    console.log('🎮 Partie démarrée:', levelKey);

    // Consommer vie
    await this.engine.useLife();

    // Afficher indicateur progression
    const progressOverlay = document.getElementById('simulation-progress');
    const progressBar = document.getElementById('simulation-progress-bar');
    const progressPercentage = document.getElementById('simulation-percentage');
    const progressDay = document.getElementById('simulation-day');
    const progressStatus = document.getElementById('simulation-status');
    const progressPhase = document.getElementById('simulation-phase');
    const progressNDVI = document.getElementById('simulation-ndvi');

    progressOverlay.style.display = 'flex';

    // Simuler progression sur 90 jours
    const duration = 90;
    const phases = ['Germination', 'Végétation', 'Floraison', 'Maturation'];

    for (let day = 0; day <= duration; day++) {
      const progress = (day / duration) * 100;
      progressBar.style.width = `${progress}%`;
      progressPercentage.textContent = Math.round(progress);
      progressDay.textContent = day;

      // Phase selon jour
      let phase = phases[0];
      if (day > 60) phase = phases[3];
      else if (day > 40) phase = phases[2];
      else if (day > 10) phase = phases[1];

      progressPhase.textContent = `Phase: ${phase}`;

      // NDVI augmente progressivement
      const ndvi = Math.min(0.85, (day / duration) * 0.9).toFixed(2);
      progressNDVI.textContent = `NDVI: ${ndvi}`;

      // Statut dynamique
      if (day < 10) {
        progressStatus.textContent = 'Germination des graines...';
      } else if (day < 40) {
        progressStatus.textContent = 'Croissance végétative...';
      } else if (day < 60) {
        progressStatus.textContent = 'Floraison en cours...';
      } else {
        progressStatus.textContent = 'Maturation finale...';
      }

      await new Promise(resolve => setTimeout(resolve, 20));
    }

    // Masquer indicateur
    progressOverlay.style.display = 'none';

    // Lancer simulation
    console.log('🎲 Lancement simulation...');
    const results = this.currentLevelObj.runSimulation();
    const isSuccess = this.currentLevelObj.isSuccess();

    console.log('📊 Résultats simulation:', results);
    console.log('✅ Succès?', isSuccess);

    // Afficher visuellement sur plants 3D
    if (this.farmScene) {
      console.log('🎨 Scène 3D détectée, application des effets...');
      // Appliquer état final aux plants
      const cursors = this.currentLevelObj.getCursors();
      this.farmScene.updatePlantConditions(cursors.water, cursors.npk, cursors.ph);

      // Afficher stress si problèmes détectés
      if (results.stressFactor && results.stressFactor.water < 60) {
        this.farmScene.showStress('water');
      } else if (results.stressFactor && results.stressFactor.nutrient < 60) {
        this.farmScene.showStress('nutrient');
      } else if (results.stressFactor && results.stressFactor.ph < 60) {
        this.farmScene.showStress('ph');
      }

      // Attendre animation puis afficher résultats
      console.log('⏳ Attente 1.5s pour animation...');
      setTimeout(() => {
        console.log('📺 Affichage écran résultats...');
        this.showResults(results, isSuccess);
      }, 1500);
    } else {
      console.log('⚠️ Pas de scène 3D, affichage direct des résultats...');
      // Pas de 3D, afficher directement
      this.showResults(results, isSuccess);
    }
  }

  /**
   * Basculer vers le Mode Ferme Interactive V3
   */
  async switchToFarmMode() {
    console.log('🌾 Basculement vers Mode Ferme Interactive...');

    try {
      // Créer l'instance FarmV3Adapter si elle n'existe pas
      if (!this.farmV3) {
        this.farmV3 = new FarmV3Adapter(this);
      }

      // Afficher l'écran Ferme V3
      this.showScreen('farmV3');

      // Initialiser le mode ferme
      await this.farmV3.init();

      console.log('✅ Mode Ferme activé');

    } catch (error) {
      console.error('❌ Erreur lors du basculement vers Mode Ferme:', error);
      this.showMessage(
        'Erreur',
        'Impossible de charger le Mode Ferme Interactive',
        'error'
      );
      // Retourner à l'écran de jeu en cas d'erreur
      this.showScreen('game');
    }
  }

  /**
   * Afficher résultats
   */
  async showResults(results, isSuccess) {
    console.log('🎯 showResults() appelé');
    console.log('   - results:', results);
    console.log('   - isSuccess:', isSuccess);

    const levelData = getCropLevel(this.currentCrop, this.currentLevel);
    console.log('   - levelData:', levelData);

    // Titre
    document.getElementById('results-title').textContent =
      isSuccess ? '🎉 Niveau Réussi !' : '❌ Niveau Échoué';

    console.log('   - Titre défini');

    // Étoiles
    const stars = '⭐'.repeat(results.stars) + '☆'.repeat(3 - results.stars);
    document.getElementById('results-stars').textContent = stars;

    // Score
    document.getElementById('results-score-value').textContent = results.score;

    // Détails
    document.getElementById('results-yield').textContent = results.actualYield;
    document.getElementById('results-target').textContent = levelData.targetYield;

    // Récompenses
    let coinsEarned = 0;
    let completion = null;
    if (isSuccess) {
      console.log('🎮 Appel completeLevel...');
      completion = await this.engine.completeLevel({
        score: results.score,
        stars: results.stars,
        globalScore: results.score,
        actualYield: results.actualYield,
        potentialYield: results.potentialYield,
        yieldPercentage: results.yieldPercentage,
        stressFactor: results.stressFactor,
        diagnosis: results.diagnosis
      });
      console.log('✅ completeLevel retourné:', completion);
      coinsEarned = completion.coins;
      console.log('💰 Pièces gagnées:', coinsEarned);

      // 🆕 Afficher notification carte de savoir si gagnée
      if (completion.knowledgeCardEarned) {
        this.showKnowledgeCardReward(completion.knowledgeCardEarned, completion.consecutiveSuccess);
      }

      // 🆕 Synchroniser le profil complet vers le backend après chaque partie
      await this.syncProfileToBackend();
    }

    console.log('💵 Affichage pièces dans UI:', coinsEarned);
    document.getElementById('results-coins').textContent =
      isSuccess ? `+${coinsEarned}` : '0';

    // Comparaison Avant/Après
    try {
      const nasaData = this.engine.getCityData('Parakou');

      // Données AVANT (initiales)
      const initialNDVI = parseFloat(nasaData.ndvi.current) || 0.15;
      const initialMoisture = nasaData.soilMoisture.current_percent || 18;
      const initialHeight = 5;

      document.getElementById('before-ndvi').textContent = initialNDVI.toFixed(2);
      document.getElementById('before-moisture').textContent = `${initialMoisture}%`;
      document.getElementById('before-height').textContent = `${initialHeight}cm`;

      // Données APRÈS (finales - calculées à partir des résultats)
      // Estimer NDVI final basé sur le rendement
      const finalNDVI = Math.min(0.85, initialNDVI + (results.yieldPercentage / 100) * 0.5);

      // Estimer humidité finale basée sur irrigation
      const cursors = this.currentLevelObj.getCursors();
      const finalMoisture = Math.min(60, initialMoisture + (cursors.water / 100) * 30);

      // Estimer hauteur finale basée sur rendement
      const finalHeight = Math.min(200, initialHeight + (results.yieldPercentage / 100) * 180);

      document.getElementById('after-ndvi').textContent = finalNDVI.toFixed(2);
      document.getElementById('after-moisture').textContent = `${Math.round(finalMoisture)}%`;
      document.getElementById('after-height').textContent = `${Math.round(finalHeight)}cm`;

      // Calcul des changements (%)
      const ndviChange = ((finalNDVI - initialNDVI) / initialNDVI * 100).toFixed(0);
      document.getElementById('ndvi-change').textContent = `+${ndviChange}%`;
      document.getElementById('ndvi-change').className = 'change positive';

      const moistureChange = ((finalMoisture - initialMoisture) / initialMoisture * 100).toFixed(0);
      document.getElementById('moisture-change').textContent = `+${moistureChange}%`;
      document.getElementById('moisture-change').className = 'change positive';

      const heightChange = ((finalHeight - initialHeight) / initialHeight * 100).toFixed(0);
      document.getElementById('height-change').textContent = `+${heightChange}%`;
      document.getElementById('height-change').className = 'change positive';

      console.log('   - Données Avant/Après remplies');
    } catch (error) {
      console.error('❌ Erreur lors du remplissage Avant/Après:', error);
    }

    // Diagnostic
    document.getElementById('diagnosis-summary').innerHTML =
      `<span style="font-size: 2rem">${results.diagnosis.summary.emoji}</span> ${results.diagnosis.summary.text}`;

    const detailsHTML = `
      <h4>Problèmes détectés:</h4>
      <ul>
        ${results.diagnosis.issues.map(issue => `<li>${issue}</li>`).join('')}
      </ul>
      <h4>Recommandations:</h4>
      <ul>
        ${results.diagnosis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    `;
    document.getElementById('diagnosis-details').innerHTML = detailsHTML;

    // Afficher la timeline d'évolution
    this.drawEvolutionTimeline(results);

    // Afficher les cartes éducatives
    this.displayEducationCards(results);

    // Boutons
    const btnNext = document.getElementById('btn-next-level');
    const cropSystem = getCropSystem(this.currentCrop);
    const hasNextLevel = cropSystem.levels.find(l => l.id === this.currentLevel + 1);

    if (isSuccess && hasNextLevel) {
      btnNext.style.display = 'block';
      console.log('   - Bouton "Niveau suivant" affiché');
    } else {
      btnNext.style.display = 'none';
      console.log('   - Bouton "Niveau suivant" masqué');
    }

    console.log('📊 Mise à jour UI joueur...');
    this.updatePlayerUI();

    console.log('🎬 Affichage écran résultats...');
    this.showScreen('results');

    console.log('✅ showResults() terminé');
  }

  /**
   * Dessiner la timeline d'évolution sur 90 jours
   */
  drawEvolutionTimeline(results) {
    const canvas = document.getElementById('timeline-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Effacer le canvas
    ctx.clearRect(0, 0, width, height);

    // Obtenir les données initiales
    const nasaData = this.engine.getCityData('Parakou');
    const initialNDVI = parseFloat(nasaData.ndvi.current) || 0.15;
    const initialMoisture = nasaData.soilMoisture.current_percent || 18;
    const cursors = this.currentLevelObj.getCursors();

    // Simuler l'évolution sur 90 jours
    const days = 90;
    const points = [];

    for (let day = 0; day <= days; day++) {
      const progress = day / days;

      // NDVI augmente progressivement
      const ndvi = initialNDVI + (results.yieldPercentage / 100) * 0.5 * progress;

      // Humidité varie selon irrigation
      const moisture = initialMoisture + (cursors.water / 100) * 30 * progress;

      // NPK décroît puis se stabilise
      const npk = 100 - (50 * progress) + (cursors.npk / 100) * 50;

      points.push({ day, ndvi, moisture, npk });
    }

    // Dimensions du graphique
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;

    // Axe X
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Axe Y
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    // Labels axes
    ctx.fillStyle = '#666';
    ctx.font = '12px sans-serif';
    ctx.fillText('Jours', width / 2 - 20, height - 10);
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Valeur (%)', 0, 0);
    ctx.restore();

    // Dessiner les courbes
    const drawCurve = (data, color, dataKey, maxValue = 100) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      points.forEach((point, i) => {
        const x = padding + (point.day / days) * graphWidth;
        const y = height - padding - (point[dataKey] / maxValue) * graphHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    };

    // NDVI (vert)
    drawCurve(points, '#82CC68', 'ndvi', 1);

    // Humidité (bleu)
    drawCurve(points, '#59A7EB', 'moisture', 100);

    // NPK (orange)
    drawCurve(points, '#F9A94B', 'npk', 150);

    // Marqueurs de temps
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    [0, 30, 60, 90].forEach(day => {
      const x = padding + (day / days) * graphWidth;
      ctx.fillText(day + 'j', x - 10, height - padding + 20);
    });

    console.log('   - Timeline d\'évolution dessinée');
  }

  /**
   * Afficher les cartes éducatives après simulation
   */
  displayEducationCards(results) {
    const container = document.getElementById('education-cards-container');

    // Obtenir 2 cartes pertinentes selon les résultats
    this.resultsCards = this.educationCards.getCards(results, 2);
    this.currentResultCardIndex = 0;
    this.cardQuizAnswered = [];

    // Générer HTML pour chaque carte (cliquable)
    container.innerHTML = this.resultsCards.map((card, index) => {
      // Déterminer la catégorie pour le style
      let category = 'general';
      if (card.id.startsWith('water')) category = 'water';
      else if (card.id.startsWith('npk')) category = 'nutrients';
      else if (card.id.startsWith('ph')) category = 'ph';
      else if (card.id.startsWith('ndvi')) category = 'ndvi';
      else if (card.id.startsWith('climate')) category = 'climate';

      return `
        <div class="education-card ${category}" data-card-index="${index}" style="cursor: pointer;">
          <div class="education-card-header">
            ${card.title}
          </div>
          <div class="education-card-content">
            ${card.content}
          </div>
          <div class="education-card-footer">
            <span class="education-card-cta">📖 Cliquez pour en savoir plus</span>
          </div>
        </div>
      `;
    }).join('');

    // Attacher événements de clic
    container.querySelectorAll('.education-card').forEach(cardEl => {
      cardEl.addEventListener('click', () => {
        const index = parseInt(cardEl.getAttribute('data-card-index'));
        this.openResultsCardModal(index);
      });
    });
  }

  /**
   * Ouvrir modal carte éducative depuis les résultats
   */
  openResultsCardModal(index) {
    console.log('🎴 Opening results card modal, index:', index);
    const card = this.resultsCards[index];
    if (!card) {
      console.error('❌ Carte non trouvée à l\'index:', index);
      return;
    }

    // Remplir le modal avec les données de la carte
    document.getElementById('modal-card-competence').textContent = this.getCompetenceLabel(card.competence);
    document.getElementById('modal-card-competence').className = `card-competence-badge ${card.competence}`;
    document.getElementById('modal-card-level').textContent = this.getLevelLabel(card.level);
    document.getElementById('modal-card-title').textContent = card.title;

    // Image
    const imgEl = document.getElementById('modal-card-image');
    if (card.image) {
      imgEl.src = card.image;
      imgEl.style.display = 'block';
    } else {
      imgEl.style.display = 'none';
    }

    document.getElementById('modal-card-content').innerHTML = card.content;
    document.getElementById('modal-card-source').textContent = card.nasaSource || 'NASA';

    // Quiz - masquer si pas de quiz pour les cartes de résultats
    const quizContainer = document.getElementById('modal-card-quiz');
    if (card.quiz) {
      this.renderQuiz(card.quiz);
      if (quizContainer) quizContainer.style.display = 'block';
    } else {
      if (quizContainer) quizContainer.style.display = 'none';
    }

    // Navigation: pas de prev/next pour cartes de résultats (seulement 2 cartes)
    const btnPrev = document.getElementById('btn-prev-card');
    const btnNext = document.getElementById('btn-next-card');
    if (btnPrev) btnPrev.style.display = 'none';
    if (btnNext) btnNext.style.display = 'none';

    // Attacher événements modal
    this.attachKnowledgeCardEventListeners();

    // Afficher modal
    this.modalKnowledgeCard.style.display = 'flex';
    console.log('✅ Results card modal displayed');
  }

  /**
   * Helper: obtenir label de compétence
   */
  getCompetenceLabel(competence) {
    const labels = {
      water: '💧 Eau',
      npk: '🌿 NPK',
      soil: '🏞️ Sol',
      rotation: '🔄 Rotation',
      nasa: '🛰️ NASA'
    };
    return labels[competence] || competence;
  }

  /**
   * Helper: obtenir label de niveau
   */
  getLevelLabel(level) {
    const labels = {
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      expert: 'Expert'
    };
    return labels[level] || level;
  }

  /**
   * Afficher modal déblocage
   */
  showUnlockModal(crop) {
    document.getElementById('unlock-crop-emoji').textContent = crop.emoji;
    document.getElementById('unlock-crop-name').textContent = crop.name.fr;
    document.getElementById('unlock-cost').textContent = crop.unlockCost;
    document.getElementById('unlock-balance').textContent = this.engine.player.coins;

    this.unlockCropData = crop;

    // Activer/désactiver bouton selon solde
    const btnConfirm = document.getElementById('btn-confirm-unlock');
    if (this.engine.player.coins >= crop.unlockCost) {
      btnConfirm.disabled = false;
    } else {
      btnConfirm.disabled = true;
    }

    this.modal.classList.add('active');
  }

  /**
   * Fermer modal
   */
  closeModal() {
    this.modal.classList.remove('active');
  }

  /**
   * Confirmer déblocage
   */
  confirmUnlock() {
    if (!this.unlockCropData) return;

    if (this.engine.spendCoins(this.unlockCropData.unlockCost)) {
      this.showMessage(
        'Culture débloquée',
        `${this.unlockCropData.name.fr} a été débloqué !`,
        'success'
      );
      this.closeModal();
      this.showCropSelection();
    } else {
      this.showMessage(
        'Pas assez de pièces',
        'Vous n\'avez pas assez de pièces pour débloquer cette culture.',
        'error'
      );
    }
  }

  /**
   * Afficher page profil
   */
  showProfile() {
    this.updatePlayerUI();
    this.loadProfileData();
    this.showScreen('profile');
  }

  /**
   * Charger les données du profil
   */
  loadProfileData() {
    const player = this.engine.player;
    const progress = this.engine.progressManager.loadPlayerProgress();

    // Username
    document.getElementById('profile-username').textContent = this.currentUser?.username || 'Agriculteur IleRise';

    // Stats globales
    document.getElementById('profile-games-played').textContent = progress.totalGames || 0;
    document.getElementById('profile-total-stars').textContent = progress.totalStars || 0;
    document.getElementById('profile-lives').textContent = player.lives || 5;
    document.getElementById('profile-coins').textContent = player.coins || 0;

    // Niveau et titre basés sur le score total
    const totalScore = progress.totalStars * 100;
    let level = 1;
    let title = 'Débutant';

    if (totalScore >= 1000) {
      level = 5;
      title = 'Expert NASA';
    } else if (totalScore >= 500) {
      level = 4;
      title = 'Agronome Confirmé';
    } else if (totalScore >= 200) {
      level = 3;
      title = 'Agriculteur Averti';
    } else if (totalScore >= 50) {
      level = 2;
      title = 'Apprenti';
    }

    document.getElementById('profile-level').textContent = level;
    document.getElementById('profile-title').textContent = title;
  }

  /**
   * Exporter les données du profil en JSON
   */
  exportProfile() {
    const player = this.engine.player;
    const progress = this.engine.progressManager.loadPlayerProgress();

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      user: {
        username: this.currentUser?.username || 'Guest',
        isGuest: localStorage.getItem('ilerise_guest') === 'true'
      },
      player: {
        name: player.name,
        coins: player.coins,
        lives: player.lives,
        unlockedCrops: player.unlockedCrops,
        completedLevels: player.completedLevels,
        knowledgeCards: player.knowledgeCards,
        highScores: player.highScores
      },
      progress: {
        totalGames: progress.totalGames,
        totalStars: progress.totalStars,
        levelHistory: progress.levelHistory,
        lastPlayed: progress.lastPlayed
      },
      stats: {
        gamesWon: Object.values(progress.levelHistory).flat().filter(g => g.stars >= 2).length,
        perfectGames: Object.values(progress.levelHistory).flat().filter(g => g.stars === 3).length,
        totalCoinsEarned: Object.values(progress.levelHistory).flat().reduce((sum, g) => sum + (g.coinsEarned || 0), 0)
      }
    };

    // Créer le fichier JSON
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = url;
    link.download = `ilerise-profile-${this.currentUser?.username || 'guest'}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showMessage(
      '✅ Exportation réussie',
      'Vos données de profil ont été téléchargées avec succès !',
      'success'
    );
  }

  /**
   * Afficher paramètres
   */
  showParametres() {
    const currentLang = this.i18n.currentLang === 'en' ? 'English' : 'Français';
    const volumeText = this.i18n.currentLang === 'en' ? 'Sound Volume: Enabled' : 'Volume son: Activé';
    const graphicsText = this.i18n.currentLang === 'en' ? 'Graphics Quality: Medium' : 'Qualité graphique: Moyenne';
    const languageText = this.i18n.currentLang === 'en' ? `Language: ${currentLang}` : `Langue: ${currentLang}`;
    const devText = this.i18n.currentLang === 'en' ? '(Settings page in development)' : '(Page de paramètres en développement)';

    const message = `
      <div style="text-align: left; line-height: 2;">
        • ${volumeText}<br>
        • ${graphicsText}<br>
        • ${languageText}<br><br>
        <em style="color: #888;">${devText}</em>
      </div>
    `;

    document.getElementById('modal-message-title').textContent = '⚙️ ' + (this.i18n.currentLang === 'en' ? 'Settings' : 'Paramètres');
    document.getElementById('modal-message-body').innerHTML = message;

    const iconEl = document.getElementById('modal-message-icon');
    iconEl.textContent = 'ℹ️';
    iconEl.className = 'modal-message-icon info';

    this.modalMessage.style.display = 'flex';
  }

  /**
   * Afficher crédits
   */
  showCredits() {
    const isEnglish = this.i18n.currentLang === 'en';

    const message = `
      <div style="text-align: center; line-height: 1.8;">
        <h3 style="margin: 10px 0; color: #667eea;">📡 NASA Space Apps Challenge 2025</h3>

        <h4 style="margin: 20px 0 10px 0; color: #555;">👥 ${isEnglish ? 'IleRise Team' : 'Équipe IleRise'}:</h4>
        <div style="text-align: left; max-width: 400px; margin: 0 auto;">
          • ${isEnglish ? 'Development' : 'Développement'}: Équipe Farm Navigators<br>
          • ${isEnglish ? 'NASA Data' : 'Données NASA'}: MODIS, SMAP, POWER<br>
          • Technologies: Three.js, Express, MongoDB
        </div>

        <div style="margin-top: 30px; font-size: 14px; color: #666;">
          <div style="margin: 10px 0;">🌍 Powered by NASA Earth Data</div>
          <div style="margin: 10px 0;">🎮 Made with ❤️ for AgriVerse</div>
        </div>
      </div>
    `;

    document.getElementById('modal-message-title').textContent = '🏆 ' + (isEnglish ? 'CREDITS - IleRise' : 'CRÉDITS - IleRise');
    document.getElementById('modal-message-body').innerHTML = message;

    const iconEl = document.getElementById('modal-message-icon');
    iconEl.textContent = 'ℹ️';
    iconEl.className = 'modal-message-icon info';

    this.modalMessage.style.display = 'flex';
  }

  /**
   * Charger les cartes éducatives
   */
  async loadKnowledgeCards() {
    try {
      const response = await fetch('/src/data/knowledgeCards.json');
      if (!response.ok) {
        throw new Error('Erreur chargement cartes éducatives');
      }
      this.knowledgeCards = await response.json();
      this.filteredCards = [...this.knowledgeCards];
      console.log(`✅ ${this.knowledgeCards.length} cartes éducatives chargées`);
    } catch (error) {
      console.error('❌ Erreur chargement cartes:', error);
      this.knowledgeCards = [];
      this.filteredCards = [];
    }
  }

  /**
   * 🆕 Afficher la récompense de carte de savoir
   */
  showKnowledgeCardReward(card, consecutiveSuccess) {
    const modal = document.createElement('div');
    modal.className = 'modal-reward active';
    modal.innerHTML = `
      <div class="modal-content reward-card-modal">
        <div class="reward-icon">🎉</div>
        <h2>Carte de Savoir Débloquée!</h2>
        <div class="reward-achievement">
          <div class="achievement-badge">
            <span class="streak-number">${consecutiveSuccess}</span>
            <span class="streak-label">Succès Consécutifs</span>
          </div>
        </div>
        <div class="knowledge-card-preview">
          <div class="card-title">${card.title}</div>
          <div class="card-description">${card.description}</div>
        </div>
        <p class="reward-hint">Consultez vos cartes dans l'écran "Savoir"</p>
        <button class="btn-primary" id="btn-close-reward">Super!</button>
      </div>
    `;

    document.body.appendChild(modal);

    // Fermer la modal
    const btnClose = modal.querySelector('#btn-close-reward');
    btnClose.addEventListener('click', () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    });

    // Auto-fermer après 5 secondes
    setTimeout(() => {
      if (modal.classList.contains('active')) {
        btnClose.click();
      }
    }, 5000);
  }

  /**
   * Afficher l'écran des cartes éducatives
   */
  showKnowledgeCards() {
    this.currentFilter = 'all';
    this.currentLevelFilter = 'all';
    this.filteredCards = [...this.knowledgeCards];
    this.renderKnowledgeCards();
    this.attachKnowledgeEventListeners();
    this.showScreen('knowledge');
  }

  /**
   * Filtrer les cartes par compétence et niveau
   */
  filterKnowledgeCards(competence = null, level = null) {
    if (competence !== null) {
      this.currentFilter = competence;
    }
    if (level !== null) {
      this.currentLevelFilter = level;
    }

    this.filteredCards = this.knowledgeCards.filter(card => {
      const competenceMatch = this.currentFilter === 'all' || card.competence === this.currentFilter;
      const levelMatch = this.currentLevelFilter === 'all' || card.level === this.currentLevelFilter;
      return competenceMatch && levelMatch;
    });

    this.renderKnowledgeCards();
  }

  /**
   * Afficher la grille de cartes
   */
  renderKnowledgeCards() {
    const grid = document.getElementById('knowledge-cards-grid');
    if (!grid) return;

    if (this.filteredCards.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">Aucune carte trouvée pour ces filtres.</p>';
      return;
    }

    const competenceEmojis = {
      water: '💧',
      npk: '🌿',
      soil: '🏞️',
      rotation: '🔄',
      nasa: '🛰️'
    };

    const levelLabels = {
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      expert: 'Expert'
    };

    grid.innerHTML = this.filteredCards.map((card, index) => {
      // Cartes débutant toujours débloquées, autres selon performance
      const isUnlocked = card.level === 'beginner' || this.engine.isCompetenceUnlocked(card.competence);
      const unlockText = this.getUnlockConditionText(card.competence, card.level);

      return `
      <div class="knowledge-card-item ${!isUnlocked ? 'locked' : ''}" data-card-index="${index}">
        ${!isUnlocked ? '<div class="card-lock-overlay"><span class="lock-icon">🔒</span></div>' : ''}
        <div class="knowledge-card-item-header">
          <span class="card-item-competence ${card.competence}">
            ${competenceEmojis[card.competence] || '🌍'} ${card.competence.toUpperCase()}
          </span>
          <span class="card-item-level">${levelLabels[card.level] || card.level}</span>
        </div>
        <div class="knowledge-card-item-body">
          <h3 class="knowledge-card-item-title">${card.title}</h3>
          <p class="knowledge-card-item-preview">
            ${isUnlocked ? card.content.substring(0, 120) + '...' : unlockText}
          </p>
        </div>
        <div class="knowledge-card-item-footer">
          <span class="card-nasa-source">
            <span>🛰️</span>
            <span>${card.nasaSource}</span>
          </span>
          <span>${isUnlocked ? '📖 Lire →' : '🔒 Verrouillée'}</span>
        </div>
      </div>
    `;
    }).join('');

    // Attacher événements de clic sur les cartes
    grid.querySelectorAll('.knowledge-card-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.cardIndex);
        const card = this.filteredCards[index];
        const isUnlocked = card.level === 'beginner' || this.engine.isCompetenceUnlocked(card.competence);

        if (isUnlocked) {
          this.showKnowledgeCardModal(index);
        } else {
          // Afficher message de déblocage
          const unlockText = this.getUnlockConditionText(card.competence, card.level);
          this.showMessage(
            'info',
            this.i18n.currentLang === 'en' ? 'Card Locked' : 'Carte Verrouillée',
            unlockText
          );
        }
      });
    });
  }

  /**
   * Obtenir le texte de condition de déblocage
   */
  getUnlockConditionText(competence, level) {
    const isEn = this.i18n.currentLang === 'en';

    // Cartes débutant toujours débloquées
    if (level === 'beginner') {
      return isEn ? '✅ Free access for beginners' : '✅ Accès libre pour débutants';
    }

    // Messages selon la compétence pour cartes intermédiaire/expert
    const levelText = level === 'intermediate'
      ? (isEn ? 'Intermediate card' : 'Carte intermédiaire')
      : (isEn ? 'Expert card' : 'Carte expert');

    switch (competence) {
      case 'water':
        return isEn
          ? `🔒 ${levelText}: Achieve good irrigation scores (70%+) in 50% of your games`
          : `🔒 ${levelText}: Obtenez de bons scores en irrigation (70%+) dans 50% de vos parties`;

      case 'npk':
        return isEn
          ? `🔒 ${levelText}: Achieve good fertilization scores (70%+) in 50% of your games`
          : `🔒 ${levelText}: Obtenez de bons scores en fertilisation (70%+) dans 50% de vos parties`;

      case 'soil':
        return isEn
          ? `🔒 ${levelText}: Achieve good pH management scores (70%+) in 50% of your games`
          : `🔒 ${levelText}: Obtenez de bons scores en gestion du pH (70%+) dans 50% de vos parties`;

      case 'rotation':
        return isEn
          ? `🔒 ${levelText}: Complete 5 different levels`
          : `🔒 ${levelText}: Complétez 5 niveaux différents`;

      case 'nasa':
        return isEn
          ? `🔒 ${levelText}: Use NASA help 3 times`
          : `🔒 ${levelText}: Utilisez l'aide NASA 3 fois`;

      default:
        return isEn ? '🔒 Complete specific challenges to unlock' : '🔒 Complétez des défis spécifiques pour débloquer';
    }
  }

  /**
   * Attacher les événements aux filtres
   */
  attachKnowledgeEventListeners() {
    // Bouton retour
    const btnBack = document.getElementById('btn-back-knowledge');
    if (btnBack) {
      btnBack.replaceWith(btnBack.cloneNode(true));
      document.getElementById('btn-back-knowledge').addEventListener('click', () => {
        this.showCropSelection();
      });
    }

    // Filtres de compétence
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const competence = e.target.dataset.competence;
        this.filterKnowledgeCards(competence, null);
      });
    });

    // Filtres de niveau
    document.querySelectorAll('.level-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.level-filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const level = e.target.dataset.level;
        this.filterKnowledgeCards(null, level);
      });
    });
  }

  /**
   * Afficher le modal d'une carte
   */
  showKnowledgeCardModal(index) {
    console.log('🎴 Opening knowledge card modal, index:', index);
    this.currentCardIndex = index;
    const card = this.filteredCards[index];
    console.log('📋 Card data:', card);
    this.currentCardQuizAnswered = false; // Reset quiz state

    const competenceLabels = {
      water: '💧 Eau',
      npk: '🌿 NPK',
      soil: '🏞️ Sol',
      rotation: '🔄 Rotation',
      nasa: '🛰️ NASA'
    };

    const levelLabels = {
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      expert: 'Expert'
    };

    // Remplir le modal
    document.getElementById('modal-card-competence').textContent = competenceLabels[card.competence] || card.competence;
    document.getElementById('modal-card-competence').className = `card-competence-badge ${card.competence}`;

    document.getElementById('modal-card-level').textContent = levelLabels[card.level] || card.level;
    document.getElementById('modal-card-title').textContent = card.title;

    // Image
    const imgEl = document.getElementById('modal-card-image');
    if (card.image) {
      imgEl.src = card.image;
      imgEl.style.display = 'block';
    } else {
      imgEl.style.display = 'none';
    }

    document.getElementById('modal-card-content').innerHTML = card.content;
    document.getElementById('modal-card-source').textContent = card.nasaSource;

    // Quiz
    this.renderQuiz(card.quiz);

    // Navigation buttons
    console.log('🔘 Setting navigation button states...');
    const btnPrev = document.getElementById('btn-prev-card');
    const btnNext = document.getElementById('btn-next-card');

    // Réafficher les boutons (au cas où ils auraient été masqués par openResultsCardModal)
    if (btnPrev) {
      btnPrev.style.display = '';
      btnPrev.disabled = index === 0;
    }
    if (btnNext) {
      btnNext.style.display = '';
    }

    // Next button sera activé seulement après réponse au quiz
    console.log('🔘 Calling updateNextButtonState...');
    this.updateNextButtonState();
    console.log('🔘 updateNextButtonState done');

    // Attacher événements modal
    console.log('🔘 About to call attachKnowledgeCardEventListeners...');
    this.attachKnowledgeCardEventListeners();
    console.log('🔘 attachKnowledgeCardEventListeners done');

    // Afficher modal
    console.log('🔘 Showing modal...');
    this.modalKnowledgeCard.style.display = 'flex';
    console.log('✅ Modal displayed');
  }

  /**
   * Afficher le quiz
   */
  renderQuiz(quiz) {
    if (!quiz) return;

    const quizContainer = document.getElementById('modal-card-quiz');
    const questionEl = document.getElementById('quiz-question');
    const answersEl = document.getElementById('quiz-answers');
    const feedbackEl = document.getElementById('quiz-feedback');

    questionEl.textContent = quiz.question;
    feedbackEl.style.display = 'none';

    answersEl.innerHTML = quiz.answers.map((answer, i) => `
      <button class="quiz-answer-btn" data-answer-index="${i}">
        ${answer}
      </button>
    `).join('');

    // Événements réponses
    answersEl.querySelectorAll('.quiz-answer-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const answerIndex = parseInt(e.target.dataset.answerIndex);
        this.handleQuizAnswer(answerIndex, quiz);
      });
    });
  }

  /**
   * Gérer la réponse au quiz
   */
  handleQuizAnswer(answerIndex, quiz) {
    const answersEl = document.getElementById('quiz-answers');
    const feedbackEl = document.getElementById('quiz-feedback');
    const isCorrect = answerIndex === quiz.correct;

    // Désactiver tous les boutons
    answersEl.querySelectorAll('.quiz-answer-btn').forEach((btn, i) => {
      btn.disabled = true;
      if (i === quiz.correct) {
        btn.classList.add('correct');
      } else if (i === answerIndex && !isCorrect) {
        btn.classList.add('incorrect');
      }
    });

    // Afficher feedback
    feedbackEl.style.display = 'block';
    feedbackEl.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackEl.innerHTML = `
      <div class="quiz-feedback-title">
        ${isCorrect ? '✅ Correct !' : '❌ Incorrect'}
      </div>
      <div>${quiz.explanation || ''}</div>
    `;

    // Marquer le quiz comme répondu
    this.currentCardQuizAnswered = true;
    this.updateNextButtonState();

    // Gagner des pièces si correct
    if (isCorrect) {
      this.engine.addCoins(10);
      this.updatePlayerUI();
    }
  }

  /**
   * Mettre à jour l'état du bouton Suivant
   */
  updateNextButtonState() {
    const btnNext = document.getElementById('btn-next-card');
    const isLastCard = this.currentCardIndex === this.filteredCards.length - 1;

    if (isLastCard) {
      btnNext.disabled = true;
    } else {
      // Le bouton suivant est actif seulement si le quiz est résolu
      btnNext.disabled = !this.currentCardQuizAnswered;

      if (!this.currentCardQuizAnswered) {
        btnNext.title = this.i18n.currentLang === 'en'
          ? 'Answer the quiz to unlock next card'
          : 'Répondez au quiz pour débloquer la carte suivante';
      } else {
        btnNext.title = '';
      }
    }
  }

  /**
   * Attacher événements du modal des cartes de savoir
   */
  attachKnowledgeCardEventListeners() {
    console.log('📎 Attaching knowledge card event listeners...');

    // Fermer modal
    const btnClose = document.getElementById('btn-close-knowledge-card');
    if (btnClose) {
      console.log('✅ Close button found');
      btnClose.replaceWith(btnClose.cloneNode(true));
      const newBtnClose = document.getElementById('btn-close-knowledge-card');
      newBtnClose.addEventListener('click', () => {
        console.log('❌ Close button clicked');
        this.modalKnowledgeCard.style.display = 'none';
      });
    } else {
      console.error('❌ Close button NOT found');
    }

    // Carte précédente
    const btnPrev = document.getElementById('btn-prev-card');
    if (btnPrev) {
      console.log('✅ Prev button found');
      btnPrev.replaceWith(btnPrev.cloneNode(true));
      const newBtnPrev = document.getElementById('btn-prev-card');
      newBtnPrev.addEventListener('click', () => {
        console.log('⬅️ Prev button clicked');
        if (this.currentCardIndex > 0) {
          this.showKnowledgeCardModal(this.currentCardIndex - 1);
        }
      });
    } else {
      console.error('❌ Prev button NOT found');
    }

    // Carte suivante
    const btnNext = document.getElementById('btn-next-card');
    if (btnNext) {
      console.log('✅ Next button found');
      btnNext.replaceWith(btnNext.cloneNode(true));
      const newBtnNext = document.getElementById('btn-next-card');
      newBtnNext.addEventListener('click', () => {
        console.log('➡️ Next button clicked');
        if (!this.currentCardQuizAnswered) {
          // Afficher message si quiz non résolu
          this.showMessage(
            'warning',
            this.i18n.currentLang === 'en' ? 'Quiz Required' : 'Quiz Requis',
            this.i18n.currentLang === 'en'
              ? 'Please answer the quiz before moving to the next card'
              : 'Veuillez répondre au quiz avant de passer à la carte suivante'
          );
          return;
        }

        if (this.currentCardIndex < this.filteredCards.length - 1) {
          this.showKnowledgeCardModal(this.currentCardIndex + 1);
        }
      });
    } else {
      console.error('❌ Next button NOT found');
    }

    console.log('✅ Modal event listeners attached');
  }

  /**
   * Attacher événements d'authentification
   */
  attachAuthEventListeners() {
    // Tabs switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchAuthTab(tabName);
      });
    });

    // Login form
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Register form
    const formRegister = document.getElementById('form-register');
    if (formRegister) {
      formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegister();
      });
    }

    // Guest button
    const btnGuest = document.getElementById('btn-guest');
    if (btnGuest) {
      btnGuest.addEventListener('click', () => {
        this.loginAsGuest();
      });
    }
  }

  /**
   * Changer d'onglet (Login/Register)
   */
  switchAuthTab(tabName) {
    // Update tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => {
      form.classList.toggle('active', form.id === `auth-${tabName}`);
    });
  }

  /**
   * Gérer la connexion
   */
  async handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const remember = document.getElementById('login-remember').checked;

    // Clear previous messages
    this.clearAuthMessages();

    try {
      // Call backend API
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success
        await this.setAuthUser(data.data.user, data.data.accessToken, remember);
        this.showAuthMessage('success', '✅ Connexion réussie !');

        setTimeout(() => {
          this.showScreen('home');
        }, 1000);
      } else {
        // Error - show validation details if available
        let errorMsg = data.message || 'Erreur de connexion';

        if (data.errors && data.errors.length > 0) {
          errorMsg += ':\n' + data.errors.map(e => `• ${e.message}`).join('\n');
        }

        this.showAuthMessage('error', errorMsg);
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showAuthMessage('error', 'Impossible de se connecter au serveur. Continuez en mode invité.');
    }
  }

  /**
   * Gérer l'inscription
   */
  async handleRegister() {
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;

    // Clear previous messages
    this.clearAuthMessages();

    // Validate
    if (password !== confirmPassword) {
      this.showAuthMessage('error', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      this.showAuthMessage('error', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      // Call backend API
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success
        await this.setAuthUser(data.data.user, data.data.accessToken, false);
        this.showAuthMessage('success', '✅ Compte créé avec succès !');

        setTimeout(() => {
          this.showScreen('home');
        }, 1000);
      } else {
        // Error - show validation details if available
        let errorMsg = data.message || 'Erreur lors de l\'inscription';

        if (data.errors && data.errors.length > 0) {
          errorMsg += ':\n' + data.errors.map(e => `• ${e.message}`).join('\n');
        }

        this.showAuthMessage('error', errorMsg);
      }
    } catch (error) {
      console.error('Register error:', error);
      this.showAuthMessage('error', 'Impossible de se connecter au serveur. Continuez en mode invité.');
    }
  }

  /**
   * Connexion en invité
   */
  loginAsGuest() {
    this.setAuthUser({
      username: 'Invité',
      email: 'guest@ilerise.local',
      isGuest: true
    }, null, false);

    this.showAuthMessage('success', '🎮 Connexion en mode invité');

    setTimeout(() => {
      this.showScreen('home');
    }, 800);
  }

  /**
   * Définir l'utilisateur authentifié
   */
  async setAuthUser(user, token, remember) {
    console.log('👤 Authentification utilisateur:', user.username || user.email);

    this.isAuthenticated = true;
    this.currentUser = user;

    if (token) {
      if (remember) {
        localStorage.setItem('ilerise_token', token);
      } else {
        sessionStorage.setItem('ilerise_token', token);
      }
      localStorage.setItem('ilerise_user', JSON.stringify(user));

      // Définir le token dans le service API
      apiService.setToken(token);
    } else {
      // Guest mode
      localStorage.setItem('ilerise_guest', 'true');
      localStorage.setItem('ilerise_user', JSON.stringify(user));
    }

    // 🆕 Recharger les données du joueur avec la nouvelle clé
    this.engine.player = this.engine.loadPlayerData();
    console.log('📦 Données joueur rechargées pour:', user.email || 'guest');

    // 💚 Initialiser le système de vies avec synchronisation backend
    if (token) {
      await this.engine.livesSystem.initialize();

      // 🔄 Charger la progression depuis le backend
      try {
        await this.engine.progressManager.loadFromBackend();
        console.log('✅ Progression chargée depuis le serveur');
      } catch (error) {
        console.warn('⚠️ Impossible de charger la progression depuis le serveur:', error.message);
      }

      // 💰 Synchroniser les pièces du joueur depuis le backend
      try {
        await this.engine.syncPlayerFromBackend();
      } catch (error) {
        console.warn('⚠️ Impossible de synchroniser les pièces:', error.message);
      }
    }

    // Mettre à jour l'UI
    this.updatePlayerUI();
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  async checkAuth() {
    const token = localStorage.getItem('ilerise_token') || sessionStorage.getItem('ilerise_token');
    const isGuest = localStorage.getItem('ilerise_guest');
    const user = localStorage.getItem('ilerise_user');

    if (token || isGuest) {
      this.isAuthenticated = true;
      if (user) {
        this.currentUser = JSON.parse(user);
      }

      // 🆕 Définir le token dans apiService si disponible
      if (token) {
        apiService.setToken(token);
        console.log('🔑 Token restauré dans apiService');

        // 🔐 Vérifier que le token est toujours valide
        try {
          await apiService.getProfile();
          console.log('✅ Token valide - utilisateur authentifié');

          // 💚 Initialiser le système de vies avec synchronisation backend
          await this.engine.livesSystem.initialize();

          // 🔄 Charger la progression depuis le backend
          try {
            await this.engine.progressManager.loadFromBackend();
            console.log('✅ Progression restaurée depuis le serveur');
          } catch (error) {
            console.warn('⚠️ Impossible de charger la progression:', error.message);
          }

          // 💰 Synchroniser les pièces du joueur depuis le backend
          try {
            await this.engine.syncPlayerFromBackend();
          } catch (error) {
            console.warn('⚠️ Impossible de synchroniser les pièces:', error.message);
          }
        } catch (error) {
          console.error('❌ Token invalide ou expiré:', error.message);
          // Le token sera nettoyé par l'événement auth:expired
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Afficher un message d'authentification
   */
  showAuthMessage(type, message) {
    const existingMsg = document.querySelector('.auth-message');
    if (existingMsg) {
      existingMsg.remove();
    }

    const msgEl = document.createElement('div');
    msgEl.className = `auth-message ${type}`;
    msgEl.textContent = message;

    const activeForm = document.querySelector('.auth-form.active');
    if (activeForm) {
      activeForm.insertBefore(msgEl, activeForm.querySelector('h2').nextSibling);
    }
  }

  /**
   * Effacer les messages d'authentification
   */
  clearAuthMessages() {
    const existingMsg = document.querySelector('.auth-message');
    if (existingMsg) {
      existingMsg.remove();
    }
  }

  /**
   * Afficher l'écran d'authentification
   */
  showAuth() {
    this.showScreen('auth');
  }

  /**
   * Se déconnecter
   */
  logout() {
    console.log('🚪 Déconnexion en cours...');

    // Effacer les données du joueur actuel
    this.engine.clearPlayerData();

    // Réinitialiser l'état d'authentification
    this.isAuthenticated = false;
    this.currentUser = null;

    // Effacer les tokens et informations utilisateur
    localStorage.removeItem('ilerise_token');
    sessionStorage.removeItem('ilerise_token');
    localStorage.removeItem('ilerise_guest');
    localStorage.removeItem('ilerise_user');

    // Effacer le token du service API
    if (typeof apiService !== 'undefined') {
      apiService.logout();
    }

    console.log('✅ Déconnexion réussie');
    this.showAuth();
  }

  /**
   * Attacher les événements des modals génériques
   */
  attachModalEventListeners() {
    // Modal message
    const btnCloseMessage = document.getElementById('btn-close-message');
    const btnMessageOk = document.getElementById('btn-message-ok');

    if (btnCloseMessage) {
      btnCloseMessage.addEventListener('click', () => {
        this.hideModal('message');
      });
    }

    if (btnMessageOk) {
      btnMessageOk.addEventListener('click', () => {
        this.hideModal('message');
      });
    }

    // Modal confirm
    const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
    const btnConfirmOk = document.getElementById('btn-confirm-ok');

    if (btnConfirmCancel) {
      btnConfirmCancel.addEventListener('click', () => {
        this.hideModal('confirm');
        if (this.confirmCallback) {
          this.confirmCallback(false);
          this.confirmCallback = null;
        }
      });
    }

    if (btnConfirmOk) {
      btnConfirmOk.addEventListener('click', () => {
        this.hideModal('confirm');
        if (this.confirmCallback) {
          this.confirmCallback(true);
          this.confirmCallback = null;
        }
      });
    }
  }

  /**
   * Synchroniser le profil depuis le backend au démarrage
   */
  async syncProfileFromBackend() {
    if (!apiService.isAuthenticated()) {
      console.log('⏭️ Pas de synchronisation backend (non authentifié)');
      return;
    }

    try {
      console.log('🔄 Chargement du profil depuis le backend...');
      const response = await apiService.getProfile();

      if (response.success && response.data) {
        const { user, progress } = response.data;

        // Mettre à jour les données du joueur depuis le backend (source de vérité)
        if (user) {
          this.engine.player.coins = user.coins || 0;
          this.engine.player.lives = user.lives || 5;
          this.engine.player.selectedLocation = user.selectedLocation || 'Parakou';

          console.log('✅ Profil synchronisé depuis backend:', {
            coins: user.coins,
            lives: user.lives,
            location: user.selectedLocation
          });
        }

        // Mettre à jour les progress depuis le backend
        if (progress && progress.length > 0) {
          const globalProgress = progress.find(p => p.cropId === null);
          if (globalProgress) {
            if (globalProgress.competenceStats) {
              this.engine.player.competenceStats = globalProgress.competenceStats;
            }
            if (globalProgress.completedLevels) {
              this.engine.player.completedLevels = globalProgress.completedLevels;
            }
            if (globalProgress.highScores) {
              this.engine.player.highScores = globalProgress.highScores;
            }

            console.log('✅ Progression synchronisée:', {
              completedLevels: globalProgress.completedLevels?.length || 0,
              highScores: Object.keys(globalProgress.highScores || {}).length
            });
          }
        } else {
          // Nouveau compte backend - réinitialiser localStorage
          console.log('🆕 Nouveau compte backend détecté - réinitialisation des données');
          this.engine.player.completedLevels = [];
          this.engine.player.highScores = {};
          this.engine.player.competenceStats = {
            water: { totalGames: 0, goodScores: 0 },
            npk: { totalGames: 0, goodScores: 0 },
            ph: { totalGames: 0, goodScores: 0 },
            rotation: { levelsCompleted: 0 },
            nasa: { nasaHelpUsed: 0 }
          };
        }

        // Sauvegarder dans localStorage (écrase les anciennes données)
        this.engine.savePlayerData();

        // Mettre à jour l'UI
        this.updatePlayerUI();

      }
    } catch (error) {
      console.error('❌ Erreur sync profil:', error.message);
      // Ne pas bloquer l'application, utiliser données localStorage
      console.log('⚠️ Utilisation des données locales');
    }
  }

  /**
   * Synchroniser le profil complet vers le backend
   */
  async syncProfileToBackend() {
    if (!apiService.isAuthenticated()) {
      console.log('⏭️ Pas de synchronisation backend (non authentifié)');
      return;
    }

    try {
      const profileData = {
        coins: this.engine.player.coins,
        selectedLocation: this.engine.player.selectedLocation || 'Parakou',
        competenceStats: this.engine.player.competenceStats,
        completedLevels: this.engine.player.completedLevels,
        highScores: this.engine.player.highScores,
        unlockedKnowledgeCards: this.engine.player.knowledgeCards?.map(card => card.id) || []
      };

      console.log('🔄 Synchronisation profil vers backend...', profileData);
      const response = await apiService.syncProfile(profileData);
      console.log('✅ Profil synchronisé:', response);

    } catch (error) {
      console.error('❌ Erreur sync profil vers backend:', error.message);
    }
  }

  /**
   * Afficher un modal de message
   * @param {string} title - Titre du modal
   * @param {string} message - Contenu du message
   * @param {string} type - Type: 'info', 'success', 'error', 'warning'
   */
  showMessage(title, message, type = 'info') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };

    document.getElementById('modal-message-title').textContent = title;
    document.getElementById('modal-message-body').textContent = message;

    const iconEl = document.getElementById('modal-message-icon');
    iconEl.textContent = icons[type] || icons.info;
    iconEl.className = `modal-message-icon ${type}`;

    this.modalMessage.style.display = 'flex';
  }

  /**
   * Afficher un modal de confirmation
   * @param {string} title - Titre du modal
   * @param {string} message - Message de confirmation
   * @param {Function} callback - Fonction à appeler avec true/false
   */
  showConfirm(title, message, callback) {
    document.getElementById('modal-confirm-title').textContent = title;
    document.getElementById('modal-confirm-body').textContent = message;

    this.confirmCallback = callback;
    this.modalConfirm.style.display = 'flex';
  }

  /**
   * Cacher un modal
   * @param {string} type - 'message' ou 'confirm'
   */
  hideModal(type) {
    if (type === 'message') {
      this.modalMessage.style.display = 'none';
    } else if (type === 'confirm') {
      this.modalConfirm.style.display = 'none';
    }
  }

  /**
   * Afficher écran de sélection de localité
   */
  showLocationSelection() {
    this.showScreen('location');

    // Initialiser la carte si première fois
    if (!this.locationSelector.map) {
      setTimeout(() => {
        this.locationSelector.initMap('satellite-map');
      }, 100);
    }
  }

  /**
   * Confirmer sélection de localité (appelé depuis popup Leaflet)
   */
  confirmLocationSelection(cityName) {
    if (cityName) {
      // Appelé depuis le bouton popup
      const location = this.engine.nasaData.ndvi.locations.find(l => l.city === cityName);
      if (location) {
        this.locationSelector.selectLocation(location);
      }
    }

    // Vérifier qu'une localité est sélectionnée
    const locationData = this.locationSelector.getSelectedLocationData();

    if (!locationData) {
      this.showMessage('⚠️ Erreur', 'Veuillez sélectionner une localité sur la carte', 'warning');
      return;
    }

    // Sauvegarder la localité sélectionnée
    this.currentLocation = locationData;
    localStorage.setItem('ilerise_location', JSON.stringify(locationData));

    console.log('✅ Localité confirmée:', locationData.city);

    // Passer à la sélection de culture
    this.showCropSelection();
  }

  /**
   * Réinitialiser sélection de localité
   */
  resetLocation() {
    this.currentLocation = null;
    localStorage.removeItem('ilerise_location');
    if (this.locationSelector) {
      this.locationSelector.resetSelection();
    }
  }

  /**
   * Appelé quand la langue change
   */
  onLanguageChange() {
    // Rafraîchir l'écran actuel
    const currentScreen = Object.keys(this.screens).find(
      key => this.screens[key] && this.screens[key].classList.contains('active')
    );

    if (currentScreen === 'cropSelect') {
      this.showCropSelection();
    } else if (currentScreen === 'levelSelect' && this.currentCrop) {
      this.showLevelSelection(this.currentCrop);
    }
    // Les autres écrans utilisent data-i18n donc sont mis à jour automatiquement par I18nManager
  }

  /**
   * Afficher les instructions audio en Fon
   */
  showAudioFonInstructions() {
    const isEnglish = this.i18n.currentLang === 'en';

    const message = `
      <div style="text-align: center; line-height: 1.8;">
        <div style="font-size: 48px; margin-bottom: 20px;">🔊</div>
        <h3 style="margin: 10px 0; color: #F9A94B;">${isEnglish ? 'Audio Instructions in Fon' : 'Instructions Audio en Fon'}</h3>

        <div style="margin: 30px 0; padding: 20px; background: #FFF8E1; border-radius: 12px; border-left: 4px solid #F9A94B;">
          <p style="margin: 0; color: #666; font-size: 1.1rem;">
            <strong>${isEnglish ? 'Feature in Development' : 'Fonctionnalité en Développement'}</strong>
          </p>
          <p style="margin: 10px 0 0 0; color: #888; font-size: 0.95rem;">
            ${isEnglish
              ? 'Voice instructions in Fon language will be available soon to help you understand farming parameters.'
              : 'Les instructions vocales en langue Fon seront bientôt disponibles pour vous aider à comprendre les paramètres de culture.'}
          </p>
        </div>

        <div style="margin-top: 20px; font-size: 14px; color: #666;">
          <div style="margin: 8px 0;">🌾 ${isEnglish ? 'Irrigation Instructions' : 'Instructions d\'Irrigation'}</div>
          <div style="margin: 8px 0;">🌱 ${isEnglish ? 'Fertilizer Guidance' : 'Guide d\'Engrais'}</div>
          <div style="margin: 8px 0;">📊 ${isEnglish ? 'Results Explanation' : 'Explication des Résultats'}</div>
        </div>
      </div>
    `;

    document.getElementById('modal-message-title').textContent = '🔊 ' + (isEnglish ? 'Audio Fon' : 'Audio Fon');
    document.getElementById('modal-message-body').innerHTML = message;

    const iconEl = document.getElementById('modal-message-icon');
    iconEl.textContent = 'ℹ️';
    iconEl.className = 'modal-message-icon info';

    this.modalMessage.style.display = 'flex';
  }

  /**
   * Mettre à jour le nom de la localité affichée
   */
  updateLocationDisplay() {
    if (this.currentLocation) {
      const locationNameEl = document.getElementById('current-location-name');
      if (locationNameEl) {
        locationNameEl.textContent = this.currentLocation.city;
      }
    }
  }
}

// Initialiser application
const app = new IleRiseApp();
app.init();

// Export pour debug
window.app = app;
