/**
 * FarmTutorial.js
 * Système de tutoriel interactif pour le mode Ferme
 * Guide le joueur étape par étape lors de sa première visite
 */

import NotificationSystem from './NotificationSystem.js';
import GameState from '../core/GameStateManager.js';
import EventBus, { GameEvents } from '../core/EventBus.js';

export class FarmTutorial {
  static instance = null;

  constructor() {
    if (FarmTutorial.instance) {
      return FarmTutorial.instance;
    }

    this.isActive = false;
    this.currentStep = 0;
    this.steps = [];
    this.overlay = null;
    this.tooltipBox = null;
    this.highlightedElement = null;
    this.completedSteps = new Set();

    FarmTutorial.instance = this;
  }

  static getInstance() {
    if (!FarmTutorial.instance) {
      FarmTutorial.instance = new FarmTutorial();
    }
    return FarmTutorial.instance;
  }

  /**
   * Définir les étapes du tutoriel
   */
  defineTutorialSteps() {
    this.steps = [
      {
        id: 'welcome',
        title: '🌾 Bienvenue dans la Ferme IleRise !',
        message: 'Je vais vous guider pour apprendre à cultiver efficacement. Cliquez sur "Suivant" pour commencer.',
        target: null,
        position: 'center',
        action: null,
        skipHighlight: true
      },
      {
        id: 'understand-resources',
        title: '💰 Vos Ressources',
        message: 'En haut à droite, vous voyez votre argent (💰) et votre eau (💧). Chaque action consomme des ressources.',
        target: '.resources-bar',
        position: 'bottom',
        action: null
      },
      {
        id: 'understand-plot',
        title: '🗺️ Vos Parcelles',
        message: 'Voici vos parcelles. La parcelle 1 est active (verte). Les autres sont verrouillées (🔒). Cliquez sur la parcelle 1 pour continuer.',
        target: '[data-plot-id="1"]',
        position: 'right',
        action: 'click',
        waitForClick: true
      },
      {
        id: 'view-plot-info',
        title: '📊 Information Parcelle',
        message: 'Ici vous voyez l\'état de votre parcelle : culture plantée, progression, santé. Pour l\'instant elle est vide.',
        target: '.plot-info',
        position: 'left',
        action: null
      },
      {
        id: 'view-soil',
        title: '🌍 État du Sol',
        message: 'Surveillez toujours votre sol : humidité (💧), NPK (🧪), pH (⚗️), et mauvaises herbes (🌿).',
        target: '.soil-status',
        position: 'left',
        action: null
      },
      {
        id: 'select-crop',
        title: '🌾 Étape 1 : Choisir une culture',
        message: 'Avant de planter, sélectionnez une culture. Le Maïs (🌽) est idéal pour commencer - 90 jours de croissance.',
        target: '#crop-select',
        position: 'bottom',
        action: 'change',
        waitForAction: true,
        highlight: true
      },
      {
        id: 'plow-action',
        title: '🚜 Étape 2 : Labourer',
        message: 'Avant de planter, vous devez labourer la terre. Cliquez sur le bouton "Labourer" (20💰).',
        target: '[data-action="plow"]',
        position: 'left',
        action: 'click',
        waitForClick: true,
        highlight: true
      },
      {
        id: 'plant-action',
        title: '🌱 Étape 3 : Planter',
        message: 'Parfait ! Maintenant plantez votre culture sélectionnée. Cliquez sur "Planter".',
        target: '[data-action="plant"]',
        position: 'left',
        action: 'click',
        waitForClick: true,
        highlight: true
      },
      {
        id: 'understand-time',
        title: '⏰ Le Temps qui Passe',
        message: 'Les cultures grandissent avec le temps. Vous pouvez accélérer (1x, 2x, 4x, 8x) ou passer au jour suivant directement.',
        target: '.time-controls',
        position: 'left',
        action: null
      },
      {
        id: 'water-action',
        title: '💧 Étape 4 : Arroser',
        message: 'Vos plantes ont besoin d\'eau ! Arrosez régulièrement quand l\'humidité du sol est basse (<30%). Cliquez sur "Arroser".',
        target: '[data-action="water"]',
        position: 'left',
        action: 'click',
        waitForClick: true,
        highlight: true
      },
      {
        id: 'understand-actions',
        title: '🎮 Autres Actions',
        message: 'D\'autres actions sont disponibles : NPK (🧪), Compost (💩), Désherber (🌿), Pesticide (🪲). Utilisez-les selon les besoins !',
        target: '.actions-panel',
        position: 'left',
        action: null
      },
      {
        id: 'nasa-recommendations',
        title: '🛰️ Aide NASA',
        message: 'La NASA vous aide ! Ces recommandations vous disent quoi faire selon l\'état de votre parcelle.',
        target: '.nasa-recommendations',
        position: 'left',
        action: null
      },
      {
        id: 'navigation',
        title: '🧭 Navigation',
        message: 'Explorez les autres sections : Élevage (🐔), Marché (🏪) pour acheter/vendre, et Stats (📊) pour votre progression.',
        target: '.navigation-menu',
        position: 'right',
        action: null
      },
      {
        id: 'keyboard-shortcuts',
        title: '⌨️ Raccourcis Clavier',
        message: 'Astuce Pro : Utilisez les raccourcis ! L=Labourer, S=Planter, W=Arroser, F=NPK, C=Compost, D=Désherber, P=Pesticide, H=Récolter',
        target: null,
        position: 'center',
        action: null,
        skipHighlight: true
      },
      {
        id: 'complete',
        title: '🎉 Tutoriel Terminé !',
        message: 'Vous savez maintenant gérer votre ferme ! Gagnez de l\'XP avec chaque action. Bon courage, fermier ! 🌾',
        target: null,
        position: 'center',
        action: null,
        skipHighlight: true
      }
    ];
  }

  /**
   * Démarrer le tutoriel
   */
  start() {
    // Vérifier si déjà complété
    const hasCompletedTutorial = GameState.get('tutorial.farmCompleted');
    if (hasCompletedTutorial) {
      console.log('📚 Tutoriel déjà complété');
      return;
    }

    this.isActive = true;
    this.currentStep = 0;
    this.defineTutorialSteps();
    this.createOverlay();
    this.showStep(0);

    console.log('📚 Tutoriel Ferme démarré');
  }

  /**
   * Créer l'overlay et le tooltip
   */
  createOverlay() {
    // Overlay semi-transparent
    this.overlay = document.createElement('div');
    this.overlay.id = 'tutorial-overlay';
    this.overlay.className = 'tutorial-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9998;
      pointer-events: none;
    `;

    // Tooltip box
    this.tooltipBox = document.createElement('div');
    this.tooltipBox.id = 'tutorial-tooltip';
    this.tooltipBox.className = 'tutorial-tooltip';
    this.tooltipBox.style.cssText = `
      position: fixed;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      max-width: 400px;
      z-index: 10000;
      pointer-events: auto;
      animation: tooltipSlideIn 0.3s ease-out;
    `;

    document.body.appendChild(this.overlay);
    document.body.appendChild(this.tooltipBox);

    // Ajouter styles d'animation
    this.injectStyles();
  }

  /**
   * Injecter les styles CSS
   */
  injectStyles() {
    if (document.getElementById('tutorial-styles')) return;

    const style = document.createElement('style');
    style.id = 'tutorial-styles';
    style.textContent = `
      @keyframes tooltipSlideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulseHighlight {
        0%, 100% {
          box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
        }
        50% {
          box-shadow: 0 0 0 20px rgba(102, 126, 234, 0);
        }
      }

      .tutorial-highlight {
        position: relative;
        z-index: 9999 !important;
        box-shadow: 0 0 0 4px #667eea, 0 0 40px rgba(102, 126, 234, 0.8) !important;
        animation: pulseHighlight 2s infinite;
        pointer-events: auto !important;
        border-radius: 8px;
      }

      .tutorial-tooltip h3 {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: bold;
      }

      .tutorial-tooltip p {
        margin: 0 0 20px 0;
        line-height: 1.6;
        font-size: 15px;
      }

      .tutorial-tooltip-buttons {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .tutorial-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .tutorial-btn-skip {
        background: rgba(255,255,255,0.2);
        color: white;
      }

      .tutorial-btn-skip:hover {
        background: rgba(255,255,255,0.3);
      }

      .tutorial-btn-next {
        background: white;
        color: #667eea;
      }

      .tutorial-btn-next:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      }

      .tutorial-progress {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
      }

      .tutorial-progress-bar {
        flex: 1;
        height: 4px;
        background: rgba(255,255,255,0.2);
        border-radius: 2px;
        overflow: hidden;
      }

      .tutorial-progress-fill {
        height: 100%;
        background: white;
        border-radius: 2px;
        transition: width 0.3s ease;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Afficher une étape
   */
  showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.steps.length) {
      this.complete();
      return;
    }

    const step = this.steps[stepIndex];
    this.currentStep = stepIndex;

    // Retirer l'ancien highlight
    if (this.highlightedElement) {
      this.highlightedElement.classList.remove('tutorial-highlight');
      this.highlightedElement.style.pointerEvents = '';
    }

    // Trouver et highlight le nouvel élément
    let targetElement = null;
    if (step.target && !step.skipHighlight) {
      targetElement = document.querySelector(step.target);
      if (targetElement) {
        targetElement.classList.add('tutorial-highlight');
        targetElement.style.pointerEvents = 'auto';
        this.highlightedElement = targetElement;
      }
    }

    // Construire le contenu du tooltip
    const progressPercent = ((stepIndex + 1) / this.steps.length) * 100;

    this.tooltipBox.innerHTML = `
      <h3>${step.title}</h3>
      <p>${step.message}</p>
      <div class="tutorial-tooltip-buttons">
        <button class="tutorial-btn tutorial-btn-skip" data-tutorial-action="skip">
          Passer
        </button>
        ${step.waitForClick || step.waitForAction ? '' : `
          <button class="tutorial-btn tutorial-btn-next" data-tutorial-action="next">
            ${stepIndex === this.steps.length - 1 ? 'Terminer' : 'Suivant'} →
          </button>
        `}
      </div>
      <div class="tutorial-progress">
        <span>${stepIndex + 1}/${this.steps.length}</span>
        <div class="tutorial-progress-bar">
          <div class="tutorial-progress-fill" style="width: ${progressPercent}%"></div>
        </div>
      </div>
    `;

    // Positionner le tooltip
    this.positionTooltip(targetElement, step.position);

    // Attacher les event listeners
    this.attachTooltipListeners(step);

    // Si l'étape attend une action, surveiller
    if (step.waitForClick && targetElement) {
      this.waitForElementClick(targetElement, step);
    } else if (step.waitForAction && targetElement) {
      this.waitForElementAction(targetElement, step);
    }
  }

  /**
   * Positionner le tooltip
   */
  positionTooltip(targetElement, position) {
    if (!targetElement || position === 'center') {
      // Centrer
      this.tooltipBox.style.top = '50%';
      this.tooltipBox.style.left = '50%';
      this.tooltipBox.style.transform = 'translate(-50%, -50%)';
      this.tooltipBox.style.bottom = 'auto';
      this.tooltipBox.style.right = 'auto';
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const tooltipRect = this.tooltipBox.getBoundingClientRect();

    this.tooltipBox.style.transform = 'none';

    switch (position) {
      case 'top':
        this.tooltipBox.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
        this.tooltipBox.style.top = `${rect.top - tooltipRect.height - 20}px`;
        break;

      case 'bottom':
        this.tooltipBox.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
        this.tooltipBox.style.top = `${rect.bottom + 20}px`;
        break;

      case 'left':
        this.tooltipBox.style.left = `${rect.left - tooltipRect.width - 20}px`;
        this.tooltipBox.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
        break;

      case 'right':
        this.tooltipBox.style.left = `${rect.right + 20}px`;
        this.tooltipBox.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
        break;
    }

    // Ajuster si hors écran
    const finalRect = this.tooltipBox.getBoundingClientRect();
    if (finalRect.right > window.innerWidth) {
      this.tooltipBox.style.left = `${window.innerWidth - tooltipRect.width - 20}px`;
    }
    if (finalRect.left < 0) {
      this.tooltipBox.style.left = '20px';
    }
    if (finalRect.bottom > window.innerHeight) {
      this.tooltipBox.style.top = `${window.innerHeight - tooltipRect.height - 20}px`;
    }
    if (finalRect.top < 0) {
      this.tooltipBox.style.top = '20px';
    }
  }

  /**
   * Attacher les listeners du tooltip
   */
  attachTooltipListeners(step) {
    const skipBtn = this.tooltipBox.querySelector('[data-tutorial-action="skip"]');
    const nextBtn = this.tooltipBox.querySelector('[data-tutorial-action="next"]');

    if (skipBtn) {
      skipBtn.onclick = () => this.skip();
    }

    if (nextBtn) {
      nextBtn.onclick = () => this.next();
    }
  }

  /**
   * Attendre un clic sur l'élément
   */
  waitForElementClick(element, step) {
    const clickHandler = (e) => {
      element.removeEventListener('click', clickHandler);
      setTimeout(() => this.next(), 500); // Petit délai pour voir l'action
    };

    element.addEventListener('click', clickHandler);
  }

  /**
   * Attendre une action sur l'élément
   */
  waitForElementAction(element, step) {
    const actionHandler = (e) => {
      element.removeEventListener(step.action, actionHandler);
      setTimeout(() => this.next(), 500);
    };

    element.addEventListener(step.action, actionHandler);
  }

  /**
   * Passer à l'étape suivante
   */
  next() {
    this.completedSteps.add(this.steps[this.currentStep].id);
    this.showStep(this.currentStep + 1);
  }

  /**
   * Passer le tutoriel
   */
  skip() {
    if (confirm('Voulez-vous vraiment passer le tutoriel ? Vous pourrez le relancer depuis les paramètres.')) {
      this.complete(true);
    }
  }

  /**
   * Terminer le tutoriel
   */
  complete(skipped = false) {
    this.isActive = false;

    // Nettoyer
    if (this.highlightedElement) {
      this.highlightedElement.classList.remove('tutorial-highlight');
      this.highlightedElement.style.pointerEvents = '';
    }

    if (this.overlay) {
      this.overlay.remove();
    }

    if (this.tooltipBox) {
      this.tooltipBox.remove();
    }

    // Marquer comme complété
    if (!skipped) {
      GameState.set('tutorial.farmCompleted', true);
      GameState.save();

      // Notification de succès
      NotificationSystem.toast({
        type: 'achievement',
        icon: '🎓',
        title: 'Tutoriel Terminé !',
        message: 'Vous êtes maintenant un fermier IleRise confirmé !',
        duration: 5000
      });

      // Récompense XP
      GameState.addXP(50);

      // Événement
      EventBus.emit('tutorial:farm:completed', {
        stepsCompleted: this.completedSteps.size,
        totalSteps: this.steps.length
      });
    }

    console.log('📚 Tutoriel Ferme terminé', skipped ? '(passé)' : '(complété)');
  }

  /**
   * Relancer le tutoriel (depuis paramètres)
   */
  restart() {
    GameState.set('tutorial.farmCompleted', false);
    this.start();
  }

  /**
   * Vérifier si le tutoriel est actif
   */
  isRunning() {
    return this.isActive;
  }
}

export default FarmTutorial.getInstance();
