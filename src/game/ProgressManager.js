/**
 * ProgressManager.js
 * Gestion de la progression globale du joueur
 * NASA Space Apps Challenge 2025
 */

import { CompetenceSystem } from './CompetenceSystem.js';
import { UnlockSystem } from './UnlockSystem.js';
import { LivesSystem } from './LivesSystem.js';
import apiService from '../services/api.js';

export class ProgressManager {
  constructor() {
    this.competenceSystem = new CompetenceSystem();
    this.unlockSystem = new UnlockSystem();
    this.livesSystem = new LivesSystem();

    this.storageKeys = {
      player: 'ilerise_player',
      progress: 'ilerise_progress',
      stats: 'ilerise_stats'
    };

    this.syncPending = false;
  }

  /**
   * Initialiser ou charger la progression du joueur
   */
  loadPlayerProgress() {
    const saved = localStorage.getItem(this.storageKeys.progress);

    if (saved) {
      return JSON.parse(saved);
    }

    // Nouvelle progression
    return this.getDefaultProgress();
  }

  /**
   * Obtenir la progression par défaut
   */
  getDefaultProgress() {
    return {
      // Historique des parties par niveau
      // Format: { "maize_1": [game1, game2, ...], "maize_2": [...] }
      levelHistory: {},

      // Niveaux deverrouilles
      unlockedLevels: ['maize_1'], // Premier niveau gratuit

      // Cultures debloquees
      unlockedCrops: ['maize'],

      // Meilleurs scores par competence
      competenceStats: {
        water: { best: 0, average: 0, total: 0 },
        npk: { best: 0, average: 0, total: 0 },
        soil: { best: 0, average: 0, total: 0 },
        rotation: { best: 0, average: 0, total: 0 },
        nasa: { best: 0, average: 0, total: 0 }
      },

      // Statistiques globales
      totalGamesPlayed: 0,
      totalStarsEarned: 0,
      perfectScores: 0,
      consecutiveWins: 0,

      // Derniere mise a jour
      lastUpdated: Date.now()
    };
  }

  /**
   * Charger la progression depuis le backend
   */
  async loadFromBackend() {
    if (!apiService.isAuthenticated()) {
      console.log('Non connecté, utilisation du localStorage uniquement');
      return this.loadPlayerProgress();
    }

    try {
      const response = await apiService.getProfile();

      if (response.success && response.data) {
        const backendProgress = this.convertBackendToLocalProgress(response.data);

        // Sauvegarder en local pour la cohérence
        this.saveProgress(backendProgress);

        console.log('✅ Progression chargée depuis le backend');
        return backendProgress;
      }
    } catch (error) {
      console.warn('⚠️ Erreur chargement backend, utilisation du localStorage:', error.message);
      return this.loadPlayerProgress();
    }

    return this.loadPlayerProgress();
  }

  /**
   * Convertir les données backend au format local
   */
  convertBackendToLocalProgress(backendData) {
    const progress = this.getDefaultProgress();

    // Extraire la progression globale
    const globalProgress = backendData.progress?.find(p => p.cropId === null);

    if (globalProgress) {
      // Niveaux débloqués
      if (globalProgress.completedLevels?.length > 0) {
        progress.unlockedLevels = [...new Set([
          'maize_1',
          ...globalProgress.completedLevels
        ])];
      }

      // Stats de compétences
      if (globalProgress.competenceStats) {
        Object.keys(globalProgress.competenceStats).forEach(comp => {
          if (progress.competenceStats[comp]) {
            const backendStats = globalProgress.competenceStats[comp];
            progress.competenceStats[comp] = {
              best: backendStats.best || 0,
              average: backendStats.average || 0,
              total: backendStats.total || 0
            };
          }
        });
      }
    }

    // Historique depuis History
    if (backendData.history?.length > 0) {
      backendData.history.forEach(entry => {
        if (entry.action === 'game_played' && entry.details) {
          const { cropId, levelId, score, stars, yield: yieldValue, coinsEarned, duration } = entry.details;
          const levelKey = `${cropId}_${levelId}`;

          if (!progress.levelHistory[levelKey]) {
            progress.levelHistory[levelKey] = [];
          }

          progress.levelHistory[levelKey].push({
            timestamp: new Date(entry.timestamp).getTime(),
            levelKey,
            scores: {}, // Scores détaillés non disponibles dans History
            globalScore: score || 0,
            stars: stars || 0,
            details: entry.details,
            yieldValue: yieldValue || 0,
            duration: duration || 0
          });
        }
      });

      // Calculer stats globales
      progress.totalGamesPlayed = backendData.history.filter(h => h.action === 'game_played').length;
      progress.totalStarsEarned = backendData.history.reduce((sum, h) =>
        sum + (h.details?.stars || 0), 0
      );
    }

    // Cultures débloquées basées sur les niveaux
    const unlockedCrops = new Set(['maize']);
    progress.unlockedLevels.forEach(levelKey => {
      const cropId = levelKey.split('_')[0];
      unlockedCrops.add(cropId);
    });
    progress.unlockedCrops = Array.from(unlockedCrops);

    progress.lastUpdated = Date.now();

    return progress;
  }

  /**
   * Sauvegarder la progression
   */
  saveProgress(progress) {
    progress.lastUpdated = Date.now();
    localStorage.setItem(this.storageKeys.progress, JSON.stringify(progress));
  }

  /**
   * Enregistrer une partie jouee
   * @param {string} levelKey - Cle du niveau (ex: "maize_1")
   * @param {Object} gameData - Donnees de la partie
   * @returns {Object} Resultats et progression mise a jour
   */
  async recordGame(levelKey, gameData) {
    const progress = this.loadPlayerProgress();

    // Utiliser le score et les étoiles déjà calculés si disponibles
    let scoreResult;
    if (gameData.globalScore !== undefined && gameData.stars !== undefined) {
      // Utiliser directement les données passées
      scoreResult = {
        scores: gameData.scores || {},
        globalScore: gameData.globalScore,
        stars: gameData.stars,
        details: gameData.details || {}
      };
    } else {
      // Calculer le score par competences (ancien comportement)
      scoreResult = this.competenceSystem.calculateCompetenceScore(gameData);
    }

    // Creer l'entree de partie
    const gameRecord = {
      timestamp: Date.now(),
      levelKey,
      scores: scoreResult.scores,
      globalScore: scoreResult.globalScore,
      stars: scoreResult.stars,
      details: scoreResult.details,
      yieldValue: gameData.actualYield || gameData.yieldValue || 0,
      duration: gameData.duration || 0
    };

    // Ajouter a l'historique
    if (!progress.levelHistory[levelKey]) {
      progress.levelHistory[levelKey] = [];
    }
    progress.levelHistory[levelKey].push(gameRecord);

    // Mettre a jour les statistiques
    this.updateStatistics(progress, gameRecord);

    // Verifier deverrouillages
    const unlockResults = this.checkUnlocks(progress, levelKey);

    // Sauvegarder en local d'abord
    this.saveProgress(progress);

    // Synchroniser avec le backend (non bloquant)
    this.syncGameToBackend(levelKey, gameRecord, gameData).catch(err =>
      console.warn('⚠️ Sync backend échouée:', err.message)
    );

    return {
      game: gameRecord,
      unlocks: unlockResults,
      progress: this.getProgressSummary(progress)
    };
  }

  /**
   * Synchroniser une partie avec le backend
   */
  async syncGameToBackend(levelKey, gameRecord, originalGameData) {
    if (!apiService.isAuthenticated()) {
      return;
    }

    try {
      const [cropId, levelId] = levelKey.split('_');

      // Sauvegarder la session de jeu
      await apiService.saveGameSession({
        cropId,
        levelId: parseInt(levelId),
        location: originalGameData.location || 'unknown',
        score: gameRecord.globalScore,
        stars: gameRecord.stars,
        yieldValue: gameRecord.yieldValue,
        parameters: originalGameData.parameters || {},
        stressFactors: originalGameData.stressFactors || {},
        coinsEarned: originalGameData.coinsEarned || 0,
        duration: gameRecord.duration
      });

      // Synchroniser le profil complet
      await this.syncWithBackend();

      console.log('✅ Partie synchronisée avec le backend');
    } catch (error) {
      console.error('❌ Erreur sync partie:', error);
      throw error;
    }
  }

  /**
   * Mettre a jour les statistiques globales
   */
  updateStatistics(progress, gameRecord) {
    // Stats globales
    progress.totalGamesPlayed++;
    progress.totalStarsEarned += gameRecord.stars;

    if (gameRecord.stars === 3) {
      progress.perfectScores++;
    }

    // Stats par competence
    Object.keys(gameRecord.scores).forEach(comp => {
      const score = gameRecord.scores[comp];
      const stats = progress.competenceStats[comp];

      stats.best = Math.max(stats.best, score);
      stats.total += score;
      stats.average = Math.round(stats.total / progress.totalGamesPlayed);
    });

    // Calculer serie de victoires consecutives
    progress.consecutiveWins = this.calculateConsecutiveWins(progress);
  }

  /**
   * Calculer la serie de victoires actuelles
   */
  calculateConsecutiveWins(progress) {
    // Recuperer toutes les parties triees par date
    const allGames = Object.values(progress.levelHistory)
      .flat()
      .sort((a, b) => b.timestamp - a.timestamp);

    let consecutive = 0;
    for (const game of allGames) {
      if (game.stars >= 2) {
        consecutive++;
      } else {
        break;
      }
    }

    return consecutive;
  }

  /**
   * Verifier les deverrouillages apres une partie
   */
  checkUnlocks(progress, currentLevelKey) {
    const unlocks = {
      levels: [],
      crops: [],
      achievements: []
    };

    const levelHistory = progress.levelHistory[currentLevelKey] || [];
    const unlockStatus = this.unlockSystem.checkUnlock(currentLevelKey, levelHistory);

    // Si niveau deverrouille, debloquer le suivant
    if (unlockStatus.unlocked) {
      const [cropId, levelId] = currentLevelKey.split('_');
      const nextLevels = this.unlockSystem.getNextLevels(cropId, parseInt(levelId));

      nextLevels.forEach(next => {
        const nextKey = `${next.cropId}_${next.levelId}`;

        if (!progress.unlockedLevels.includes(nextKey)) {
          progress.unlockedLevels.push(nextKey);
          unlocks.levels.push({
            key: nextKey,
            cropId: next.cropId,
            levelId: next.levelId,
            type: next.type
          });

          // Debloquer la culture si necessaire
          if (!progress.unlockedCrops.includes(next.cropId)) {
            progress.unlockedCrops.push(next.cropId);
            unlocks.crops.push(next.cropId);
          }
        }
      });
    }

    // Verifier achievements
    const achievements = this.unlockSystem.getUnlockAchievements(levelHistory);
    unlocks.achievements = achievements;

    return unlocks;
  }

  /**
   * Obtenir un resume de la progression
   */
  getProgressSummary(progress) {
    const completion = this.unlockSystem.getGlobalCompletion(progress.levelHistory);

    return {
      totalGames: progress.totalGamesPlayed,
      totalStars: progress.totalStarsEarned,
      perfectScores: progress.perfectScores,
      consecutiveWins: progress.consecutiveWins,
      completion,
      lives: this.livesSystem.getLivesState(),
      competences: this.getCompetenceSummary(progress)
    };
  }

  /**
   * Resume des competences du joueur
   */
  getCompetenceSummary(progress) {
    const summary = {};

    Object.keys(progress.competenceStats).forEach(comp => {
      const stats = progress.competenceStats[comp];
      const competence = this.competenceSystem.competences[comp];

      summary[comp] = {
        name: competence.name,
        emoji: competence.emoji,
        best: stats.best,
        average: stats.average,
        level: this.getCompetenceLevel(stats.average)
      };
    });

    return summary;
  }

  /**
   * Determiner le niveau de maitrise d'une competence
   */
  getCompetenceLevel(averageScore) {
    if (averageScore >= 80) return { level: 'Expert', emoji: '🏆' };
    if (averageScore >= 60) return { level: 'Avance', emoji: '🥈' };
    if (averageScore >= 40) return { level: 'Intermediaire', emoji: '🥉' };
    return { level: 'Debutant', emoji: '🌱' };
  }

  /**
   * Obtenir l'historique d'un niveau specifique
   */
  getLevelHistory(levelKey) {
    const progress = this.loadPlayerProgress();
    const history = progress.levelHistory[levelKey] || [];

    return {
      games: history,
      bestScore: Math.max(...history.map(g => g.globalScore), 0),
      bestStars: Math.max(...history.map(g => g.stars), 0),
      totalPlays: history.length,
      unlockProgress: this.unlockSystem.getProgressToUnlock(history)
    };
  }

  /**
   * Obtenir les stats detaillees d'une competence
   */
  getCompetenceDetails(competenceName) {
    const progress = this.loadPlayerProgress();
    const allGames = Object.values(progress.levelHistory).flat();

    const competenceScores = allGames.map(g => g.scores[competenceName]).filter(s => s !== undefined);

    if (competenceScores.length === 0) {
      return null;
    }

    return {
      name: this.competenceSystem.competences[competenceName].name,
      emoji: this.competenceSystem.competences[competenceName].emoji,
      best: Math.max(...competenceScores),
      worst: Math.min(...competenceScores),
      average: Math.round(competenceScores.reduce((a, b) => a + b, 0) / competenceScores.length),
      total: competenceScores.length,
      trend: this.calculateTrend(competenceScores)
    };
  }

  /**
   * Calculer la tendance d'evolution (progression/regression)
   */
  calculateTrend(scores) {
    if (scores.length < 5) return 'neutral';

    const recent = scores.slice(-5);
    const older = scores.slice(-10, -5);

    if (older.length === 0) return 'neutral';

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    if (recentAvg > olderAvg + 10) return 'improving';
    if (recentAvg < olderAvg - 10) return 'declining';
    return 'stable';
  }

  /**
   * Exporter la progression (pour sauvegarde cloud future)
   */
  exportProgress() {
    const progress = this.loadPlayerProgress();
    const lives = this.livesSystem.getLivesState();

    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      progress,
      lives,
      stats: this.getProgressSummary(progress)
    };
  }

  /**
   * Importer la progression (restauration)
   */
  importProgress(exportedData) {
    if (!exportedData || exportedData.version !== '1.0') {
      throw new Error('Format de sauvegarde invalide');
    }

    this.saveProgress(exportedData.progress);
    return true;
  }

  /**
   * Reset complet de la progression (debug)
   */
  resetProgress() {
    localStorage.removeItem(this.storageKeys.progress);
    localStorage.removeItem(this.storageKeys.stats);
    this.livesSystem.reset();
  }

  /**
   * Synchroniser avec l'API backend
   */
  async syncWithBackend() {
    if (!apiService.isAuthenticated()) {
      console.log('Non connecté, synchronisation ignorée');
      return { success: false, message: 'Non connecté' };
    }

    if (this.syncPending) {
      console.log('Synchronisation déjà en cours');
      return { success: false, message: 'Sync en cours' };
    }

    this.syncPending = true;

    try {
      const progress = this.loadPlayerProgress();
      const profileData = this.convertLocalToBackendFormat(progress);

      const response = await apiService.syncProfile(profileData);

      if (response.success) {
        console.log('✅ Progression synchronisée avec le backend');
        this.syncPending = false;
        return { success: true, data: response.data };
      }

      this.syncPending = false;
      return { success: false, message: 'Erreur de synchronisation' };
    } catch (error) {
      console.error('❌ Erreur sync backend:', error);
      this.syncPending = false;
      return { success: false, message: error.message };
    }
  }

  /**
   * Convertir la progression locale au format backend
   */
  convertLocalToBackendFormat(progress) {
    // Créer la liste des niveaux complétés
    const completedLevels = [];
    Object.keys(progress.levelHistory).forEach(levelKey => {
      const history = progress.levelHistory[levelKey];
      const hasWon = history.some(game => game.stars >= 2);

      if (hasWon) {
        completedLevels.push(levelKey);
      }
    });

    // Formater les stats de compétences pour le backend
    const competenceStats = {};
    Object.keys(progress.competenceStats).forEach(comp => {
      const stats = progress.competenceStats[comp];
      competenceStats[comp] = {
        best: stats.best || 0,
        average: stats.average || 0,
        total: stats.total || 0,
        goodScores: progress.totalGamesPlayed > 0 ?
          Math.round((stats.average / 100) * progress.totalGamesPlayed) : 0,
        totalGames: progress.totalGamesPlayed
      };
    });

    return {
      completedLevels,
      competenceStats,
      highScores: this.extractHighScores(progress),
      coins: this.getTotalCoins(progress)
    };
  }

  /**
   * Extraire les meilleurs scores par niveau
   */
  extractHighScores(progress) {
    const highScores = {};

    Object.keys(progress.levelHistory).forEach(levelKey => {
      const history = progress.levelHistory[levelKey];
      const bestGame = history.reduce((best, game) =>
        game.globalScore > (best?.globalScore || 0) ? game : best
      , null);

      if (bestGame) {
        highScores[levelKey] = {
          score: bestGame.globalScore,
          stars: bestGame.stars,
          yield: bestGame.yieldValue,
          timestamp: bestGame.timestamp
        };
      }
    });

    return highScores;
  }

  /**
   * Calculer le total de pièces gagnées (estimation)
   */
  getTotalCoins(progress) {
    // Les pièces sont gérées ailleurs, retourner 0 pour éviter les conflits
    // Le backend utilisera sa propre source de vérité pour les pièces
    return 0;
  }
}

export default ProgressManager;
