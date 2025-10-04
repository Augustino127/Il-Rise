/**
 * UnlockSystem.js
 * Systeme de deverrouillage des niveaux
 * NASA Space Apps Challenge 2025
 */

export class UnlockSystem {
  constructor() {
    this.unlockCriteria = {
      // 3 reussites consecutives (>= 2 etoiles)
      consecutiveSuccess: 3,
      minStarsForSuccess: 2,

      // OU 1 fois 3 etoiles
      perfectSuccess: 3
    };
  }

  /**
   * Verifier si un niveau peut etre deverrouille
   * @param {string} levelId - ID du niveau a deverrouiller
   * @param {Array} levelHistory - Historique des parties pour ce niveau
   * @returns {Object} { unlocked, reason, progress }
   */
  checkUnlock(levelId, levelHistory) {
    if (!levelHistory || levelHistory.length === 0) {
      return {
        unlocked: false,
        reason: 'Aucune partie jouee',
        progress: {
          consecutiveSuccesses: 0,
          hasPerfectScore: false
        }
      };
    }

    // Methode 1 : Verifier si 3 etoiles obtenues
    const hasPerfectScore = this.hasPerfectScore(levelHistory);
    if (hasPerfectScore) {
      return {
        unlocked: true,
        reason: 'Score parfait obtenu (3 etoiles) !',
        method: 'perfect',
        progress: {
          consecutiveSuccesses: 0,
          hasPerfectScore: true
        }
      };
    }

    // Methode 2 : Verifier 3 reussites consecutives
    const consecutiveSuccesses = this.countConsecutiveSuccesses(levelHistory);
    if (consecutiveSuccesses >= this.unlockCriteria.consecutiveSuccess) {
      return {
        unlocked: true,
        reason: `${consecutiveSuccesses} reussites consecutives !`,
        method: 'consecutive',
        progress: {
          consecutiveSuccesses,
          hasPerfectScore: false
        }
      };
    }

    // Pas encore deverrouille
    return {
      unlocked: false,
      reason: 'Criteres non atteints',
      progress: {
        consecutiveSuccesses,
        hasPerfectScore: false,
        needed: this.unlockCriteria.consecutiveSuccess - consecutiveSuccesses
      }
    };
  }

  /**
   * Verifier si le joueur a obtenu 3 etoiles au moins une fois
   */
  hasPerfectScore(levelHistory) {
    return levelHistory.some(game => game.stars === 3);
  }

  /**
   * Compter les reussites consecutives (>= 2 etoiles)
   */
  countConsecutiveSuccesses(levelHistory) {
    let consecutiveCount = 0;
    let maxConsecutive = 0;

    // Parcourir l'historique du plus recent au plus ancien
    for (let i = levelHistory.length - 1; i >= 0; i--) {
      const game = levelHistory[i];

      if (game.stars >= this.unlockCriteria.minStarsForSuccess) {
        consecutiveCount++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
      } else {
        // Reset si echec
        consecutiveCount = 0;
      }
    }

    return maxConsecutive;
  }

  /**
   * Obtenir les niveaux suivants deverrouillables
   * @param {string} currentCropId - ID de la culture actuelle
   * @param {number} currentLevelId - ID du niveau actuel
   * @returns {Array} Liste des niveaux suivants
   */
  getNextLevels(currentCropId, currentLevelId) {
    const nextLevels = [];

    // Niveau suivant de la meme culture
    nextLevels.push({
      cropId: currentCropId,
      levelId: currentLevelId + 1,
      type: 'same_crop'
    });

    // Autres cultures (si niveau Expert complete)
    if (currentLevelId === 3) {
      // Logique de progression des cultures
      const cropProgression = {
        maize: ['cowpea'],
        cowpea: ['rice'],
        rice: ['cassava'],
        cassava: ['cacao'],
        cacao: ['cotton']
      };

      const nextCrops = cropProgression[currentCropId] || [];
      nextCrops.forEach(cropId => {
        nextLevels.push({
          cropId,
          levelId: 1,
          type: 'new_crop'
        });
      });
    }

    return nextLevels;
  }

  /**
   * Calculer la progression vers le deverrouillage
   * @param {Array} levelHistory - Historique des parties
   * @returns {Object} Informations de progression
   */
  getProgressToUnlock(levelHistory) {
    const unlockStatus = this.checkUnlock(null, levelHistory);

    if (unlockStatus.unlocked) {
      return {
        percentage: 100,
        status: 'unlocked',
        message: unlockStatus.reason
      };
    }

    // Calcul du pourcentage de progression
    const consecutiveProg = unlockStatus.progress.consecutiveSuccesses;
    const percentage = (consecutiveProg / this.unlockCriteria.consecutiveSuccess) * 100;

    return {
      percentage: Math.round(percentage),
      status: 'locked',
      message: `${consecutiveProg}/${this.unlockCriteria.consecutiveSuccess} reussites consecutives`,
      needed: unlockStatus.progress.needed || 0
    };
  }

  /**
   * Obtenir les achievements lies au deverrouillage
   */
  getUnlockAchievements(levelHistory) {
    const achievements = [];

    // Achievement : Premiere reussite
    const firstSuccess = levelHistory.find(g => g.stars >= 2);
    if (firstSuccess) {
      achievements.push({
        id: 'first_success',
        name: 'Premiere reussite',
        emoji: '🌟',
        unlocked: true
      });
    }

    // Achievement : Score parfait
    const perfectScore = levelHistory.find(g => g.stars === 3);
    if (perfectScore) {
      achievements.push({
        id: 'perfect_score',
        name: 'Score parfait',
        emoji: '⭐⭐⭐',
        unlocked: true
      });
    }

    // Achievement : 3 reussites consecutives
    const consecutive = this.countConsecutiveSuccesses(levelHistory);
    if (consecutive >= 3) {
      achievements.push({
        id: 'consecutive_wins',
        name: '3 reussites consecutives',
        emoji: '🔥',
        unlocked: true
      });
    }

    return achievements;
  }

  /**
   * Obtenir les conditions de deverrouillage pour l'UI
   */
  getUnlockConditionsText() {
    return {
      method1: {
        title: 'Methode 1 : Score parfait',
        description: `Obtenez 3 etoiles (${this.unlockCriteria.perfectSuccess}⭐) une seule fois`,
        emoji: '⭐'
      },
      method2: {
        title: 'Methode 2 : Reussites consecutives',
        description: `Obtenez ${this.unlockCriteria.consecutiveSuccess} reussites consecutives (>= ${this.unlockCriteria.minStarsForSuccess}⭐)`,
        emoji: '🔄'
      }
    };
  }

  /**
   * Verifier si tous les niveaux d'une culture sont completes
   */
  isCropCompleted(cropId, playerProgress) {
    const cropLevels = [1, 2, 3]; // 3 niveaux par culture

    return cropLevels.every(levelId => {
      const levelKey = `${cropId}_${levelId}`;
      const history = playerProgress[levelKey] || [];
      return this.checkUnlock(levelKey, history).unlocked;
    });
  }

  /**
   * Calculer le taux de completion global
   */
  getGlobalCompletion(playerProgress) {
    const allCrops = ['maize', 'cowpea', 'rice', 'cassava', 'cacao', 'cotton'];
    const totalLevels = allCrops.length * 3; // 6 cultures x 3 niveaux = 18 niveaux

    let completedLevels = 0;

    allCrops.forEach(cropId => {
      [1, 2, 3].forEach(levelId => {
        const levelKey = `${cropId}_${levelId}`;
        const history = playerProgress[levelKey] || [];
        if (this.checkUnlock(levelKey, history).unlocked) {
          completedLevels++;
        }
      });
    });

    return {
      completed: completedLevels,
      total: totalLevels,
      percentage: Math.round((completedLevels / totalLevels) * 100)
    };
  }
}

export default UnlockSystem;
