/**
 * Modal Component
 * Composant modal générique réutilisable
 */

export class Modal {
  /**
   * Crée une modal
   * @param {Object} options - Options de la modal
   * @param {string} options.title - Titre de la modal
   * @param {string} options.content - Contenu de la modal
   * @param {Array} options.actions - Tableau de boutons {text, onClick, variant}
   * @param {boolean} options.closeButton - Afficher bouton de fermeture
   * @param {Function} options.onClose - Callback à la fermeture
   * @returns {HTMLDivElement}
   */
  static create(options = {}) {
    const {
      title = '',
      content = '',
      actions = [],
      closeButton = true,
      onClose = null,
      size = 'medium'
    } = options;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    const modalContent = document.createElement('div');
    modalContent.className = `modal-content modal-${size}`;

    // Bouton fermeture
    if (closeButton) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'modal-close';
      closeBtn.innerHTML = '✕';
      closeBtn.addEventListener('click', () => {
        this.close(modal);
        if (onClose) onClose();
      });
      modalContent.appendChild(closeBtn);
    }

    // Titre
    if (title) {
      const titleEl = document.createElement('h2');
      titleEl.className = 'modal-title';
      titleEl.textContent = title;
      modalContent.appendChild(titleEl);
    }

    // Contenu
    const bodyEl = document.createElement('div');
    bodyEl.className = 'modal-body';
    bodyEl.innerHTML = content;
    modalContent.appendChild(bodyEl);

    // Actions
    if (actions.length > 0) {
      const actionsEl = document.createElement('div');
      actionsEl.className = 'modal-actions';

      actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = `btn btn-${action.variant || 'primary'}`;
        btn.textContent = action.text;
        btn.addEventListener('click', () => {
          if (action.onClick) action.onClick();
          if (action.closeOnClick !== false) {
            this.close(modal);
          }
        });
        actionsEl.appendChild(btn);
      });

      modalContent.appendChild(actionsEl);
    }

    modal.appendChild(modalContent);

    // Fermeture au clic sur overlay
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close(modal);
        if (onClose) onClose();
      }
    });

    return modal;
  }

  /**
   * Affiche une modal
   */
  static show(modal) {
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
  }

  /**
   * Ferme une modal
   */
  static close(modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }

  /**
   * Modal de confirmation
   */
  static confirm(title, message, onConfirm) {
    const modal = this.create({
      title,
      content: `<p>${message}</p>`,
      actions: [
        { text: 'Annuler', variant: 'secondary' },
        { text: 'Confirmer', variant: 'primary', onClick: onConfirm }
      ]
    });
    this.show(modal);
    return modal;
  }

  /**
   * Modal d'alerte
   */
  static alert(title, message) {
    const modal = this.create({
      title,
      content: `<p>${message}</p>`,
      actions: [
        { text: 'OK', variant: 'primary' }
      ]
    });
    this.show(modal);
    return modal;
  }
}

// Styles CSS à ajouter
export const modalStyles = `
.modal-overlay {
  display: flex;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(46, 31, 3, 0.7);
  z-index: 1000;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.modal-overlay.active {
  opacity: 1;
}

.modal-content {
  background: #FFFFFF;
  padding: var(--spacing-2xl);
  border-radius: var(--radius-xl);
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-light);
  position: relative;
  transform: scale(0.9);
  transition: transform 0.3s ease;
}

.modal-overlay.active .modal-content {
  transform: scale(1);
}

.modal-small {
  max-width: 400px;
}

.modal-medium {
  max-width: 600px;
}

.modal-large {
  max-width: 900px;
}

.modal-close {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-medium);
}

.modal-title {
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
  font-size: 1.75rem;
  text-align: center;
}

.modal-body {
  margin-bottom: var(--spacing-xl);
  color: var(--text-primary);
  line-height: 1.6;
}

.modal-body p {
  margin-bottom: var(--spacing-md);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.modal-actions .btn {
  flex: 1;
  max-width: 200px;
}
`;
