/**
 * GameEngine.js
 * Moteur de jeu principal - IleRise
 * NASA Space Apps Challenge 2025
 */

import { ProgressManager } from './ProgressManager.js';
import { CompetenceSystem } from './CompetenceSystem.js';
import { LivesSystem } from './LivesSystem.js';
import apiService from '../services/api.js';

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
   * Obtenir la clé localStorage spécifique à l'utilisateur
   */
  getPlayerStorageKey() {
    // Utiliser l'email de l'utilisateur connecté ou 'guest'
    const userStr = localStorage.getItem('ilerise_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return `ilerise_player_${user.email || user.id || 'guest'}`;
      } catch (e) {
        return 'ilerise_player_guest';
      }
    }
    return 'ilerise_player_guest';
  }

  /**
   * Charger données joueur (LocalStorage)
   */
  loadPlayerData() {
    const storageKey = this.getPlayerStorageKey();
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      console.log(`📦 Chargement données depuis ${storageKey}`);
      return JSON.parse(saved);
    }

    // Nouveau joueur
    console.log(`🆕 Nouveau joueur, initialisation des données`);
    return {
      name: 'Néo',
      coins: 0,
      lives: 5,
      livesResetTime: Date.now(),
      unlockedCrops: ['maize'],
      completedLevels: [],
      knowledgeCards: [],
      aiQuestionsToday: 5,
      currentScore: 0,
      highScores: {},
      // Suivi des compétences pour débloquer les cartes
      competenceStats: {
        water: { totalGames: 0, goodScores: 0 }, // irrigation
        npk: { totalGames: 0, goodScores: 0 },   // fertilisation
        ph: { totalGames: 0, goodScores: 0 },    // gestion pH
        rotation: { levelsCompleted: 0 },        // rotation
        nasa: { nasaHelpUsed: 0 }                // utilisation aide NASA
      }
    };
  }

  /**
   * Sauvegarder progression joueur
   */
  savePlayerData() {
    const storageKey = this.getPlayerStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(this.player));
    console.log(`💾 Données sauvegardées dans ${storageKey}`);
  }

  /**
   * Réinitialiser les données du joueur (lors de la déconnexion)
   */
  clearPlayerData() {
    const storageKey = this.getPlayerStorageKey();
    localStorage.removeItem(storageKey);
    console.log(`🗑️ Données effacées: ${storageKey}`);

    // Réinitialiser avec des données vierges
    this.player = this.loadPlayerData();
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
  async useLife() {
    return await this.livesSystem.useLife();
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
  async completeLevel(gameData) {
    if (!this.currentGame) {
      throw new Error('Aucune partie en cours');
    }

    console.log('🎮 completeLevel - gameData reçu:', gameData);
    console.log('🎮 completeLevel - currentGame:', this.currentGame);

    // Fusionner les donnees de partie
    const fullGameData = {
      ...this.currentGame,
      ...gameData
    };

    console.log('🎮 completeLevel - fullGameData fusionné:', fullGameData);

    // Enregistrer la partie dans ProgressManager
    const result = this.progressManager.recordGame(
      this.currentGame.levelKey,
      fullGameData
    );

    console.log('🎮 completeLevel - result de recordGame:', result);

    // Calculer recompenses en pieces
    const coins = this.calculateCoinsReward(result.game.globalScore, result.game.stars);
    console.log('💰 Pièces calculées:', coins, 'depuis score:', result.game.globalScore, 'stars:', result.game.stars);
    this.addCoins(coins);

    // 🆕 Vérifier les succès consécutifs pour carte de savoir
    const consecutiveSuccess = this.checkConsecutiveSuccess(this.currentGame.levelKey);
    let knowledgeCardEarned = null;

    if (consecutiveSuccess >= 3 && result.game.stars >= 2) {
      // Récompense : Débloquer une carte de savoir
      knowledgeCardEarned = this.unlockKnowledgeCard(this.currentGame.levelKey);
    }

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

    // Mettre à jour les stats de compétence
    this.updateCompetenceStats(result);

    this.savePlayerData();

    // 🆕 Synchroniser avec le backend AVANT de mettre currentGame à null
    await this.syncGameSession(result, coins, this.currentGame);

    // Reset partie en cours
    this.currentGame = null;

    return {
      ...result,
      coins,
      totalCoins: this.player.coins,
      feedback: this.generateFeedback(result.game),
      knowledgeCardEarned, // 🆕 Carte de savoir gagnée
      consecutiveSuccess // 🆕 Nombre de succès consécutifs
    };
  }

  /**
   * Vérifier les succès consécutifs (>= 2 étoiles)
   */
  checkConsecutiveSuccess(levelKey) {
    const levelHistory = this.progressManager.getLevelHistory(levelKey);
    if (!levelHistory || levelHistory.length === 0) {
      return 0;
    }

    let consecutive = 0;
    // Parcourir depuis les jeux les plus récents
    for (let i = levelHistory.length - 1; i >= 0; i--) {
      const game = levelHistory[i];
      if (game.stars >= 2) {
        consecutive++;
      } else {
        break; // Arrêter si un échec
      }
    }

    return consecutive;
  }

  /**
   * Débloquer une carte de savoir
   */
  unlockKnowledgeCard(levelKey) {
    // Générer ID de carte basé sur le niveau
    const [cropId, levelId] = levelKey.split('-');
    const cardId = `card-${cropId}-${levelId}-${Date.now()}`;

    const card = {
      id: cardId,
      cropId,
      levelId,
      unlockedAt: new Date().toISOString(),
      title: `🏆 Maîtrise: ${cropId} Niveau ${levelId}`,
      description: `Vous avez réussi 3 fois consécutives ce niveau avec excellence!`
    };

    // Ajouter aux cartes du joueur
    if (!this.player.knowledgeCards) {
      this.player.knowledgeCards = [];
    }

    // Éviter les doublons
    const alreadyUnlocked = this.player.knowledgeCards.find(c =>
      c.cropId === cropId && c.levelId === levelId
    );

    if (!alreadyUnlocked) {
      this.player.knowledgeCards.push(card);
      this.savePlayerData();
      return card;
    }

    return null;
  }

  /**
   * Mettre à jour les statistiques de compétence
   */
  updateCompetenceStats(result) {
    const stats = this.player.competenceStats;

    // Les stressFactor peuvent être dans result.game.stressFactor ou result.stressFactor
    const stressFactor = result.game?.stressFactor || result.stressFactor || {};

    // Irrigation (eau)
    stats.water.totalGames++;
    if (stressFactor.water >= 70) {
      stats.water.goodScores++;
    }

    // Fertilisation (NPK)
    stats.npk.totalGames++;
    if (stressFactor.nutrient >= 70) {
      stats.npk.goodScores++;
    }

    // Gestion pH
    stats.ph.totalGames++;
    if (stressFactor.ph >= 70) {
      stats.ph.goodScores++;
    }

    // Rotation (niveaux complétés)
    stats.rotation.levelsCompleted = this.player.completedLevels.length;

    // Utilisation aide NASA (sera incrémenté ailleurs)
    // stats.nasa.nasaHelpUsed++;
  }

  /**
   * Vérifier si une compétence débloque des cartes
   */
  isCompetenceUnlocked(competence) {
    // Initialiser competenceStats si manquant (joueurs existants)
    if (!this.player.competenceStats) {
      this.player.competenceStats = {
        water: { totalGames: 0, goodScores: 0 },
        npk: { totalGames: 0, goodScores: 0 },
        ph: { totalGames: 0, goodScores: 0 },
        rotation: { levelsCompleted: this.player.completedLevels?.length || 0 },
        nasa: { nasaHelpUsed: 0 }
      };
      this.savePlayerData();
    }

    const stats = this.player.competenceStats;

    switch (competence) {
      case 'water':
        return stats.water.totalGames > 0 &&
               (stats.water.goodScores / stats.water.totalGames) >= 0.5;

      case 'npk':
        return stats.npk.totalGames > 0 &&
               (stats.npk.goodScores / stats.npk.totalGames) >= 0.5;

      case 'soil':
        return stats.ph.totalGames > 0 &&
               (stats.ph.goodScores / stats.ph.totalGames) >= 0.5;

      case 'rotation':
        return stats.rotation.levelsCompleted >= 5;

      case 'nasa':
        return stats.nasa.nasaHelpUsed >= 3;

      default:
        return true; // Compétences inconnues débloquées par défaut
    }
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
   * Synchroniser la session de jeu avec le backend
   */
  async syncGameSession(result, coinsEarned, currentGameData) {
    // Ne synchroniser que si l'utilisateur est authentifié
    if (!apiService.isAuthenticated()) {
      console.log('⏭️ Pas de synchronisation (utilisateur non connecté)');
      return;
    }

    try {
      const [cropId, levelId] = currentGameData?.levelKey.split('-') || ['unknown', '0'];

      // Récupérer stressFactor depuis le bon emplacement
      const stressFactor = result.game?.stressFactor || result.stressFactor || {};

      const gameData = {
        cropId: cropId,
        levelId: levelId,
        location: this.player.selectedLocation || 'Parakou',
        score: result.game?.globalScore || result.globalScore || 0,
        stars: result.game?.stars || result.stars || 0,
        yieldValue: result.game?.yieldValue || result.actualYield || 0,
        parameters: {
          irrigation: currentGameData?.inputs?.irrigation || 0,
          npk: currentGameData?.inputs?.npk || { n: 0, p: 0, k: 0 },
          ph: currentGameData?.inputs?.ph || 7.0
        },
        stressFactors: stressFactor,
        coinsEarned: coinsEarned,
        duration: result.game?.duration || 0
      };

      console.log('🔄 Synchronisation session de jeu avec backend...', gameData);
      const response = await apiService.saveGameSession(gameData);
      console.log('✅ Session sauvegardée:', response);

    } catch (error) {
      console.error('❌ Erreur sync session de jeu:', error.message);
      // Ne pas bloquer le jeu en cas d'erreur, localStorage sert de fallback
    }
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
