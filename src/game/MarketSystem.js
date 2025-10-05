/**
 * MarketSystem.js
 * Système de marché agricole avec prix dynamiques
 * IleRise V3 - NASA Space Apps Challenge 2025
 */

export class MarketSystem {
  constructor(resourceManager, timeSimulation) {
    this.resourceManager = resourceManager;
    this.timeSimulation = timeSimulation;

    // Prix de base (en pièces)
    this.basePrices = this.initializeBasePrices();

    // Modificateurs de prix (fluctuations)
    this.priceModifiers = {};

    // Historique des prix
    this.priceHistory = [];

    // Tendances du marché
    this.trends = {};

    this.initializeMarket();
  }

  /**
   * Initialiser les prix de base
   * @returns {Object}
   */
  initializeBasePrices() {
    return {
      // GRAINES (achat uniquement)
      seeds: {
        maize: 2,    // 2💰 par graine
        cowpea: 2.5,
        rice: 3,
        cassava: 4,
        cacao: 5,
        cotton: 2
      },

      // EAU (achat uniquement)
      water: 0.05, // 0.05💰 par litre (5💰 pour 100L)

      // ENGRAIS (achat)
      fertilizers: {
        organic: 1.5, // 1.5💰 par kg
        npk: 3,       // 3💰 par kg
        urea: 2.5,
        phosphate: 2
      },

      // PESTICIDES (achat)
      pesticides: {
        natural: 15,  // 15💰 par litre
        chemical: 25
      },

      // ANIMAUX (achat)
      animals: {
        chicken: 50,
        goat: 500
      },

      // RÉCOLTES (vente)
      harvest: {
        maize: 150,    // 150💰 par tonne
        cowpea: 200,
        rice: 180,
        cassava: 100,
        cacao: 2500,   // Prix élevé pour le cacao
        cotton: 300
      },

      // PRODUITS ANIMAUX (vente)
      animalProducts: {
        eggs: 5,      // 5💰 par œuf
        milk: 3,      // 3💰 par litre
        manure: 1     // 1💰 par kg (peut être vendu)
      }
    };
  }

  /**
   * Initialiser le marché
   */
  initializeMarket() {
    // Initialiser modificateurs à 1.0 (prix normal)
    for (const category in this.basePrices) {
      if (typeof this.basePrices[category] === 'object') {
        this.priceModifiers[category] = {};
        for (const item in this.basePrices[category]) {
          this.priceModifiers[category][item] = 1.0;
          this.trends[`${category}.${item}`] = 'stable';
        }
      } else {
        this.priceModifiers[category] = 1.0;
        this.trends[category] = 'stable';
      }
    }

    console.log('🏪 Marché initialisé');
  }

  /**
   * Obtenir le prix actuel d'un article
   * @param {String} category - seeds, water, fertilizers, harvest, etc.
   * @param {String} item - maize, npk, eggs, etc.
   * @returns {Number}
   */
  getPrice(category, item = null) {
    let basePrice;

    if (item) {
      basePrice = this.basePrices[category]?.[item];
      const modifier = this.priceModifiers[category]?.[item] || 1.0;
      return basePrice ? Math.round(basePrice * modifier) : 0;
    }

    basePrice = this.basePrices[category];
    const modifier = this.priceModifiers[category] || 1.0;
    return basePrice ? basePrice * modifier : 0;
  }

  /**
   * Acheter un article
   * @param {String} category
   * @param {String} item
   * @param {Number} quantity
   * @returns {Object} { success: Boolean, cost: Number }
   */
  buy(category, item, quantity) {
    const unitPrice = this.getPrice(category, item);
    const totalCost = unitPrice * quantity;

    if (!this.resourceManager.hasResources({ money: totalCost })) {
      return { success: false, error: 'Argent insuffisant', cost: totalCost };
    }

    // Consommer l'argent
    this.resourceManager.consume({ money: totalCost }, `Achat ${quantity}x ${item}`);

    // Ajouter les ressources achetées
    const gain = {};
    if (item) {
      gain[category] = { [item]: quantity };
    } else {
      gain[category] = quantity;
    }

    this.resourceManager.add(gain, `Achat marché`);

    console.log(`🛒 Acheté: ${quantity}x ${item || category} pour ${totalCost}💰`);

    return { success: true, cost: totalCost };
  }

  /**
   * Vendre un article
   * @param {String} category
   * @param {String} item
   * @param {Number} quantity
   * @returns {Object} { success: Boolean, revenue: Number }
   */
  sell(category, item, quantity) {
    // Vérifier stock
    const available = this.resourceManager.get(category, item);
    if (available < quantity) {
      return { success: false, error: 'Stock insuffisant', available };
    }

    const unitPrice = this.getPrice(category, item);
    const totalRevenue = unitPrice * quantity;

    // Consommer le stock
    const cost = {};
    cost[category] = { [item]: quantity };
    this.resourceManager.consume(cost, `Vente ${quantity}x ${item}`);

    // Ajouter l'argent
    this.resourceManager.add({ money: totalRevenue }, `Vente ${quantity}x ${item}`);

    console.log(`💰 Vendu: ${quantity}x ${item} pour ${totalRevenue}💰`);

    // Influencer le prix (l'offre augmente → prix baisse légèrement)
    this.adjustPrice(category, item, -0.02);

    return { success: true, revenue: totalRevenue };
  }

  /**
   * Ajuster le prix d'un article
   * @param {String} category
   * @param {String} item
   * @param {Number} change - Pourcentage de changement (-0.1 = -10%, +0.1 = +10%)
   */
  adjustPrice(category, item, change) {
    if (item) {
      this.priceModifiers[category][item] = Math.max(
        0.5,
        Math.min(2.0, this.priceModifiers[category][item] + change)
      );

      // Déterminer tendance
      if (change > 0.05) {
        this.trends[`${category}.${item}`] = 'rising';
      } else if (change < -0.05) {
        this.trends[`${category}.${item}`] = 'falling';
      } else {
        this.trends[`${category}.${item}`] = 'stable';
      }
    } else {
      this.priceModifiers[category] = Math.max(
        0.5,
        Math.min(2.0, this.priceModifiers[category] + change)
      );
    }
  }

  /**
   * Mettre à jour les prix du marché (appelé périodiquement)
   * Simule les fluctuations du marché
   */
  updateMarket() {
    // Fluctuations aléatoires pour les récoltes (plus volatiles)
    for (const crop in this.basePrices.harvest) {
      const randomChange = (Math.random() - 0.5) * 0.2; // ±10%
      this.adjustPrice('harvest', crop, randomChange);
    }

    // Fluctuations légères pour les autres produits
    for (const product in this.basePrices.animalProducts) {
      const randomChange = (Math.random() - 0.5) * 0.1; // ±5%
      this.adjustPrice('animalProducts', product, randomChange);
    }

    // Événements spéciaux (rares)
    if (Math.random() < 0.05) {
      this.triggerMarketEvent();
    }

    // Enregistrer dans l'historique
    this.recordPrices();

    console.log('📊 Prix du marché mis à jour');
  }

  /**
   * Déclencher un événement de marché
   */
  triggerMarketEvent() {
    const events = [
      {
        name: 'Forte demande de maïs',
        effect: () => this.adjustPrice('harvest', 'maize', 0.3),
        message: '📈 Forte demande de maïs ! Prix +30%'
      },
      {
        name: 'Surplus de niébé',
        effect: () => this.adjustPrice('harvest', 'cowpea', -0.2),
        message: '📉 Surplus de niébé sur le marché. Prix -20%'
      },
      {
        name: 'Hausse prix engrais',
        effect: () => {
          this.adjustPrice('fertilizers', 'npk', 0.25);
          this.adjustPrice('fertilizers', 'urea', 0.25);
        },
        message: '📈 Hausse du prix des engrais chimiques (+25%)'
      },
      {
        name: 'Boom du cacao',
        effect: () => this.adjustPrice('harvest', 'cacao', 0.5),
        message: '🍫 Boom du marché du cacao ! Prix +50%'
      },
      {
        name: 'Chute prix cotton',
        effect: () => this.adjustPrice('harvest', 'cotton', -0.3),
        message: '📉 Chute du prix du coton (-30%)'
      }
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    event.effect();
    console.log(`🎬 ${event.message}`);

    return event;
  }

  /**
   * Enregistrer les prix actuels dans l'historique
   */
  recordPrices() {
    const snapshot = {
      day: this.timeSimulation.currentDay,
      prices: {
        harvest: {},
        animalProducts: {}
      }
    };

    for (const crop in this.basePrices.harvest) {
      snapshot.prices.harvest[crop] = this.getPrice('harvest', crop);
    }

    for (const product in this.basePrices.animalProducts) {
      snapshot.prices.animalProducts[product] = this.getPrice('animalProducts', product);
    }

    this.priceHistory.push(snapshot);

    // Garder seulement les 30 derniers jours
    if (this.priceHistory.length > 30) {
      this.priceHistory.shift();
    }
  }

  /**
   * Obtenir les tendances du marché
   * @returns {Array}
   */
  getTrends() {
    const trends = [];

    for (const crop in this.basePrices.harvest) {
      const modifier = this.priceModifiers.harvest[crop];
      const change = ((modifier - 1.0) * 100).toFixed(0);
      const trend = this.trends[`harvest.${crop}`] || 'stable';

      let icon = '➡️';
      if (trend === 'rising') icon = '📈';
      if (trend === 'falling') icon = '📉';

      trends.push({
        category: 'harvest',
        item: crop,
        basePrice: this.basePrices.harvest[crop],
        currentPrice: this.getPrice('harvest', crop),
        change: `${change > 0 ? '+' : ''}${change}%`,
        trend,
        icon
      });
    }

    return trends;
  }

  /**
   * Obtenir le catalogue complet du marché
   * @returns {Object}
   */
  getCatalog() {
    return {
      seeds: Object.keys(this.basePrices.seeds).map(crop => ({
        id: crop,
        name: crop,
        category: 'seeds',
        price: this.getPrice('seeds', crop),
        unit: 'graine',
        action: 'buy'
      })),

      fertilizers: Object.keys(this.basePrices.fertilizers).map(type => ({
        id: type,
        name: type,
        category: 'fertilizers',
        price: this.getPrice('fertilizers', type),
        unit: 'kg',
        action: 'buy'
      })),

      pesticides: Object.keys(this.basePrices.pesticides).map(type => ({
        id: type,
        name: type,
        category: 'pesticides',
        price: this.getPrice('pesticides', type),
        unit: 'L',
        action: 'buy'
      })),

      animals: Object.keys(this.basePrices.animals).map(animal => ({
        id: animal,
        name: animal,
        category: 'animals',
        price: this.getPrice('animals', animal),
        unit: 'animal',
        action: 'buy'
      })),

      harvest: Object.keys(this.basePrices.harvest).map(crop => ({
        id: crop,
        name: crop,
        category: 'harvest',
        price: this.getPrice('harvest', crop),
        unit: 'tonne',
        stock: this.resourceManager.get('harvest', crop),
        action: 'sell'
      })),

      animalProducts: Object.keys(this.basePrices.animalProducts).map(product => ({
        id: product,
        name: product,
        category: 'animalProducts',
        price: this.getPrice('animalProducts', product),
        unit: product === 'milk' ? 'L' : (product === 'eggs' ? 'unité' : 'kg'),
        stock: this.resourceManager.get('animalProducts', product),
        action: 'sell'
      }))
    };
  }

  /**
   * Sauvegarder l'état
   * @param {String} key
   */
  save(key = 'ilerise_market') {
    const data = {
      priceModifiers: this.priceModifiers,
      trends: this.trends,
      priceHistory: this.priceHistory.slice(-10) // Garder 10 derniers jours
    };

    localStorage.setItem(key, JSON.stringify(data));
    console.log('💾 Marché sauvegardé');
  }

  /**
   * Charger l'état
   * @param {String} key
   */
  load(key = 'ilerise_market') {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        this.priceModifiers = data.priceModifiers;
        this.trends = data.trends;
        this.priceHistory = data.priceHistory || [];

        console.log('📦 Marché chargé');
        return true;
      }
    } catch (e) {
      console.error('❌ Erreur chargement marché:', e);
    }
    return false;
  }
}
