/**
 * Card Component
 * Composant carte réutilisable avec header, body, footer
 */

export class Card {
  /**
   * Crée une carte
   * @param {Object} options - Options de la carte
   * @param {string} options.header - Contenu du header
   * @param {string} options.body - Contenu du body
   * @param {string} options.footer - Contenu du footer
   * @param {string} options.className - Classes CSS additionnelles
   * @returns {HTMLDivElement}
   */
  static create(options = {}) {
    const {
      header = '',
      body = '',
      footer = '',
      className = '',
      variant = 'default'
    } = options;

    const card = document.createElement('div');
    card.className = `card card-${variant} ${className}`.trim();

    if (header) {
      const headerEl = document.createElement('div');
      headerEl.className = 'card-header';
      headerEl.innerHTML = header;
      card.appendChild(headerEl);
    }

    if (body) {
      const bodyEl = document.createElement('div');
      bodyEl.className = 'card-body';
      bodyEl.innerHTML = body;
      card.appendChild(bodyEl);
    }

    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'card-footer';
      footerEl.innerHTML = footer;
      card.appendChild(footerEl);
    }

    return card;
  }

  /**
   * Crée une carte avec header et body seulement
   */
  static simple(header, body) {
    return this.create({ header, body });
  }

  /**
   * Crée une carte complète
   */
  static full(header, body, footer) {
    return this.create({ header, body, footer });
  }
}

// Styles CSS à ajouter
export const cardStyles = `
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  font-weight: 600;
  font-size: 1.125rem;
  color: var(--text-primary);
}

.card-body {
  padding: var(--spacing-lg);
  color: var(--text-primary);
}

.card-footer {
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-light);
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.card-default {
  border-color: var(--border-light);
}

.card-success {
  border-color: var(--success-color);
  border-width: 2px;
}

.card-success .card-header {
  background: #E8F5E9;
  color: var(--success-dark);
}

.card-danger {
  border-color: var(--error-color);
  border-width: 2px;
}

.card-danger .card-header {
  background: #FFEBEE;
  color: var(--error-dark);
}

.card-info {
  border-color: var(--nasa-blue);
  border-width: 2px;
}

.card-info .card-header {
  background: #E3F2FD;
  color: var(--nasa-blue);
}
`;
