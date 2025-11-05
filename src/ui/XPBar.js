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
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999;
        user-select: none;
        pointer-events: none;
      }

      .xp-bar-content {
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        border-radius: 50px;
        padding: 12px 24px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        border: 2px solid rgba(255,255,255,0.1);
        min-width: 300px;
      }

      .xp-level-badge {
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
        position: relative;
        animation: levelPulse 2s ease-in-out infinite;
      }

      .xp-level-badge::before {
        content: 'LVL';
        position: absolute;
        top: -8px;
        font-size: 9px;
        font-weight: 700;
        color: #FFD700;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      }

      .level-number {
        font-size: 24px;
        font-weight: 800;
        color: #000;
        text-shadow: 0 2px 4px rgba(255,255,255,0.3);
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
        font-size: 14px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;
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
        height: 10px;
        background: rgba(255,255,255,0.1);
        border-radius: 10px;
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
    });
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
    content.classList.add('level-up');

    setTimeout(() => {
      content.classList.remove('level-up');
    }, 1000);
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
