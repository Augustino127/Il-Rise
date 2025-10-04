/**
 * GameEngine.js
 * Moteur de jeu principal - IleRise
 * NASA Space Apps Challenge 2025
 */

export class GameEngine {
  constructor() {
    this.currentLevel = null;
    this.player = this.loadPlayerData();
    this.nasaData = null;
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
   * Gérer système de vies
   */
  checkLives() {
  const now = Date.now();
  const hoursSinceReset = (now - this.player.livesResetTime) / (1000 * 60 * 60);

  // Dev mode: always max lives
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    this.player.lives = 99;
    return 99;
  }

  // Production logic...
  if (hoursSinceReset >= 24) {
    this.player.lives = 5;
    this.player.livesResetTime = now;
    this.savePlayerData();
  }

  if (this.player.lives < 5) {
    const livesToAdd = Math.floor(hoursSinceReset / 4);
    if (livesToAdd > 0) {
      this.player.lives = Math.min(5, this.player.lives + livesToAdd);
      this.player.livesResetTime = now;
      this.savePlayerData();
    }
  }

  return this.player.lives;
}

  /**
   * Utiliser une vie
   */
  useLife() {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return true; // Unlimited in dev
  }
  if (this.player.lives > 0) {
    this.player.lives--;
    this.savePlayerData();
    return true;
  }
  return false;
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
   * Compléter un niveau
   */
  completeLevel(levelId, score, stars) {
    // Enregistrer score
    if (!this.player.highScores[levelId] || score > this.player.highScores[levelId].score) {
      this.player.highScores[levelId] = { score, stars };
    }

    // Marquer comme complété
    if (!this.player.completedLevels.includes(levelId)) {
      this.player.completedLevels.push(levelId);
    }

    // Calculer récompense
    const coins = Math.floor(score / 10);
    const bonus = stars === 3 ? 50 : 0;

    this.addCoins(coins + bonus);

    this.savePlayerData();

    return {
      coins: coins + bonus,
      totalCoins: this.player.coins,
      newHighScore: score > (this.player.highScores[levelId]?.score || 0)
    };
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
