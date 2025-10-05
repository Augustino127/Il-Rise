/**
 * LivestockManager.js
 * Système de gestion de la ferme d'élevage
 * IleRise V3 - NASA Space Apps Challenge 2025
 */

export class LivestockManager {
  constructor(resourceManager, timeSimulation) {
    this.resourceManager = resourceManager;
    this.timeSimulation = timeSimulation;

    // Animaux
    this.animals = {
      chickens: {
        count: 0,
        maxCount: 0, // Dépend du niveau poulailler
        age: 0, // Jours
        feedLevel: 100,
        health: 100,
        dailyEggProduction: 0,
        dailyManureProduction: 2, // kg/poulet/jour
        feedConsumption: 0.12, // kg/poulet/jour
        unlocked: false
      },

      goats: {
        count: 0,
        maxCount: 0,
        age: 0,
        feedLevel: 100,
        health: 100,
        dailyMilkProduction: 0,
        dailyManureProduction: 5, // kg/chèvre/jour
        feedConsumption: 2, // kg/chèvre/jour
        unlocked: false,
        unlockLevel: 8
      }
    };

    // Infrastructure
    this.infrastructure = {
      chickenCoop: {
        level: 0,
        maxLevel: 3,
        capacity: [0, 20, 40, 60], // Capacité par niveau
        upgradeCost: [100, 200, 400],
        unlocked: false
      },

      compostPit: {
        level: 0,
        maxLevel: 3,
        capacity: [0, 500, 1000, 2000], // kg
        conversionRate: 0.8, // 1 kg fumier → 0.8 kg compost
        conversionTime: 7, // jours
        upgradeCost: [50, 150, 300],
        unlocked: false
      },

      goatShed: {
        level: 0,
        maxLevel: 2,
        capacity: [0, 10, 20],
        upgradeCost: [500, 1000],
        unlocked: false,
        unlockLevel: 8
      }
    };

    // Production et stocks
    this.production = {
      manure: 0, // kg fumier frais
      compost: 0, // kg compost prêt
      eggs: 0,
      milk: 0
    };

    // Compostage en cours
    this.activeComposting = [];

    // Dernière mise à jour
    this.lastUpdateDay = 0;
  }

  /**
   * Débloquer le poulailler
   * @param {Number} playerLevel
   * @returns {Boolean}
   */
  unlockChickenCoop(playerLevel = 1) {
    if (this.infrastructure.chickenCoop.unlocked) {
      console.log('ℹ️ Poulailler déjà débloqué');
      return true;
    }

    const cost = this.infrastructure.chickenCoop.upgradeCost[0];
    if (!this.resourceManager.hasResources({ money: cost })) {
      console.warn('⚠️ Argent insuffisant');
      return false;
    }

    this.resourceManager.consume({ money: cost }, 'Déblocage poulailler');
    this.infrastructure.chickenCoop.unlocked = true;
    this.infrastructure.chickenCoop.level = 1;
    this.animals.chickens.unlocked = true;
    this.animals.chickens.maxCount = this.infrastructure.chickenCoop.capacity[1];

    console.log('🐔 Poulailler débloqué !');
    return true;
  }

  /**
   * Améliorer le poulailler
   * @returns {Boolean}
   */
  upgradeChickenCoop() {
    const coop = this.infrastructure.chickenCoop;

    if (coop.level >= coop.maxLevel) {
      console.warn('⚠️ Niveau maximum atteint');
      return false;
    }

    const cost = coop.upgradeCost[coop.level];
    if (!this.resourceManager.hasResources({ money: cost })) {
      console.warn('⚠️ Argent insuffisant');
      return false;
    }

    this.resourceManager.consume({ money: cost }, `Amélioration poulailler niveau ${coop.level + 1}`);
    coop.level++;
    this.animals.chickens.maxCount = coop.capacity[coop.level];

    console.log(`⬆️ Poulailler niveau ${coop.level} (Capacité: ${this.animals.chickens.maxCount})`);
    return true;
  }

  /**
   * Acheter des poulets
   * @param {Number} count
   * @returns {Boolean}
   */
  buyChickens(count = 1) {
    if (!this.animals.chickens.unlocked) {
      console.warn('⚠️ Poulailler non débloqué');
      return false;
    }

    if (this.animals.chickens.count + count > this.animals.chickens.maxCount) {
      console.warn('⚠️ Capacité insuffisante');
      return false;
    }

    const cost = count * 50; // 50💰 par poulet
    if (!this.resourceManager.hasResources({ money: cost })) {
      console.warn('⚠️ Argent insuffisant');
      return false;
    }

    this.resourceManager.consume({ money: cost }, `Achat de ${count} poulets`);
    this.animals.chickens.count += count;

    console.log(`🐔 ${count} poulet(s) acheté(s) (Total: ${this.animals.chickens.count})`);
    return true;
  }

  /**
   * Nourrir les poulets
   * @returns {Boolean}
   */
  feedChickens() {
    if (this.animals.chickens.count === 0) {
      console.warn('⚠️ Aucun poulet à nourrir');
      return false;
    }

    const grainNeeded = this.animals.chickens.count * this.animals.chickens.feedConsumption;
    const cost = { money: Math.ceil(grainNeeded) }; // 1💰 par kg

    if (!this.resourceManager.hasResources(cost)) {
      console.warn('⚠️ Argent insuffisant pour acheter les grains');
      return false;
    }

    this.resourceManager.consume(cost, 'Achat grains pour poulets');
    this.animals.chickens.feedLevel = 100;

    console.log(`🌾 Poulets nourris (${grainNeeded.toFixed(1)} kg grains)`);
    return true;
  }

  /**
   * Mettre à jour l'élevage (appelé chaque jour)
   * @param {Number} currentDay
   */
  update(currentDay) {
    if (currentDay === this.lastUpdateDay) return;

    const daysPassed = currentDay - this.lastUpdateDay;
    this.lastUpdateDay = currentDay;

    // Mettre à jour les poulets
    if (this.animals.chickens.unlocked && this.animals.chickens.count > 0) {
      this.updateChickens(daysPassed);
    }

    // Mettre à jour les chèvres
    if (this.animals.goats.unlocked && this.animals.goats.count > 0) {
      this.updateGoats(daysPassed);
    }

    // Mettre à jour le compostage
    this.updateComposting(currentDay);
  }

  /**
   * Mettre à jour les poulets
   * @param {Number} daysPassed
   */
  updateChickens(daysPassed) {
    const chickens = this.animals.chickens;

    // Vieillissement
    chickens.age += daysPassed;

    // Consommation de nourriture
    chickens.feedLevel -= daysPassed * 10;
    chickens.feedLevel = Math.max(0, chickens.feedLevel);

    // Santé dépend de la nourriture
    if (chickens.feedLevel < 30) {
      chickens.health -= daysPassed * 5;
    } else if (chickens.feedLevel > 70) {
      chickens.health = Math.min(100, chickens.health + daysPassed * 2);
    }
    chickens.health = Math.max(0, chickens.health);

    // Production d'œufs (dépend santé et âge)
    if (chickens.age > 150 && chickens.health > 50) { // Poules pondent après 150 jours
      const productionRate = (chickens.health / 100) * 0.8; // 80% des poulets pondent
      chickens.dailyEggProduction = Math.floor(chickens.count * productionRate);
      this.production.eggs += chickens.dailyEggProduction * daysPassed;
    } else {
      chickens.dailyEggProduction = 0;
    }

    // Production de fumier
    const manureProduced = chickens.count * chickens.dailyManureProduction * daysPassed;
    this.production.manure += manureProduced;

    console.log(`🐔 Poulets: ${chickens.dailyEggProduction} œufs, ${manureProduced.toFixed(1)} kg fumier`);
  }

  /**
   * Mettre à jour les chèvres
   * @param {Number} daysPassed
   */
  updateGoats(daysPassed) {
    const goats = this.animals.goats;

    goats.age += daysPassed;
    goats.feedLevel -= daysPassed * 15;
    goats.feedLevel = Math.max(0, goats.feedLevel);

    if (goats.feedLevel < 30) {
      goats.health -= daysPassed * 7;
    } else if (goats.feedLevel > 70) {
      goats.health = Math.min(100, goats.health + daysPassed * 3);
    }
    goats.health = Math.max(0, goats.health);

    // Production de lait
    if (goats.age > 365 && goats.health > 60) {
      const productionRate = (goats.health / 100) * 2; // 2L/chèvre/jour
      goats.dailyMilkProduction = goats.count * productionRate;
      this.production.milk += goats.dailyMilkProduction * daysPassed;
    } else {
      goats.dailyMilkProduction = 0;
    }

    // Production de fumier
    const manureProduced = goats.count * goats.dailyManureProduction * daysPassed;
    this.production.manure += manureProduced;

    console.log(`🐐 Chèvres: ${goats.dailyMilkProduction.toFixed(1)}L lait, ${manureProduced.toFixed(1)} kg fumier`);
  }

  /**
   * Collecter les œufs
   * @returns {Number}
   */
  collectEggs() {
    const eggs = this.production.eggs;
    if (eggs === 0) {
      console.log('ℹ️ Aucun œuf à collecter');
      return 0;
    }

    // Ajouter aux ressources
    this.resourceManager.add({ animalProducts: { eggs } }, 'Collecte œufs');
    this.production.eggs = 0;

    console.log(`🥚 ${eggs} œufs collectés`);
    return eggs;
  }

  /**
   * Débloquer la compostière
   * @returns {Boolean}
   */
  unlockCompostPit() {
    if (this.infrastructure.compostPit.unlocked) {
      console.log('ℹ️ Compostière déjà débloquée');
      return true;
    }

    const cost = this.infrastructure.compostPit.upgradeCost[0];
    if (!this.resourceManager.hasResources({ money: cost })) {
      console.warn('⚠️ Argent insuffisant');
      return false;
    }

    this.resourceManager.consume({ money: cost }, 'Déblocage compostière');
    this.infrastructure.compostPit.unlocked = true;
    this.infrastructure.compostPit.level = 1;

    console.log('💩 Compostière débloquée !');
    return true;
  }

  /**
   * Démarrer le compostage
   * @param {Number} manureAmount - kg de fumier
   * @param {Number} currentDay
   * @returns {Boolean}
   */
  startComposting(manureAmount, currentDay) {
    if (!this.infrastructure.compostPit.unlocked) {
      console.warn('⚠️ Compostière non débloquée');
      return false;
    }

    if (this.production.manure < manureAmount) {
      console.warn('⚠️ Fumier insuffisant');
      return false;
    }

    const pit = this.infrastructure.compostPit;
    const compostOutput = manureAmount * pit.conversionRate;

    // Vérifier capacité
    const totalCompostAfter = this.production.compost + compostOutput;
    if (totalCompostAfter > pit.capacity[pit.level]) {
      console.warn('⚠️ Capacité compostière insuffisante');
      return false;
    }

    // Consommer fumier
    this.production.manure -= manureAmount;

    // Planifier la fin du compostage
    this.activeComposting.push({
      startDay: currentDay,
      endDay: currentDay + pit.conversionTime,
      manureInput: manureAmount,
      compostOutput,
      status: 'in_progress'
    });

    console.log(`🔄 Compostage démarré: ${manureAmount}kg fumier → ${compostOutput}kg compost (${pit.conversionTime}j)`);
    return true;
  }

  /**
   * Mettre à jour le compostage
   * @param {Number} currentDay
   */
  updateComposting(currentDay) {
    for (let i = this.activeComposting.length - 1; i >= 0; i--) {
      const process = this.activeComposting[i];

      if (currentDay >= process.endDay && process.status === 'in_progress') {
        // Compost prêt
        this.production.compost += process.compostOutput;
        process.status = 'completed';

        // Ajouter aux ressources
        this.resourceManager.add(
          { fertilizers: { organic: process.compostOutput } },
          'Compostage terminé'
        );

        console.log(`✅ Compostage terminé: +${process.compostOutput}kg compost`);

        // Retirer de la liste
        this.activeComposting.splice(i, 1);
      }
    }
  }

  /**
   * Obtenir le résumé de l'élevage
   * @returns {Object}
   */
  getSummary() {
    return {
      chickens: {
        count: `${this.animals.chickens.count}/${this.animals.chickens.maxCount}`,
        feedLevel: `${this.animals.chickens.feedLevel}%`,
        health: `${this.animals.chickens.health}%`,
        dailyEggs: this.animals.chickens.dailyEggProduction,
        age: `${Math.floor(this.animals.chickens.age)} jours`
      },
      production: {
        eggs: this.production.eggs,
        manure: `${this.production.manure.toFixed(1)} kg`,
        compost: `${this.production.compost.toFixed(1)} kg`
      },
      composting: this.activeComposting.map(p => ({
        daysRemaining: p.endDay - this.lastUpdateDay,
        output: `${p.compostOutput}kg`
      }))
    };
  }

  /**
   * Sauvegarder l'état
   * @param {String} key
   */
  save(key = 'ilerise_livestock') {
    const data = {
      animals: this.animals,
      infrastructure: this.infrastructure,
      production: this.production,
      activeComposting: this.activeComposting,
      lastUpdateDay: this.lastUpdateDay
    };

    localStorage.setItem(key, JSON.stringify(data));
    console.log('💾 Élevage sauvegardé');
  }

  /**
   * Charger l'état
   * @param {String} key
   */
  load(key = 'ilerise_livestock') {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        this.animals = data.animals;
        this.infrastructure = data.infrastructure;
        this.production = data.production;
        this.activeComposting = data.activeComposting || [];
        this.lastUpdateDay = data.lastUpdateDay || 0;

        console.log('📦 Élevage chargé');
        return true;
      }
    } catch (e) {
      console.error('❌ Erreur chargement élevage:', e);
    }
    return false;
  }
}
