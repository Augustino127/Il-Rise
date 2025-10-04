# Quick Start - Systeme de Competences

## Installation rapide

Le systeme de competences est pret a l'emploi. Suivez ces etapes :

### 1. Importer les modules

```javascript
import { GameEngine } from './src/game/GameEngine.js';
```

### 2. Initialiser le moteur de jeu

```javascript
const engine = new GameEngine();

// Charger donnees NASA (requis)
await engine.loadNASAData();
```

### 3. Verifier les vies disponibles

```javascript
const lives = engine.getLivesUI();

if (lives.isEmpty) {
  alert(`Plus de vies ! Prochaine dans ${lives.timeUntilNext}`);
  return;
}

console.log(lives.hearts); // ❤️❤️❤️❤️❤️
```

### 4. Demarrer une partie

```javascript
// Format : levelKey, cropId, levelId
const game = engine.startGame('maize_1', 'maize', 1);

console.log('Partie demarree:', game);
```

### 5. (Optionnel) Utiliser les donnees NASA

```javascript
// Types disponibles : 'temperature', 'ndvi', 'precipitation', 'smap'
engine.useNASAData(['temperature', 'precipitation', 'ndvi']);
```

### 6. Configurer les parametres de culture

```javascript
// Recuperer infos culture
import { getCrop } from './src/game/CropDatabase.js';
const cropInfo = getCrop('maize');

// Preparer donnees de partie
const gameData = {
  crop: {
    id: cropInfo.id,
    family: 'cereal', // cereal, legume, tuber, tree_crop, fiber
    water_requirements: {
      min_mm: cropInfo.waterNeed.min * 10, // Convertir % en mm
      max_mm: cropInfo.waterNeed.max * 10
    },
    nutrient_requirements: {
      nitrogen: { optimal: cropInfo.npkNeed.optimal },
      phosphorus: { optimal: cropInfo.npkNeed.optimal * 0.5 },
      potassium: { optimal: cropInfo.npkNeed.optimal * 0.7 }
    },
    soil_requirements: {
      ph: { min: cropInfo.phRange.min, max: cropInfo.phRange.max },
      texture: { preferred: ['loam', 'sandy_loam'] }
    }
  },

  // Parametres joueur
  irrigation: 500,           // mm d'eau
  weather: 'optimal',        // optimal/dry/rainy/drought
  soilMoisture: 40,          // % humidite

  npk: {
    nitrogen: 120,           // kg/ha
    phosphorus: 60,
    potassium: 80
  },

  budget: {
    spent: 80,
    max: 100
  },

  soil: {
    ph: 6.5,
    texture: 'loam'          // sandy/sandy_loam/loam/clay_loam/clay
  }
};
```

### 7. Completer la partie

```javascript
const result = engine.completeLevel(gameData);

console.log('=== RESULTATS ===');
console.log(`Score global: ${result.game.globalScore}/100`);
console.log(`Etoiles: ${'⭐'.repeat(result.game.stars)}`);
console.log(`Pieces gagnees: +${result.coins}`);
console.log(`Total pieces: ${result.totalCoins}`);

console.log('\n=== SCORES PAR COMPETENCE ===');
result.details.breakdown.forEach(comp => {
  console.log(`${comp.emoji} ${comp.competence}: ${comp.score}/100`);
});

console.log('\n=== FEEDBACK ===');
console.log(result.feedback.overall.message);

Object.keys(result.feedback.competences).forEach(comp => {
  console.log(`- ${comp}: ${result.feedback.competences[comp]}`);
});

// Verifier deverrouillages
if (result.unlocks.levels.length > 0) {
  console.log('\n🎉 Nouveaux niveaux deverrouilles !');
  result.unlocks.levels.forEach(level => {
    console.log(`- ${level.cropId} niveau ${level.levelId}`);
  });
}
```

### 8. Consulter la progression

```javascript
// Historique d'un niveau
const history = engine.progressManager.getLevelHistory('maize_1');
console.log(`Meilleur score: ${history.bestScore}/100`);
console.log(`Parties jouees: ${history.totalPlays}`);
console.log(`Progression deverrouillage: ${history.unlockProgress.percentage}%`);

// Stats globales
const progress = engine.progressManager.loadPlayerProgress();
const summary = engine.progressManager.getProgressSummary(progress);

console.log(`Total parties: ${summary.totalGames}`);
console.log(`Total etoiles: ${summary.totalStars}`);
console.log(`Scores parfaits: ${summary.perfectScores}`);
console.log(`Serie victoires: ${summary.consecutiveWins}`);
console.log(`Completion: ${summary.completion.percentage}%`);

// Stats par competence
Object.keys(summary.competences).forEach(comp => {
  const stat = summary.competences[comp];
  console.log(`${stat.emoji} ${stat.name}:`);
  console.log(`  Meilleur: ${stat.best}/100`);
  console.log(`  Moyenne: ${stat.average}/100`);
  console.log(`  Niveau: ${stat.level.emoji} ${stat.level.level}`);
});
```

---

## Exemple complet (copy-paste)

```javascript
import { GameEngine } from './src/game/GameEngine.js';
import { getCrop } from './src/game/CropDatabase.js';

async function jouerPartie() {
  // 1. Initialiser
  const engine = new GameEngine();
  await engine.loadNASAData();

  // 2. Verifier vies
  const lives = engine.getLivesUI();
  if (lives.isEmpty) {
    console.log(`Pas de vies ! Prochaine dans ${lives.timeUntilNext}`);
    return;
  }

  // 3. Demarrer
  engine.startGame('maize_1', 'maize', 1);

  // 4. Utiliser NASA
  engine.useNASAData(['temperature', 'precipitation']);

  // 5. Jouer
  const cropInfo = getCrop('maize');
  const gameData = {
    crop: {
      id: 'maize',
      family: 'cereal',
      water_requirements: { min_mm: 400, max_mm: 600 },
      nutrient_requirements: {
        nitrogen: { optimal: 120 },
        phosphorus: { optimal: 60 },
        potassium: { optimal: 80 }
      },
      soil_requirements: {
        ph: { min: 6.0, max: 7.0 },
        texture: { preferred: ['loam'] }
      }
    },
    irrigation: 500,
    weather: 'optimal',
    soilMoisture: 40,
    npk: { nitrogen: 120, phosphorus: 60, potassium: 80 },
    budget: { spent: 80, max: 100 },
    soil: { ph: 6.5, texture: 'loam' }
  };

  // 6. Completer
  const result = engine.completeLevel(gameData);

  // 7. Afficher resultats
  console.log(`Score: ${result.game.globalScore}/100 - ${result.game.stars}⭐`);
  console.log(`Pieces: +${result.coins} (Total: ${result.totalCoins})`);
  console.log(result.feedback.overall.message);

  return result;
}

// Executer
jouerPartie().then(result => {
  console.log('Partie terminee !', result);
});
```

---

## Valeurs recommandees par culture

### Mais (maize)
```javascript
irrigation: 500         // 400-600mm optimal
npk: { N: 120, P: 60, K: 80 }
soil: { ph: 6.5, texture: 'loam' }
```

### Niebe (cowpea)
```javascript
irrigation: 400         // 300-500mm optimal
npk: { N: 40, P: 30, K: 50 }  // Legumineuse, moins N
soil: { ph: 6.2, texture: 'sandy_loam' }
```

### Riz (rice)
```javascript
irrigation: 1000        // 800-1200mm optimal (inonde)
npk: { N: 100, P: 50, K: 70 }
soil: { ph: 6.0, texture: 'clay_loam' }
```

### Manioc (cassava)
```javascript
irrigation: 450         // 300-600mm optimal
npk: { N: 60, P: 40, K: 100 }  // Beaucoup K
soil: { ph: 6.0, texture: 'sandy_loam' }
```

### Cacao (cacao)
```javascript
irrigation: 800         // 600-1000mm optimal
npk: { N: 90, P: 50, K: 70 }
soil: { ph: 6.5, texture: 'loam' }
```

### Coton (cotton)
```javascript
irrigation: 700         // 500-900mm optimal
npk: { N: 130, P: 70, K: 90 }  // Fertilisation intensive
soil: { ph: 7.0, texture: 'loam' }
```

---

## Conditions meteorologiques

```javascript
'optimal'       // Conditions ideales
'dry'           // Saison seche (augmenter irrigation)
'rainy'         // Saison pluies (reduire irrigation)
'drought'       // Secheresse severe
'variable'      // Conditions changeantes
```

---

## Textures de sol

```javascript
'sandy'         // Sableux (drainage rapide)
'sandy_loam'    // Sablo-limoneux
'loam'          // Limoneux (ideal)
'clay_loam'     // Limono-argileux
'clay'          // Argileux (retient eau)
```

---

## Debuggage

### Mode developpement

```javascript
// Vies illimitees en localhost
engine.livesSystem.enableDevMode();

// Reset progression
engine.progressManager.resetProgress();

// Export donnees
const exportData = engine.progressManager.exportProgress();
console.log(JSON.stringify(exportData, null, 2));
```

### Console logs

```javascript
// Activer logs detailles
const result = engine.competenceSystem.calculateCompetenceScore(gameData);
console.log('Scores detailles:', result);
console.log('Breakdown:', result.details.breakdown);
```

---

## Ressources

- **Documentation complete** : `src/game/COMPETENCE_SYSTEM_README.md`
- **Guide integration** : `src/game/INTEGRATION_GUIDE.md`
- **Resume implementation** : `IMPLEMENTATION_SUMMARY.md`
- **Tests** : `src/game/CompetenceSystem.test.js`

---

## Support

Pour toute question :
1. Consulter la documentation complete
2. Executer les tests : `node src/game/CompetenceSystem.test.js`
3. Verifier les exemples dans INTEGRATION_GUIDE.md

**Bon jeu ! 🌾🛰️**
