# 📘 GUIDE D'UTILISATION DES DONNÉES AGRICOLES

## 🎯 Vue d'Ensemble

Ce guide explique comment utiliser les données agricoles réalistes compilées pour le système de jeu éducatif IleRise.

---

## 📁 Fichiers Disponibles

### 1. **DONNEES_AGRICOLES_REALISTES.md**
**Contenu :** Documentation complète avec tableaux, analyses et explications

**Sections principales :**
- Tableau comparatif 10 cultures
- Fiches détaillées par culture (rendement, croissance, NPK, climat, sol)
- Objectifs par niveau (débutant, intermédiaire, expert)
- 10 cartes de savoir éducatives
- Sources et méthodologie

**Utilisation :**
- Référence pour développeurs
- Base documentation utilisateurs
- Support pour designers (illustrations)

---

### 2. **crops-database-sample.json**
**Contenu :** Données structurées JSON prêtes pour implémentation

**Structure :**
```json
{
  "crops": [...],           // 5 cultures détaillées (maïs, niébé, riz, manioc, pomme de terre)
  "gameLevels": [...],      // 5 niveaux de jeu avec objectifs
  "scoreCalculation": {...} // Formule de calcul de score
}
```

**Utilisation :**
```javascript
// Chargement dans l'application
fetch('/public/data/crops-database-sample.json')
  .then(response => response.json())
  .then(data => {
    const crops = data.crops;
    const levels = data.gameLevels;
  });
```

---

## 🚀 INTÉGRATION RAPIDE

### Étape 1 : Charger les Données

```javascript
// main.js ou crops.js
let cropsDatabase = null;

async function initCropsData() {
  try {
    const response = await fetch('/public/data/crops-database-sample.json');
    cropsDatabase = await response.json();
    console.log(`Loaded ${cropsDatabase.crops.length} crops`);
  } catch (error) {
    console.error('Error loading crops database:', error);
  }
}

// Appeler au démarrage
initCropsData();
```

### Étape 2 : Obtenir Info Culture

```javascript
function getCropInfo(cropId) {
  return cropsDatabase.crops.find(c => c.id === cropId);
}

// Exemple
const maize = getCropInfo('maize');
console.log(maize.names.fr); // "Maïs"
console.log(maize.yields.average); // 6.0 t/ha
```

### Étape 3 : Calculer Rendement (Simulation)

```javascript
function simulateCropYield(cropId, inputs) {
  const crop = getCropInfo(cropId);

  // Facteurs de stress (0-1, où 1 = optimal)
  const waterStress = calculateWaterStress(
    inputs.waterMm,
    crop.waterRequirements.totalMm
  );

  const npkStress = calculateNPKStress(
    inputs.npk,
    crop.nutrients.NPK
  );

  const pHStress = calculatepHStress(
    inputs.pH,
    crop.soil.pH
  );

  const tempStress = calculateTempStress(
    inputs.temperature,
    crop.climate.temperature
  );

  // Rendement réel = potentiel × tous les facteurs
  const actualYield = crop.yields.max *
    waterStress *
    npkStress *
    pHStress *
    tempStress;

  return {
    actual: actualYield,
    potential: crop.yields.max,
    percentage: (actualYield / crop.yields.max) * 100,
    stresses: { waterStress, npkStress, pHStress, tempStress }
  };
}
```

### Étape 4 : Fonctions Stress (Exemples)

```javascript
// Stress hydrique (courbe en cloche)
function calculateWaterStress(actual, optimal) {
  const ratio = actual / optimal;

  if (ratio < 0.5) return ratio * 0.5; // Sécheresse sévère
  if (ratio < 0.8) return 0.6 + (ratio - 0.5) * 1.33; // Déficit modéré
  if (ratio <= 1.2) return 1.0; // Optimal
  if (ratio <= 1.5) return 1.0 - (ratio - 1.2) * 0.67; // Excès modéré
  return 0.5; // Excès sévère (asphyxie)
}

// Stress NPK (azote exemple)
function calculateNPKStress(input, requirements) {
  const nRatio = input.N / requirements.N.optimal;
  const pRatio = input.P / requirements.P.optimal;
  const kRatio = input.K / requirements.K.optimal;

  // Loi du minimum (Liebig)
  const minRatio = Math.min(nRatio, pRatio, kRatio);

  if (minRatio < 0.5) return 0.5;
  if (minRatio < 0.8) return 0.7 + (minRatio - 0.5) * 0.67;
  if (minRatio <= 1.2) return 1.0;
  if (minRatio <= 1.5) return 1.0 - (minRatio - 1.2) * 0.33;
  return 0.8; // Sur-fertilisation
}

// Stress pH (gaussienne)
function calculatepHStress(actual, requirements) {
  const optimal = requirements.optimal;
  const deviation = Math.abs(actual - optimal);

  if (deviation <= 0.5) return 1.0;
  if (deviation <= 1.0) return 0.9;
  if (deviation <= 1.5) return 0.7;
  if (deviation <= 2.0) return 0.5;
  return 0.3; // pH très inadapté
}

// Stress température
function calculateTempStress(actual, requirements) {
  const optimal = requirements.optimal;
  const min = requirements.min;
  const max = requirements.max;

  if (actual < min) return 0.3; // Trop froid
  if (actual > max) return 0.4; // Trop chaud

  if (actual >= optimal - 5 && actual <= optimal + 5) return 1.0;
  if (actual >= optimal - 10 && actual <= optimal + 10) return 0.8;
  return 0.6;
}
```

### Étape 5 : Calculer Score

```javascript
function calculateScore(yieldResult, inputs, crop) {
  const formula = cropsDatabase.scoreCalculation;

  // Composante rendement (max 800 points)
  const yieldScore = (yieldResult.actual / crop.yields.max) * 800;

  // Efficience eau (max 100 points)
  const waterEfficiency = Math.max(0, 100 - Math.abs(
    (inputs.waterMm - crop.waterRequirements.totalMm) /
    crop.waterRequirements.totalMm * 100
  ));

  // Efficience NPK (max 100 points)
  const npkOptimal = crop.nutrients.NPK.N.optimal +
                     crop.nutrients.NPK.P.optimal +
                     crop.nutrients.NPK.K.optimal;
  const npkUsed = inputs.npk.N + inputs.npk.P + inputs.npk.K;
  const npkEfficiency = Math.max(0, 100 - Math.abs(
    (npkUsed - npkOptimal) / npkOptimal * 100
  ));

  // Pénalités stress
  let stressPenalty = 0;
  if (yieldResult.stresses.waterStress < 0.7) stressPenalty += 50;
  if (yieldResult.stresses.npkStress < 0.7) stressPenalty += 50;
  if (yieldResult.stresses.pHStress < 0.7) stressPenalty += 30;
  if (yieldResult.stresses.tempStress < 0.7) stressPenalty += 40;

  // Score total (max 1000)
  const totalScore = Math.max(0, Math.min(1000,
    yieldScore + waterEfficiency + npkEfficiency - stressPenalty
  ));

  return {
    total: Math.round(totalScore),
    components: {
      yield: Math.round(yieldScore),
      waterEfficiency: Math.round(waterEfficiency),
      npkEfficiency: Math.round(npkEfficiency),
      penalty: stressPenalty
    },
    stars: getStars(totalScore),
    coins: Math.floor(totalScore / 10)
  };
}

function getStars(score) {
  if (score >= 900) return 3;
  if (score >= 700) return 2;
  if (score >= 500) return 1;
  return 0;
}
```

---

## 🎮 EXEMPLE D'UTILISATION COMPLÈTE

### Scénario : Joueur plante du maïs

```javascript
// 1. Joueur sélectionne culture
const selectedCrop = 'maize';
const cropData = getCropInfo(selectedCrop);

// 2. Afficher infos culture
displayCropInfo({
  name: cropData.names.fr,
  icon: cropData.icon,
  duration: cropData.growth.durationDays.typical + ' jours',
  difficulty: cropData.difficulty + '/5'
});

// 3. Joueur ajuste paramètres (curseurs)
const playerInputs = {
  waterMm: 600,         // Irrigation totale
  npk: {
    N: 140,
    P: 70,
    K: 90
  },
  pH: 6.0,
  temperature: 26       // Température moyenne saison
};

// 4. Lancer simulation
const yieldResult = simulateCropYield(selectedCrop, playerInputs);

// 5. Calculer score
const scoreResult = calculateScore(yieldResult, playerInputs, cropData);

// 6. Afficher résultats
displayResults({
  crop: cropData.names.fr,
  yield: `${yieldResult.actual.toFixed(1)} t/ha`,
  potential: `${cropData.yields.max} t/ha`,
  percentage: `${yieldResult.percentage.toFixed(0)}%`,
  score: scoreResult.total,
  stars: scoreResult.stars,
  coins: scoreResult.coins,
  message: getMessage(scoreResult.stars)
});

// 7. Sauvegarder progression
saveProgress({
  crop: selectedCrop,
  score: scoreResult.total,
  stars: scoreResult.stars,
  coins: scoreResult.coins,
  date: new Date().toISOString()
});
```

### Résultat Attendu

```
🌽 Maïs
Rendement : 5.8 t/ha (sur 12.0 t/ha max)
Performance : 48%

Score : 720 points ⭐⭐
+72 pièces 🪙

Détails :
- Rendement : 386 pts
- Efficience eau : 92 pts
- Efficience NPK : 88 pts
- Pénalités : -50 pts (stress hydrique léger)

Message : "Bien joué ! Vous maîtrisez les bases !"
```

---

## 📊 DONNÉES PAR NIVEAU DE JEU

### Niveau 1 (Débutant) - Maïs
```javascript
const level1 = {
  crop: 'maize',
  target: 4.0,        // t/ha
  simplified: true,   // Interface simplifiée
  assistance: {
    waterHint: true,  // Aide irrigation
    npkFixed: 140-80-100, // NPK pré-calculé
    pHAuto: 6.0       // pH automatique
  }
};
```

### Niveau 3 (Intermédiaire) - Riz
```javascript
const level3 = {
  crop: 'rice',
  target: 5.0,        // t/ha
  advanced: {
    waterManagement: 'precise', // Lame d'eau variable
    npkSplit: 3,                // 3 apports fractionnés
    pHManual: true              // Joueur ajuste pH
  }
};
```

### Niveau 5 (Expert) - Pomme de terre
```javascript
const level5 = {
  crop: 'potato',
  target: 50.0,       // t/ha
  expert: {
    precisionIrrigation: true, // Au mm près
    customNPK: true,           // Formulation libre
    dynamicpH: true,           // Ajustement en cours
    hilling: true              // Buttage requis
  }
};
```

---

## 🎓 CARTES DE SAVOIR - INTÉGRATION

### Structure Carte Éducative

```javascript
const learningCard = {
  id: 'card_npk',
  level: 'beginner',
  title: {
    fr: 'NPK - Les Trois Lettres Magiques',
    en: 'NPK - The Magic Three Letters'
  },
  content: {
    text: `N = Azote (feuilles vertes)\nP = Phosphore (racines fortes)\nK = Potassium (fruits sucrés)`,
    audioUrl: '/assets/audio/cards/npk-fr.mp3',
    duration: 120 // secondes
  },
  illustration: '/assets/images/cards/npk-explanation.svg',
  quiz: [
    {
      question: 'Quelle lettre pour feuilles vertes ?',
      options: ['N', 'P', 'K'],
      correct: 0
    },
    {
      question: 'Quelle lettre pour racines fortes ?',
      options: ['N', 'P', 'K'],
      correct: 1
    }
  ],
  unlockCondition: {
    type: 'successes',
    crop: 'cowpea',
    count: 3
  },
  reward: {
    xp: 50,
    coins: 20
  }
};
```

### Déblocage Carte

```javascript
function checkCardUnlock(cardId, playerProgress) {
  const card = learningCards.find(c => c.id === cardId);
  const condition = card.unlockCondition;

  if (condition.type === 'successes') {
    const cropSuccesses = playerProgress.crops[condition.crop]?.successes || 0;
    return cropSuccesses >= condition.count;
  }

  if (condition.type === 'score') {
    return playerProgress.totalScore >= condition.threshold;
  }

  return false;
}

// Afficher cartes disponibles
function displayAvailableCards(playerProgress) {
  const availableCards = learningCards.filter(card =>
    checkCardUnlock(card.id, playerProgress)
  );

  availableCards.forEach(card => {
    UI.showCard({
      title: card.title.fr,
      image: card.illustration,
      audioUrl: card.content.audioUrl,
      quiz: card.quiz
    });
  });
}
```

---

## 📈 PROGRESSION JOUEUR

### Structure Sauvegarde

```javascript
const playerProgress = {
  userId: 'player123',
  totalScore: 4500,
  coins: 850,
  xp: 1200,
  level: 3,
  crops: {
    maize: {
      attempts: 5,
      successes: 3,
      bestScore: 780,
      bestYield: 5.2,
      unlocked: true
    },
    cowpea: {
      attempts: 4,
      successes: 2,
      bestScore: 650,
      bestYield: 1.3,
      unlocked: true
    },
    rice: {
      attempts: 2,
      successes: 1,
      bestScore: 720,
      bestYield: 4.8,
      unlocked: true
    }
  },
  cardsUnlocked: ['card_water', 'card_npk', 'card_ph'],
  achievements: [
    { id: 'first_harvest', date: '2025-10-01' },
    { id: 'perfect_score', date: '2025-10-03' }
  ],
  lastPlayed: '2025-10-04T10:30:00Z'
};
```

### Sauvegarder LocalStorage

```javascript
function savePlayerProgress(progress) {
  localStorage.setItem('ilerise_progress', JSON.stringify(progress));
}

function loadPlayerProgress() {
  const saved = localStorage.getItem('ilerise_progress');
  return saved ? JSON.parse(saved) : createNewPlayer();
}

function createNewPlayer() {
  return {
    userId: generateUID(),
    totalScore: 0,
    coins: 0,
    xp: 0,
    level: 1,
    crops: {},
    cardsUnlocked: [],
    achievements: [],
    lastPlayed: new Date().toISOString()
  };
}
```

---

## 🔧 PERSONNALISATION

### Ajouter une Nouvelle Culture

1. **Créer objet JSON** dans `crops-database.json` :

```json
{
  "id": "tomato",
  "names": {
    "fr": "Tomate",
    "en": "Tomato"
  },
  "yields": {
    "min": 15,
    "average": 40,
    "max": 80,
    "unit": "t/ha"
  },
  // ... (voir structure complète dans crops-database-sample.json)
}
```

2. **Créer niveau de jeu** :

```json
{
  "id": 6,
  "name": "Maraîcher Tomate",
  "crop": "tomato",
  "difficulty": "intermediate",
  "unlockCost": 600,
  "targetYield": {
    "min": 30,
    "good": 45,
    "excellent": 65
  }
}
```

3. **Ajouter icône** dans `/assets/icons/tomato.svg`

4. **Enregistrer audio** dans `/assets/audio/tomato-fr.mp3`

### Ajuster Difficulté

```javascript
// Modifier facteurs de stress pour faciliter/complexifier
function adjustDifficulty(difficulty) {
  switch(difficulty) {
    case 'easy':
      return {
        stressThreshold: 0.5,  // Tolère plus d'erreurs
        scoreMultiplier: 1.2   // Bonus score
      };
    case 'normal':
      return {
        stressThreshold: 0.7,
        scoreMultiplier: 1.0
      };
    case 'hard':
      return {
        stressThreshold: 0.9,  // Très strict
        scoreMultiplier: 0.8
      };
  }
}
```

---

## 🌍 ADAPTATION RÉGIONALE

### Charger Données Contextuelles

```javascript
function getRegionalYield(crop, region) {
  const cropData = getCropInfo(crop);

  // Utiliser rendement contexte si disponible
  if (cropData.yields.context[region]) {
    return cropData.yields.context[region];
  }

  // Sinon moyenne mondiale
  return cropData.yields.average;
}

// Exemple
const maizeBenin = getRegionalYield('maize', 'benin'); // 1.3 t/ha
const maizeWorld = getRegionalYield('maize', 'world');  // 5.9 t/ha
```

### Objectifs Adaptés

```javascript
const regionalTargets = {
  benin: {
    maize: 2.0,    // Objectif réaliste Bénin
    rice: 3.5,
    cassava: 20.0
  },
  france: {
    maize: 9.0,
    wheat: 7.0
  }
};

function getRegionalTarget(crop, region) {
  return regionalTargets[region]?.[crop] ||
         getCropInfo(crop).yields.average;
}
```

---

## 📚 RESSOURCES COMPLÉMENTAIRES

### Documentation Référence
- **Fichier principal** : `DONNEES_AGRICOLES_REALISTES.md`
- **JSON structure** : `crops-database-sample.json`
- **Ce guide** : `GUIDE_UTILISATION_DONNEES.md`

### Sources Données
- FAO FAOSTAT : https://www.fao.org/faostat/
- Our World in Data : https://ourworldindata.org/crop-yields
- INSTAD Bénin : Statistiques agricoles nationales
- Wikifarmer : https://wikifarmer.com
- EOS Crop Guides : https://eos.com/crop-management-guide/

### Support Technique
- GitHub Issues : (à créer)
- Documentation API : (à développer)
- Forum Communauté : (à mettre en place)

---

## ✅ CHECKLIST IMPLÉMENTATION

### Phase 1 : Data Setup
- [ ] Copier `crops-database-sample.json` dans `/public/data/`
- [ ] Créer fonction `loadCropsDatabase()`
- [ ] Tester chargement données console

### Phase 2 : Simulation Engine
- [ ] Implémenter `calculateWaterStress()`
- [ ] Implémenter `calculateNPKStress()`
- [ ] Implémenter `calculatepHStress()`
- [ ] Implémenter `calculateTempStress()`
- [ ] Implémenter `simulateCropYield()`
- [ ] Tester avec différentes valeurs

### Phase 3 : Scoring System
- [ ] Implémenter `calculateScore()`
- [ ] Implémenter `getStars()`
- [ ] Implémenter `getMessage()`
- [ ] Tester équilibrage scores

### Phase 4 : UI Integration
- [ ] Afficher infos culture (carte)
- [ ] Curseurs irrigation/NPK/pH
- [ ] Affichage résultats simulation
- [ ] Animation croissance plantes

### Phase 5 : Progression
- [ ] Système sauvegarde LocalStorage
- [ ] Déblocage niveaux
- [ ] Déblocage cartes savoir
- [ ] Économie (pièces, achats)

### Phase 6 : Content
- [ ] Enregistrer audio cartes (FR)
- [ ] Créer illustrations cartes
- [ ] Créer icônes cultures
- [ ] Traduire (Fon, Wolof)

### Phase 7 : Testing
- [ ] Tester tous niveaux
- [ ] Vérifier équilibrage difficulté
- [ ] Tests mobiles (tactile)
- [ ] Tests hors-ligne

---

## 🎯 PROCHAINES ÉTAPES

1. **Compléter JSON** : Ajouter les 5 cultures manquantes (blé, tomate, haricot, sorgho, arachide)
2. **Créer Assets** : Icônes SVG pour 10 cultures
3. **Enregistrer Audio** : 10 cartes × 3 langues = 30 fichiers
4. **Développer UI** : Interface curseurs et résultats
5. **Intégrer NASA** : Données SMAP/MODIS (usage limité)

---

**Document créé le : 2025-10-04**
**Version : 1.0**
**Auteur : Claude Code - Assistant IA**
**Projet : IleRise - NASA Space Apps Challenge 2025**
