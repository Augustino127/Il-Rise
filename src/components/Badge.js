/**
 * Badge Component
 * Composant badge coloré pour statuts
 */

export class Badge {
  /**
   * Crée un badge
   * @param {Object} options - Options du badge
   * @param {string} options.text - Texte du badge
   * @param {string} options.variant - Variante: 'success', 'error', 'warning', 'info', 'default'
   * @param {string} options.icon - Icône/emoji optionnel
   * @returns {HTMLSpanElement}
   */
  static create(options = {}) {
    const {
      text = '',
      variant = 'default',
      icon = '',
      className = ''
    } = options;

    const badge = document.createElement('span');
    badge.className = `badge badge-${variant} ${className}`.trim();

    if (icon) {
      badge.innerHTML = `<span class="badge-icon">${icon}</span> ${text}`;
    } else {
      badge.textContent = text;
    }

    return badge;
  }

  /**
   * Badge de succès (vert)
   */
  static success(text, icon = '✓') {
    return this.create({ text, variant: 'success', icon });
  }

  /**
   * Badge d'erreur (rouge)
   */
  static error(text, icon = '✕') {
    return this.create({ text, variant: 'error', icon });
  }

  /**
   * Badge d'avertissement (orange)
   */
  static warning(text, icon = '⚠') {
    return this.create({ text, variant: 'warning', icon });
  }

  /**
   * Badge d'info (bleu)
   */
  static info(text, icon = 'ℹ') {
    return this.create({ text, variant: 'info', icon });
  }

  /**
   * Badge par défaut (gris)
   */
  static default(text, icon = '') {
    return this.create({ text, variant: 'default', icon });
  }
}

// Styles CSS à ajouter
export const badgeStyles = `
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.badge-icon {
  font-size: 1em;
}

.badge-success {
  background: var(--success-light);
  color: var(--success-dark);
}

.badge-error {
  background: var(--error-light);
  color: var(--error-dark);
}

.badge-warning {
  background: #FEF3D7;
  color: #D68910;
}

.badge-info {
  background: #E3F2FD;
  color: var(--nasa-blue);
}

.badge-default {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
}
`;
