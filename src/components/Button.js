/**
 * Button Component
 * Composant bouton réutilisable avec variantes
 */

export class Button {
  /**
   * Crée un bouton avec le style souhaité
   * @param {Object} options - Options du bouton
   * @param {string} options.text - Texte du bouton
   * @param {string} options.variant - Variante: 'primary', 'secondary', 'danger', 'success'
   * @param {string} options.size - Taille: 'small', 'medium', 'large'
   * @param {Function} options.onClick - Callback au clic
   * @param {string} options.icon - Emoji ou icône à afficher
   * @param {boolean} options.disabled - Bouton désactivé
   * @returns {HTMLButtonElement}
   */
  static create(options = {}) {
    const {
      text = '',
      variant = 'primary',
      size = 'medium',
      onClick = null,
      icon = '',
      disabled = false,
      className = ''
    } = options;

    const button = document.createElement('button');
    button.className = `btn btn-${variant} btn-${size} ${className}`.trim();

    if (icon) {
      button.innerHTML = `<span class="btn-icon">${icon}</span> ${text}`;
    } else {
      button.textContent = text;
    }

    if (disabled) {
      button.disabled = true;
      button.classList.add('btn-disabled');
    }

    if (onClick) {
      button.addEventListener('click', onClick);
    }

    return button;
  }

  /**
   * Bouton primary (principal)
   */
  static primary(text, onClick, icon = '') {
    return this.create({ text, variant: 'primary', onClick, icon });
  }

  /**
   * Bouton secondary (secondaire)
   */
  static secondary(text, onClick, icon = '') {
    return this.create({ text, variant: 'secondary', onClick, icon });
  }

  /**
   * Bouton danger (rouge)
   */
  static danger(text, onClick, icon = '') {
    return this.create({ text, variant: 'danger', onClick, icon });
  }

  /**
   * Bouton success (vert)
   */
  static success(text, onClick, icon = '') {
    return this.create({ text, variant: 'success', onClick, icon });
  }
}

// Styles CSS à ajouter
export const buttonStyles = `
.btn {
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-family: inherit;
}

.btn-icon {
  font-size: 1.2em;
}

.btn-primary {
  background: linear-gradient(135deg, var(--success-color), var(--success-dark));
  color: #FFFFFF;
  box-shadow: var(--shadow-md);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  background: linear-gradient(135deg, var(--success-light), var(--success-color));
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-medium);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-tertiary);
  border-color: var(--success-color);
}

.btn-danger {
  background: linear-gradient(135deg, var(--error-color), var(--error-dark));
  color: #FFFFFF;
  box-shadow: var(--shadow-md);
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  background: linear-gradient(135deg, var(--error-light), var(--error-color));
}

.btn-success {
  background: linear-gradient(135deg, var(--success-light), var(--success-color));
  color: #FFFFFF;
  box-shadow: var(--shadow-md);
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-small {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 0.875rem;
}

.btn-medium {
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1rem;
}

.btn-large {
  padding: var(--spacing-lg) var(--spacing-xl);
  font-size: 1.25rem;
  min-width: 200px;
}

.btn-disabled,
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}
`;
