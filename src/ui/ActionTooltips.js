/**
 * ActionTooltips.js
 * Système de tooltips informatifs pour les actions de ferme
 * Explique chaque action, son coût, et ses effets
 */

export class ActionTooltips {
  static tooltips = {
    plow: {
      title: '🚜 Labourer',
      description: 'Prépare le sol pour la plantation',
      cost: '20💰',
      effects: ['Permet de planter', 'Améliore la structure du sol'],
      when: 'Avant de planter une nouvelle culture',
      hotkey: 'L'
    },
    plant: {
      title: '🌱 Planter',
      description: 'Plante la culture sélectionnée',
      cost: '1 graine de la culture choisie',
      effects: ['Démarre la croissance', 'Gagne 10 XP'],
      when: 'Après avoir labouré et sélectionné une culture',
      hotkey: 'S'
    },
    water: {
      title: '💧 Arroser',
      description: 'Irrigue la parcelle',
      cost: '100L d\'eau',
      effects: ['+20% humidité sol', 'Accélère croissance', 'Gagne 3 XP'],
      when: 'Quand humidité <30% ou plante en stress',
      hotkey: 'W'
    },
    fertilize_npk: {
      title: '🧪 Engrais NPK',
      description: 'Fertilise avec NPK chimique',
      cost: '20kg NPK',
      effects: ['+30 NPK sol', 'Boost croissance 20%', 'Gagne 8 XP'],
      when: 'Quand NPK sol <50%',
      hotkey: 'F'
    },
    fertilize_organic: {
      title: '💩 Compost Organique',
      description: 'Fertilise avec compost bio',
      cost: '30kg compost',
      effects: ['+20 NPK sol', '+0.2 pH', 'Bio-friendly', 'Gagne 8 XP'],
      when: 'Alternative écologique au NPK',
      hotkey: 'C'
    },
    weed: {
      title: '🌿 Désherber',
      description: 'Enlève les mauvaises herbes',
      cost: '10💰',
      effects: ['-50% mauvaises herbes', '+5% santé plante', 'Gagne 5 XP'],
      when: 'Quand mauvaises herbes >40%',
      hotkey: 'D'
    },
    spray_pesticide_natural: {
      title: '🪲 Pesticide Naturel',
      description: 'Protège contre les nuisibles',
      cost: '2L pesticide',
      effects: ['Protection 7 jours', '+10% santé', 'Gagne 7 XP'],
      when: 'Prévention ou attaque de parasites',
      hotkey: 'P'
    },
    harvest: {
      title: '🌾 Récolter',
      description: 'Récolte la culture mature',
      cost: '20💰 (main d\'œuvre)',
      effects: ['Collecte récolte', 'Libère parcelle', 'Gagne 20 XP'],
      when: 'Quand culture 100% mature (stade: Mûr)',
      hotkey: 'H'
    }
  };

  /**
   * Initialiser les tooltips sur tous les boutons d'action
   */
  static init() {
    const actionButtons = document.querySelectorAll('.action-btn[data-action]');

    actionButtons.forEach(button => {
      const actionId = button.dataset.action;
      const tooltipData = this.tooltips[actionId];

      if (!tooltipData) return;

      // Créer le tooltip element
      const tooltip = this.createTooltipElement(tooltipData);
      tooltip.style.display = 'none';
      document.body.appendChild(tooltip);

      // Événements hover
      button.addEventListener('mouseenter', (e) => {
        this.showTooltip(tooltip, button);
      });

      button.addEventListener('mouseleave', () => {
        this.hideTooltip(tooltip);
      });

      // Stocker la référence
      button._tooltip = tooltip;
    });

    console.log('✅ Tooltips d\'actions initialisés');
  }

  /**
   * Créer un élément tooltip
   */
  static createTooltipElement(data) {
    const tooltip = document.createElement('div');
    tooltip.className = 'action-tooltip';

    const effectsList = data.effects.map(e => `<li>${e}</li>`).join('');

    tooltip.innerHTML = `
      <div class="tooltip-header">
        <strong>${data.title}</strong>
        <span class="tooltip-hotkey">${data.hotkey}</span>
      </div>
      <p class="tooltip-description">${data.description}</p>
      <div class="tooltip-cost">
        <span class="tooltip-label">Coût:</span>
        <span class="tooltip-value">${data.cost}</span>
      </div>
      <div class="tooltip-effects">
        <span class="tooltip-label">Effets:</span>
        <ul>${effectsList}</ul>
      </div>
      <div class="tooltip-when">
        <span class="tooltip-label">Quand:</span>
        <span class="tooltip-value">${data.when}</span>
      </div>
    `;

    // Styles
    tooltip.style.cssText = `
      position: fixed;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      max-width: 320px;
      z-index: 10001;
      pointer-events: none;
      font-size: 13px;
      border: 1px solid rgba(255,255,255,0.1);
    `;

    return tooltip;
  }

  /**
   * Afficher le tooltip
   */
  static showTooltip(tooltip, button) {
    const rect = button.getBoundingClientRect();

    // Positionner à gauche du bouton
    tooltip.style.display = 'block';
    tooltip.style.opacity = '0';

    // Calculer position
    const tooltipRect = tooltip.getBoundingClientRect();
    let left = rect.left - tooltipRect.width - 12;
    let top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);

    // Ajuster si hors écran
    if (left < 12) {
      left = rect.right + 12; // Afficher à droite
    }

    if (top < 12) {
      top = 12;
    }

    if (top + tooltipRect.height > window.innerHeight - 12) {
      top = window.innerHeight - tooltipRect.height - 12;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;

    // Fade in
    setTimeout(() => {
      tooltip.style.transition = 'opacity 0.2s';
      tooltip.style.opacity = '1';
    }, 10);
  }

  /**
   * Cacher le tooltip
   */
  static hideTooltip(tooltip) {
    tooltip.style.opacity = '0';
    setTimeout(() => {
      tooltip.style.display = 'none';
    }, 200);
  }

  /**
   * Injecter les styles CSS
   */
  static injectStyles() {
    if (document.getElementById('action-tooltips-styles')) return;

    const style = document.createElement('style');
    style.id = 'action-tooltips-styles';
    style.textContent = `
      .action-tooltip .tooltip-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }

      .action-tooltip .tooltip-hotkey {
        background: rgba(255,255,255,0.2);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: bold;
      }

      .action-tooltip .tooltip-description {
        margin: 8px 0;
        opacity: 0.9;
        line-height: 1.4;
      }

      .action-tooltip .tooltip-cost,
      .action-tooltip .tooltip-effects,
      .action-tooltip .tooltip-when {
        margin: 8px 0;
      }

      .action-tooltip .tooltip-label {
        color: #ffd700;
        font-weight: 600;
        margin-right: 6px;
      }

      .action-tooltip .tooltip-value {
        opacity: 0.9;
      }

      .action-tooltip ul {
        margin: 4px 0 0 16px;
        padding: 0;
        list-style: none;
      }

      .action-tooltip li {
        margin: 2px 0;
        opacity: 0.85;
        line-height: 1.3;
      }

      .action-tooltip li:before {
        content: '✓ ';
        color: #4CAF50;
        margin-right: 4px;
      }

      /* Amélioration visuelle des boutons d'action */
      .action-btn {
        position: relative;
        transition: all 0.2s ease;
      }

      .action-btn:hover:not(.disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      }

      .action-btn.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        filter: grayscale(50%);
      }

      .action-btn:not(.disabled):active {
        transform: translateY(0);
      }

      /* Pulse animation pour actions importantes */
      .action-btn.action-recommended {
        animation: actionPulse 2s infinite;
      }

      @keyframes actionPulse {
        0%, 100% {
          box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
        }
        50% {
          box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

export default ActionTooltips;
