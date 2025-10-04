# 🎨 Améliorations Visuelles pour l'Affordance

## 🎯 Objectif : Rendre le Jeu Intuitif et Visuel

Le public cible (agriculteurs africains) a besoin d'un jeu **visuellement parlant** où les actions et données sont **immédiatement compréhensibles**.

---

## ✅ Fichiers Créés

### 1. **nasa-soil-moisture-benin.json** ✅
**Localisation :** `public/data/nasa-soil-moisture-benin.json`

**Contenu :**
- Données SMAP réelles pour 11 villes du Bénin
- Historique 30 jours d'humidité du sol
- Surface (0-5cm) et zone racinaire (0-100cm)
- Formats : volumétrique (m³/m³) et pourcentage

**Utilisation :**
```javascript
const response = await fetch('/data/nasa-soil-moisture-benin.json');
const data = await response.json();

// Parakou
const parakou = data.layers.sm_surface.locations.find(
  loc => loc.city === 'Parakou'
);

console.log(parakou.current.percentage); // 21%
console.log(parakou.current.status); // "moderate"
```

---

### 2. **VisualEffects.js** ✅
**Localisation :** `src/3d/VisualEffects.js`

**Classe :** `VisualEffects`

**Effets disponibles :**

#### A. Effets Météo
- `createRainEffect()` - Pluie visuelle 3D
- `animateRain()` - Animation gouttes qui tombent
- `createHeatWaveEffect()` - Ciel jaune/soleil intense pour canicule

#### B. Sol Visuel
- `updateSoilMoisture()` - Couleur du sol selon humidité
- `addWaterIndicators()` - Gouttes d'eau visibles sur sol humide
- `createNutrientGrid()` - Texture sol selon NPK

#### C. Plantes Visuelles
- `addHealthGlow()` - Halo coloré selon NDVI (rouge→orange→vert)
- `createGrowthBurst()` - Particules vertes lors de croissance

#### D. Affordance (Actions Claires)
- `addActionArrows()` - Flèches animées montrant où agir
- `createInfoPanel()` - Panneau 3D flottant avec texte
- `updateBillboards()` - Panneaux toujours face à la caméra

---

## 🎨 Améliorations Visuelles à Implémenter

### 1. **SOL DYNAMIQUE** (PRIORITÉ 1)

#### Avant :
```
Sol statique brun, même couleur toujours
```

#### Après :
```javascript
// Dans FarmScene.js
import { VisualEffects } from './VisualEffects.js';

class FarmScene {
  constructor(container) {
    // ...
    this.visualEffects = new VisualEffects(this.scene);
  }

  // Mettre à jour selon humidité SMAP
  updateFromNASAData(nasaData) {
    const moisture = nasaData.soilMoisture.current_percent;

    // Couleur du sol
    this.visualEffects.updateSoilMoisture(moisture, this.ground);

    // Gouttes visuelles si humide
    if (moisture > 20) {
      this.visualEffects.addWaterIndicators(moisture);
    }

    // NPK texture
    const npk = this.currentNPK || 80;
    this.visualEffects.createNutrientGrid(this.ground, npk);
  }
}
```

**Résultat Visuel :**
- Sol SEC (10-15%) : Brun clair 🟤
- Sol MOYEN (20-25%) : Brun moyen 🟫 + quelques gouttes
- Sol HUMIDE (30-35%) : Brun foncé 🟫 + beaucoup de gouttes 💧
- Sol SATURÉ (>35%) : Très foncé + flaques brillantes 💦

---

### 2. **MÉTÉO VISUELLE** (PRIORITÉ 1)

#### Effet Pluie
```javascript
// Quand il pleut (données GPM > 10mm)
if (nasaData.precipitation.today_mm > 10) {
  this.visualEffects.createRainEffect(0.8); // Intensité
}

// Dans la boucle animate()
animate() {
  this.visualEffects.animateRain();
}
```

**Résultat :**
- Gouttes qui tombent du ciel 🌧️
- Plus de gouttes si pluie intense
- S'arrête quand sec ☀️

#### Effet Canicule
```javascript
// Si température > 35°C
if (nasaData.temperature.current_c > 35) {
  this.visualEffects.createHeatWaveEffect(
    nasaData.temperature.current_c
  );
}
```

**Résultat :**
- Ciel devient jaune-orangé 🌅
- Soleil plus intense (lumière forte)
- Ambiance de chaleur visuelle

---

### 3. **SANTÉ DES PLANTES VISUELLE** (PRIORITÉ 1)

#### NDVI Visuel avec Halo
```javascript
// Pour chaque plante
this.plants.forEach(plant => {
  const ndvi = nasaData.ndvi.current;
  this.visualEffects.addHealthGlow(plant, ndvi);
});
```

**Résultat :**
- NDVI < 0.3 : Halo ROUGE 🔴 (malade)
- NDVI 0.3-0.5 : Halo ORANGE 🟠 (moyen)
- NDVI 0.5-0.7 : Halo JAUNE-VERT 🟡 (bon)
- NDVI > 0.7 : Halo VERT BRILLANT 🟢 (excellent)

**L'agriculteur voit immédiatement la santé !**

---

### 4. **AFFORDANCE : FLÈCHES D'ACTION** (CRITIQUE)

#### Montrer où agir
```javascript
// Si sol sec
if (moisture < 20) {
  const arrow = this.visualEffects.addActionArrows(
    new THREE.Vector3(0, 0, 0),
    'water'
  );

  // Animer dans la boucle
  this.visualEffects.animateActionArrows(arrow, time);
}

// Si faible NPK
if (currentNPK < 60) {
  this.visualEffects.addActionArrows(
    new THREE.Vector3(2, 0, 0),
    'fertilize'
  );
}
```

**Résultat :**
- Flèches BLEUES animées ⬇️💧 = "Arroser ici !"
- Flèches ORANGE animées ⬇️🌿 = "Fertiliser ici !"
- Flèches VERTES animées ⬇️🌽 = "Récolter ici !"

**L'agriculteur sait quoi faire sans lire !**

---

### 5. **PANNEAUX D'INFO 3D FLOTTANTS** (PRIORITÉ 2)

#### Info contextuelle
```javascript
// Au survol d'une plante
onPlantHover(plant) {
  const info = this.visualEffects.createInfoPanel(
    `NDVI: ${plant.userData.ndvi.toFixed(2)}`,
    plant.position
  );

  setTimeout(() => {
    this.scene.remove(info);
  }, 3000);
}
```

**Résultat :**
- Panneau flottant au-dessus de la plante
- Toujours face à la caméra
- Texte clair et grand
- Disparaît automatiquement

---

### 6. **ANIMATION DE CROISSANCE RÉALISTE** (PRIORITÉ 2)

#### Burst de particules lors de croissance
```javascript
// Quand plante grandit
onPlantGrow(plant) {
  const burst = this.visualEffects.createGrowthBurst(
    plant.position
  );
}

// Dans animate()
animate() {
  this.visualEffects.animateGrowthBursts(deltaTime);
}
```

**Résultat :**
- Particules vertes ✨ jaillissent de la plante
- Monte puis retombe (gravité)
- Fade out progressif
- Sensation de vie !

---

### 7. **SPLIT-SCREEN 3D AVANT/APRÈS** (CRITIQUE)

#### Double vue en temps réel
```html
<!-- Dans game.html -->
<div class="dual-3d-view">
  <div class="view-before">
    <h4>AVANT</h4>
    <div id="canvas-before"></div>
    <div class="snapshot-data">
      <div>NDVI: <span id="before-ndvi-3d">0.15</span></div>
      <div>Sol: <span id="before-soil-3d">Sec</span></div>
    </div>
  </div>

  <div class="view-arrow">→</div>

  <div class="view-after">
    <h4>APRÈS (PRÉVISION)</h4>
    <div id="canvas-after"></div>
    <div class="snapshot-data">
      <div>NDVI: <span id="after-ndvi-3d">0.78</span></div>
      <div>Sol: <span id="after-soil-3d">Optimal</span></div>
    </div>
  </div>
</div>
```

```javascript
// Créer 2 scènes
class DualSceneManager {
  constructor() {
    this.sceneBefore = new FarmScene(
      document.getElementById('canvas-before')
    );

    this.sceneAfter = new FarmScene(
      document.getElementById('canvas-after')
    );
  }

  setBeforeState(nasaData) {
    this.sceneBefore.updateFromNASAData(nasaData);
    this.sceneBefore.plantCrop('maize', 49);
  }

  predictAfterState(waterInput, npkInput, phInput) {
    // Simuler état futur
    const predictedNDVI = 0.78;
    const predictedMoisture = 32;

    this.sceneAfter.visualEffects.addHealthGlow(
      this.sceneAfter.plants[0],
      predictedNDVI
    );

    this.sceneAfter.visualEffects.updateSoilMoisture(
      predictedMoisture,
      this.sceneAfter.ground
    );

    this.sceneAfter.plants.forEach(plant => {
      plant.scale.set(3, 3, 3); // Plantes matures
    });
  }
}
```

**Résultat :**
```
┌─────────────────┬─────┬─────────────────┐
│     AVANT       │  →  │     APRÈS       │
│                 │     │                 │
│  🌱 (petit)     │     │   🌽 (grand)    │
│  Sol clair      │     │   Sol foncé     │
│  Halo rouge     │     │   Halo vert     │
│  Sec            │     │   Humide        │
└─────────────────┴─────┴─────────────────┘
```

---

### 8. **INDICATEURS VISUELS DE CURSEURS** (PRIORITÉ 1)

#### Feedback temps réel en 3D
```javascript
// Quand curseur eau change
onWaterSliderChange(value) {
  // Montrer effet immédiatement
  if (value > 70) {
    this.visualEffects.createRainEffect(0.5);
  } else {
    this.visualEffects.stopRain();
  }

  // Changer couleur du sol
  const predictedMoisture = currentMoisture + (value / 2);
  this.visualEffects.updateSoilMoisture(
    predictedMoisture,
    this.ground
  );
}

// Quand curseur NPK change
onNPKSliderChange(value) {
  // Texture du sol change
  this.visualEffects.createNutrientGrid(this.ground, value);

  // Particules vertes si bon NPK
  if (value > 100) {
    this.plants.forEach(plant => {
      this.visualEffects.createGrowthBurst(plant.position);
    });
  }
}
```

**Résultat :**
- Curseur EAU → Sol devient plus foncé en temps réel 💧
- Curseur NPK → Sol devient plus riche, particules vertes ✨
- Curseur pH → Couleur des plantes change
- **L'agriculteur VOIT l'effet avant de simuler !**

---

### 9. **LÉGENDES VISUELLES** (PRIORITÉ 2)

#### Panneau de légende permanent
```html
<div class="visual-legend">
  <h4>🎨 Légende Visuelle</h4>

  <div class="legend-item">
    <div class="color-box" style="background: #8B7355"></div>
    <span>Sol Sec (< 20%)</span>
  </div>

  <div class="legend-item">
    <div class="color-box" style="background: #654321"></div>
    <span>Sol Humide (> 25%)</span>
  </div>

  <div class="legend-item">
    <div class="glow-demo red"></div>
    <span>NDVI Faible (< 0.3)</span>
  </div>

  <div class="legend-item">
    <div class="glow-demo green"></div>
    <span>NDVI Excellent (> 0.7)</span>
  </div>

  <div class="legend-item">
    <span>⬇️💧 Flèche Bleue = Arroser</span>
  </div>

  <div class="legend-item">
    <span>⬇️🌿 Flèche Orange = Fertiliser</span>
  </div>
</div>
```

---

### 10. **SONS ET FEEDBACK AUDIO** (OPTIONNEL)

#### Sons correspondants aux actions
```javascript
class AudioFeedback {
  constructor() {
    this.sounds = {
      water: new Audio('/sounds/water-pour.mp3'),
      rain: new Audio('/sounds/rain.mp3'),
      grow: new Audio('/sounds/growth.mp3'),
      success: new Audio('/sounds/success.mp3')
    };
  }

  playWaterSound() {
    this.sounds.water.play();
  }

  playGrowthSound() {
    this.sounds.grow.play();
  }
}
```

---

## 🎯 Plan d'Implémentation Recommandé

### Phase 1 : Effets Critiques (2-3h)
1. ✅ Sol dynamique selon humidité
2. ✅ Halo santé des plantes (NDVI)
3. ✅ Flèches d'action affordantes
4. ✅ Pluie visuelle

### Phase 2 : Split-Screen (2h)
5. ✅ Double vue 3D AVANT/APRÈS
6. ✅ Prédiction visuelle temps réel

### Phase 3 : Polish (1-2h)
7. ✅ Panneaux d'info flottants
8. ✅ Particules de croissance
9. ✅ Légende visuelle permanente
10. ⏳ Sons (optionnel)

---

## 📝 Code d'Intégration dans FarmScene.js

```javascript
import { VisualEffects } from './VisualEffects.js';

export class FarmScene {
  constructor(container) {
    // ... code existant

    // NOUVEAU : Effets visuels
    this.visualEffects = new VisualEffects(this.scene);
    this.currentNASAData = null;
  }

  /**
   * NOUVEAU : Mettre à jour depuis données NASA
   */
  updateFromNASAData(nasaData) {
    this.currentNASAData = nasaData;

    // Sol selon humidité
    const moisture = nasaData.soilMoisture?.current_percent || 20;
    this.visualEffects.updateSoilMoisture(moisture, this.ground);

    // Gouttes si humide
    if (moisture > 20) {
      this.visualEffects.addWaterIndicators(moisture);
    }

    // Pluie si précipitations
    if (nasaData.precipitation?.today_mm > 10) {
      this.visualEffects.createRainEffect(0.6);
    } else {
      this.visualEffects.stopRain();
    }

    // Canicule
    if (nasaData.temperature?.current_c > 35) {
      this.visualEffects.createHeatWaveEffect(
        nasaData.temperature.current_c
      );
    }

    // Santé plantes
    const ndvi = nasaData.ndvi?.current || 0.2;
    this.plants.forEach(plant => {
      this.visualEffects.addHealthGlow(plant, ndvi);
    });
  }

  /**
   * NOUVEAU : Afficher actions recommandées
   */
  showRecommendedActions(recommendations) {
    // Flèche eau si sec
    if (recommendations.moisture.irrigationRecommended > 50) {
      this.actionArrows = this.actionArrows || [];
      const arrow = this.visualEffects.addActionArrows(
        new THREE.Vector3(0, 0, 0),
        'water'
      );
      this.actionArrows.push(arrow);
    }

    // Flèche NPK si faible
    if (recommendations.npk.recommended > 100) {
      const arrow = this.visualEffects.addActionArrows(
        new THREE.Vector3(3, 0, 0),
        'fertilize'
      );
      this.actionArrows.push(arrow);
    }
  }

  /**
   * Boucle d'animation enrichie
   */
  animate() {
    requestAnimationFrame(() => this.animate());

    const time = Date.now() * 0.001;

    // Animer pluie
    this.visualEffects.animateRain();

    // Animer flèches
    if (this.actionArrows) {
      this.actionArrows.forEach(arrow => {
        this.visualEffects.animateActionArrows(arrow, time);
      });
    }

    // Animer bursts
    this.visualEffects.animateGrowthBursts(0.016);

    // Billboards face caméra
    this.visualEffects.updateBillboards(this.camera);

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
```

---

## ✅ Résultat Final Attendu

### Ce que l'agriculteur verra :

1. **SOL VIVANT**
   - Change de couleur selon humidité 🟤→🟫
   - Gouttes visibles si humide 💧
   - Texture selon NPK 🌾

2. **MÉTÉO RÉELLE**
   - Pluie qui tombe 🌧️
   - Ciel jaune si canicule 🌅
   - Soleil intense ☀️

3. **PLANTES PARLANTES**
   - Halo rouge si malade 🔴
   - Halo vert si saine 🟢
   - Particules lors de croissance ✨

4. **ACTIONS CLAIRES**
   - Flèches bleues = Arroser ⬇️💧
   - Flèches orange = Fertiliser ⬇️🌿
   - Panneaux avec texte clair 📋

5. **COMPARAISON VISUELLE**
   - Vue AVANT : Petit, sec, rouge 🌱
   - Vue APRÈS : Grand, humide, vert 🌽
   - Différence évidente !

---

## 🎉 Impact sur l'Affordance

### AVANT :
❌ Agriculteur ne comprend pas les chiffres
❌ Doit lire beaucoup de texte
❌ Ne sait pas quoi faire
❌ Résultat abstrait

### APRÈS :
✅ Voit immédiatement l'état du champ
✅ Comprend visuellement la santé
✅ Flèches lui disent quoi faire
✅ Voit la transformation avant/après

**Le jeu devient UNIVERSEL et INTUITIF !** 🌍

---

**Développé pour le NASA Space Apps Challenge 2025** 🚀
