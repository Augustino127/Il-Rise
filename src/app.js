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

class IleRiseApp {
  constructor() {
    this.engine = new GameEngine();
    this.currentCrop = null;
    this.currentLevel = null;
    this.currentLevelObj = null;
    this.cursorControls = null;
    this.farmScene = null;
    this.isInitialized = false;

    this.screens = {
      home: document.getElementById('screen-home'),
      cropSelect: document.getElementById('screen-crop-select'),
      levelSelect: document.getElementById('screen-level-select'),
      game: document.getElementById('screen-game'),
      results: document.getElementById('screen-results')
    };

    this.modal = document.getElementById('modal-unlock');
    this.loading = document.getElementById('loading');
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

      // Vérifier vies
      this.engine.checkLives();

      this.isInitialized = true;

      // Attacher événements
      this.attachEventListeners();

      // Mettre à jour UI
      this.updatePlayerUI();

      // Afficher écran d'accueil
      this.showScreen('home');

      console.log('✅ IleRise initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation:', error);
      alert('Erreur de chargement. Vérifiez que les données NASA sont disponibles.');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Attacher événements
   */
  attachEventListeners() {
    // Écran d'accueil
    document.getElementById('btn-start').addEventListener('click', () => {
      this.showCropSelection();
    });

    // Sélection culture
    document.getElementById('btn-back-crop').addEventListener('click', () => {
      this.showScreen('home');
    });

    // Sélection niveau
    document.getElementById('btn-back-level').addEventListener('click', () => {
      this.showCropSelection();
    });

    // Écran de jeu
    document.getElementById('btn-back-game').addEventListener('click', () => {
      if (confirm('Quitter le niveau ? Vous perdrez votre progression.')) {
        if (this.farmScene) {
          this.farmScene.dispose();
          this.farmScene = null;
        }
        this.showLevelSelection(this.currentCrop);
      }
    });

    document.getElementById('btn-recommendations').addEventListener('click', () => {
      this.applyNASARecommendations();
    });

    document.getElementById('btn-simulate').addEventListener('click', () => {
      this.runSimulation();
    });

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
    Object.values(this.screens).forEach(screen => {
      screen.classList.remove('active');
    });

    this.screens[screenName].classList.add('active');
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

    // Écran d'accueil
    document.getElementById('home-lives').textContent = status.lives;
    document.getElementById('home-coins').textContent = status.coins;

    // Sélection culture
    document.getElementById('crop-coins').textContent = status.coins;

    // Sélection niveau
    document.getElementById('level-coins').textContent = status.coins;

    // Écran de jeu
    document.getElementById('game-lives').textContent = status.lives;
    document.getElementById('game-coins').textContent = status.coins;
  }

  /**
   * Afficher sélection culture
   */
  showCropSelection() {
    this.updatePlayerUI();

    const crops = getAllCropSystems();
    const grid = document.getElementById('crop-grid');
    grid.innerHTML = '';

    crops.forEach(crop => {
      const isUnlocked = this.engine.player.coins >= crop.unlockCost ||
                         crop.unlockCost === 0;

      const card = document.createElement('div');
      card.className = `crop-card ${!isUnlocked ? 'locked' : ''}`;
      card.innerHTML = `
        <span class="crop-emoji">${crop.emoji}</span>
        <h3 class="crop-name">${crop.name.fr}</h3>
        ${crop.unlockCost > 0 ? `<p class="crop-unlock-cost">Coût: ${crop.unlockCost} 💰</p>` : '<p class="crop-unlock-cost">Gratuit</p>'}
        <div class="crop-stats">
          ${crop.levels.length} niveaux disponibles
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
    document.getElementById('level-crop-title').textContent =
      `${cropSystem.emoji} ${cropSystem.name.fr}`;

    document.getElementById('level-crop-description').textContent =
      `Progressez à travers ${cropSystem.levels.length} niveaux de difficulté croissante`;

    // Générer cartes de niveaux
    grid.innerHTML = '';

    cropSystem.levels.forEach(level => {
      const isCompleted = this.engine.player.completedLevels.includes(`${cropId}-${level.id}`);
      const highScore = this.engine.player.highScores[`${cropId}-${level.id}`] || null;

      const card = document.createElement('div');
      card.className = 'level-card';
      card.innerHTML = `
        <div class="level-badge-icon">
          ${level.id}
        </div>
        <div class="level-details">
          <div class="level-header">
            <span class="level-number">Niveau ${level.id}</span>
            <span class="level-name">${level.name}</span>
            <span class="difficulty-badge ${level.difficulty}">${level.difficulty}</span>
          </div>
          <p class="level-description">${level.description}</p>
          <div class="level-stats">
            <span class="level-stat">🎯 ${level.targetYield} t/ha</span>
            ${level.constraints.budget ? `<span class="level-stat">💰 Budget: ${level.constraints.budget}</span>` : ''}
            ${isCompleted ? `<span class="level-stat">✅ Complété</span>` : ''}
          </div>
        </div>
        <div class="level-stars">
          ${highScore ? '⭐'.repeat(highScore.stars) : ''}
        </div>
      `;

      card.addEventListener('click', () => {
        this.startLevel(cropId, level.id);
      });

      grid.appendChild(card);
    });

    this.showScreen('levelSelect');
  }

  /**
   * Démarrer niveau
   */
  startLevel(cropId, levelId) {
    console.log('🎯 startLevel appelé:', cropId, levelId);

    // Vérifier vies
    if (this.engine.player.lives <= 0) {
      alert('Plus de vies disponibles ! Revenez demain ou attendez la recharge.');
      return;
    }

    this.currentCrop = cropId;
    this.currentLevel = levelId;

    console.log('📦 Chargement données culture...');
    const cropSystem = getCropSystem(cropId);
    const levelData = getCropLevel(cropId, levelId);
    const cropData = getCrop(cropId);

    console.log('Crop system:', cropSystem);
    console.log('Level data:', levelData);
    console.log('Crop data:', cropData);

    // Récupérer données NASA (ville par défaut: Parakou)
    console.log('🌍 Chargement données NASA...');
    const nasaData = this.engine.getCityData('Parakou');
    console.log('NASA data:', nasaData);

    // Créer objet niveau
    console.log('📊 Création objet niveau...');
    try {
      this.currentLevelObj = new Level(
        `${cropId}-${levelId}`,
        cropData,
        'Parakou',
        nasaData
      );
      console.log('✅ Niveau créé');
    } catch (error) {
      console.error('❌ Erreur création niveau:', error);
      alert('Erreur lors de la création du niveau: ' + error.message);
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
      alert('Erreur lors de la création de la scène 3D: ' + error.message);
    }

    this.updatePlayerUI();
    console.log('🎮 Affichage écran de jeu...');
    this.showScreen('game');
  }

  /**
   * Créer scène 3D
   */
  create3DScene(cropId) {
    console.log('  📦 Récupération container...');
    const container = document.getElementById('game-canvas-container');

    if (!container) {
      throw new Error('Container game-canvas-container non trouvé');
    }

    // Nettoyer scène précédente
    if (this.farmScene) {
      console.log('  🧹 Nettoyage scène précédente...');
      this.farmScene.dispose();
    }

    // Créer nouvelle scène
    console.log('  🌾 Création FarmScene...');
    this.farmScene = new FarmScene(container);

    // Planter culture
    console.log(`  🌱 Plantation ${cropId}...`);
    this.farmScene.plantCrop(cropId, 49); // 7x7 grille

    // Animer croissance
    console.log('  📈 Animation croissance...');
    setTimeout(() => {
      this.farmScene.animateGrowth(2000);
    }, 300);
  }

  /**
   * Appliquer recommandations NASA
   */
  applyNASARecommendations() {
    if (this.cursorControls) {
      this.cursorControls.applyRecommendations();
      alert('✅ Recommandations NASA appliquées !');
    }
  }

  /**
   * Lancer simulation
   */
  runSimulation() {
    if (!this.currentLevelObj) return;

    // Vérifier vies
    if (this.engine.player.lives <= 0) {
      alert('Plus de vies disponibles !');
      return;
    }

    // Consommer vie
    this.engine.useLife();

    // Lancer simulation
    const results = this.currentLevelObj.runSimulation();
    const isSuccess = this.currentLevelObj.isSuccess();

    // Afficher visuellement sur plants 3D
    if (this.farmScene) {
      // Appliquer état final aux plants
      const cursors = this.currentLevelObj.getCursors();
      this.farmScene.updatePlantConditions(cursors.water, cursors.npk, cursors.ph);

      // Afficher stress si problèmes détectés
      if (results.stressFactor.water < 60) {
        this.farmScene.showStress('water');
      } else if (results.stressFactor.nutrient < 60) {
        this.farmScene.showStress('nutrient');
      } else if (results.stressFactor.ph < 60) {
        this.farmScene.showStress('ph');
      }

      // Attendre animation puis afficher résultats
      setTimeout(() => {
        this.showResults(results, isSuccess);
      }, 1500);
    } else {
      // Pas de 3D, afficher directement
      this.showResults(results, isSuccess);
    }
  }

  /**
   * Afficher résultats
   */
  showResults(results, isSuccess) {
    const levelData = getCropLevel(this.currentCrop, this.currentLevel);

    // Titre
    document.getElementById('results-title').textContent =
      isSuccess ? '🎉 Niveau Réussi !' : '❌ Niveau Échoué';

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
    if (isSuccess) {
      const completion = this.engine.completeLevel(
        `${this.currentCrop}-${this.currentLevel}`,
        results.score,
        results.stars
      );
      coinsEarned = completion.coins;
    }

    document.getElementById('results-coins').textContent =
      isSuccess ? `+${coinsEarned}` : '0';

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

    // Boutons
    const btnNext = document.getElementById('btn-next-level');
    const cropSystem = getCropSystem(this.currentCrop);
    const hasNextLevel = cropSystem.levels.find(l => l.id === this.currentLevel + 1);

    if (isSuccess && hasNextLevel) {
      btnNext.style.display = 'block';
    } else {
      btnNext.style.display = 'none';
    }

    this.updatePlayerUI();
    this.showScreen('results');
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
      alert(`✅ ${this.unlockCropData.name.fr} débloqué !`);
      this.closeModal();
      this.showCropSelection();
    } else {
      alert('❌ Pas assez de pièces');
    }
  }
}

// Initialiser application
const app = new IleRiseApp();
app.init();

// Export pour debug
window.app = app;
