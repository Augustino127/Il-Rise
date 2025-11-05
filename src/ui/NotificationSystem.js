/**
 * NotificationSystem.js
 * Système de notifications avancé avec toasts, modales et alertes
 * Inspiré de Material Design, iOS et les meilleurs jeux mobiles
 * NASA Space Apps Challenge 2025
 */

import EventBus, { GameEvents } from '../core/EventBus.js';

export class NotificationSystem {
  static instance = null;

  constructor() {
    if (NotificationSystem.instance) {
      return NotificationSystem.instance;
    }

    this.queue = [];
    this.active = [];
    this.maxActive = 3;
    this.container = null;
    this.initialized = false;

    NotificationSystem.instance = this;
  }

  static getInstance() {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem();
    }
    return NotificationSystem.instance;
  }

  /**
   * Initialiser le système
   */
  init() {
    if (this.initialized) return;

    // Créer le conteneur de notifications
    this.createContainer();

    // Écouter les événements
    this.setupEventListeners();

    this.initialized = true;
    console.log('🔔 NotificationSystem initialized');
  }

  /**
   * Créer le conteneur DOM
   */
  createContainer() {
    // Conteneur pour les toasts (en haut à droite)
    this.toastContainer = document.createElement('div');
    this.toastContainer.id = 'toast-container';
    this.toastContainer.className = 'toast-container';
    document.body.appendChild(this.toastContainer);

    // Conteneur pour les notifications de progression (en bas)
    this.progressContainer = document.createElement('div');
    this.progressContainer.id = 'progress-notification-container';
    this.progressContainer.className = 'progress-notification-container';
    document.body.appendChild(this.progressContainer);

    // Injecter les styles
    this.injectStyles();
  }

  /**
   * Injecter les styles CSS
   */
  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Toast Container */
      .toast-container {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
      }

      /* Toast individuel */
      .toast {
        background: white;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        max-width: 400px;
        pointer-events: auto;
        animation: toastSlideIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        overflow: hidden;
      }

      .toast:hover {
        transform: translateX(-5px);
        box-shadow: 0 12px 32px rgba(0,0,0,0.2);
      }

      .toast.removing {
        animation: toastSlideOut 0.3s ease forwards;
      }

      /* Types de toast */
      .toast.success {
        border-left: 4px solid #4CAF50;
      }

      .toast.error {
        border-left: 4px solid #f44336;
      }

      .toast.warning {
        border-left: 4px solid #ff9800;
      }

      .toast.info {
        border-left: 4px solid #2196F3;
      }

      .toast.achievement {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
      }

      .toast.reward {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        border: none;
      }

      /* Icône du toast */
      .toast-icon {
        font-size: 28px;
        flex-shrink: 0;
        line-height: 1;
      }

      /* Contenu du toast */
      .toast-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .toast-title {
        font-weight: 600;
        font-size: 15px;
        margin: 0;
      }

      .toast-message {
        font-size: 13px;
        opacity: 0.85;
        margin: 0;
      }

      /* Barre de progression du toast */
      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: rgba(0,0,0,0.1);
        animation: toastProgress linear;
        transform-origin: left;
      }

      .toast.success .toast-progress { background: #4CAF50; }
      .toast.error .toast-progress { background: #f44336; }
      .toast.warning .toast-progress { background: #ff9800; }
      .toast.info .toast-progress { background: #2196F3; }

      /* Bouton de fermeture */
      .toast-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        opacity: 0.5;
        transition: opacity 0.2s;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .toast-close:hover {
        opacity: 1;
      }

      /* Animations */
      @keyframes toastSlideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes toastSlideOut {
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }

      @keyframes toastProgress {
        from {
          transform: scaleX(1);
        }
        to {
          transform: scaleX(0);
        }
      }

      /* Progress Notification Container */
      .progress-notification-container {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
      }

      /* Progress Notification */
      .progress-notification {
        background: rgba(0, 0, 0, 0.9);
        color: white;
        border-radius: 16px;
        padding: 20px 32px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        animation: progressFadeIn 0.3s ease;
        min-width: 400px;
      }

      .progress-notification.removing {
        animation: progressFadeOut 0.3s ease forwards;
      }

      .progress-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;
        text-align: center;
      }

      .progress-bar-wrapper {
        background: rgba(255,255,255,0.2);
        border-radius: 8px;
        height: 8px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .progress-bar-fill {
        background: linear-gradient(90deg, #4CAF50, #8BC34A);
        height: 100%;
        border-radius: 8px;
        transition: width 0.3s ease;
      }

      .progress-details {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        opacity: 0.8;
      }

      @keyframes progressFadeIn {
        from {
          transform: translateX(-50%) translateY(50px);
          opacity: 0;
        }
        to {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }

      @keyframes progressFadeOut {
        to {
          transform: translateX(-50%) translateY(50px);
          opacity: 0;
        }
      }

      /* Badge de notification */
      .notification-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #f44336;
        color: white;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 11px;
        font-weight: 600;
        min-width: 18px;
        text-align: center;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .toast-container {
          right: 10px;
          left: 10px;
          top: 60px;
        }

        .toast {
          min-width: auto;
          max-width: none;
        }

        .progress-notification {
          min-width: auto;
          max-width: calc(100vw - 40px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Écouter les événements du jeu
   */
  setupEventListeners() {
    // XP gagné
    EventBus.on(GameEvents.PLAYER_XP_GAINED, (data) => {
      this.toast({
        type: 'info',
        icon: '⭐',
        title: 'XP Gagné!',
        message: `+${data.amount} XP`,
        duration: 2000
      });
    });

    // Level up
    EventBus.on(GameEvents.PLAYER_LEVEL_UP, (data) => {
      this.toast({
        type: 'achievement',
        icon: '🎉',
        title: 'Niveau Supérieur!',
        message: `Vous êtes maintenant niveau ${data.newLevel}`,
        duration: 4000
      });
    });

    // Achievement débloqué
    EventBus.on(GameEvents.ACHIEVEMENT_UNLOCKED, (data) => {
      this.toast({
        type: 'achievement',
        icon: '🏆',
        title: 'Achievement Débloqué!',
        message: data.name,
        duration: 5000
      });
    });

    // Vie régénérée
    EventBus.on(GameEvents.PLAYER_LIFE_REGENERATED, () => {
      this.toast({
        type: 'success',
        icon: '❤️',
        title: 'Vie Régénérée',
        message: 'Vous avez récupéré une vie!',
        duration: 3000
      });
    });

    // Streak mis à jour
    EventBus.on(GameEvents.STREAK_UPDATED, (data) => {
      if (data.streak % 7 === 0) {
        // Milestone tous les 7 jours
        this.toast({
          type: 'reward',
          icon: '🔥',
          title: `${data.streak} jours d'affilée!`,
          message: 'Continuez comme ça!',
          duration: 4000
        });
      }
    });

    // Erreurs
    EventBus.on(GameEvents.ERROR_OCCURRED, (data) => {
      this.toast({
        type: 'error',
        icon: '⚠️',
        title: 'Erreur',
        message: data.message,
        duration: 5000
      });
    });
  }

  /**
   * Afficher un toast
   * @param {object} options - Options du toast
   */
  toast(options = {}) {
    const defaultOptions = {
      type: 'info', // success, error, warning, info, achievement, reward
      icon: 'ℹ️',
      title: '',
      message: '',
      duration: 3000,
      closable: true,
      onClick: null
    };

    const config = { ...defaultOptions, ...options };

    // Créer le toast
    const toast = this.createToast(config);

    // Ajouter au DOM
    this.toastContainer.appendChild(toast);
    this.active.push(toast);

    // Auto-remove après duration
    if (config.duration > 0) {
      setTimeout(() => {
        this.removeToast(toast);
      }, config.duration);
    }

    // Limiter le nombre de toasts actifs
    while (this.active.length > this.maxActive) {
      this.removeToast(this.active[0]);
    }

    // Émettre événement
    EventBus.emit(GameEvents.TOAST_SHOW, config);

    return toast;
  }

  /**
   * Créer l'élément DOM du toast
   */
  createToast(config) {
    const toast = document.createElement('div');
    toast.className = `toast ${config.type}`;

    // Icône
    const icon = document.createElement('div');
    icon.className = 'toast-icon';
    icon.textContent = config.icon;

    // Contenu
    const content = document.createElement('div');
    content.className = 'toast-content';

    if (config.title) {
      const title = document.createElement('div');
      title.className = 'toast-title';
      title.textContent = config.title;
      content.appendChild(title);
    }

    if (config.message) {
      const message = document.createElement('div');
      message.className = 'toast-message';
      message.textContent = config.message;
      content.appendChild(message);
    }

    // Bouton de fermeture
    let closeBtn = null;
    if (config.closable) {
      closeBtn = document.createElement('button');
      closeBtn.className = 'toast-close';
      closeBtn.innerHTML = '×';
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        this.removeToast(toast);
      };
    }

    // Barre de progression
    const progress = document.createElement('div');
    progress.className = 'toast-progress';
    if (config.duration > 0) {
      progress.style.animationDuration = `${config.duration}ms`;
    }

    // Assemblage
    toast.appendChild(icon);
    toast.appendChild(content);
    if (closeBtn) toast.appendChild(closeBtn);
    toast.appendChild(progress);

    // onClick
    if (config.onClick) {
      toast.style.cursor = 'pointer';
      toast.onclick = () => {
        config.onClick();
        this.removeToast(toast);
      };
    }

    return toast;
  }

  /**
   * Retirer un toast
   */
  removeToast(toast) {
    if (!toast || !toast.parentElement) return;

    toast.classList.add('removing');

    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
      const index = this.active.indexOf(toast);
      if (index !== -1) {
        this.active.splice(index, 1);
      }
    }, 300);
  }

  /**
   * Afficher une notification de succès rapide
   */
  success(message, title = 'Succès') {
    return this.toast({
      type: 'success',
      icon: '✅',
      title,
      message,
      duration: 3000
    });
  }

  /**
   * Afficher une notification d'erreur
   */
  error(message, title = 'Erreur') {
    return this.toast({
      type: 'error',
      icon: '❌',
      title,
      message,
      duration: 5000
    });
  }

  /**
   * Afficher une notification d'avertissement
   */
  warning(message, title = 'Attention') {
    return this.toast({
      type: 'warning',
      icon: '⚠️',
      title,
      message,
      duration: 4000
    });
  }

  /**
   * Afficher une notification d'information
   */
  info(message, title = 'Info') {
    return this.toast({
      type: 'info',
      icon: 'ℹ️',
      title,
      message,
      duration: 3000
    });
  }

  /**
   * Afficher une notification de récompense
   */
  reward(message, title = 'Récompense', icon = '🎁') {
    return this.toast({
      type: 'reward',
      icon,
      title,
      message,
      duration: 4000
    });
  }

  /**
   * Afficher une notification de progression
   */
  showProgress(options = {}) {
    const defaultOptions = {
      title: 'Chargement...',
      progress: 0,
      detail: ''
    };

    const config = { ...defaultOptions, ...options };

    // Créer ou mettre à jour
    let notification = this.progressContainer.querySelector('.progress-notification');

    if (!notification) {
      notification = this.createProgressNotification(config);
      this.progressContainer.appendChild(notification);
    } else {
      this.updateProgressNotification(notification, config);
    }

    return notification;
  }

  /**
   * Créer une notification de progression
   */
  createProgressNotification(config) {
    const notification = document.createElement('div');
    notification.className = 'progress-notification';

    notification.innerHTML = `
      <div class="progress-title">${config.title}</div>
      <div class="progress-bar-wrapper">
        <div class="progress-bar-fill" style="width: ${config.progress}%"></div>
      </div>
      <div class="progress-details">
        <span class="progress-detail">${config.detail}</span>
        <span class="progress-percentage">${Math.round(config.progress)}%</span>
      </div>
    `;

    return notification;
  }

  /**
   * Mettre à jour une notification de progression
   */
  updateProgressNotification(notification, config) {
    const title = notification.querySelector('.progress-title');
    const fill = notification.querySelector('.progress-bar-fill');
    const detail = notification.querySelector('.progress-detail');
    const percentage = notification.querySelector('.progress-percentage');

    if (title) title.textContent = config.title;
    if (fill) fill.style.width = `${config.progress}%`;
    if (detail) detail.textContent = config.detail;
    if (percentage) percentage.textContent = `${Math.round(config.progress)}%`;
  }

  /**
   * Cacher la notification de progression
   */
  hideProgress() {
    const notification = this.progressContainer.querySelector('.progress-notification');
    if (notification) {
      notification.classList.add('removing');
      setTimeout(() => {
        if (notification.parentElement) {
          notification.parentElement.removeChild(notification);
        }
      }, 300);
    }
  }

  /**
   * Effacer tous les toasts
   */
  clearAll() {
    this.active.forEach(toast => this.removeToast(toast));
  }
}

// Export singleton instance
export default NotificationSystem.getInstance();
