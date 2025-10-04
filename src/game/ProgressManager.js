/**
 * ProgressManager.js
 * Gestion de la progression globale du joueur
 * NASA Space Apps Challenge 2025
 */

import { CompetenceSystem } from './CompetenceSystem.js';
import { UnlockSystem } from './UnlockSystem.js';
import { LivesSystem } from './LivesSystem.js';

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
  recordGame(levelKey, gameData) {
    const progress = this.loadPlayerProgress();

    // Calculer le score par competences
    const scoreResult = this.competenceSystem.calculateCompetenceScore(gameData);

    // Creer l'entree de partie
    const gameRecord = {
      timestamp: Date.now(),
      levelKey,
      scores: scoreResult.scores,
      globalScore: scoreResult.globalScore,
      stars: scoreResult.stars,
      details: scoreResult.details
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

    // Sauvegarder
    this.saveProgress(progress);

    return {
      game: gameRecord,
      unlocks: unlockResults,
      progress: this.getProgressSummary(progress)
    };
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
   * Synchroniser avec l'API backend (futur)
   */
  async syncWithBackend(userId) {
    // TODO: Implementation API
    console.log('Backend sync not yet implemented');
    return {
      success: false,
      message: 'Backend API en cours de developpement'
    };
  }
}

export default ProgressManager;
