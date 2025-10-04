# 🌾 Visualisation 3D - IleRise

## FarmScene.js

Scène Three.js pour visualiser la parcelle agricole et les cultures.

### Caractéristiques

- **Scène 3D interactive** avec OrbitControls
- **6 types de cultures** avec modèles distincts
- **Animation de croissance** échelonnée
- **Réactivité aux curseurs** (eau, NPK, pH)
- **Effets visuels de stress**
- **Optimisé mobile**

---

## Cultures Supportées

### 🌽 Maïs (maize)
- Tige haute (1.5m)
- 6 feuilles vertes
- Épi doré en haut

### 🫘 Niébé (cowpea)
- Plant bas (0.6m)
- 4 feuilles compactes
- Gousses brunes

### 🍚 Riz (rice)
- Tiges fines (0.8m)
- 8 feuilles
- Grains beiges

### 🥔 Manioc (cassava)
- Tige robuste (1.2m)
- 5 feuilles larges
- Pas de fruit visible

### 🍫 Cacao (cacao)
- Arbre (2.0m)
- 10 feuilles
- Cabosses brunes

### ☁️ Coton (cotton)
- Plant moyen (1.0m)
- 6 feuilles
- Boules blanches

---

## Utilisation

### Initialisation Basique

```javascript
import { FarmScene } from './3d/FarmScene.js';

// Container HTML
const container = document.getElementById('canvas-container');

// Créer scène
const scene = new FarmScene(container);

// Planter culture (7x7 = 49 plants)
scene.plantCrop('maize', 49);

// Animer croissance
scene.animateGrowth(2000); // 2 secondes
```

### Mettre à Jour État Plants

```javascript
// Selon curseurs (eau, NPK, pH)
scene.updatePlantConditions(
  65,    // Eau (0-100%)
  100,   // NPK (0-150 kg/ha)
  6.5    // pH (4.0-8.0)
);
```

### Afficher Stress Visuel

```javascript
// Stress hydrique
scene.showStress('water');  // Plants flétrissent + brunissent

// Carence NPK
scene.showStress('nutrient'); // Jaunissement

// pH inadapté
scene.showStress('ph');       // Croissance ralentie
```

### Reset

```javascript
// Restaurer apparence normale
scene.resetPlants();
```

### Nettoyage

```javascript
// Disposer scène (important!)
scene.dispose();
```

---

## Intégration dans l'Application

### Dans `app.js`

```javascript
import { FarmScene } from './3d/FarmScene.js';

class IleRiseApp {
  constructor() {
    this.farmScene = null;
  }

  startLevel(cropId, levelId) {
    // ... autres initialisations

    // Créer scène 3D
    this.create3DScene(cropId);
  }

  create3DScene(cropId) {
    const container = document.getElementById('game-canvas-container');

    // Nettoyer ancienne scène
    if (this.farmScene) {
      this.farmScene.dispose();
    }

    // Créer nouvelle scène
    this.farmScene = new FarmScene(container);
    this.farmScene.plantCrop(cropId, 49);

    // Animation croissance
    setTimeout(() => {
      this.farmScene.animateGrowth(2000);
    }, 300);
  }
}
```

### Réagir aux Curseurs

```javascript
// Événement changement curseur
document.getElementById('cursor-container').addEventListener('cursorChange', (e) => {
  if (this.farmScene) {
    const cursors = this.currentLevelObj.getCursors();
    this.farmScene.updatePlantConditions(
      cursors.water,
      cursors.npk,
      cursors.ph
    );
  }
});
```

### Afficher Résultats Simulation

```javascript
runSimulation() {
  const results = this.currentLevelObj.runSimulation();

  // Visualiser sur plants 3D
  if (this.farmScene) {
    // Appliquer état final
    const cursors = this.currentLevelObj.getCursors();
    this.farmScene.updatePlantConditions(cursors.water, cursors.npk, cursors.ph);

    // Stress visuel si nécessaire
    if (results.stressFactor.water < 60) {
      this.farmScene.showStress('water');
    } else if (results.stressFactor.nutrient < 60) {
      this.farmScene.showStress('nutrient');
    }

    // Attendre animation
    setTimeout(() => {
      this.showResults(results, isSuccess);
    }, 1500);
  }
}
```

---

## Architecture de la Scène

### Composition

```
FarmScene
├── Scene (Three.js)
│   ├── Background (Ciel bleu #87CEEB)
│   ├── Fog (Brume atmosphérique)
│   └── Children
│       ├── Ground (Sol brun avec grille)
│       ├── Lights
│       │   ├── AmbientLight (0.5)
│       │   ├── DirectionalLight (soleil, shadows)
│       │   └── HemisphereLight (ciel/sol)
│       └── Plants[] (7x7 grille)
│           └── PlantGroup
│               ├── Stem (tige)
│               ├── Leaves[] (feuilles)
│               └── Grain? (fruit/grain si applicable)
│
├── Camera (PerspectiveCamera)
│   └── Position: (0, 8, 12)
│
├── Renderer (WebGLRenderer + shadows)
└── Controls (OrbitControls)
```

### Plant Structure

Chaque plant est un `THREE.Group` avec :

```javascript
plantGroup.userData = {
  baseScale: 1.0,
  health: 1.0,        // 0-1
  growth: 1.0,        // 0-1 (animation)
  waterLevel: 0.5,    // 0-1
  nutrientLevel: 0.5, // 0-1
  phLevel: 0.5        // 0-1
}
```

### Calcul Santé

```javascript
health = (waterLevel + nutrientLevel + phLevel) / 3

if (health < 0.3) → Jaune/Brun (#DAA520)
if (health < 0.6) → Vert pâle (#ADFF2F)
if (health >= 0.6) → Vert vif (#228B22)
```

---

## Animations

### Croissance (animateGrowth)

- Durée configurable (défaut: 2000ms)
- Échelonnée (delay 10ms entre plants)
- Ease-out cubic
- Scale 0.1 → 1.0

### Vent (auto, boucle)

```javascript
rotation.z = sin(time + offset) * 0.02
```

### Stress (manuel)

**Water :**
- Rotation aléatoire (flétrissement)
- Couleur → Brun (#D2691E)

**Nutrient :**
- Couleur → Jaune (#FFD700)

**pH :**
- Scale × 0.8 (croissance ralentie)

---

## Performance

### Optimisations

- **Low-poly models** : 8-16 segments max
- **Instancing** : Même géométrie réutilisée
- **Shadow maps** : 2048×2048
- **Frustum culling** : Auto (Three.js)
- **LOD** : Pas nécessaire (49 plants max)

### Mobile

- `devicePixelRatio` pris en compte
- Contrôles tactiles (OrbitControls)
- Canvas responsive (resize listener)

---

## Exemple Complet

```javascript
import { FarmScene } from './3d/FarmScene.js';

// HTML: <div id="farm-canvas" style="width:100%; height:400px;"></div>

const container = document.getElementById('farm-canvas');
const scene = new FarmScene(container);

// Planter maïs
scene.plantCrop('maize', 49);

// Croissance
setTimeout(() => {
  scene.animateGrowth(3000);
}, 500);

// Simuler curseurs
setTimeout(() => {
  scene.updatePlantConditions(40, 80, 5.5); // Faible eau, moyen NPK, pH acide
}, 4000);

// Afficher stress
setTimeout(() => {
  scene.showStress('water');
}, 5000);

// Reset après 7s
setTimeout(() => {
  scene.resetPlants();
}, 7000);

// Nettoyer après 10s
setTimeout(() => {
  scene.dispose();
}, 10000);
```

---

## TODO / Améliorations Futures

- [ ] Modèles 3D réalistes (GLTF)
- [ ] Particules (pluie, poussière)
- [ ] Effet jour/nuit
- [ ] Oiseaux/insectes animés
- [ ] Son ambiance (vent, pluie)
- [ ] Post-processing (bloom, SSAO)
- [ ] VR/AR support
