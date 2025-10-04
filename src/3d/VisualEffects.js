/**
 * VisualEffects.js
 * Effets visuels 3D pour rendre le jeu plus affordant et intuitif
 * NASA Space Apps Challenge 2025
 */

import * as THREE from 'three';

export class VisualEffects {
  constructor(scene) {
    this.scene = scene;
    this.weatherParticles = null;
    this.soilMesh = null;
    this.waterIndicators = [];
  }

  /**
   * Effet de pluie visuel
   */
  createRainEffect(intensity = 0.5) {
    if (this.weatherParticles) {
      this.scene.remove(this.weatherParticles);
    }

    const particleCount = Math.floor(intensity * 2000);
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.1,
      transparent: true,
      opacity: 0.6
    });

    this.weatherParticles = new THREE.Points(particles, material);
    this.scene.add(this.weatherParticles);
  }

  /**
   * Animer la pluie (à appeler dans la boucle d'animation)
   */
  animateRain() {
    if (!this.weatherParticles) return;

    const positions = this.weatherParticles.geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= 0.3; // Tomber

      // Réinitialiser si touche le sol
      if (positions[i + 1] < 0) {
        positions[i + 1] = 20;
      }
    }

    this.weatherParticles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Arrêter la pluie
   */
  stopRain() {
    if (this.weatherParticles) {
      this.scene.remove(this.weatherParticles);
      this.weatherParticles = null;
    }
  }

  /**
   * Changer couleur du sol selon humidité
   */
  updateSoilMoisture(moisturePercent, soilMesh) {
    if (!soilMesh) return;

    // Couleur sol sec (brun clair) → sol humide (brun foncé)
    const dryColor = new THREE.Color(0x8B7355);   // Brun clair
    const wetColor = new THREE.Color(0x4A3728);   // Brun foncé

    const color = dryColor.clone().lerp(wetColor, moisturePercent / 100);
    soilMesh.material.color = color;
  }

  /**
   * Indicateurs visuels d'humidité (gouttes)
   */
  addWaterIndicators(moisturePercent) {
    // Supprimer anciens indicateurs
    this.waterIndicators.forEach(ind => this.scene.remove(ind));
    this.waterIndicators = [];

    if (moisturePercent < 15) {
      // Sol très sec - fissures visuelles (optionnel)
      return;
    }

    // Nombre de gouttes selon humidité
    const dropCount = Math.floor((moisturePercent / 100) * 20);

    for (let i = 0; i < dropCount; i++) {
      const dropGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      const dropMaterial = new THREE.MeshStandardMaterial({
        color: 0x4da6ff,
        transparent: true,
        opacity: 0.6,
        emissive: 0x4da6ff,
        emissiveIntensity: 0.3
      });

      const drop = new THREE.Mesh(dropGeometry, dropMaterial);
      drop.position.set(
        (Math.random() - 0.5) * 12,
        0.05,
        (Math.random() - 0.5) * 12
      );

      this.scene.add(drop);
      this.waterIndicators.push(drop);
    }
  }

  /**
   * Effet de soleil intense (canicule)
   */
  createHeatWaveEffect(temperature) {
    // Changer couleur du ciel
    const skyColor = temperature > 35
      ? new THREE.Color(0xFFE4B5) // Jaune chaud
      : new THREE.Color(0x87CEEB); // Bleu normal

    this.scene.background = skyColor;

    // Augmenter intensité lumière du soleil
    const sunLight = this.scene.children.find(
      child => child instanceof THREE.DirectionalLight
    );

    if (sunLight && temperature > 35) {
      sunLight.intensity = 1.2;
      sunLight.color = new THREE.Color(0xFFFFCC); // Jaune chaud
    } else if (sunLight) {
      sunLight.intensity = 0.8;
      sunLight.color = new THREE.Color(0xFFFFFF); // Blanc normal
    }
  }

  /**
   * Halo de santé végétale (NDVI visuel)
   */
  addHealthGlow(plant, ndvi) {
    // Supprimer ancien glow
    plant.children = plant.children.filter(
      child => !child.userData.isHealthGlow
    );

    let glowColor;
    if (ndvi < 0.3) glowColor = 0xff4444; // Rouge (mauvais)
    else if (ndvi < 0.5) glowColor = 0xffaa44; // Orange (moyen)
    else if (ndvi < 0.7) glowColor = 0xaaff44; // Jaune-vert (bon)
    else glowColor = 0x44ff44; // Vert (excellent)

    const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 1;
    glow.userData.isHealthGlow = true;

    plant.add(glow);
  }

  /**
   * Flèches d'action (affordance visuelle)
   */
  addActionArrows(position, action) {
    const arrowGroup = new THREE.Group();

    let arrowColor;
    switch (action) {
      case 'water':
        arrowColor = 0x4da6ff; // Bleu
        break;
      case 'fertilize':
        arrowColor = 0xffaa44; // Orange
        break;
      case 'harvest':
        arrowColor = 0x44ff44; // Vert
        break;
      default:
        arrowColor = 0xffffff;
    }

    // Créer 3 flèches animées vers le bas
    for (let i = 0; i < 3; i++) {
      const arrowShape = new THREE.Shape();
      arrowShape.moveTo(0, 0.5);
      arrowShape.lineTo(0.2, 0);
      arrowShape.lineTo(0.1, 0);
      arrowShape.lineTo(0.1, -0.5);
      arrowShape.lineTo(-0.1, -0.5);
      arrowShape.lineTo(-0.1, 0);
      arrowShape.lineTo(-0.2, 0);
      arrowShape.lineTo(0, 0.5);

      const arrowGeometry = new THREE.ShapeGeometry(arrowShape);
      const arrowMaterial = new THREE.MeshBasicMaterial({
        color: arrowColor,
        transparent: true,
        opacity: 0.8 - i * 0.2,
        side: THREE.DoubleSide
      });

      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      arrow.position.y = 3 + i * 0.5;
      arrow.rotation.x = Math.PI;
      arrow.userData.offset = i * 0.5;

      arrowGroup.add(arrow);
    }

    arrowGroup.position.copy(position);
    arrowGroup.userData.isActionIndicator = true;
    this.scene.add(arrowGroup);

    return arrowGroup;
  }

  /**
   * Animer les flèches d'action
   */
  animateActionArrows(arrowGroup, time) {
    if (!arrowGroup) return;

    arrowGroup.children.forEach((arrow, i) => {
      const offset = arrow.userData.offset || 0;
      arrow.position.y = 3 + offset + Math.sin(time * 2 + i) * 0.2;
    });
  }

  /**
   * Effet de croissance (particules vertes)
   */
  createGrowthBurst(position) {
    const particleCount = 30;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      velocities.push({
        x: (Math.random() - 0.5) * 0.1,
        y: Math.random() * 0.15,
        z: (Math.random() - 0.5) * 0.1
      });
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x44ff44,
      size: 0.1,
      transparent: true,
      opacity: 1
    });

    const burst = new THREE.Points(particles, material);
    burst.userData.velocities = velocities;
    burst.userData.lifetime = 0;
    burst.userData.isGrowthBurst = true;

    this.scene.add(burst);

    return burst;
  }

  /**
   * Animer les bursts de croissance
   */
  animateGrowthBursts(deltaTime) {
    const bursts = this.scene.children.filter(
      child => child.userData.isGrowthBurst
    );

    bursts.forEach(burst => {
      burst.userData.lifetime += deltaTime;

      const positions = burst.geometry.attributes.position.array;
      const velocities = burst.userData.velocities;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i / 3].x;
        positions[i + 1] += velocities[i / 3].y;
        positions[i + 2] += velocities[i / 3].z;

        // Gravité
        velocities[i / 3].y -= 0.01;
      }

      burst.geometry.attributes.position.needsUpdate = true;

      // Fade out
      burst.material.opacity = Math.max(0, 1 - burst.userData.lifetime / 2);

      // Supprimer après 2 secondes
      if (burst.userData.lifetime > 2) {
        this.scene.remove(burst);
      }
    });
  }

  /**
   * Grille de sol avec couleurs selon NPK
   */
  createNutrientGrid(soilMesh, npkLevel) {
    // Texture procédurale basée sur NPK
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Couleur de base selon NPK
    let baseColor;
    if (npkLevel < 50) baseColor = '#8B4513'; // Brun (pauvre)
    else if (npkLevel < 100) baseColor = '#A0522D'; // Sienna (moyen)
    else baseColor = '#654321'; // Brun riche (riche en nutriments)

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // Texture aléatoire
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 3;

      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`;
      ctx.fillRect(x, y, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    if (soilMesh) {
      soilMesh.material.map = texture;
      soilMesh.material.needsUpdate = true;
    }
  }

  /**
   * Panel d'information flottant 3D
   */
  createInfoPanel(text, position) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Fond
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 256, 128);

    // Texte
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

    const geometry = new THREE.PlaneGeometry(2, 1);
    const panel = new THREE.Mesh(geometry, material);

    panel.position.copy(position);
    panel.position.y += 4;
    panel.userData.isInfoPanel = true;

    // Faire toujours face à la caméra
    panel.userData.isBillboard = true;

    this.scene.add(panel);
    return panel;
  }

  /**
   * Mettre à jour les billboards (toujours face caméra)
   */
  updateBillboards(camera) {
    const billboards = this.scene.children.filter(
      child => child.userData.isBillboard
    );

    billboards.forEach(billboard => {
      billboard.lookAt(camera.position);
    });
  }

  /**
   * Nettoyer tous les effets
   */
  cleanup() {
    this.stopRain();
    this.waterIndicators.forEach(ind => this.scene.remove(ind));
    this.waterIndicators = [];

    // Supprimer indicateurs d'action
    const indicators = this.scene.children.filter(
      child => child.userData.isActionIndicator ||
               child.userData.isInfoPanel ||
               child.userData.isGrowthBurst
    );

    indicators.forEach(ind => this.scene.remove(ind));
  }
}
