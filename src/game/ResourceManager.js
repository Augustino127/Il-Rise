/**
 * ResourceManager.js
 * Système de gestion des ressources agricoles
 * IleRise V3 - NASA Space Apps Challenge 2025
 */

export class ResourceManager {
  constructor(initialResources = {}) {
    this.resources = {
      // Ressources monétaires
      money: initialResources.money || 500,

      // Ressources liquides
      water: initialResources.water || 1000, // Litres

      // Graines par culture
      seeds: {
        maize: initialResources.seeds?.maize || 50,
        cowpea: initialResources.seeds?.cowpea || 30,
        rice: initialResources.seeds?.rice || 20,
        cassava: initialResources.seeds?.cassava || 15,
        cacao: initialResources.seeds?.cacao || 10,
        cotton: initialResources.seeds?.cotton || 25
      },

      // Engrais et amendements
      fertilizers: {
        organic: initialResources.fertilizers?.organic || 100, // kg compost
        npk: initialResources.fertilizers?.npk || 50,           // kg NPK chimique
        urea: initialResources.fertilizers?.urea || 30,         // kg urée (azote)
        phosphate: initialResources.fertilizers?.phosphate || 20 // kg phosphate
      },

      // Pesticides et traitements
      pesticides: {
        natural: initialResources.pesticides?.natural || 10,    // L pesticide bio
        chemical: initialResources.pesticides?.chemical || 5     // L pesticide chimique
      },

      // Outils et équipements
      tools: {
        watering_can: initialResources.tools?.watering_can || 1,  // Arrosoir
        sprayer: initialResources.tools?.sprayer || 0,            // Pulvérisateur
        plow: initialResources.tools?.plow || 0,                  // Charrue
        tractor: initialResources.tools?.tractor || 0             // Tracteur
      },

      // Récoltes stockées (tonnes)
      harvest: {
        maize: initialResources.harvest?.maize || 0,
        cowpea: initialResources.harvest?.cowpea || 0,
        rice: initialResources.harvest?.rice || 0,
        cassava: initialResources.harvest?.cassava || 0,
        cacao: initialResources.harvest?.cacao || 0,
        cotton: initialResources.harvest?.cotton || 0
      },

      // Produits animaux
      animalProducts: {
        eggs: initialResources.animalProducts?.eggs || 0,
        milk: initialResources.animalProducts?.milk || 0,
        manure: initialResources.animalProducts?.manure || 0
      }
    };

    // Capacités maximales
    this.capacities = {
      water: 2000,
      fertilizers: { organic: 500, npk: 200, urea: 100, phosphate: 100 },
      pesticides: { natural: 50, chemical: 20 },
      harvest: 10, // tonnes par culture
      animalProducts: { eggs: 100, milk: 50, manure: 500 }
    };

    // Historique des transactions
    this.transactionHistory = [];
  }

  /**
   * Vérifier si on a suffisamment de ressources
   * @param {Object} cost - Coût de l'action { money: 50, water: 100, ... }
   * @returns {Boolean}
   */
  hasResources(cost) {
    for (const [category, value] of Object.entries(cost)) {
      if (category === 'money' || category === 'water') {
        if (this.resources[category] < value) {
          return false;
        }
      } else if (category === 'seeds' || category === 'fertilizers' || category === 'pesticides') {
        for (const [type, amount] of Object.entries(value)) {
          if (this.resources[category][type] < amount) {
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * Consommer des ressources
   * @param {Object} cost - Ressources à consommer
   * @param {String} action - Description de l'action
   * @returns {Boolean} - Success
   */
  consume(cost, action = 'Unknown action') {
    if (!this.hasResources(cost)) {
      console.warn(`⚠️ Ressources insuffisantes pour: ${action}`);
      return false;
    }

    // Consommer les ressources
    for (const [category, value] of Object.entries(cost)) {
      if (category === 'money' || category === 'water') {
        this.resources[category] -= value;
      } else if (category === 'seeds' || category === 'fertilizers' || category === 'pesticides') {
        for (const [type, amount] of Object.entries(value)) {
          this.resources[category][type] -= amount;
        }
      }
    }

    // Enregistrer la transaction
    this.transactionHistory.push({
      timestamp: Date.now(),
      action,
      cost,
      type: 'expense'
    });

    console.log(`✅ Ressources consommées pour: ${action}`, cost);
    return true;
  }

  /**
   * Ajouter des ressources
   * @param {Object} gain - Ressources à ajouter
   * @param {String} source - Source du gain
   */
  add(gain, source = 'Unknown source') {
    for (const [category, value] of Object.entries(gain)) {
      if (category === 'money' || category === 'water') {
        this.resources[category] += value;
        // Appliquer capacité max
        if (category === 'water') {
          this.resources.water = Math.min(this.resources.water, this.capacities.water);
        }
      } else if (category === 'seeds' || category === 'fertilizers' || category === 'pesticides' ||
                 category === 'harvest' || category === 'animalProducts') {
        for (const [type, amount] of Object.entries(value)) {
          this.resources[category][type] += amount;

          // Appliquer capacités max
          if (this.capacities[category] && this.capacities[category][type] !== undefined) {
            this.resources[category][type] = Math.min(
              this.resources[category][type],
              this.capacities[category][type]
            );
          }
        }
      }
    }

    // Enregistrer la transaction
    this.transactionHistory.push({
      timestamp: Date.now(),
      source,
      gain,
      type: 'income'
    });

    console.log(`💰 Ressources ajoutées depuis: ${source}`, gain);
  }

  /**
   * Obtenir le stock d'une ressource spécifique
   * @param {String} category - Catégorie (money, water, seeds, etc.)
   * @param {String} type - Type optionnel (maize, npk, etc.)
   * @returns {Number}
   */
  get(category, type = null) {
    if (type) {
      return this.resources[category]?.[type] || 0;
    }
    return this.resources[category] || 0;
  }

  /**
   * Définir directement une valeur (admin/debug)
   * @param {String} category
   * @param {Number|String} value
   * @param {String} type
   */
  set(category, value, type = null) {
    if (type) {
      if (this.resources[category]) {
        this.resources[category][type] = value;
      }
    } else {
      this.resources[category] = value;
    }
  }

  /**
   * Vérifier si une ressource est pleine (capacité max)
   * @param {String} category
   * @param {String} type
   * @returns {Boolean}
   */
  isFull(category, type = null) {
    if (type) {
      const current = this.resources[category]?.[type] || 0;
      const capacity = this.capacities[category]?.[type];
      return capacity ? current >= capacity : false;
    }

    const current = this.resources[category] || 0;
    const capacity = this.capacities[category];
    return capacity ? current >= capacity : false;
  }

  /**
   * Obtenir un résumé des ressources
   * @returns {Object}
   */
  getSummary() {
    return {
      money: this.resources.money,
      water: `${this.resources.water}/${this.capacities.water}L`,
      seeds: Object.entries(this.resources.seeds).map(([crop, count]) => `${crop}: ${count}`),
      fertilizers: {
        organic: `${this.resources.fertilizers.organic}/${this.capacities.fertilizers.organic}kg`,
        npk: `${this.resources.fertilizers.npk}/${this.capacities.fertilizers.npk}kg`
      },
      harvest: Object.entries(this.resources.harvest)
        .filter(([, amount]) => amount > 0)
        .map(([crop, amount]) => `${crop}: ${amount}t`)
    };
  }

  /**
   * Obtenir l'historique des transactions
   * @param {Number} limit - Nombre max de transactions
   * @returns {Array}
   */
  getHistory(limit = 10) {
    return this.transactionHistory.slice(-limit).reverse();
  }

  /**
   * Sauvegarder l'état dans localStorage
   * @param {String} key
   */
  save(key = 'ilerise_resources') {
    try {
      const data = {
        resources: this.resources,
        history: this.transactionHistory.slice(-50) // Garder 50 dernières transactions
      };
      localStorage.setItem(key, JSON.stringify(data));
      console.log('💾 Ressources sauvegardées');
    } catch (e) {
      console.error('❌ Erreur sauvegarde ressources:', e);
    }
  }

  /**
   * Charger l'état depuis localStorage
   * @param {String} key
   */
  load(key = 'ilerise_resources') {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        this.resources = data.resources;
        this.transactionHistory = data.history || [];
        console.log('📦 Ressources chargées');
        return true;
      }
    } catch (e) {
      console.error('❌ Erreur chargement ressources:', e);
    }
    return false;
  }

  /**
   * Réinitialiser les ressources
   */
  reset() {
    this.resources = {
      money: 500,
      water: 1000,
      seeds: { maize: 50, cowpea: 30, rice: 20, cassava: 15, cacao: 10, cotton: 25 },
      fertilizers: { organic: 100, npk: 50, urea: 30, phosphate: 20 },
      pesticides: { natural: 10, chemical: 5 },
      tools: { watering_can: 1, sprayer: 0, plow: 0, tractor: 0 },
      harvest: { maize: 0, cowpea: 0, rice: 0, cassava: 0, cacao: 0, cotton: 0 },
      animalProducts: { eggs: 0, milk: 0, manure: 0 }
    };
    this.transactionHistory = [];
    console.log('🔄 Ressources réinitialisées');
  }
}
