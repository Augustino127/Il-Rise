/**
 * GameManager.js
 * Gestionnaire principal du jeu
 * NASA Space Apps Challenge 2025
 */

import { GameEngine } from './GameEngine.js';
import { Level } from './Level.js';
import { getCrop, getCropsByLevel } from './CropDatabase.js';

export class GameManager {
  constructor() {
    this.engine = new GameEngine();
    this.currentLevel = null;
    this.isInitialized = false;
  }

  /**
   * Initialiser le jeu
   */
  async init() {
    console.log('🎮 Initialisation IleRise...');

    // Charger données NASA
    const nasaData = await this.engine.loadNASAData();

    if (!nasaData) {
      console.error('❌ Impossible de charger les données NASA');
      return false;
    }

    // Vérifier vies
    const lives = this.engine.checkLives();
    console.log(`❤️  Vies disponibles: ${lives}/5`);

    this.isInitialized = true;
    console.log('✅ IleRise initialisé');

    return true;
  }

  /**
   * Créer nouveau niveau
   */
  createLevel(levelId, cityName = 'Parakou') {
    // Vérifier si niveau débloqué
    if (!this.engine.isLevelUnlocked(levelId)) {
      return {
        success: false,
        message: `Niveau ${levelId} non débloqué`
      };
    }

    // Vérifier vies
    if (this.engine.player.lives <= 0) {
      return {
        success: false,
        message: 'Plus de vies disponibles. Revenez demain !'
      };
    }

    // Récupérer culture correspondante
    const crops = getCropsByLevel();
    const crop = crops.find(c => c.level === levelId);

    if (!crop) {
      return {
        success: false,
        message: `Culture pour niveau ${levelId} introuvable`
      };
    }

    // Récupérer données NASA pour la ville
    const nasaData = this.engine.getCityData(cityName);

    if (!nasaData) {
      return {
        success: false,
        message: `Données NASA indisponibles pour ${cityName}`
      };
    }

    // Créer niveau
    this.currentLevel = new Level(levelId, crop, cityName, nasaData);

    console.log(`🎯 Niveau ${levelId} créé: ${crop.name.fr} à ${cityName}`);

    return {
      success: true,
      level: this.currentLevel,
      summary: this.currentLevel.getSummary()
    };
  }

  /**
   * Jouer niveau actuel
   */
  async playLevel() {
    if (!this.currentLevel) {
      return {
        success: false,
        message: 'Aucun niveau actif'
      };
    }

    // Consommer une vie
    const lifeUsed = await this.engine.useLife();
    if (!lifeUsed) {
      return {
        success: false,
        message: 'Plus de vies disponibles'
      };
    }

    // Lancer simulation
    const results = this.currentLevel.runSimulation();

    // Vérifier succès
    const isSuccess = this.currentLevel.isSuccess();

    // Si succès, enregistrer
    if (isSuccess) {
      const completion = this.engine.completeLevel(
        this.currentLevel.levelId,
        results.score,
        results.stars
      );

      console.log(`✅ Niveau ${this.currentLevel.levelId} réussi !`);
      console.log(`💰 Pièces gagnées: +${completion.coins}`);

      return {
        success: true,
        isLevelSuccess: true,
        results,
        rewards: completion
      };
    } else {
      console.log(`❌ Niveau ${this.currentLevel.levelId} échoué`);

      return {
        success: true,
        isLevelSuccess: false,
        results,
        rewards: null
      };
    }
  }

  /**
   * Débloquer niveau
   */
  unlockLevel(levelId) {
    const crops = getCropsByLevel();
    const crop = crops.find(c => c.level === levelId);

    if (!crop) {
      return {
        success: false,
        message: 'Niveau introuvable'
      };
    }

    return this.engine.unlockLevel(levelId, crop.unlockCost);
  }

  /**
   * Obtenir statut joueur
   */
  getPlayerStatus() {
    return {
      name: this.engine.player.name,
      coins: this.engine.player.coins,
      lives: this.engine.player.lives,
      unlockedLevels: this.engine.player.unlockedLevels,
      completedLevels: this.engine.player.completedLevels,
      highScores: this.engine.player.highScores,
      knowledgeCards: this.engine.player.knowledgeCards,
      aiQuestionsLeft: this.engine.player.aiQuestionsToday
    };
  }

  /**
   * Obtenir niveaux disponibles
   */
  getAvailableLevels() {
    const crops = getCropsByLevel();

    return crops.map(crop => ({
      id: crop.level,
      name: crop.name.fr,
      emoji: crop.emoji,
      unlockCost: crop.unlockCost,
      isUnlocked: this.engine.isLevelUnlocked(crop.level),
      isCompleted: this.engine.player.completedLevels.includes(crop.level),
      highScore: this.engine.player.highScores[crop.level] || null,
      targetYield: crop.targetYield,
      maxYield: crop.maxYield
    }));
  }

  /**
   * Poser question à l'IA
   */
  async askAI(question) {
    if (!this.engine.useAIQuestion()) {
      return {
        success: false,
        message: `Plus de questions disponibles aujourd'hui (${this.engine.player.aiQuestionsToday}/5)`
      };
    }

    // Simulation réponse IA (à remplacer par vraie API)
    const response = this.simulateAIResponse(question);

    return {
      success: true,
      question,
      response,
      questionsLeft: this.engine.player.aiQuestionsToday
    };
  }

  /**
   * Simuler réponse IA (placeholder)
   */
  simulateAIResponse(question) {
    // Placeholder - à remplacer par vraie API
    const responses = {
      default: "Je suis Néo, votre assistant agricole. Utilisez les données des satellites NASA pour optimiser vos cultures !",
      jaunisse: "Le jaunissement des feuilles indique souvent une carence en azote (N). Augmentez l'apport NPK.",
      recolte: "Récoltez quand le rendement est proche du maximum. Consultez les indicateurs de croissance.",
      ph: "Le pH mesure l'acidité du sol. La plupart des cultures préfèrent un pH entre 6 et 7."
    };

    const lowerQ = question.toLowerCase();

    if (lowerQ.includes('jaun')) return responses.jaunisse;
    if (lowerQ.includes('récolt') || lowerQ.includes('recolte')) return responses.recolte;
    if (lowerQ.includes('ph')) return responses.ph;

    return responses.default;
  }

  /**
   * Réinitialiser niveau actuel
   */
  resetLevel() {
    if (this.currentLevel) {
      this.currentLevel.reset();
      return true;
    }
    return false;
  }

  /**
   * Sauvegarder progression
   */
  save() {
    this.engine.savePlayerData();
  }

  /**
   * Réinitialiser jeu (debug)
   */
  resetGame() {
    this.engine.resetProgress();
    this.currentLevel = null;
    console.log('🔄 Jeu réinitialisé');
  }
}

// Export singleton
export const gameManager = new GameManager();
