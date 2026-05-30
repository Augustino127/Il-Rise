/**
 * XPBar.js
 * Barre d'expérience animée avec niveau du joueur
 * Design inspiré de RPGs et jeux modernes
 * NASA Space Apps Challenge 2025
 */

import EventBus, { GameEvents } from '../core/EventBus.js';
import GameState from '../core/GameStateManager.js';

export class XPBar {
  constructor(container) {
    this.container = container;
    this.bar = null;
    this.init();
  }

  init() {
    this.createBar();
    this.setupEventListeners();
    this.update();
    console.log('⭐ XPBar initialized');
  }

  createBar() {
    this.bar = document.createElement('div');
    this.bar.className = 'xp-bar';
    this.bar.innerHTML = `
      <div class="xp-bar-content">
        <div class="xp-level-badge">
          <span class="level-number" id="xp-level">1</span>
        </div>
        <div class="xp-info">
          <div class="xp-text">
            <span class="current-xp" id="xp-current">0</span>
            <span class="xp-separator">/</span>
            <span class="max-xp" id="xp-max">100</span>
            <span class="xp-label">XP</span>
          </div>
          <div class="xp-progress-container">
            <div class="xp-progress-bar">
              <div class="xp-progress-fill" id="xp-progress-fill"></div>
              <div class="xp-progress-shine"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.injectStyles();
    this.container.appendChild(this.bar);

    this.elements = {
      level: this.bar.querySelector('#xp-level'),
      current: this.bar.querySelector('#xp-current'),
      max: this.bar.querySelector('#xp-max'),
      fill: this.bar.querySelector('#xp-progress-fill')
    };
  }

  injectStyles() {
    if (document.getElementById('xp-bar-styles')) return;

    const style = document.createElement('style');
    style.id = 'xp-bar-styles';
    style.textContent = `
      .xp-bar {
        position: relative;
        user-select: none;
      }

      .xp-bar-content {
        background: rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(6px);
        border-radius: 30px;
        padding: 6px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        border: 1px solid rgba(255,255,255,0.15);
        min-width: 180px;
      }

      .xp-level-badge {
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(255, 215, 0, 0.5);
        position: relative;
        flex-shrink: 0;
        animation: levelPulse 2s ease-in-out infinite;
      }

      .xp-level-badge::before {
        content: 'LVL';
        position: absolute;
        top: -7px;
        font-size: 8px;
        font-weight: 700;
        color: #FFD700;
        text-shadow: 0 1px 3px rgba(0,0,0,0.6);
      }

      .level-number {
        font-size: 16px;
        font-weight: 800;
        color: #000;
      }

      @keyframes levelPulse {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
        }
        50% {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
        }
      }

      .xp-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .xp-text {
        color: white;
        font-size: 11px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 3px;
      }

      .current-xp {
        color: #FFD700;
      }

      .xp-separator {
        opacity: 0.5;
      }

      .max-xp {
        opacity: 0.7;
      }

      .xp-label {
        margin-left: 4px;
        opacity: 0.6;
        font-size: 12px;
      }

      .xp-progress-container {
        width: 100%;
      }

      .xp-progress-bar {
        height: 6px;
        background: rgba(255,255,255,0.15);
        border-radius: 6px;
        overflow: hidden;
        position: relative;
      }

      .xp-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #FFD700 0%, #FFA500 100%);
        border-radius: 10px;
        transition: width 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        position: relative;
        box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
      }

      .xp-progress-shine {
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255,255,255,0.3),
          transparent
        );
        animation: shine 2s infinite;
      }

      @keyframes shine {
        0% {
          left: -100%;
        }
        50%, 100% {
          left: 100%;
        }
      }

      /* Animation when gaining XP */
      .xp-bar-content.gaining-xp {
        animation: xpGain 0.6s ease;
      }

      @keyframes xpGain {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }

      /* Level up animation */
      .xp-bar-content.level-up {
        animation: levelUpAnim 1s ease;
      }

      @keyframes levelUpAnim {
        0% {
          transform: scale(1);
        }
        20% {
          transform: scale(1.2) rotate(5deg);
        }
        40% {
          transform: scale(1.2) rotate(-5deg);
        }
        60% {
          transform: scale(1.2) rotate(5deg);
        }
        80% {
          transform: scale(1.2) rotate(-5deg);
        }
        100% {
          transform: scale(1);
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .xp-bar {
          bottom: 10px;
        }

        .xp-bar-content {
          min-width: 250px;
          padding: 10px 16px;
          gap: 12px;
        }

        .xp-level-badge {
          width: 40px;
          height: 40px;
        }

        .level-number {
          font-size: 20px;
        }

        .xp-text {
          font-size: 12px;
        }

        .xp-progress-bar {
          height: 8px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  setupEventListeners() {
    // Listen for XP gained
    EventBus.on(GameEvents.PLAYER_XP_GAINED, (data) => {
      this.animateXPGain();
      this.update();
    });

    // Listen for level up
    EventBus.on(GameEvents.PLAYER_LEVEL_UP, (data) => {
      this.animateLevelUp();
      this.update();
      this._showLevelUpToast(data?.newLevel);
    });

    // Listen for XP gain — aussi abonné au notify interne via GameState.subscribe si dispo
    GameState.subscribe?.('player.*', () => this.update());
  }

  update() {
    const level = GameState.get('player.level') || 1;
    const xp = GameState.get('player.xp') || 0;
    const xpToNext = GameState.get('player.xpToNextLevel') || 100;

    // Update numbers
    this.elements.level.textContent = level;
    this.elements.current.textContent = xp;
    this.elements.max.textContent = xpToNext;

    // Update progress bar
    const percentage = (xp / xpToNext) * 100;
    this.elements.fill.style.width = `${percentage}%`;
  }

  animateXPGain() {
    const content = this.bar.querySelector('.xp-bar-content');
    content.classList.add('gaining-xp');

    setTimeout(() => {
      content.classList.remove('gaining-xp');
    }, 600);
  }

  animateLevelUp() {
    const content = this.bar.querySelector('.xp-bar-content');
    if (content) {
      content.classList.add('level-up');
      setTimeout(() => content.classList.remove('level-up'), 1000);
    }
  }

  _showLevelUpToast(newLevel) {
    // Créer un toast de level-up visible partout
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.5);
      background: linear-gradient(135deg, #FFD700, #FFA500);
      color: #000;
      padding: 20px 36px;
      border-radius: 50px;
      font-size: 1.3rem;
      font-weight: 900;
      z-index: 99999;
      box-shadow: 0 0 60px rgba(255,215,0,0.6);
      pointer-events: none;
      text-align: center;
      letter-spacing: 0.02em;
      transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease;
      opacity: 0;
    `;
    toast.innerHTML = `⭐ NIVEAU ${newLevel || ''}`;
    document.body.appendChild(toast);

    // Animer
    requestAnimationFrame(() => {
      toast.style.transform = 'translate(-50%, -50%) scale(1)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.transform = 'translate(-50%, -60%) scale(1.1)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 1800);
  }

  show() {
    this.bar.style.display = 'block';
  }

  hide() {
    this.bar.style.display = 'none';
  }

  destroy() {
    if (this.bar && this.bar.parentElement) {
      this.bar.parentElement.removeChild(this.bar);
    }
  }
}

export default XPBar;
