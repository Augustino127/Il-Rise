/**
 * FarmActionSystem.js
 * Système d'actions agricoles
 * IleRise V3 - NASA Space Apps Challenge 2025
 */

export class FarmActionSystem {
  constructor(resourceManager) {
    this.resourceManager = resourceManager;

    // Définition de toutes les actions agricoles
    this.actions = this.initializeActions();

    // Actions en cours d'exécution
    this.activeActions = [];
  }

  /**
   * Initialiser les actions disponibles
   * @returns {Array}
   */
  initializeActions() {
    return [
      // ===== PHASE 1: PRÉPARATION DU SOL =====
      {
        id: 'plow',
        name: { fr: 'Labourer le champ', fon: 'Gbɛ́ɖóhun', wolof: 'Leep' },
        icon: '🚜',
        category: 'preparation',
        duration: 2, // jours
        cost: { money: 20 },
        effect: { soilQuality: +10, weedLevel: -30 },
        unlockLevel: 1,
        description: { fr: 'Retourner la terre pour améliorer la structure du sol' }
      },

      {
        id: 'compost_prepare',
        name: { fr: 'Ajouter du compost', fon: 'Sɔ́ɖó gbɛ́ɖóhun', wolof: 'Defar kompos' },
        icon: '💩',
        category: 'preparation',
        duration: 1,
        cost: { fertilizers: { organic: 50 } },
        effect: { soilOrganic: +15, ph: +0.3, soilQuality: +5 },
        unlockLevel: 1,
        description: { fr: 'Enrichir le sol avec du compost organique' }
      },

      {
        id: 'lime_application',
        name: { fr: 'Chauler le sol', fon: 'Sɔ́ chaux gbɛ́ɖóhun', wolof: 'Defar chaux' },
        icon: '⚗️',
        category: 'preparation',
        duration: 1,
        cost: { money: 15 },
        effect: { ph: +0.5 },
        unlockLevel: 3,
        description: { fr: 'Corriger l\'acidité du sol avec de la chaux' }
      },

      // ===== PHASE 2: PLANTATION =====
      {
        id: 'plant',
        name: { fr: 'Planter les graines', fon: 'Zé atɛ́', wolof: 'Fas tëj' },
        icon: '🌱',
        category: 'planting',
        duration: 1,
        cost: {}, // Coût dynamique selon la culture
        effect: { plantCount: 100, daysSincePlant: 0 },
        required: ['plow'], // Nécessite labour
        unlockLevel: 1,
        description: { fr: 'Semer les graines dans le sol préparé' }
      },

      // ===== PHASE 3: ENTRETIEN =====
      {
        id: 'water',
        name: { fr: 'Arroser', fon: 'Sɔ́ sin', wolof: 'Ndox' },
        icon: '💧',
        category: 'maintenance',
        duration: 0.5,
        cost: { water: 100 },
        effect: { soilMoisture: +10 },
        repeatable: true,
        unlockLevel: 1,
        hotkey: 'W',
        description: { fr: 'Irriguer les plants pour maintenir l\'humidité du sol' }
      },

      {
        id: 'water_drip',
        name: { fr: 'Irrigation goutte-à-goutte', fon: 'Sin gbɛ́ɖókpó', wolof: 'Ndox ci bëri' },
        icon: '💦',
        category: 'maintenance',
        duration: 0.3,
        cost: { water: 50 }, // 2x plus efficace
        effect: { soilMoisture: +10 },
        repeatable: true,
        unlockLevel: 5,
        required: ['irrigation_skill_level_3'],
        description: { fr: 'Système d\'irrigation économe en eau (2x efficace)' }
      },

      {
        id: 'fertilize_npk',
        name: { fr: 'Appliquer NPK', fon: 'Sɔ́ NPK', wolof: 'Defar NPK' },
        icon: '🧪',
        category: 'maintenance',
        duration: 1,
        cost: { fertilizers: { npk: 20 } },
        effect: { npkLevel: +20 },
        repeatable: true,
        unlockLevel: 1,
        hotkey: 'F',
        description: { fr: 'Fertiliser avec de l\'engrais chimique NPK' }
      },

      {
        id: 'fertilize_organic',
        name: { fr: 'Fertiliser bio', fon: 'Sɔ́ɖó azɔ́n', wolof: 'Defar kompos' },
        icon: '💩',
        category: 'maintenance',
        duration: 1,
        cost: { fertilizers: { organic: 30 } },
        effect: { npkLevel: +12, soilOrganic: +5 },
        repeatable: true,
        unlockLevel: 2,
        hotkey: 'C',
        description: { fr: 'Fertiliser avec du compost organique' }
      },

      {
        id: 'spray_pesticide_natural',
        name: { fr: 'Pesticide bio', fon: 'Sɔ́ɖó agban azɔ́n', wolof: 'Pestisid nataal' },
        icon: '🪲',
        category: 'protection',
        duration: 1,
        cost: { pesticides: { natural: 2 } },
        effect: { pestResistance: +30, pestLevel: -20 },
        repeatable: true,
        unlockLevel: 2,
        hotkey: 'P',
        description: { fr: 'Traiter avec des pesticides naturels' }
      },

      {
        id: 'spray_pesticide_chemical',
        name: { fr: 'Pesticide chimique', fon: 'Sɔ́ɖó agban chimique', wolof: 'Pestisid chimik' },
        icon: '☠️',
        category: 'protection',
        duration: 0.5,
        cost: { pesticides: { chemical: 1 } },
        effect: { pestResistance: +50, pestLevel: -40, soilHealth: -5 },
        repeatable: true,
        unlockLevel: 4,
        description: { fr: 'Traiter avec des pesticides chimiques (efficace mais nocif)' }
      },

      {
        id: 'weed',
        name: { fr: 'Désherber', fon: 'Ko gbɛ́ azɔ́n', wolof: 'Leen xaj' },
        icon: '🌿',
        category: 'maintenance',
        duration: 2,
        cost: { money: 10 }, // Main d'œuvre
        effect: { weedLevel: -50 },
        repeatable: true,
        unlockLevel: 1,
        hotkey: 'D',
        description: { fr: 'Enlever les mauvaises herbes manuellement' }
      },

      {
        id: 'mulch',
        name: { fr: 'Pailler', fon: 'Sɔ́ɖó kpakpatí', wolof: 'Defar paj' },
        icon: '🍂',
        category: 'maintenance',
        duration: 1,
        cost: { money: 15 },
        effect: { weedLevel: -20, soilMoisture: +5, soilTemperature: -2 },
        repeatable: false,
        unlockLevel: 3,
        description: { fr: 'Couvrir le sol pour réduire les herbes et conserver l\'eau' }
      },

      // ===== PHASE 4: RÉCOLTE =====
      {
        id: 'harvest',
        name: { fr: 'Récolter', fon: 'Gbe atɛ́', wolof: 'Yàgg' },
        icon: '🌾',
        category: 'harvest',
        duration: 1,
        cost: { money: 20 }, // Main d'œuvre
        effect: { harvestYield: 'calculated' },
        required: ['mature_crop'],
        unlockLevel: 1,
        hotkey: 'H',
        description: { fr: 'Récolter les cultures arrivées à maturité' }
      },

      // ===== PHASE 5: POST-RÉCOLTE =====
      {
        id: 'dry',
        name: { fr: 'Sécher la récolte', fon: 'Fɛn atɛ́', wolof: 'Mëtt' },
        icon: '☀️',
        category: 'post_harvest',
        duration: 3,
        cost: {},
        effect: { harvestQuality: +10, storageLife: +30 },
        unlockLevel: 5,
        description: { fr: 'Sécher les récoltes pour une meilleure conservation' }
      },

      {
        id: 'sell',
        name: { fr: 'Vendre au marché', fon: 'Ta atɛ́ ayihɔn mɛ', wolof: 'Jaay ci marché' },
        icon: '💰',
        category: 'post_harvest',
        duration: 0,
        cost: {},
        effect: { money: 'market_price' },
        unlockLevel: 1,
        hotkey: 'S',
        description: { fr: 'Vendre la récolte au prix du marché' }
      }
    ];
  }

  /**
   * Vérifier si une action est disponible
   * @param {String} actionId
   * @param {Object} plot - Parcelle concernée
   * @param {Number} playerLevel
   * @returns {Object} { available: Boolean, reason: String }
   */
  isAvailable(actionId, plot, playerLevel = 1) {
    const action = this.getAction(actionId);
    if (!action) {
      return { available: false, reason: 'Action inconnue' };
    }

    // Vérifier déblocage niveau
    if (playerLevel < action.unlockLevel) {
      return {
        available: false,
        reason: `Niveau ${action.unlockLevel} requis`
      };
    }

    // Vérifier ressources
    if (!this.resourceManager.hasResources(action.cost)) {
      return { available: false, reason: 'Ressources insuffisantes' };
    }

    // Vérifier conditions requises
    if (action.required) {
      for (const requirement of action.required) {
        if (requirement === 'plow' && !plot.isPlowed) {
          return { available: false, reason: 'Champ non labouré' };
        }
        if (requirement === 'mature_crop' && plot.growthStage < 3) {
          return { available: false, reason: 'Culture pas encore mature' };
        }
      }
    }

    // Vérifier si répétable
    if (!action.repeatable && plot.actionsHistory?.includes(actionId)) {
      return { available: false, reason: 'Action déjà effectuée' };
    }

    return { available: true, reason: '' };
  }

  /**
   * Exécuter une action
   * @param {String} actionId
   * @param {Object} plot - Parcelle concernée
   * @param {Number} currentDay - Jour actuel de simulation
   * @returns {Object} { success: Boolean, result: Object }
   */
  executeAction(actionId, plot, currentDay = 0) {
    const action = this.getAction(actionId);
    if (!action) {
      return { success: false, error: 'Action inconnue' };
    }

    // Construire le coût dynamique pour 'plant'
    let cost = { ...action.cost };
    if (actionId === 'plant' && plot.crop) {
      cost.seeds = { [plot.crop.id]: 10 };
    }

    // Consommer ressources
    if (!this.resourceManager.consume(cost, action.name.fr)) {
      return { success: false, error: 'Ressources insuffisantes' };
    }

    // Créer l'action active
    const activeAction = {
      id: actionId,
      action,
      plot: plot.id,
      startDay: currentDay,
      endDay: currentDay + action.duration,
      status: 'in_progress'
    };

    this.activeActions.push(activeAction);

    console.log(`🎬 Action lancée: ${action.name.fr} sur parcelle ${plot.id}`);

    return {
      success: true,
      activeAction,
      completionDay: activeAction.endDay
    };
  }

  /**
   * Mettre à jour les actions en cours
   * @param {Number} currentDay
   * @returns {Array} - Actions complétées
   */
  updateActions(currentDay) {
    const completedActions = [];

    for (let i = this.activeActions.length - 1; i >= 0; i--) {
      const activeAction = this.activeActions[i];

      if (currentDay >= activeAction.endDay) {
        // Action terminée
        activeAction.status = 'completed';
        completedActions.push(activeAction);
        this.activeActions.splice(i, 1);

        console.log(`✅ Action complétée: ${activeAction.action.name.fr}`);
      }
    }

    return completedActions;
  }

  /**
   * Appliquer les effets d'une action complétée
   * @param {Object} completedAction
   * @param {Object} plot
   * @returns {Object} - Changements appliqués
   */
  applyEffects(completedAction, plot) {
    const effects = completedAction.action.effect;
    const changes = {};

    for (const [key, value] of Object.entries(effects)) {
      if (key === 'soilMoisture') {
        plot.soilMoisture = Math.max(0, Math.min(100, plot.soilMoisture + value));
        changes.soilMoisture = value;
      } else if (key === 'npkLevel') {
        plot.npkLevel = Math.max(0, Math.min(150, plot.npkLevel + value));
        changes.npkLevel = value;
      } else if (key === 'weedLevel') {
        plot.weedLevel = Math.max(0, Math.min(100, plot.weedLevel + value));
        changes.weedLevel = value;
      } else if (key === 'pestLevel') {
        plot.pestLevel = Math.max(0, Math.min(100, plot.pestLevel + value));
        changes.pestLevel = value;
      } else if (key === 'ph') {
        plot.ph = Math.max(4.0, Math.min(8.0, plot.ph + value));
        changes.ph = value;
      } else if (key === 'soilQuality' || key === 'soilOrganic' || key === 'pestResistance') {
        plot[key] = (plot[key] || 0) + value;
        changes[key] = value;
      } else if (key === 'plantCount') {
        plot.plantCount = value;
        plot.daysSincePlant = 0;
        plot.isPlanted = true;
        changes.plantCount = value;
      } else if (key === 'harvestYield') {
        // Sera calculé par le moteur de simulation
        changes.harvestYield = 'calculated';
      }
    }

    // Enregistrer dans l'historique
    if (!plot.actionsHistory) {
      plot.actionsHistory = [];
    }
    plot.actionsHistory.push(completedAction.id);

    return changes;
  }

  /**
   * Obtenir une action par ID
   * @param {String} actionId
   * @returns {Object}
   */
  getAction(actionId) {
    return this.actions.find(a => a.id === actionId);
  }

  /**
   * Obtenir les actions par catégorie
   * @param {String} category
   * @returns {Array}
   */
  getActionsByCategory(category) {
    return this.actions.filter(a => a.category === category);
  }

  /**
   * Obtenir les actions disponibles pour une parcelle
   * @param {Object} plot
   * @param {Number} playerLevel
   * @returns {Array}
   */
  getAvailableActions(plot, playerLevel = 1) {
    return this.actions
      .map(action => ({
        ...action,
        availability: this.isAvailable(action.id, plot, playerLevel)
      }))
      .filter(action => action.availability.available || action.unlockLevel <= playerLevel);
  }

  /**
   * Annuler une action en cours
   * @param {String} actionId
   * @param {String} plotId
   * @returns {Boolean}
   */
  cancelAction(actionId, plotId) {
    const index = this.activeActions.findIndex(
      a => a.id === actionId && a.plot === plotId && a.status === 'in_progress'
    );

    if (index !== -1) {
      this.activeActions.splice(index, 1);
      console.log(`❌ Action annulée: ${actionId}`);
      return true;
    }

    return false;
  }
}
