/**
 * GameOverScreen.js
 * Contrôleur pour l'écran Game Over
 * Gère les options de retry, régénération des vies et statistiques
 * NASA Space Apps Challenge 2025
 */

import EventBus, { GameEvents } from '../core/EventBus.js';
import GameState from '../core/GameStateManager.js';
import NotificationSystem from './NotificationSystem.js';

export class GameOverScreen {
  constructor(livesSystem, app) {
    this.livesSystem = livesSystem;
    this.app = app;
    this.timerInterval = null;
    this.retryCost = 50; // Coût en coins pour retry

    this.elements = {
      screen: document.getElementById('screen-game-over'),
      gamesPlayed: document.getElementById('go-games-played'),
      totalStars: document.getElementById('go-total-stars'),
      coinsEarned: document.getElementById('go-coins-earned'),
      heartsDisplay: document.getElementById('go-hearts-display'),
      nextLifeTimer: document.getElementById('go-next-life-timer'),
      retryCost: document.getElementById('go-retry-cost'),
      coinBalance: document.getElementById('go-coin-balance'),
      notEnough: document.getElementById('go-not-enough'),
      encouragement: document.getElementById('go-encouragement'),
      tip: document.getElementById('go-tip'),

      btnWait: document.getElementById('btn-go-wait'),
      btnRetry: document.getElementById('btn-go-retry'),
      btnViewProfile: document.getElementById('btn-go-view-profile'),
      btnKnowledgeCards: document.getElementById('btn-go-knowledge-cards')
    };

    this.encouragementMessages = [
      "Chaque agriculteur connaît des difficultés. Continuez à apprendre et vous deviendrez un maître!",
      "L'échec est le premier pas vers le succès. Réessayez avec ce que vous avez appris!",
      "Les meilleurs agriculteurs sont ceux qui apprennent de leurs erreurs. Vous êtes sur la bonne voie!",
      "La patience et la persévérance transforment les obstacles en opportunités!",
      "Même les cultures les plus fortes ont besoin de plusieurs saisons pour prospérer!",
      "Chaque niveau raté est une leçon apprise. Continuez ainsi!",
      "Les données NASA sont vos alliées. Utilisez-les pour devenir imbattable!"
    ];

    this.tips = [
      "💡 Astuce: Utilisez les recommandations NASA pour optimiser vos paramètres!",
      "💡 Astuce: Consultez les cartes éducatives pour mieux comprendre les cultures!",
      "💡 Astuce: Observez les données NDVI pour suivre la santé de vos plantes!",
      "💡 Astuce: L'humidité du sol est cruciale - surveillez les données SMAP!",
      "💡 Astuce: Chaque culture a des besoins spécifiques en température!",
      "💡 Astuce: Le NPK doit être appliqué aux bons moments du cycle de croissance!",
      "💡 Astuce: Expérimentez dans le mode Ferme avant de jouer les niveaux difficiles!"
    ];

    this.init();
  }

  init() {
    this.attachEventListeners();
    console.log('💀 GameOverScreen initialized');
  }

  attachEventListeners() {
    // Bouton attendre
    this.elements.btnWait.addEventListener('click', () => {
      this.close();
      this.app.showScreen('home');
    });

    // Bouton retry
    this.elements.btnRetry.addEventListener('click', () => {
      this.handleRetry();
    });

    // Bouton voir profil
    this.elements.btnViewProfile.addEventListener('click', () => {
      this.close();
      this.app.showProfile();
    });

    // Bouton cartes éducatives
    this.elements.btnKnowledgeCards.addEventListener('click', () => {
      this.close();
      this.app.showKnowledgeCards();
    });
  }

  /**
   * Afficher l'écran Game Over
   */
  async show() {
    // Mettre à jour les statistiques
    this.updateStats();

    // Mettre à jour l'affichage des vies
    this.updateLivesDisplay();

    // Afficher coût retry et balance
    this.updateRetryOption();

    // Message d'encouragement aléatoire
    this.showRandomEncouragement();

    // Démarrer le timer de régénération
    this.startRegenTimer();

    // Émettre événement
    EventBus.emit(GameEvents.GAME_OVER);

    // Afficher l'écran
    this.elements.screen.classList.add('active');
  }

  /**
   * Fermer l'écran Game Over
   */
  close() {
    this.stopRegenTimer();
    this.elements.screen.classList.remove('active');
  }

  /**
   * Mettre à jour les statistiques de session
   */
  updateStats() {
    const stats = GameState.get('player.stats');
    const sessionStats = this.calculateSessionStats();

    this.elements.gamesPlayed.textContent = sessionStats.gamesPlayed || 0;
    this.elements.totalStars.textContent = sessionStats.starsEarned || 0;
    this.elements.coinsEarned.textContent = sessionStats.coinsEarned || 0;
  }

  /**
   * Calculer les stats de la session
   */
  calculateSessionStats() {
    // Pour l'instant, on utilise les stats globales
    // TODO: Tracker les stats par session
    const stats = GameState.get('player.stats');

    return {
      gamesPlayed: stats.gamesPlayed || 0,
      starsEarned: Math.floor(stats.totalScore / 300) || 0, // Approximation
      coinsEarned: GameState.get('player.coins') || 0
    };
  }

  /**
   * Mettre à jour l'affichage des vies
   */
  updateLivesDisplay() {
    const livesState = this.livesSystem.getLivesState();
    this.elements.heartsDisplay.textContent = livesState.hearts;
  }

  /**
   * Mettre à jour l'option de retry
   */
  updateRetryOption() {
    const coins = GameState.get('player.coins') || 0;

    this.elements.retryCost.textContent = this.retryCost;
    this.elements.coinBalance.textContent = coins;

    if (coins < this.retryCost) {
      this.elements.notEnough.style.display = 'block';
      this.elements.btnRetry.disabled = true;
      this.elements.btnRetry.style.opacity = '0.5';
    } else {
      this.elements.notEnough.style.display = 'none';
      this.elements.btnRetry.disabled = false;
      this.elements.btnRetry.style.opacity = '1';
    }
  }

  /**
   * Afficher un message d'encouragement aléatoire
   */
  showRandomEncouragement() {
    const randomMessage = this.encouragementMessages[
      Math.floor(Math.random() * this.encouragementMessages.length)
    ];

    const randomTip = this.tips[
      Math.floor(Math.random() * this.tips.length)
    ];

    this.elements.encouragement.textContent = `"${randomMessage}"`;
    this.elements.tip.textContent = randomTip;
  }

  /**
   * Démarrer le timer de régénération
   */
  startRegenTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    const updateTimer = () => {
      const livesState = this.livesSystem.getLivesState();

      if (livesState.timeUntilNextLife > 0) {
        const formatted = this.formatTime(livesState.timeUntilNextLife);
        this.elements.nextLifeTimer.textContent = formatted;

        // Mettre à jour l'affichage des cœurs
        this.elements.heartsDisplay.textContent = livesState.hearts;

        // Si une vie a été régénérée
        if (livesState.current > 0) {
          // Arrêter le timer et proposer de rejouer
          this.stopRegenTimer();
          this.showLifeRegenerated();
        }
      } else {
        this.elements.nextLifeTimer.textContent = 'Bientôt!';
      }
    };

    updateTimer();
    this.timerInterval = setInterval(updateTimer, 1000);
  }

  /**
   * Arrêter le timer
   */
  stopRegenTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Formater le temps (ms -> mm:ss)
   */
  formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Afficher notification de vie régénérée
   */
  showLifeRegenerated() {
    NotificationSystem.success(
      'Vous pouvez rejouer maintenant!',
      'Vie Régénérée! 💚'
    );

    // Activer le bouton pour revenir au jeu
    this.elements.btnWait.textContent = '🎮 Rejouer';
    this.elements.btnWait.classList.remove('btn-secondary');
    this.elements.btnWait.classList.add('btn-primary');

    // Effet visuel sur les cœurs
    this.elements.heartsDisplay.style.animation = 'none';
    setTimeout(() => {
      this.elements.heartsDisplay.style.animation = 'heartsFloat 2s ease-in-out infinite';
    }, 10);
  }

  /**
   * Gérer le retry avec coins
   */
  async handleRetry() {
    const coins = GameState.get('player.coins') || 0;

    if (coins < this.retryCost) {
      NotificationSystem.error(
        `Vous avez besoin de ${this.retryCost} pièces pour continuer`,
        'Pièces Insuffisantes'
      );
      return;
    }

    // Confirmer
    this.app.showConfirm(
      'Continuer avec des pièces?',
      `Dépenser ${this.retryCost} 💰 pour obtenir une vie et continuer à jouer?`,
      async (confirmed) => {
        if (confirmed) {
          // Dépenser les coins
          const success = GameState.spendCoins(this.retryCost, 'retry_life');

          if (success) {
            // Ajouter une vie
            this.livesSystem.addLives(1);

            // Notification
            NotificationSystem.success(
              'Vous avez obtenu une vie!',
              'Continue Débloqué! 🚀'
            );

            // Fermer et retourner au jeu
            this.close();
            this.app.showScreen('home');

            // Émettre événement
            EventBus.emit('retry:purchased', {
              cost: this.retryCost,
              livesNow: this.livesSystem.getLivesState().current
            });
          }
        }
      }
    );
  }

  /**
   * Vérifier si le joueur peut jouer
   */
  canPlay() {
    return this.livesSystem.hasLives();
  }
}

export default GameOverScreen;
