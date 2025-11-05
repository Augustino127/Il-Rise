/**
 * LivesWidget.js
 * Widget d'affichage des vies avec animations et countdown
 * Design inspiré de Clash of Clans, Candy Crush
 * NASA Space Apps Challenge 2025
 */

import EventBus, { GameEvents } from '../core/EventBus.js';
import NotificationSystem from './NotificationSystem.js';

export class LivesWidget {
  constructor(livesSystem, container) {
    this.livesSystem = livesSystem;
    this.container = container;
    this.widget = null;
    this.updateInterval = null;
    this.lastLivesCount = 0;

    this.init();
  }

  init() {
    this.createWidget();
    this.startUpdating();
    this.setupEventListeners();
    console.log('💚 LivesWidget initialized');
  }

  createWidget() {
    this.widget = document.createElement('div');
    this.widget.className = 'lives-widget';
    this.widget.innerHTML = `
      <div class="lives-widget-content">
        <div class="lives-hearts" id="lives-hearts"></div>
        <div class="lives-text">
          <div class="lives-count">
            <span id="lives-current">5</span>
            <span class="lives-separator">/</span>
            <span id="lives-max">5</span>
          </div>
          <div class="lives-regen-timer" id="lives-regen-timer">
            <span class="timer-icon">⏱️</span>
            <span id="lives-countdown">--:--</span>
          </div>
        </div>
        <div class="lives-tooltip" id="lives-tooltip">
          <div class="tooltip-content">
            <p class="tooltip-title">💚 Vies</p>
            <p class="tooltip-text">
              Régénération: <strong>30 min/vie</strong><br>
              Reset complet: <strong>Minuit</strong>
            </p>
            <div class="tooltip-progress">
              <div class="progress-bar-small">
                <div class="progress-fill" id="lives-progress-fill"></div>
              </div>
              <p class="progress-text">
                Prochaine vie: <span id="tooltip-countdown">--:--</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Ajouter les styles
    this.injectStyles();

    // Ajouter au container
    this.container.appendChild(this.widget);

    // Éléments
    this.elements = {
      hearts: this.widget.querySelector('#lives-hearts'),
      current: this.widget.querySelector('#lives-current'),
      max: this.widget.querySelector('#lives-max'),
      regenTimer: this.widget.querySelector('#lives-regen-timer'),
      countdown: this.widget.querySelector('#lives-countdown'),
      tooltip: this.widget.querySelector('#lives-tooltip'),
      tooltipCountdown: this.widget.querySelector('#tooltip-countdown'),
      progressFill: this.widget.querySelector('#lives-progress-fill')
    };

    // Toggle tooltip au clic
    this.widget.addEventListener('click', () => {
      this.elements.tooltip.classList.toggle('visible');
    });

    // Cacher tooltip si clic ailleurs
    document.addEventListener('click', (e) => {
      if (!this.widget.contains(e.target)) {
        this.elements.tooltip.classList.remove('visible');
      }
    });
  }

  injectStyles() {
    if (document.getElementById('lives-widget-styles')) return;

    const style = document.createElement('style');
    style.id = 'lives-widget-styles';
    style.textContent = `
      .lives-widget {
        position: relative;
        cursor: pointer;
        user-select: none;
      }

      .lives-widget-content {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 30px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        transition: all 0.3s ease;
      }

      .lives-widget:hover .lives-widget-content {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
      }

      .lives-hearts {
        font-size: 24px;
        line-height: 1;
        display: flex;
        gap: 4px;
      }

      .heart {
        display: inline-block;
        animation: heartBeat 1.5s ease-in-out infinite;
        transition: all 0.3s ease;
      }

      .heart.empty {
        opacity: 0.3;
        animation: none;
      }

      .heart.lost {
        animation: heartLost 0.6s ease forwards;
      }

      .heart.gained {
        animation: heartGained 0.6s ease forwards;
      }

      @keyframes heartBeat {
        0%, 100% { transform: scale(1); }
        10% { transform: scale(1.1); }
        20% { transform: scale(1); }
      }

      @keyframes heartLost {
        0% { transform: scale(1) rotate(0deg); opacity: 1; }
        50% { transform: scale(1.3) rotate(20deg); opacity: 0.5; }
        100% { transform: scale(0.8) rotate(0deg); opacity: 0.3; }
      }

      @keyframes heartGained {
        0% { transform: scale(0) rotate(-180deg); opacity: 0; }
        50% { transform: scale(1.3) rotate(10deg); }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }

      .lives-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .lives-count {
        font-size: 18px;
        font-weight: 700;
        line-height: 1;
      }

      .lives-separator {
        opacity: 0.7;
        margin: 0 2px;
      }

      .lives-regen-timer {
        font-size: 12px;
        opacity: 0.9;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .timer-icon {
        font-size: 10px;
      }

      .lives-regen-timer.hidden {
        display: none;
      }

      /* Tooltip */
      .lives-tooltip {
        position: absolute;
        top: calc(100% + 10px);
        left: 50%;
        transform: translateX(-50%);
        background: white;
        color: #333;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        min-width: 250px;
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s ease;
        z-index: 1000;
      }

      .lives-tooltip::before {
        content: '';
        position: absolute;
        top: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-bottom: 8px solid white;
      }

      .lives-tooltip.visible {
        opacity: 1;
        pointer-events: auto;
        transform: translateX(-50%) translateY(5px);
      }

      .tooltip-title {
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 8px;
      }

      .tooltip-text {
        font-size: 13px;
        line-height: 1.6;
        margin-bottom: 12px;
        color: #666;
      }

      .tooltip-progress {
        background: #f5f5f5;
        border-radius: 8px;
        padding: 12px;
      }

      .progress-bar-small {
        background: #e0e0e0;
        border-radius: 10px;
        height: 6px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .progress-fill {
        background: linear-gradient(90deg, #4CAF50, #8BC34A);
        height: 100%;
        border-radius: 10px;
        transition: width 0.3s ease;
      }

      .progress-text {
        font-size: 12px;
        color: #666;
        text-align: center;
        margin: 0;
      }

      /* États spéciaux */
      .lives-widget-content.full {
        background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
      }

      .lives-widget-content.critical {
        background: linear-gradient(135deg, #f44336 0%, #e91e63 100%);
        animation: pulseWarning 1s ease-in-out infinite;
      }

      @keyframes pulseWarning {
        0%, 100% { box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3); }
        50% { box-shadow: 0 4px 24px rgba(244, 67, 54, 0.6); }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .lives-widget-content {
          padding: 10px 16px;
        }

        .lives-hearts {
          font-size: 20px;
        }

        .lives-count {
          font-size: 16px;
        }

        .lives-tooltip {
          min-width: 200px;
          font-size: 12px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  setupEventListeners() {
    // Écouter les changements de vies
    EventBus.on(GameEvents.PLAYER_LIVES_CHANGED, (data) => {
      this.update();

      // Animation si vie perdue ou gagnée
      if (data.delta < 0) {
        this.animateLifeLost();
      } else if (data.delta > 0) {
        this.animateLifeGained();
      }
    });

    // Écouter la régénération
    EventBus.on(GameEvents.PLAYER_LIFE_REGENERATED, () => {
      this.animateLifeGained();
      this.update();
    });
  }

  startUpdating() {
    this.update();

    // Mettre à jour toutes les secondes
    this.updateInterval = setInterval(() => {
      this.update();
    }, 1000);
  }

  stopUpdating() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  update() {
    const state = this.livesSystem.getLivesState();

    // Mettre à jour les cœurs
    this.updateHearts(state.current, state.max);

    // Mettre à jour les chiffres
    this.elements.current.textContent = state.current;
    this.elements.max.textContent = state.max;

    // Mettre à jour le timer
    if (state.current < state.max && state.timeUntilNextLife > 0) {
      const formatted = this.formatTime(state.timeUntilNextLife);
      this.elements.countdown.textContent = formatted;
      this.elements.tooltipCountdown.textContent = formatted;
      this.elements.regenTimer.classList.remove('hidden');

      // Mettre à jour la barre de progression
      const progress = 100 - (state.timeUntilNextLife / (30 * 60 * 1000)) * 100;
      this.elements.progressFill.style.width = `${progress}%`;
    } else {
      this.elements.regenTimer.classList.add('hidden');
      this.elements.progressFill.style.width = '0%';
    }

    // Changer l'apparence selon l'état
    const content = this.widget.querySelector('.lives-widget-content');

    content.classList.remove('full', 'critical');

    if (state.current === state.max) {
      content.classList.add('full');
    } else if (state.current <= 1) {
      content.classList.add('critical');
    }

    // Vérifier si une vie a été régénérée
    if (state.current > this.lastLivesCount && this.lastLivesCount > 0) {
      EventBus.emit(GameEvents.PLAYER_LIFE_REGENERATED);
    }

    this.lastLivesCount = state.current;
  }

  updateHearts(current, max) {
    let heartsHTML = '';

    for (let i = 0; i < max; i++) {
      if (i < current) {
        heartsHTML += `<span class="heart">❤️</span>`;
      } else {
        heartsHTML += `<span class="heart empty">🖤</span>`;
      }
    }

    this.elements.hearts.innerHTML = heartsHTML;
  }

  animateLifeLost() {
    const hearts = this.elements.hearts.querySelectorAll('.heart:not(.empty)');
    const lastHeart = hearts[hearts.length - 1];

    if (lastHeart) {
      lastHeart.classList.add('lost');
      setTimeout(() => {
        lastHeart.classList.remove('lost');
        lastHeart.classList.add('empty');
      }, 600);
    }
  }

  animateLifeGained() {
    const emptyHearts = this.elements.hearts.querySelectorAll('.heart.empty');
    const firstEmpty = emptyHearts[0];

    if (firstEmpty) {
      firstEmpty.classList.add('gained');
      setTimeout(() => {
        firstEmpty.classList.remove('gained', 'empty');
      }, 600);
    }
  }

  formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  destroy() {
    this.stopUpdating();
    if (this.widget && this.widget.parentElement) {
      this.widget.parentElement.removeChild(this.widget);
    }
  }
}

export default LivesWidget;
