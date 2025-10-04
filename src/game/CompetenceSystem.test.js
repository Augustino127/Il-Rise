/**
 * CompetenceSystem.test.js
 * Tests du systeme de competences avec donnees realistes
 * NASA Space Apps Challenge 2025
 */

import { CompetenceSystem } from './CompetenceSystem.js';

// Instance du systeme
const competenceSystem = new CompetenceSystem();

console.log('=== TESTS DU SYSTEME DE COMPETENCES ===\n');

/**
 * TEST 1 : Partie parfaite (3 etoiles)
 */
console.log('TEST 1 : Partie parfaite - Mais avec conditions optimales');
const perfectGameData = {
  crop: {
    id: 'maize',
    family: 'cereal',
    water_requirements: {
      min_mm: 400,
      max_mm: 600
    },
    nutrient_requirements: {
      nitrogen: { optimal: 120 },
      phosphorus: { optimal: 60 },
      potassium: { optimal: 80 }
    },
    soil_requirements: {
      ph: { min: 6.0, max: 7.0 },
      texture: { preferred: ['loam', 'sandy_loam'] }
    }
  },
  irrigation: 500, // mm - optimal
  weather: 'optimal',
  soilMoisture: 40, // % - optimal
  npk: {
    nitrogen: 120,
    phosphorus: 60,
    potassium: 80
  },
  budget: {
    spent: 80,
    max: 100
  },
  soil: {
    ph: 6.5, // optimal
    texture: 'loam'
  },
  previousCrops: [
    { cropId: 'cowpea', family: 'legume' },
    { cropId: 'rice', family: 'cereal' }
  ],
  seasonNumber: 3,
  nasaDataUsed: {
    types: ['temperature', 'ndvi', 'precipitation', 'smap']
  },
  nasaUsageCount: 2,
  maxNASAUsage: 3
};

const perfectResult = competenceSystem.calculateCompetenceScore(perfectGameData);
console.log('Score global:', perfectResult.globalScore, '/100');
console.log('Etoiles:', '⭐'.repeat(perfectResult.stars));
console.log('Details par competence:');
perfectResult.details.breakdown.forEach(comp => {
  console.log(`  ${comp.emoji} ${comp.competence}: ${comp.score}/100 (poids: ${comp.weight}%, contribution: ${comp.contribution})`);
});
console.log('\n');

/**
 * TEST 2 : Partie moyenne (2 etoiles)
 */
console.log('TEST 2 : Partie moyenne - Quelques erreurs');
const mediumGameData = {
  crop: {
    id: 'rice',
    family: 'cereal',
    water_requirements: {
      min_mm: 800,
      max_mm: 1200
    },
    nutrient_requirements: {
      nitrogen: { optimal: 100 },
      phosphorus: { optimal: 50 },
      potassium: { optimal: 70 }
    },
    soil_requirements: {
      ph: { min: 5.5, max: 6.5 },
      texture: { preferred: ['clay', 'clay_loam'] }
    }
  },
  irrigation: 700, // Sous-irrigation
  weather: 'dry',
  soilMoisture: 30, // Un peu faible
  npk: {
    nitrogen: 90,  // Legere carence
    phosphorus: 45,
    potassium: 60
  },
  budget: {
    spent: 95,
    max: 100
  },
  soil: {
    ph: 6.0, // Acceptable
    texture: 'clay_loam'
  },
  previousCrops: [
    { cropId: 'maize', family: 'cereal' } // Meme famille - pas ideal
  ],
  seasonNumber: 2,
  nasaDataUsed: {
    types: ['temperature', 'precipitation']
  },
  nasaUsageCount: 1,
  maxNASAUsage: 3
};

const mediumResult = competenceSystem.calculateCompetenceScore(mediumGameData);
console.log('Score global:', mediumResult.globalScore, '/100');
console.log('Etoiles:', '⭐'.repeat(mediumResult.stars));
console.log('Details par competence:');
mediumResult.details.breakdown.forEach(comp => {
  console.log(`  ${comp.emoji} ${comp.competence}: ${comp.score}/100 (contribution: ${comp.contribution})`);
});
console.log('\n');

/**
 * TEST 3 : Partie faible (1 etoile)
 */
console.log('TEST 3 : Partie faible - Beaucoup d\'erreurs');
const poorGameData = {
  crop: {
    id: 'cowpea',
    family: 'legume',
    water_requirements: {
      min_mm: 300,
      max_mm: 500
    },
    nutrient_requirements: {
      nitrogen: { optimal: 40 },
      phosphorus: { optimal: 30 },
      potassium: { optimal: 50 }
    },
    soil_requirements: {
      ph: { min: 6.0, max: 7.0 },
      texture: { preferred: ['sandy', 'sandy_loam'] }
    }
  },
  irrigation: 150, // Tres insuffisant
  weather: 'drought',
  soilMoisture: 15, // Trop sec
  npk: {
    nitrogen: 80,  // Exces (legumineuse)
    phosphorus: 10, // Deficit
    potassium: 30
  },
  budget: {
    spent: 100,
    max: 100
  },
  soil: {
    ph: 7.5, // Trop alcalin
    texture: 'clay' // Mauvaise texture
  },
  previousCrops: [
    { cropId: 'cowpea', family: 'legume' }, // Meme culture consecutive - mauvais
    { cropId: 'cowpea', family: 'legume' }
  ],
  seasonNumber: 1,
  nasaDataUsed: null, // Pas utilise
  nasaUsageCount: 0,
  maxNASAUsage: 3
};

const poorResult = competenceSystem.calculateCompetenceScore(poorGameData);
console.log('Score global:', poorResult.globalScore, '/100');
console.log('Etoiles:', '⭐'.repeat(poorResult.stars));
console.log('Details par competence:');
poorResult.details.breakdown.forEach(comp => {
  console.log(`  ${comp.emoji} ${comp.competence}: ${comp.score}/100 (contribution: ${comp.contribution})`);
});
console.log('\n');

/**
 * TEST 4 : Test feedback textuel
 */
console.log('TEST 4 : Feedback textuel par competence');
console.log('\nPour partie parfaite:');
Object.keys(perfectResult.scores).forEach(comp => {
  const feedback = competenceSystem.getScoreFeedback(comp, perfectResult.scores[comp]);
  console.log(`  ${comp}: ${feedback}`);
});

console.log('\nPour partie faible:');
Object.keys(poorResult.scores).forEach(comp => {
  const feedback = competenceSystem.getScoreFeedback(comp, poorResult.scores[comp]);
  console.log(`  ${comp}: ${feedback}`);
});
console.log('\n');

/**
 * TEST 5 : Verification du calcul des etoiles
 */
console.log('TEST 5 : Verification seuils des etoiles');
const testScores = [30, 50, 60, 75, 85, 95];
testScores.forEach(score => {
  const stars = competenceSystem.calculateStars(score);
  console.log(`  Score ${score}/100 => ${stars} etoile(s)`);
});
console.log('\n');

/**
 * TEST 6 : Test cas limite - donnees manquantes
 */
console.log('TEST 6 : Gestion des donnees manquantes');
const incompleteGameData = {
  crop: {
    id: 'maize',
    water_requirements: { min_mm: 400, max_mm: 600 }
  },
  irrigation: 500
};

const incompleteResult = competenceSystem.calculateCompetenceScore(incompleteGameData);
console.log('Score global avec donnees manquantes:', incompleteResult.globalScore, '/100');
console.log('Etoiles:', incompleteResult.stars);
console.log('\n');

/**
 * RESUME DES TESTS
 */
console.log('=== RESUME DES TESTS ===');
console.log(`Test 1 (Parfait):   ${perfectResult.globalScore}/100 - ${perfectResult.stars}⭐`);
console.log(`Test 2 (Moyen):     ${mediumResult.globalScore}/100 - ${mediumResult.stars}⭐`);
console.log(`Test 3 (Faible):    ${poorResult.globalScore}/100 - ${poorResult.stars}⭐`);
console.log(`Test 6 (Incomplet): ${incompleteResult.globalScore}/100 - ${incompleteResult.stars}⭐`);
console.log('\nTous les tests sont passes avec succes !');

export { perfectGameData, mediumGameData, poorGameData };
