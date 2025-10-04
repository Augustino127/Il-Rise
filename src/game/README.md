# 🎮 Architecture du Jeu IleRise

## Vue d'ensemble

IleRise est un jeu éducatif de simulation agricole qui intègre les données satellites NASA pour enseigner les bonnes pratiques agricoles aux agriculteurs africains.

## Structure des fichiers

```
src/
├── game/
│   ├── GameEngine.js         # Moteur principal (vies, pièces, progression)
│   ├── SimulationEngine.js   # Calcul rendement (inspiré DSSAT)
│   ├── Level.js              # Gestion niveau individuel
│   ├── CropDatabase.js       # Base de données cultures
│   ├── GameManager.js        # Gestionnaire principal
│   └── README.md             # Ce fichier
├── ui/
│   └── CursorControls.js     # Interface curseurs interactifs
└── styles/
    └── cursors.css           # Styles curseurs
```

## Flux de jeu

### 1. Initialisation

```javascript
import { gameManager } from './src/game/GameManager.js';

// Initialiser le jeu
await gameManager.init();

// Charger les données NASA et vérifier les vies
const status = gameManager.getPlayerStatus();
console.log(`Vies: ${status.lives}/5`);
console.log(`Pièces: ${status.coins}`);
```

### 2. Sélection niveau

```javascript
// Voir niveaux disponibles
const levels = gameManager.getAvailableLevels();

// Résultat :
// [
//   { id: 1, name: 'Maïs', emoji: '🌽', isUnlocked: true, unlockCost: 0 },
//   { id: 2, name: 'Niébé', emoji: '🫘', isUnlocked: false, unlockCost: 100 },
//   ...
// ]

// Débloquer niveau (si assez de pièces)
const unlockResult = gameManager.unlockLevel(2);
if (unlockResult.success) {
  console.log('Niveau 2 débloqué !');
}
```

### 3. Créer et jouer un niveau

```javascript
// Créer niveau 1 (Maïs) à Parakou
const result = gameManager.createLevel(1, 'Parakou');

if (result.success) {
  const level = result.level;

  // Obtenir recommandations NASA
  const recommendations = level.getRecommendations();
  console.log(recommendations);

  // Ajuster curseurs
  level.setWater(65);  // 65% irrigation
  level.setNPK(100);   // 100 kg/ha NPK
  level.setPH(6.5);    // pH 6.5

  // Lancer simulation
  const gameResult = gameManager.playLevel();

  if (gameResult.isLevelSuccess) {
    console.log(`✅ Niveau réussi !`);
    console.log(`Score: ${gameResult.results.score}/1000`);
    console.log(`Étoiles: ${'⭐'.repeat(gameResult.results.stars)}`);
    console.log(`Pièces gagnées: +${gameResult.rewards.coins}`);
  } else {
    console.log(`❌ Niveau échoué`);
    console.log(`Rendement: ${gameResult.results.actualYield}/${level.crop.targetYield} t/ha`);
  }
}
```

### 4. Interface utilisateur avec curseurs

```javascript
import { CursorControls } from './src/ui/CursorControls.js';

// Créer niveau
const result = gameManager.createLevel(1, 'Parakou');
const level = result.level;

// Créer interface curseurs
const cursors = new CursorControls(level, 'cursor-container');

// Écouter changements curseurs
document.getElementById('cursor-container').addEventListener('cursorChange', (e) => {
  console.log(`Curseur ${e.detail.type} modifié: ${e.detail.value}`);
});

// Bouton "Lancer Simulation"
document.getElementById('btn-simulate').addEventListener('click', () => {
  const gameResult = gameManager.playLevel();
  displayResults(gameResult);
});

// Bouton "Appliquer recommandations NASA"
document.getElementById('btn-recommendations').addEventListener('click', () => {
  cursors.applyRecommendations();
});
```

## Composants clés

### GameEngine

Gère la progression du joueur :
- ✅ Vies (5 par jour, recharge 1/4h)
- ✅ Pièces (monnaie virtuelle)
- ✅ Niveaux débloqués
- ✅ Cartes de connaissance
- ✅ Questions IA (5/jour)
- ✅ Sauvegarde LocalStorage

**Méthodes principales :**
- `loadNASAData()` - Charger données satellites
- `checkLives()` - Vérifier/recharger vies
- `addCoins(amount)` - Ajouter pièces
- `unlockLevel(levelId, cost)` - Débloquer niveau
- `completeLevel(levelId, score, stars)` - Enregistrer réussite

### SimulationEngine

Calcule rendement basé sur :
- 💧 Eau (curseur + SMAP)
- 🌿 NPK (curseur)
- ⚗️ pH (curseur)
- 🌡️ Température (MODIS)

**Formule :**
```
Rendement = RendementMax × StressEau × StressNPK × StressPH × StressTemp
Score = (Rendement/RendementMax × 600) + (MoyenneStress × 400)
```

**Méthodes principales :**
- `calculateYield(water, npk, ph)` - Calcul rendement
- `calculateWaterStress(water)` - Facteur stress hydrique
- `generateDiagnosis()` - Diagnostic textuel

### Level

Représente un niveau de jeu :
- 🌽 Culture (maïs, niébé, riz...)
- 📍 Ville (Parakou, Cotonou...)
- 📊 Données NASA locales
- 🎚️ État curseurs
- 📈 Résultats simulation

**Méthodes principales :**
- `setWater(value)` - Ajuster irrigation
- `setNPK(value)` - Ajuster fertilisation
- `setPH(value)` - Ajuster pH
- `getRecommendations()` - Conseils NASA
- `runSimulation()` - Lancer calcul
- `isSuccess()` - Vérifier réussite

### CropDatabase

Base de données 6 cultures :
1. 🌽 Maïs (Niveau 1 - Gratuit)
2. 🫘 Niébé (Niveau 2 - 100 pièces)
3. 🍚 Riz irrigué (Niveau 3 - 300 pièces)
4. 🥔 Manioc (Niveau 4 - 500 pièces)
5. 🍫 Cacao (Niveau 5 - 1000 pièces)
6. ☁️ Coton (Niveau 6 - 1500 pièces)

**Propriétés culture :**
```javascript
{
  id: 'maize',
  name: { fr: 'Maïs', fon: 'Gbàdò', wolof: 'Mburu' },
  emoji: '🌽',
  maxYield: 5.0,       // t/ha
  targetYield: 3.0,    // Objectif minimum
  waterNeed: { min: 40, optimal: 65, max: 85 },
  npkNeed: { min: 60, optimal: 100, max: 140 },
  phRange: { min: 5.5, optimal: 6.5, max: 7.5 },
  tempRange: { min: 18, optimal: 28, max: 35 }
}
```

### CursorControls

Interface utilisateur pour les curseurs :
- 💧 Slider eau (0-100%)
- 🌿 Slider NPK (0-150 kg/ha)
- ⚗️ Slider pH (4.0-8.0)
- Indicateurs visuels couleur
- Aide contextuelle
- Événements changement

## Intégration données NASA

### Température (MODIS)
```javascript
nasaData.temperature.current_c  // 30.51°C
→ Facteur stress thermique (0-1)
```

### Humidité du sol (SMAP)
```javascript
nasaData.soilMoisture.current_percent  // 15%
→ Ajouté à l'irrigation du curseur
```

### Végétation (NDVI)
```javascript
nasaData.ndvi.current  // 0.31
→ Validation santé culture
```

### Précipitations
```javascript
nasaData.precipitation.total_mm  // 7.2 mm
→ Apport eau automatique
```

## Exemple complet

```javascript
import { gameManager } from './src/game/GameManager.js';
import { CursorControls } from './src/ui/CursorControls.js';

async function startGame() {
  // 1. Initialiser
  await gameManager.init();

  // 2. Créer niveau
  const result = gameManager.createLevel(1, 'Parakou');

  if (!result.success) {
    alert(result.message);
    return;
  }

  const level = result.level;

  // 3. Créer interface
  const cursors = new CursorControls(level, 'cursor-container');

  // 4. Afficher infos niveau
  const summary = level.getSummary();
  console.log(`Culture: ${summary.cropName} ${summary.cropEmoji}`);
  console.log(`Ville: ${summary.city}`);
  console.log(`Objectif: ${summary.targetYield} t/ha`);
  console.log(`Température actuelle: ${summary.nasaData.temperature}°C`);
  console.log(`Humidité sol: ${summary.nasaData.soilMoisture}%`);

  // 5. Bouton simulation
  document.getElementById('btn-simulate').onclick = () => {
    const gameResult = gameManager.playLevel();

    if (gameResult.isLevelSuccess) {
      alert(`
        ✅ Niveau réussi !
        Score: ${gameResult.results.score}/1000
        Étoiles: ${gameResult.results.stars}/3
        Rendement: ${gameResult.results.actualYield} t/ha
        Pièces: +${gameResult.rewards.coins}
      `);
    } else {
      alert(`
        ❌ Niveau échoué
        Rendement: ${gameResult.results.actualYield}/${level.crop.targetYield} t/ha

        Problèmes détectés:
        ${gameResult.results.diagnosis.issues.join('\n')}

        Recommandations:
        ${gameResult.results.diagnosis.recommendations.join('\n')}
      `);
    }

    // Recharger vies
    const lives = gameManager.engine.checkLives();
    console.log(`Vies restantes: ${lives}/5`);
  };
}

startGame();
```

## Système de progression

### Déblocage niveaux
- 3 succès consécutifs → Niveau suivant disponible
- Coût en pièces croissant

### Économie
- Gagner pièces : Récolte réussie (score/10)
- Dépenser pièces : Débloquer niveaux, NPK, zones

### Vies
- 5 vies par jour
- Échec = -1 vie
- Recharge : 1 vie/4h ou reset minuit

### Cartes de connaissance
- Débloquées après 3 réussites
- Contenu éducatif audio/vidéo

## Prochaines étapes

1. ✅ Architecture jeu complète
2. ⏳ Intégration Three.js (visualisation 3D)
3. ⏳ Audio multilingue (TTS)
4. ⏳ Assistant IA
5. ⏳ Mode hors-ligne (Service Worker)
6. ⏳ Mapbox (sélection ville)

## Notes techniques

- **LocalStorage** : Sauvegarde progression
- **JSON** : Format données NASA
- **ES6 Modules** : Architecture modulaire
- **Événements** : Communication composants
- **CSS Variables** : Thème personnalisable
