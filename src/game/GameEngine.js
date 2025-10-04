/**
 * GameEngine.js
 * Moteur de jeu principal - IleRise
 * NASA Space Apps Challenge 2025
 */

import { ProgressManager } from './ProgressManager.js';
import { CompetenceSystem } from './CompetenceSystem.js';
import { LivesSystem } from './LivesSystem.js';

export class GameEngine {
  constructor() {
    this.currentLevel = null;
    this.player = this.loadPlayerData();
    this.nasaData = null;

    // Nouveaux systemes
    this.progressManager = new ProgressManager();
    this.competenceSystem = new CompetenceSystem();
    this.livesSystem = new LivesSystem();

    // Tracking de la partie en cours
    this.currentGame = null;
  }

  /**
   * Charger données joueur (LocalStorage)
   */
  loadPlayerData() {
  const saved = localStorage.getItem('ilerise_player');

  if (saved) {
    return JSON.parse(saved);
  }

  // Nouveau joueur
  const devLives = process.env.DEV_LIVES || 5; // Use .env in dev
  return {
    name: 'Néo',
    coins: 0,
    lives: process.env.NODE_ENV === 'development' ? parseInt(devLives) : 5,
    livesResetTime: Date.now(),
    unlockedCrops: ['maize'],
    completedLevels: [],
    knowledgeCards: [],
    aiQuestionsToday: 5,
    currentScore: 0,
    highScores: {}
  };
}

  /**
   * Sauvegarder progression joueur
   */
  savePlayerData() {
    localStorage.setItem('ilerise_player', JSON.stringify(this.player));
  }

  /**
   * Charger données NASA
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

      this.nasaData = {
        temperature,
        ndvi,
        precipitation,
        smap
      };

      console.log('✅ Données NASA chargées:', this.nasaData);
      return this.nasaData;

    } catch (error) {
      console.error('❌ Erreur chargement données NASA:', error);
      throw error;
    }
  }

  /**
   * Récupérer données NASA pour une ville
   */
  getCityData(cityName) {
    console.log(`🔍 getCityData appelé pour: ${cityName}`);

    if (!this.nasaData) {
      console.warn('⚠️  Données NASA non chargées');
      return null;
    }

    console.log('  Recherche dans temperature...');
    const tempLocation = this.nasaData.temperature.locations.find(
      loc => loc.city === cityName
    );
    console.log('  Température trouvée:', tempLocation?.city);

    console.log('  Recherche dans NDVI...');
    const ndviLocation = this.nasaData.ndvi.locations.find(
      loc => loc.city === cityName
    );
    console.log('  NDVI trouvé:', ndviLocation?.city);

    console.log('  Recherche dans précipitations...');
    const precipLocation = this.nasaData.precipitation.locations.find(
      loc => loc.city === cityName
    );
    console.log('  Précipitations trouvées:', precipLocation?.city);

    console.log('  Recherche dans SMAP...');
    const smapSurface = this.nasaData.smap?.layers?.sm_surface?.locations.find(
      loc => loc.city === cityName
    );
    console.log('  SMAP trouvé:', smapSurface?.city || 'non disponible');

    const result = {
      city: cityName,
      temperature: tempLocation?.temperature || { current_c: 28 },
      ndvi: ndviLocation?.ndvi || { current: 0.3 },
      precipitation: precipLocation?.precipitation || { total_mm: 0 },
      soilMoisture: smapSurface?.moisture || { current_percent: 20 }
    };

    console.log('  ✅ Données retournées:', result);
    return result;
  }

  /**
   * Gérer système de vies (DELEGUE a LivesSystem)
   */
  checkLives() {
    const state = this.livesSystem.getLivesState();
    return state.current;
  }

  /**
   * Utiliser une vie (DELEGUE a LivesSystem)
   */
  useLife() {
    return this.livesSystem.useLife();
  }

  /**
   * Obtenir l'etat complet des vies pour l'UI
   */
  getLivesUI() {
    return this.livesSystem.getUIInfo();
  }

  /**
   * Ajouter des pièces
   */
  addCoins(amount) {
    this.player.coins += amount;
    this.savePlayerData();
  }

  /**
   * Dépenser des pièces
   */
  spendCoins(amount) {
    if (this.player.coins >= amount) {
      this.player.coins -= amount;
      this.savePlayerData();
      return true;
    }
    return false;
  }

  /**
   * Débloquer une culture
   */
  unlockCrop(cropId, cost) {
    if (this.player.unlockedCrops.includes(cropId)) {
      return { success: false, message: 'Culture déjà débloquée' };
    }

    if (this.spendCoins(cost)) {
      this.player.unlockedCrops.push(cropId);
      this.savePlayerData();
      return { success: true, message: `Culture ${cropId} débloquée !` };
    }

    return { success: false, message: 'Pas assez de pièces' };
  }

  /**
   * Demarrer une nouvelle partie
   */
  startGame(levelKey, cropId, levelId) {
    this.currentGame = {
      levelKey,
      cropId,
      levelId,
      startTime: Date.now(),
      nasaUsageCount: 0,
      nasaDataUsed: null,
      previousCrops: this.getPreviousCrops()
    };
    return this.currentGame;
  }

  /**
   * Recuperer les cultures precedentes pour la rotation
   */
  getPreviousCrops() {
    const progress = this.progressManager.loadPlayerProgress();
    const allGames = Object.values(progress.levelHistory).flat();

    // Retourner les 5 dernieres cultures plantees
    return allGames
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map(g => ({
        cropId: g.levelKey.split('_')[0],
        family: this.getCropFamily(g.levelKey.split('_')[0])
      }));
  }

  /**
   * Obtenir la famille d'une culture (pour rotation)
   */
  getCropFamily(cropId) {
    const families = {
      maize: 'cereal',
      rice: 'cereal',
      cowpea: 'legume',
      cassava: 'tuber',
      cacao: 'tree_crop',
      cotton: 'fiber'
    };
    return families[cropId] || 'unknown';
  }

  /**
   * Enregistrer l'utilisation de donnees NASA
   */
  useNASAData(types = []) {
    if (!this.currentGame) return;

    this.currentGame.nasaUsageCount++;
    this.currentGame.nasaDataUsed = {
      types,
      timestamp: Date.now()
    };
  }

  /**
   * Completer un niveau avec le nouveau systeme de competences
   */
  completeLevel(gameData) {
    if (!this.currentGame) {
      throw new Error('Aucune partie en cours');
    }

    // Fusionner les donnees de partie
    const fullGameData = {
      ...this.currentGame,
      ...gameData
    };

    // Enregistrer la partie dans ProgressManager
    const result = this.progressManager.recordGame(
      this.currentGame.levelKey,
      fullGameData
    );

    // Calculer recompenses en pieces
    const coins = this.calculateCoinsReward(result.game.globalScore, result.game.stars);
    this.addCoins(coins);

    // Mettre a jour anciennes donnees pour compatibilite
    const levelId = this.currentGame.levelKey;
    if (!this.player.highScores[levelId] || result.game.globalScore > this.player.highScores[levelId].score) {
      this.player.highScores[levelId] = {
        score: result.game.globalScore,
        stars: result.game.stars
      };
    }

    if (!this.player.completedLevels.includes(levelId)) {
      this.player.completedLevels.push(levelId);
    }

    this.savePlayerData();

    // Reset partie en cours
    this.currentGame = null;

    return {
      ...result,
      coins,
      totalCoins: this.player.coins,
      feedback: this.generateFeedback(result.game)
    };
  }

  /**
   * Calculer la recompense en pieces
   */
  calculateCoinsReward(globalScore, stars) {
    let coins = Math.floor(globalScore / 2); // Base: 50 points = 25 coins

    // Bonus etoiles
    if (stars === 3) coins += 50;
    else if (stars === 2) coins += 20;

    return coins;
  }

  /**
   * Generer feedback detaille pour le joueur
   */
  generateFeedback(gameRecord) {
    const feedback = {
      overall: this.getOverallFeedback(gameRecord.stars, gameRecord.globalScore),
      competences: {}
    };

    // Feedback par competence
    Object.keys(gameRecord.scores).forEach(comp => {
      feedback.competences[comp] = this.competenceSystem.getScoreFeedback(
        comp,
        gameRecord.scores[comp]
      );
    });

    return feedback;
  }

  /**
   * Feedback global
   */
  getOverallFeedback(stars, score) {
    if (stars === 3) {
      return {
        title: 'Excellent travail !',
        emoji: '⭐⭐⭐',
        message: `Score parfait de ${score}/100. Vous maitrisez l'agriculture de precision !`
      };
    } else if (stars === 2) {
      return {
        title: 'Bon travail !',
        emoji: '⭐⭐',
        message: `Score de ${score}/100. Quelques ameliorations possibles.`
      };
    } else {
      return {
        title: 'Essayez encore',
        emoji: '⭐',
        message: `Score de ${score}/100. Consultez les donnees NASA pour optimiser vos cultures.`
      };
    }
  }

  /**
   * Vérifier si culture est débloquée
   */
  isCropUnlocked(cropId) {
    return this.player.unlockedCrops.includes(cropId);
  }

  /**
   * Utiliser une question IA
   */
  useAIQuestion() {
    const today = new Date().toDateString();
    const lastReset = new Date(this.player.livesResetTime).toDateString();

    // Reset quotidien des questions
    if (today !== lastReset) {
      this.player.aiQuestionsToday = 5;
    }

    if (this.player.aiQuestionsToday > 0) {
      this.player.aiQuestionsToday--;
      this.savePlayerData();
      return true;
    }

    return false;
  }

  /**
   * Débloquer carte de connaissance
   */
  unlockKnowledgeCard(cardId) {
    if (!this.player.knowledgeCards.includes(cardId)) {
      this.player.knowledgeCards.push(cardId);
      this.savePlayerData();
      return true;
    }
    return false;
  }

  /**
   * Réinitialiser progression (debug)
   */
  resetProgress() {
    localStorage.removeItem('ilerise_player');
    this.player = this.loadPlayerData();
  }
}
