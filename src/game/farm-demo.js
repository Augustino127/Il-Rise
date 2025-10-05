/**
 * farm-demo.js
 * Exemple d'utilisation complète du système FarmGame V3
 * IleRise - NASA Space Apps Challenge 2025
 */

import { FarmGame } from './FarmGame.js';

/**
 * Démo interactive du système de ferme
 * Exécuter dans la console: runFarmDemo()
 */
export function runFarmDemo() {
  console.log('🌾 === DÉMARRAGE DÉMO FARMGAME V3 ===');

  // Données NASA fictives pour la démo
  const mockNASAData = {
    soilMoisture: {
      current_percent: 25,
      optimal: 65
    },
    ndvi: 0.35,
    temperature: 28,
    location: 'Parakou'
  };

  // ===== ÉTAPE 1: INITIALISATION =====
  console.log('\n📦 Étape 1: Initialisation du jeu');

  const game = new FarmGame(mockNASAData, 1);
  game.initialize();

  // Afficher état initial
  console.log('💰 Ressources initiales:', game.resourceManager.getSummary());

  // ===== ÉTAPE 2: DÉMARRAGE SIMULATION =====
  console.log('\n⏰ Étape 2: Démarrage simulation temporelle');

  // Callbacks pour voir ce qui se passe
  game.onDayChangeCallback = (day) => {
    console.log(`\n📅 === NOUVEAU JOUR: ${day} ===`);
    console.log('État:', game.getState().time);
  };

  game.onActionCompleteCallback = (action, changes) => {
    console.log(`✅ ${action.action.name.fr} terminée`, changes);
  };

  game.start();
  console.log('▶️ Simulation démarrée (vitesse 1x)');

  // ===== ÉTAPE 3: PRÉPARATION PARCELLE =====
  console.log('\n🚜 Étape 3: Préparation de la parcelle 1');

  // Labourer
  const plowResult = game.executeAction('plow', 1);
  console.log('Labour:', plowResult.success ? '✅ Réussi' : '❌ Échec');

  // Ajouter compost
  const compostResult = game.executeAction('compost_prepare', 1);
  console.log('Compost:', compostResult.success ? '✅ Réussi' : '❌ Échec');

  // ===== ÉTAPE 4: PLANTATION =====
  console.log('\n🌱 Étape 4: Plantation du maïs');

  // Planter
  const plot = game.plotManager.getActivePlot();
  const plantResult = game.plantCrop('maize', 1);
  console.log('Plantation:', plantResult.success ? '✅ Réussi' : '❌ Échec');
  console.log('Culture:', plot.crop?.name?.fr || 'Aucune');

  // ===== ÉTAPE 5: CYCLE DE CROISSANCE =====
  console.log('\n🌾 Étape 5: Simulation cycle de croissance (15 jours)');

  // Accélérer pour la démo
  game.timeSimulation.setSpeed(4);

  // Simuler 15 jours avec entretien
  for (let day = 1; day <= 15; day++) {
    // Arroser tous les 3 jours
    if (day % 3 === 0) {
      const waterResult = game.executeAction('water', 1);
      console.log(`Jour ${day}: Arrosage ${waterResult.success ? '✅' : '❌'}`);
    }

    // Fertiliser au jour 7
    if (day === 7) {
      const fertResult = game.executeAction('fertilize_npk', 1);
      console.log(`Jour ${day}: Fertilisation ${fertResult.success ? '✅' : '❌'}`);
    }

    // Désherber au jour 10
    if (day === 10) {
      const weedResult = game.executeAction('weed', 1);
      console.log(`Jour ${day}: Désherbage ${weedResult.success ? '✅' : '❌'}`);
    }

    // Passer au jour suivant
    game.skipToNextDay();

    // Afficher état tous les 5 jours
    if (day % 5 === 0) {
      const plotState = game.plotManager.getActivePlot();
      console.log(`\n📊 État Jour ${day}:`);
      console.log(`  - Santé: ${plotState.health.toFixed(1)}%`);
      console.log(`  - Humidité sol: ${plotState.soilMoisture.toFixed(1)}%`);
      console.log(`  - NPK: ${plotState.npkLevel.toFixed(1)}`);
      console.log(`  - Stade: ${game.plotManager.getGrowthStageName(plotState.growthStage)}`);
    }
  }

  // ===== ÉTAPE 6: ÉLEVAGE =====
  console.log('\n🐔 Étape 6: Démarrage élevage de poulets');

  // Débloquer poulailler
  const coopResult = game.livestockManager.unlockChickenCoop(1);
  console.log('Poulailler:', coopResult ? '✅ Débloqué' : '❌ Échec');

  // Acheter poulets
  const buyChickensResult = game.buyChickens(10);
  console.log('Achat 10 poulets:', buyChickensResult ? '✅ Réussi' : '❌ Échec');

  // Nourrir
  const feedResult = game.feedChickens();
  console.log('Nourrir poulets:', feedResult ? '✅ Réussi' : '❌ Échec');

  // Simuler 10 jours pour production
  console.log('\n⏩ Simulation 10 jours pour production œufs...');
  for (let i = 0; i < 10; i++) {
    game.skipToNextDay();
  }

  const livestock = game.livestockManager.getSummary();
  console.log('📊 Production élevage:', livestock.production);

  // Collecter œufs
  const eggsCollected = game.livestockManager.collectEggs();
  console.log(`🥚 Œufs collectés: ${eggsCollected}`);

  // ===== ÉTAPE 7: MARCHÉ =====
  console.log('\n🏪 Étape 7: Transactions au marché');

  // Acheter ressources
  const buyWaterResult = game.buyFromMarket('water', null, 500);
  console.log('Achat 500L eau:', buyWaterResult.success ? '✅ Réussi' : '❌ Échec');

  const buyNPKResult = game.buyFromMarket('fertilizers', 'npk', 50);
  console.log('Achat 50kg NPK:', buyNPKResult.success ? '✅ Réussi' : '❌ Échec');

  // Vendre œufs
  if (eggsCollected > 0) {
    const sellEggsResult = game.sellToMarket('animalProducts', 'eggs', eggsCollected);
    console.log(`Vente ${eggsCollected} œufs:`, sellEggsResult.success ? `✅ +${sellEggsResult.revenue}💰` : '❌ Échec');
  }

  // Tendances marché
  console.log('\n📈 Tendances du marché:');
  const trends = game.marketSystem.getTrends().slice(0, 3);
  trends.forEach(trend => {
    console.log(`  ${trend.icon} ${trend.item}: ${trend.currentPrice}💰 (${trend.change})`);
  });

  // ===== ÉTAPE 8: RÉCOLTE =====
  console.log('\n🌾 Étape 8: Récolte (simuler jusqu\'à maturité)');

  // Aller au jour 90 (maturité du maïs)
  const currentDay = game.timeSimulation.currentDay;
  const daysToMaturity = 90 - currentDay;

  console.log(`⏩ Avancer de ${daysToMaturity} jours jusqu'à maturité...`);
  for (let i = 0; i < daysToMaturity; i++) {
    // Arroser périodiquement
    if (i % 5 === 0) {
      game.executeAction('water', 1);
    }
    game.skipToNextDay();
  }

  // Récolter
  const harvestResult = game.harvestPlot(1);
  if (harvestResult.success) {
    console.log(`✅ Récolte réussie: ${harvestResult.yield.toFixed(2)} tonnes`);
    console.log('   Rendement:', harvestResult.results);

    // Vendre la récolte
    const sellHarvestResult = game.sellToMarket('harvest', 'maize', harvestResult.yield);
    console.log(`💰 Vente récolte: ${sellHarvestResult.success ? `+${sellHarvestResult.revenue}💰` : 'Échec'}`);
  } else {
    console.log('❌ Récolte échouée:', harvestResult.error);
  }

  // ===== ÉTAPE 9: BILAN FINAL =====
  console.log('\n📊 === BILAN FINAL ===');

  const finalState = game.getState();
  console.log('\n⏰ Temps écoulé:');
  console.log(`  - Jour: ${finalState.time.day}`);
  console.log(`  - Saison: ${finalState.time.season}`);

  console.log('\n💰 Ressources finales:');
  console.log(finalState.resources);

  console.log('\n🌾 Parcelles:');
  finalState.plots.forEach(plot => {
    console.log(`  - ${plot.name}: ${plot.crop} (${plot.unlocked ? 'Débloquée' : 'Verrouillée'})`);
  });

  console.log('\n🐔 Élevage:');
  console.log(finalState.livestock);

  // ===== ÉTAPE 10: SAUVEGARDE =====
  console.log('\n💾 Étape 10: Sauvegarde du jeu');

  const saveResult = game.save('demo_save');
  console.log('Sauvegarde:', saveResult ? '✅ Réussie' : '❌ Échec');

  // Arrêter simulation
  game.stop();
  console.log('\n⏹️ Simulation arrêtée');

  console.log('\n🎉 === FIN DE LA DÉMO ===');
  console.log('\n💡 L\'instance est accessible via: window.demoGame');
  console.log('💡 Essayez: demoGame.getState()');

  // Exposer globalement pour manipulation
  window.demoGame = game;

  return game;
}

/**
 * Démo rapide (cycle complet en 1 minute)
 */
export function quickDemo() {
  console.log('⚡ === DÉMO RAPIDE (1 minute) ===\n');

  const mockNASAData = {
    soilMoisture: { current_percent: 30 },
    ndvi: 0.4,
    temperature: 28
  };

  const game = new FarmGame(mockNASAData, 1);
  game.initialize();
  game.timeSimulation.setSpeed(8); // Très rapide

  console.log('1️⃣ Plantation maïs...');
  game.executeAction('plow', 1);
  game.plantCrop('maize', 1);

  console.log('2️⃣ Arrosage et fertilisation...');
  game.executeAction('water', 1);
  game.executeAction('fertilize_npk', 1);

  console.log('3️⃣ Avancement au jour 90...');
  for (let i = 0; i < 90; i++) {
    if (i % 10 === 0) game.executeAction('water', 1);
    game.skipToNextDay();
  }

  console.log('4️⃣ Récolte...');
  const result = game.harvestPlot(1);
  console.log(`✅ Rendement: ${result.yield?.toFixed(2) || 0} tonnes`);

  console.log('5️⃣ Vente...');
  if (result.yield) {
    const sellResult = game.sellToMarket('harvest', 'maize', result.yield);
    console.log(`💰 Revenu: ${sellResult.revenue}💰`);
  }

  const finalResources = game.resourceManager.getSummary();
  console.log('\n📊 Résultat final:');
  console.log(`   Argent: ${finalResources.money}💰`);
  console.log(`   Récolte stockée: ${finalResources.harvest}`);

  game.stop();
  console.log('\n✨ Démo rapide terminée !');

  return game;
}

/**
 * Utilitaires de debug
 */
export const FarmDebug = {
  /**
   * Donner ressources illimitées
   */
  godMode(game) {
    game.resourceManager.set('money', 100000);
    game.resourceManager.set('water', 10000);
    game.resourceManager.set('fertilizers', { npk: 1000, organic: 1000 }, 'npk');
    game.resourceManager.set('seeds', { maize: 500, cowpea: 500 }, 'maize');
    console.log('🔓 Mode Dieu activé: Ressources illimitées');
  },

  /**
   * Débloquer toutes les parcelles
   */
  unlockAll(game) {
    for (let i = 1; i <= 4; i++) {
      const plot = game.plotManager.getPlot(i);
      if (!plot.unlocked) {
        plot.unlocked = true;
        console.log(`🔓 Parcelle ${i} débloquée`);
      }
    }
  },

  /**
   * Simuler jusqu'à la récolte
   */
  fastForwardToHarvest(game, plotId = 1) {
    const plot = game.plotManager.getPlot(plotId);
    if (!plot || !plot.isPlanted) {
      console.warn('⚠️ Parcelle non plantée');
      return;
    }

    const daysNeeded = plot.crop.growthDuration - plot.daysSincePlant;
    console.log(`⏩ Avance de ${daysNeeded} jours...`);

    for (let i = 0; i < daysNeeded; i++) {
      if (i % 5 === 0) game.executeAction('water', plotId);
      game.skipToNextDay();
    }

    console.log('✅ Culture mature, prête à récolter');
  },

  /**
   * Afficher état complet
   */
  showFullState(game) {
    console.log('📊 === ÉTAT COMPLET DU JEU ===\n');

    const state = game.getState();

    console.log('⏰ TEMPS:', state.time);
    console.log('\n💰 RESSOURCES:', state.resources);
    console.log('\n🌾 PARCELLES:');
    state.plots.forEach(p => console.log(`  ${p.id}. ${p.name}: ${p.crop} (${p.health}%)`));
    console.log('\n🐔 ÉLEVAGE:', state.livestock);
    console.log('\n📈 TENDANCES MARCHÉ:');
    state.marketTrends.slice(0, 5).forEach(t =>
      console.log(`  ${t.icon} ${t.item}: ${t.currentPrice}💰 (${t.change})`)
    );
  }
};

// Exposer globalement pour faciliter les tests
if (typeof window !== 'undefined') {
  window.runFarmDemo = runFarmDemo;
  window.quickDemo = quickDemo;
  window.FarmDebug = FarmDebug;

  console.log('💡 Démos disponibles:');
  console.log('   - runFarmDemo()  : Démo complète (~2 min)');
  console.log('   - quickDemo()    : Démo rapide (30 sec)');
  console.log('   - FarmDebug      : Utilitaires de debug');
}
