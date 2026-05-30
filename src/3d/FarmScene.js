/**
 * FarmScene.js
 * Scène 3D parcelle agricole
 * NASA Space Apps Challenge 2025
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VisualEffects } from './VisualEffects.js';

// Config des effets par action
const ACTION_EFFECTS = {
  plow:                   { color: 0x8B4513, label: '🚜 Labourage', sky: 0x87CEEB, soil: 0x4A3728 },
  plant:                  { color: 0x44ff44, label: '🌱 Plantation', sky: 0x87CEEB, soil: null },
  water:                  { color: 0x4da6ff, label: '💧 Arrosage',   sky: 0xaaddff, soil: 0x3a2a1e },
  fertilize_npk:          { color: 0xffaa44, label: '🧪 NPK',        sky: 0x87CEEB, soil: null },
  fertilize_organic:      { color: 0xa0522d, label: '💩 Compost',    sky: 0x87CEEB, soil: null },
  weed:                   { color: 0x32cd32, label: '🌿 Désherbage', sky: 0x87CEEB, soil: null },
  spray_pesticide_natural:{ color: 0x9b59b6, label: '🪲 Pesticide',  sky: 0x87CEEB, soil: null },
  harvest:                { color: 0xFFD700, label: '🌾 Récolte',    sky: 0x87CEEB, soil: null },
};

export class FarmScene {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.plants = [];
    this.animationId = null;
    this.cropType = null;
    this.effects = null;
    this.groundMesh = null;
    this._activeEffects = []; // particules en cours

    this.init();
  }

  /**
   * Initialiser la scène
   */
  init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Scène
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Ciel bleu
    this.scene.fog = new THREE.Fog(0x87CEEB, 20, 50);

    // Caméra
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    this.camera.position.set(0, 8, 12);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Contrôles
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 20;
    this.controls.target.set(0, 0, 0);

    // Lumières
    this.setupLights();

    // Sol (terrain agricole)
    this.createGround();

    // Gestion resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Effets visuels
    this.effects = new VisualEffects(this.scene);

    // Démarrer animation
    this.animate();
  }

  /**
   * Configurer lumières
   */
  setupLights() {
    // Lumière ambiante (ciel)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Lumière directionnelle (soleil)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(10, 15, 10);
    sunLight.castShadow = true;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 15;
    sunLight.shadow.camera.bottom = -15;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    this.scene.add(sunLight);

    // Lumière hémisphérique (réflexion sol/ciel)
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.3);
    this.scene.add(hemiLight);
  }

  /**
   * Créer sol
   */
  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(30, 30, 32, 32);

    // Texture sol agricole (procédurale)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321, // Brun terre
      roughness: 0.9,
      metalness: 0.1
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    // Grille légère pour référence
    const gridHelper = new THREE.GridHelper(30, 20, 0x444444, 0x333333);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);
  }

  /**
   * Planter culture
   */
  plantCrop(cropType, count = 49) {
    this.clearPlants();
    this.cropType = cropType;

    const gridSize = Math.sqrt(count);
    const spacing = 2;
    const offset = (gridSize - 1) * spacing / 2;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = i * spacing - offset;
        const z = j * spacing - offset;

        const plant = this.createPlant(cropType, x, z);
        if (plant) {
          this.scene.add(plant);
          this.plants.push(plant);
        }
      }
    }
  }

  /**
   * Créer plant selon type culture
   */
  createPlant(cropType, x, z) {
    const plantGroup = new THREE.Group();
    plantGroup.position.set(x, 0, z);

    // Paramètres par culture
    const cropParams = {
      maize: {
        stemHeight: 1.5,
        stemColor: 0x90EE90,
        leafCount: 6,
        leafColor: 0x228B22,
        hasGrain: true,
        grainColor: 0xFFD700
      },
      cowpea: {
        stemHeight: 0.6,
        stemColor: 0x8FBC8F,
        leafCount: 4,
        leafColor: 0x2E8B57,
        hasGrain: true,
        grainColor: 0x8B4513
      },
      rice: {
        stemHeight: 0.8,
        stemColor: 0x9ACD32,
        leafCount: 8,
        leafColor: 0x6B8E23,
        hasGrain: true,
        grainColor: 0xF5DEB3
      },
      cassava: {
        stemHeight: 1.2,
        stemColor: 0x8B7355,
        leafCount: 5,
        leafColor: 0x2F4F2F,
        hasGrain: false
      },
      cacao: {
        stemHeight: 2.0,
        stemColor: 0x8B4513,
        leafCount: 10,
        leafColor: 0x228B22,
        hasGrain: true,
        grainColor: 0xD2691E
      },
      cotton: {
        stemHeight: 1.0,
        stemColor: 0x90EE90,
        leafCount: 6,
        leafColor: 0x32CD32,
        hasGrain: true,
        grainColor: 0xFFFFFF
      }
    };

    const params = cropParams[cropType] || cropParams.maize;

    // Tige
    const stemGeometry = new THREE.CylinderGeometry(0.05, 0.08, params.stemHeight, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: params.stemColor });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = params.stemHeight / 2;
    stem.castShadow = true;
    plantGroup.add(stem);

    // Feuilles
    for (let i = 0; i < params.leafCount; i++) {
      const leafGeometry = new THREE.ConeGeometry(0.2, 0.4, 4);
      const leafMaterial = new THREE.MeshStandardMaterial({ color: params.leafColor });
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);

      const angle = (i / params.leafCount) * Math.PI * 2;
      const heightRatio = i / params.leafCount;

      leaf.position.x = Math.cos(angle) * 0.15;
      leaf.position.y = params.stemHeight * 0.3 + heightRatio * params.stemHeight * 0.6;
      leaf.position.z = Math.sin(angle) * 0.15;

      leaf.rotation.z = Math.PI / 2;
      leaf.rotation.y = angle;

      leaf.castShadow = true;
      plantGroup.add(leaf);
    }

    // Fruit/Grain (si applicable)
    if (params.hasGrain) {
      const grainGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      const grainMaterial = new THREE.MeshStandardMaterial({ color: params.grainColor });
      const grain = new THREE.Mesh(grainGeometry, grainMaterial);
      grain.position.y = params.stemHeight * 0.9;
      grain.castShadow = true;
      plantGroup.add(grain);
    }

    // Propriétés pour animation
    plantGroup.userData = {
      baseScale: 1.0,
      health: 1.0,
      growth: 1.0,
      waterLevel: 0.5,
      nutrientLevel: 0.5,
      phLevel: 0.5
    };

    // Scale initial (pour animation croissance)
    plantGroup.scale.set(0.1, 0.1, 0.1);

    return plantGroup;
  }

  /**
   * Nettoyer plants existants
   */
  clearPlants() {
    this.plants.forEach(plant => {
      this.scene.remove(plant);
    });
    this.plants = [];
  }

  /**
   * Mettre à jour état plants selon curseurs
   */
  updatePlantConditions(water, npk, ph) {
    this.plants.forEach(plant => {
      plant.userData.waterLevel = water / 100;
      plant.userData.nutrientLevel = npk / 150;
      plant.userData.phLevel = (ph - 4.0) / 4.0; // Normaliser 4-8 vers 0-1

      // Calculer santé globale
      plant.userData.health = (
        plant.userData.waterLevel +
        plant.userData.nutrientLevel +
        plant.userData.phLevel
      ) / 3;

      // Ajuster couleur selon santé
      this.updatePlantAppearance(plant);
    });
  }

  /**
   * Mettre à jour apparence plant selon santé
   */
  updatePlantAppearance(plant) {
    const health = plant.userData.health;

    plant.traverse((child) => {
      if (child.isMesh && child.material) {
        const originalColor = child.material.userData.originalColor;

        // Sauvegarder couleur originale
        if (!originalColor) {
          child.material.userData.originalColor = child.material.color.clone();
        }

        // Changer couleur selon santé
        if (health < 0.3) {
          // Mauvaise santé → Brun/Mort
          child.material.color.setHex(0x8B4513);
          child.material.emissive.setHex(0x000000);
        } else if (health < 0.5) {
          // Santé faible → Jaune/Flétri
          child.material.color.setHex(0xDAA520);
          child.material.emissive.setHex(0x000000);
        } else if (health < 0.7) {
          // Santé moyenne → Vert pâle
          child.material.color.setHex(0x9ACD32);
          child.material.emissive.setHex(0x000000);
        } else if (health < 0.9) {
          // Bonne santé → Vert
          child.material.color.setHex(0x32CD32);
          child.material.emissive.setHex(0x000000);
        } else {
          // Excellente santé → Vert vif avec légère lueur
          child.material.color.setHex(0x228B22);
          child.material.emissive.setHex(0x003300);
        }

        // Ajuster opacité selon santé
        if (health < 0.2) {
          child.material.opacity = 0.7;
          child.material.transparent = true;
        } else {
          child.material.opacity = 1.0;
          child.material.transparent = false;
        }
      }
    });
  }

  /**
   * Animer croissance plants
   */
  animateGrowth(duration = 2000) {
    const startTime = Date.now();

    const growthAnimation = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      this.plants.forEach((plant, index) => {
        // Croissance échelonnée
        const delay = index * 10;
        const plantProgress = Math.max(0, Math.min(1, (elapsed - delay) / duration));

        // Fonction ease-out
        const easedProgress = 1 - Math.pow(1 - plantProgress, 3);

        plant.scale.set(easedProgress, easedProgress, easedProgress);
        plant.userData.growth = easedProgress;
      });

      if (progress < 1.0) {
        requestAnimationFrame(growthAnimation);
      }
    };

    growthAnimation();
  }

  /**
   * Simuler stress visuel (effets dramatiques)
   */
  showStress(stressType) {
    this.plants.forEach((plant, index) => {
      const delay = index * 20; // Animation échelonnée

      setTimeout(() => {
        if (stressType === 'water') {
          // Stress hydrique → Flétrissement + brunissement
          plant.rotation.x = Math.random() * 0.3 - 0.15;
          plant.rotation.z = Math.random() * 0.2 - 0.1;

          // Réduction taille (plante flétrie)
          plant.scale.multiplyScalar(0.85);

          plant.traverse(child => {
            if (child.isMesh && child.material) {
              // Brun sec
              child.material.color.setHex(0x8B4513);
              child.material.roughness = 1.0; // Aspect sec
            }
          });

        } else if (stressType === 'nutrient') {
          // Carence NPK → Jaunissement + tiges fines
          plant.scale.set(
            plant.scale.x * 0.9,
            plant.scale.y * 0.85,
            plant.scale.z * 0.9
          );

          plant.traverse(child => {
            if (child.isMesh && child.material) {
              // Jaune pâle (chlorose)
              child.material.color.setHex(0xFFFF99);
              child.material.emissive.setHex(0x000000);
            }
          });

        } else if (stressType === 'ph') {
          // pH inadapté → Croissance ralentie + décoloration
          plant.scale.multiplyScalar(0.75);

          plant.traverse(child => {
            if (child.isMesh && child.material) {
              // Vert terne
              child.material.color.setHex(0x556B2F);
              child.material.opacity = 0.8;
              child.material.transparent = true;
            }
          });

        } else if (stressType === 'temperature') {
          // Stress thermique → Brûlure
          plant.rotation.y = Math.random() * 0.1 - 0.05;

          plant.traverse(child => {
            if (child.isMesh && child.material) {
              // Brun brûlé sur pointes
              child.material.color.setHex(0xA0522D);
              child.material.emissive.setHex(0x1A0000);
            }
          });
        }
      }, delay);
    });
  }

  /**
   * Afficher succès visuel (plants sains)
   */
  showSuccess() {
    this.plants.forEach((plant, index) => {
      const delay = index * 15;

      setTimeout(() => {
        // Restaurer échelle normale
        plant.scale.set(1, 1, 1);
        plant.rotation.set(0, 0, 0);

        plant.traverse(child => {
          if (child.isMesh && child.material) {
            // Vert vif et sain
            child.material.color.setHex(0x228B22);
            child.material.emissive.setHex(0x003300);
            child.material.opacity = 1.0;
            child.material.transparent = false;
            child.material.roughness = 0.7;
          }
        });

        // Petite animation de "joie"
        const startY = plant.position.y;
        const bounce = () => {
          plant.position.y = startY + Math.sin(Date.now() * 0.01) * 0.1;
        };

        const bounceInterval = setInterval(bounce, 50);
        setTimeout(() => {
          clearInterval(bounceInterval);
          plant.position.y = startY;
        }, 1000);

      }, delay);
    });
  }

  /**
   * Reset apparence plants
   */
  resetPlants() {
    this.plants.forEach(plant => {
      plant.rotation.set(0, 0, 0);
      plant.scale.set(1, 1, 1);
      plant.userData.health = 1.0;
      this.updatePlantAppearance(plant);
    });
  }

  /**
   * Lancer l'effet visuel d'une action qui démarre
   */
  showActionStart(actionId) {
    const cfg = ACTION_EFFECTS[actionId];
    if (!cfg) return;

    // Changer ciel selon action
    if (cfg.sky) this.scene.background = new THREE.Color(cfg.sky);

    // Assombrir sol si nécessaire
    if (cfg.soil && this.groundMesh) {
      this.groundMesh.material.color.setHex(cfg.soil);
    }

    switch (actionId) {
      case 'water':
        this.effects.createRainEffect(0.6);
        if (this.groundMesh) this.effects.updateSoilMoisture(70, this.groundMesh);
        break;

      case 'plow':
        this._burstParticles(new THREE.Vector3(0, 0.2, 0), 0x8B4513, 40);
        // Sol retourné directement — pas de RAF supplémentaire
        if (this.groundMesh) {
          this.groundMesh.material.color.setHex(0x3a2010);
        }
        break;

      case 'plant':
        this._burstParticles(new THREE.Vector3(0, 0.5, 0), 0x44ff44, 30);
        break;

      case 'fertilize_npk':
        this._burstParticles(new THREE.Vector3(0, 0.3, 0), 0xffaa44, 25);
        break;

      case 'fertilize_organic':
        this._burstParticles(new THREE.Vector3(0, 0.3, 0), 0xa0522d, 25);
        break;

      case 'weed':
        this._burstParticles(new THREE.Vector3(0, 0.2, 0), 0x32cd32, 20);
        break;

      case 'spray_pesticide_natural':
        this._burstParticles(new THREE.Vector3(0, 1, 0), 0x9b59b6, 25);
        break;

      case 'harvest':
        this._burstParticles(new THREE.Vector3(0, 1, 0), 0xFFD700, 40);
        break;
    }
  }

  /**
   * Afficher l'effet de fin d'action
   */
  showActionComplete(actionId) {
    const cfg = ACTION_EFFECTS[actionId];

    // Remettre ciel normal
    this.scene.background = new THREE.Color(0x87CEEB);

    if (actionId === 'water') {
      this.effects.stopRain();
      if (this.groundMesh) this.effects.updateSoilMoisture(65, this.groundMesh);
    }

    if (actionId === 'harvest') {
      // Effacer les plants récoltés avec une animation
      this.plants.forEach((p, i) => {
        setTimeout(() => {
          const shrink = () => {
            p.scale.multiplyScalar(0.88);
            if (p.scale.x > 0.01) requestAnimationFrame(shrink);
            else this.scene.remove(p);
          };
          shrink();
        }, i * 15);
      });
      this.plants = [];
    }

    // Burst doré de complétion
    const color = cfg ? cfg.color : 0xffffff;
    this._burstParticles(new THREE.Vector3(0, 2, 0), color, 30, true);

    if (actionId === 'plant') {
      this.showSuccess();
    }
  }

  /**
   * Émettre un burst de particules
   */
  _burstParticles(origin, color, count = 40, rise = false) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3]     = origin.x + (Math.random() - 0.5) * 2;
      pos[i * 3 + 1] = origin.y;
      pos[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 2;
      vel.push({
        x: (Math.random() - 0.5) * 0.12,
        y: rise ? Math.random() * 0.15 : (Math.random() - 0.3) * 0.1,
        z: (Math.random() - 0.5) * 0.12,
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({ color, size: 0.18, transparent: true, opacity: 1 });
    const burst = new THREE.Points(geo, mat);
    burst.userData = { vel, life: 0, maxLife: 1.5 };
    this.scene.add(burst);
    this._activeEffects.push(burst);
  }

  /**
   * Boucle animation
   */
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const time = Date.now() * 0.001;
    const delta = 0.016; // ~60fps

    // Vent sur les plants
    this.plants.forEach((plant, index) => {
      plant.rotation.z = Math.sin(time + index * 0.5) * 0.02;
    });

    // Pluie
    if (this.effects) this.effects.animateRain();

    // Particules burst
    for (let i = this._activeEffects.length - 1; i >= 0; i--) {
      const burst = this._activeEffects[i];
      burst.userData.life += delta;
      const t = burst.userData.life / burst.userData.maxLife;

      const pos = burst.geometry.attributes.position.array;
      const vel = burst.userData.vel;
      for (let j = 0; j < vel.length; j++) {
        pos[j * 3]     += vel[j].x;
        pos[j * 3 + 1] += vel[j].y;
        pos[j * 3 + 2] += vel[j].z;
        vel[j].y -= 0.004; // gravité légère
      }
      burst.geometry.attributes.position.needsUpdate = true;
      burst.material.opacity = Math.max(0, 1 - t);

      if (t >= 1) {
        this.scene.remove(burst);
        this._activeEffects.splice(i, 1);
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Gestion resize
   */
  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Nettoyer
   */
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    this.clearPlants();

    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }

    window.removeEventListener('resize', () => this.onWindowResize());
  }
}
