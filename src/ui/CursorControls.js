/**
 * CursorControls.js
 * Contrôleurs de curseurs interactifs
 * NASA Space Apps Challenge 2025
 */

export class CursorControls {
  constructor(level, containerId) {
    this.level = level;
    this.container = document.getElementById(containerId);

    this.cursors = {
      water: null,
      npk: null,
      ph: null
    };

    this.init();
  }

  /**
   * Initialiser les curseurs
   */
  init() {
    if (!this.container) {
      console.error('Container non trouvé');
      return;
    }

    this.container.innerHTML = `
      <div class="cursor-controls">
        ${this.createCursorHTML('water')}
        ${this.createCursorHTML('npk')}
        ${this.createCursorHTML('ph')}
      </div>
    `;

    this.attachEventListeners();
    this.updateDisplay();
  }

  /**
   * Créer HTML pour un curseur
   */
  createCursorHTML(type) {
    const config = this.getCursorConfig(type);

    return `
      <div class="cursor-container" id="cursor-${type}">
        <div class="cursor-header">
          <span class="cursor-icon">${config.icon}</span>
          <span class="cursor-label">${config.label}</span>
          <span class="cursor-value" id="value-${type}">${config.defaultValue}${config.unit}</span>
        </div>

        <div class="cursor-slider">
          <input
            type="range"
            id="slider-${type}"
            min="${config.min}"
            max="${config.max}"
            step="${config.step}"
            value="${config.defaultValue}"
            class="slider"
          />
          <div class="cursor-range">
            <span class="range-min">${config.min}${config.unit}</span>
            <span class="range-optimal" id="optimal-${type}">
              Optimal: ${config.optimal}${config.unit}
            </span>
            <span class="range-max">${config.max}${config.unit}</span>
          </div>
        </div>

        <div class="cursor-indicator" id="indicator-${type}">
          <div class="indicator-bar"></div>
        </div>

        <div class="cursor-help" id="help-${type}">
          ${config.help}
        </div>
      </div>
    `;
  }

  /**
   * Configuration curseurs
   */
  getCursorConfig(type) {
    const crop = this.level.crop;

    const configs = {
      water: {
        icon: '💧',
        label: 'Irrigation',
        unit: '%',
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 50,
        optimal: crop.waterNeed.optimal,
        help: `Sol actuellement à ${this.level.nasaData?.soilMoisture?.current_percent || '?'}% d'humidité (SMAP)`
      },
      npk: {
        icon: '🌿',
        label: 'Fertilisation NPK',
        unit: ' kg/ha',
        min: 0,
        max: 150,
        step: 10,
        defaultValue: 50,
        optimal: crop.npkNeed.optimal,
        help: `Plage optimale pour ${crop.name.fr}: ${crop.npkNeed.min}-${crop.npkNeed.max} kg/ha`
      },
      ph: {
        icon: '⚗️',
        label: 'pH du sol',
        unit: '',
        min: 4.0,
        max: 8.0,
        step: 0.1,
        defaultValue: 6.5,
        optimal: crop.phRange.optimal,
        help: `pH optimal: ${crop.phRange.optimal} (plage: ${crop.phRange.min}-${crop.phRange.max})`
      }
    };

    return configs[type];
  }

  /**
   * Attacher événements
   */
  attachEventListeners() {
    // Curseur eau
    const waterSlider = document.getElementById('slider-water');
    if (waterSlider) {
      waterSlider.addEventListener('input', (e) => {
        this.updateCursor('water', parseFloat(e.target.value));
      });
    }

    // Curseur NPK
    const npkSlider = document.getElementById('slider-npk');
    if (npkSlider) {
      npkSlider.addEventListener('input', (e) => {
        this.updateCursor('npk', parseFloat(e.target.value));
      });
    }

    // Curseur pH
    const phSlider = document.getElementById('slider-ph');
    if (phSlider) {
      phSlider.addEventListener('input', (e) => {
        this.updateCursor('ph', parseFloat(e.target.value));
      });
    }
  }

  /**
   * Mettre à jour curseur
   */
  updateCursor(type, value) {
    // Mettre à jour niveau
    if (type === 'water') {
      this.level.setWater(value);
    } else if (type === 'npk') {
      this.level.setNPK(value);
    } else if (type === 'ph') {
      this.level.setPH(value);
    }

    // Mettre à jour affichage
    this.updateDisplay(type);

    // Émettre événement
    this.dispatchCursorChange(type, value);
  }

  /**
   * Mettre à jour affichage
   */
  updateDisplay(type = null) {
    const types = type ? [type] : ['water', 'npk', 'ph'];

    types.forEach(t => {
      const config = this.getCursorConfig(t);
      const value = this.level.cursors[t];

      // Mettre à jour valeur affichée
      const valueElement = document.getElementById(`value-${t}`);
      if (valueElement) {
        valueElement.textContent = `${value}${config.unit}`;
      }

      // Mettre à jour indicateur couleur
      this.updateIndicator(t, value, config);
    });
  }

  /**
   * Mettre à jour indicateur visuel
   */
  updateIndicator(type, value, config) {
    const indicator = document.getElementById(`indicator-${type}`);
    if (!indicator) return;

    const bar = indicator.querySelector('.indicator-bar');
    if (!bar) return;

    // Calculer distance de l'optimal
    const distanceFromOptimal = Math.abs(value - config.optimal);
    const maxDistance = (config.max - config.min) / 2;
    const ratio = 1 - (distanceFromOptimal / maxDistance);

    // Couleur basée sur proximité optimal
    let color;
    if (ratio > 0.9) {
      color = '#4CAF50'; // Vert
    } else if (ratio > 0.7) {
      color = '#8BC34A'; // Vert clair
    } else if (ratio > 0.5) {
      color = '#FFC107'; // Jaune
    } else if (ratio > 0.3) {
      color = '#FF9800'; // Orange
    } else {
      color = '#F44336'; // Rouge
    }

    bar.style.width = `${ratio * 100}%`;
    bar.style.backgroundColor = color;
  }

  /**
   * Émettre événement changement
   */
  dispatchCursorChange(type, value) {
    const event = new CustomEvent('cursorChange', {
      detail: { type, value, cursors: this.level.getCursors() }
    });
    this.container.dispatchEvent(event);
  }

  /**
   * Réinitialiser curseurs
   */
  reset() {
    ['water', 'npk', 'ph'].forEach(type => {
      const config = this.getCursorConfig(type);
      const slider = document.getElementById(`slider-${type}`);
      if (slider) {
        slider.value = config.defaultValue;
        this.updateCursor(type, config.defaultValue);
      }
    });
  }

  /**
   * Appliquer recommandations NASA
   */
  applyRecommendations() {
    const recommendations = this.level.getRecommendations();

    recommendations.forEach(rec => {
      if (rec.type === 'water' && rec.suggestion !== null) {
        const slider = document.getElementById('slider-water');
        if (slider) {
          slider.value = rec.suggestion;
          this.updateCursor('water', rec.suggestion);
        }
      } else if (rec.type === 'npk' && rec.suggestion !== null) {
        const slider = document.getElementById('slider-npk');
        if (slider) {
          slider.value = rec.suggestion;
          this.updateCursor('npk', rec.suggestion);
        }
      } else if (rec.type === 'ph' && rec.suggestion !== null) {
        const slider = document.getElementById('slider-ph');
        if (slider) {
          slider.value = rec.suggestion;
          this.updateCursor('ph', rec.suggestion);
        }
      }
    });
  }

  /**
   * Activer/désactiver curseurs
   */
  setEnabled(enabled) {
    ['water', 'npk', 'ph'].forEach(type => {
      const slider = document.getElementById(`slider-${type}`);
      if (slider) {
        slider.disabled = !enabled;
      }
    });
  }
}
