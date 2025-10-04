/**
 * ComparisonVisualizer.js
 * Visualisation de la comparaison avant/après et timeline
 * NASA Space Apps Challenge 2025
 */

export class ComparisonVisualizer {
  constructor() {
    this.beforeState = null;
    this.afterState = null;
  }

  /**
   * Définir les états avant/après
   */
  setState(beforeState, afterState) {
    this.beforeState = beforeState;
    this.afterState = afterState;
  }

  /**
   * Afficher la comparaison avant/après
   */
  renderComparison(beforeData, afterData, cropEmoji = '🌽') {
    // Mettre à jour les valeurs AVANT
    document.getElementById('before-ndvi').textContent = beforeData.ndvi.toFixed(2);
    document.getElementById('before-moisture').textContent = `${beforeData.moisture}%`;
    document.getElementById('before-height').textContent = `${beforeData.height}cm`;

    // Mettre à jour les valeurs APRÈS
    document.getElementById('after-ndvi').textContent = afterData.ndvi.toFixed(2);
    document.getElementById('after-moisture').textContent = `${afterData.moisture}%`;
    document.getElementById('after-height').textContent = `${afterData.height}cm`;

    // Calculer et afficher les changements
    this.updateChanges(beforeData, afterData);

    // Mettre à jour les icônes
    const beforeIcon = document.querySelector('.comparison-col.before .comparison-icon');
    const afterIcon = document.querySelector('.comparison-col.after .comparison-icon');
    if (beforeIcon) beforeIcon.textContent = '🌱';
    if (afterIcon) afterIcon.textContent = cropEmoji;

    // Durée simulation
    const duration = afterData.days || 90;
    document.getElementById('simulation-days').textContent = duration;
  }

  /**
   * Calculer et afficher les changements en pourcentage
   */
  updateChanges(before, after) {
    // NDVI
    const ndviChange = ((after.ndvi - before.ndvi) / before.ndvi) * 100;
    const ndviElement = document.getElementById('ndvi-change');
    if (ndviElement) {
      ndviElement.textContent = this.formatChange(ndviChange);
      ndviElement.className = `change ${ndviChange >= 0 ? 'positive' : 'negative'}`;
    }

    // Humidité
    const moistureChange = ((after.moisture - before.moisture) / before.moisture) * 100;
    const moistureElement = document.getElementById('moisture-change');
    if (moistureElement) {
      moistureElement.textContent = this.formatChange(moistureChange);
      moistureElement.className = `change ${moistureChange >= 0 ? 'positive' : 'negative'}`;
    }

    // Hauteur
    const heightChange = ((after.height - before.height) / before.height) * 100;
    const heightElement = document.getElementById('height-change');
    if (heightElement) {
      heightElement.textContent = this.formatChange(heightChange);
      heightElement.className = `change ${heightChange >= 0 ? 'positive' : 'negative'}`;
    }
  }

  /**
   * Formater changement en pourcentage
   */
  formatChange(value) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${Math.round(value)}%`;
  }

  /**
   * Dessiner timeline sur canvas
   */
  drawTimeline(simulationData) {
    const canvas = document.getElementById('timeline-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Nettoyer canvas
    ctx.clearRect(0, 0, width, height);

    // Données de simulation (jour par jour)
    const days = simulationData.days || 90;
    const ndviData = simulationData.ndvi || [];
    const moistureData = simulationData.moisture || [];
    const npkData = simulationData.npk || [];

    // Dessiner grille
    this.drawGrid(ctx, width, height);

    // Dessiner courbes
    this.drawCurve(ctx, ndviData, days, width, height, '#4caf50', 'NDVI');
    this.drawCurve(ctx, moistureData, days, width, height, '#2196f3', 'Humidité');
    this.drawCurve(ctx, npkData, days, width, height, '#ff9800', 'NPK');

    // Afficher événements
    this.displayEvents(simulationData.events || []);
  }

  /**
   * Dessiner grille
   */
  drawGrid(ctx, width, height) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Lignes horizontales
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Lignes verticales
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }

  /**
   * Dessiner courbe
   */
  drawCurve(ctx, data, days, width, height, color, label) {
    if (!data || data.length === 0) {
      // Générer données simulées si absentes
      data = this.generateSimulatedData(days, label);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = (index / days) * width;
      const y = height - (value * height); // Inverser Y (0 en haut)

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }

  /**
   * Générer données simulées pour démonstration
   */
  generateSimulatedData(days, type) {
    const data = [];

    for (let i = 0; i <= days; i++) {
      let value = 0;

      switch (type) {
        case 'NDVI':
          // Croissance sigmoïde
          value = 0.15 + (0.65 / (1 + Math.exp(-0.1 * (i - days / 2))));
          break;
        case 'Humidité':
          // Fluctuations avec tendance
          value = 0.3 + 0.4 * Math.sin(i * 0.2) + (i / days) * 0.2;
          value = Math.max(0.1, Math.min(0.9, value));
          break;
        case 'NPK':
          // Décroissance avec apports
          value = 0.8 - (i / days) * 0.6;
          if (i % 30 === 0 && i > 0) value += 0.3; // Apport tous les 30j
          value = Math.max(0.1, Math.min(1, value));
          break;
      }

      data.push(value);
    }

    return data;
  }

  /**
   * Afficher événements sur timeline
   */
  displayEvents(events) {
    const container = document.getElementById('timeline-events');
    if (!container) return;

    container.innerHTML = '';

    events.forEach(event => {
      const eventDiv = document.createElement('div');
      eventDiv.className = `timeline-event ${event.severity || ''}`;
      eventDiv.innerHTML = `
        <span>${event.icon || '📌'}</span>
        <span><strong>Jour ${event.day}:</strong> ${event.description}</span>
      `;
      container.appendChild(eventDiv);
    });
  }

  /**
   * Générer événements de simulation réalistes
   */
  generateSimulationEvents(days, waterInput, npkInput, nasaData) {
    const events = [];

    // Événement: Germination
    events.push({
      day: 5,
      icon: '🌱',
      description: 'Germination réussie',
      severity: 'success'
    });

    // Événement basé sur humidité
    const moisture = nasaData?.soilMoisture?.current_percent || 20;
    if (moisture < 20) {
      events.push({
        day: Math.floor(days * 0.3),
        icon: '⚠️',
        description: 'Stress hydrique détecté (humidité sol < 20%)',
        severity: 'critical'
      });
    }

    // Événement basé sur température
    const temp = nasaData?.temperature?.current_c || 28;
    if (temp > 35) {
      events.push({
        day: Math.floor(days * 0.4),
        icon: '🌡️',
        description: `Canicule (${temp}°C) - Augmentation évapotranspiration`,
        severity: 'critical'
      });
    }

    // Événement: Stade végétatif
    events.push({
      day: Math.floor(days * 0.4),
      icon: '🌿',
      description: 'Entrée en stade végétatif actif',
      severity: ''
    });

    // Événement: Floraison
    events.push({
      day: Math.floor(days * 0.6),
      icon: '🌸',
      description: 'Début floraison - Besoins en eau accrus',
      severity: 'success'
    });

    // Événement basé sur NPK
    if (npkInput < 80) {
      events.push({
        day: Math.floor(days * 0.5),
        icon: '🌾',
        description: 'Carence NPK détectée - Jaunissement feuilles',
        severity: 'critical'
      });
    }

    // Événement: Maturation
    events.push({
      day: Math.floor(days * 0.85),
      icon: '🌽',
      description: 'Maturation des grains en cours',
      severity: ''
    });

    // Événement: Récolte
    events.push({
      day: days,
      icon: '🎉',
      description: 'Récolte - Fin du cycle',
      severity: 'success'
    });

    return events.sort((a, b) => a.day - b.day);
  }

  /**
   * Mettre à jour l'état initial affiché
   */
  updateInitialState(nasaData, crop) {
    // NDVI initial
    const ndvi = nasaData?.ndvi?.current || 0.15;
    document.getElementById('initial-ndvi').textContent = ndvi.toFixed(2);
    document.getElementById('initial-ndvi-status').textContent = this.getNDVIStatus(ndvi);

    // Humidité initiale
    const moisture = nasaData?.soilMoisture?.current_percent || 18;
    document.getElementById('initial-moisture').textContent = `${moisture}%`;
    document.getElementById('initial-moisture-status').textContent = this.getMoistureStatus(moisture, crop);

    // Température initiale
    const temp = nasaData?.temperature?.current_c || 30;
    document.getElementById('initial-temp').textContent = `${temp}°C`;
    document.getElementById('initial-temp-status').textContent = this.getTempStatus(temp, crop);
  }

  /**
   * Obtenir statut NDVI
   */
  getNDVIStatus(ndvi) {
    if (ndvi < 0.2) return 'Très faible';
    if (ndvi < 0.4) return 'Faible';
    if (ndvi < 0.6) return 'Moyen';
    if (ndvi < 0.8) return 'Bon';
    return 'Excellent';
  }

  /**
   * Obtenir statut humidité
   */
  getMoistureStatus(moisture, crop) {
    const optimal = crop?.waterNeed?.optimal || 30;
    if (moisture < optimal - 10) return 'Sec';
    if (moisture < optimal - 5) return 'Légèrement sec';
    if (moisture <= optimal + 5) return 'Optimal';
    if (moisture <= optimal + 10) return 'Humide';
    return 'Saturé';
  }

  /**
   * Obtenir statut température
   */
  getTempStatus(temp, crop) {
    const optimal = crop?.tempRange?.optimal || 28;
    if (temp < optimal - 5) return 'Froid';
    if (temp < optimal - 2) return 'Frais';
    if (temp <= optimal + 2) return 'Optimal';
    if (temp <= optimal + 5) return 'Chaud';
    return 'Très chaud';
  }
}
