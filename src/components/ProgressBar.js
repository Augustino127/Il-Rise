/**
 * ProgressBar Component
 * Composant barre de progression
 */

export class ProgressBar {
  /**
   * Crée une barre de progression
   * @param {Object} options - Options de la barre
   * @param {number} options.value - Valeur actuelle (0-100)
   * @param {number} options.max - Valeur max (défaut: 100)
   * @param {string} options.label - Label à afficher
   * @param {string} options.variant - Variante de couleur: 'success', 'error', 'warning', 'info'
   * @param {boolean} options.showPercentage - Afficher le pourcentage
   * @param {boolean} options.animated - Animation de progression
   * @returns {HTMLDivElement}
   */
  static create(options = {}) {
    const {
      value = 0,
      max = 100,
      label = '',
      variant = 'success',
      showPercentage = true,
      animated = true,
      className = ''
    } = options;

    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const container = document.createElement('div');
    container.className = `progress-container ${className}`.trim();

    // En-tête avec label et pourcentage
    if (label || showPercentage) {
      const header = document.createElement('div');
      header.className = 'progress-header';

      if (label) {
        const labelEl = document.createElement('span');
        labelEl.className = 'progress-label';
        labelEl.textContent = label;
        header.appendChild(labelEl);
      }

      if (showPercentage) {
        const percentEl = document.createElement('span');
        percentEl.className = 'progress-percentage';
        percentEl.textContent = `${Math.round(percentage)}%`;
        header.appendChild(percentEl);
      }

      container.appendChild(header);
    }

    // Barre de progression
    const bar = document.createElement('div');
    bar.className = `progress-bar progress-${variant}`;

    const fill = document.createElement('div');
    fill.className = `progress-fill ${animated ? 'progress-animated' : ''}`;
    fill.style.width = `${percentage}%`;

    bar.appendChild(fill);
    container.appendChild(bar);

    // Méthode pour mettre à jour la valeur
    container.setValue = (newValue) => {
      const newPercentage = Math.min(Math.max((newValue / max) * 100, 0), 100);
      fill.style.width = `${newPercentage}%`;

      if (showPercentage) {
        const percentEl = container.querySelector('.progress-percentage');
        if (percentEl) {
          percentEl.textContent = `${Math.round(newPercentage)}%`;
        }
      }
    };

    return container;
  }

  /**
   * Barre de progression simple
   */
  static simple(value, max = 100) {
    return this.create({ value, max, showPercentage: true });
  }

  /**
   * Barre de progression avec label
   */
  static labeled(label, value, max = 100) {
    return this.create({ label, value, max, showPercentage: true });
  }

  /**
   * Barre de progression circulaire
   */
  static circular(options = {}) {
    const {
      value = 0,
      max = 100,
      size = 120,
      strokeWidth = 10,
      variant = 'success',
      label = '',
      className = ''
    } = options;

    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const container = document.createElement('div');
    container.className = `progress-circular ${className}`.trim();
    container.style.width = `${size}px`;
    container.style.height = `${size}px`;

    const colorMap = {
      success: 'var(--success-color)',
      error: 'var(--error-color)',
      warning: '#F39C12',
      info: 'var(--nasa-blue)'
    };

    container.innerHTML = `
      <svg width="${size}" height="${size}" class="progress-ring">
        <circle
          class="progress-ring-bg"
          stroke="var(--bg-secondary)"
          stroke-width="${strokeWidth}"
          fill="transparent"
          r="${radius}"
          cx="${size / 2}"
          cy="${size / 2}"
        />
        <circle
          class="progress-ring-fill"
          stroke="${colorMap[variant] || colorMap.success}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${circumference} ${circumference}"
          stroke-dashoffset="${offset}"
          stroke-linecap="round"
          fill="transparent"
          r="${radius}"
          cx="${size / 2}"
          cy="${size / 2}"
          transform="rotate(-90 ${size / 2} ${size / 2})"
        />
      </svg>
      <div class="progress-circular-label">
        ${label ? `<div class="progress-circular-text">${label}</div>` : ''}
        <div class="progress-circular-value">${Math.round(percentage)}%</div>
      </div>
    `;

    return container;
  }
}

// Styles CSS à ajouter
export const progressBarStyles = `
.progress-container {
  margin-bottom: var(--spacing-md);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
  font-size: 0.875rem;
}

.progress-label {
  color: var(--text-primary);
  font-weight: 600;
}

.progress-percentage {
  color: var(--text-secondary);
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease;
}

.progress-animated {
  position: relative;
  overflow: hidden;
}

.progress-animated::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: progressShine 2s infinite;
}

@keyframes progressShine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-success .progress-fill {
  background: linear-gradient(90deg, var(--success-color), var(--success-light));
}

.progress-error .progress-fill {
  background: linear-gradient(90deg, var(--error-color), var(--error-light));
}

.progress-warning .progress-fill {
  background: linear-gradient(90deg, #F39C12, #F7931E);
}

.progress-info .progress-fill {
  background: linear-gradient(90deg, var(--nasa-blue), var(--nasa-blue-light));
}

/* Barre circulaire */
.progress-circular {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-fill {
  transition: stroke-dashoffset 0.5s ease;
}

.progress-circular-label {
  position: absolute;
  text-align: center;
}

.progress-circular-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.progress-circular-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}
`;
