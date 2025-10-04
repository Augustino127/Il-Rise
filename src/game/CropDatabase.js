/**
 * CropDatabase.js
 * Base de données cultures africaines
 * NASA Space Apps Challenge 2025
 */

export const CROPS = {
  maize: {
    id: 'maize',
    name: {
      fr: 'Maïs',
      fon: 'Gbàdò',
      wolof: 'Mburu'
    },
    emoji: '🌽',
    level: 1,
    unlockCost: 0, // Gratuit (tutoriel)

    // Rendement
    maxYield: 5.0, // tonnes/hectare
    targetYield: 3.0, // Objectif minimum

    // Cycle de vie
    growthDuration: 90, // jours

    // Besoins en eau (%)
    waterNeed: {
      min: 40,
      optimal: 65,
      max: 85
    },

    // Besoins NPK (kg/ha)
    npkNeed: {
      min: 60,
      optimal: 100,
      max: 140
    },

    // pH optimal
    phRange: {
      min: 5.5,
      optimal: 6.5,
      max: 7.5
    },

    // Température (°C)
    tempRange: {
      min: 18,
      optimal: 28,
      max: 35
    },

    // Informations éducatives
    info: {
      description: 'Culture de base en Afrique. Tolère sécheresse modérée.',
      tips: [
        'Arroser régulièrement pendant floraison',
        'Besoin important en azote (N)',
        'Éviter excès d\'eau (risque pourriture)'
      ]
    }
  },

  cowpea: {
    id: 'cowpea',
    name: {
      fr: 'Niébé',
      fon: 'Ayikun',
      wolof: 'Niebe'
    },
    emoji: '🫘',
    level: 2,
    unlockCost: 100,

    maxYield: 2.0,
    targetYield: 1.5,
    growthDuration: 70,

    waterNeed: {
      min: 30,
      optimal: 50,
      max: 70
    },

    npkNeed: {
      min: 20, // Légumineuse fixe azote
      optimal: 40,
      max: 60
    },

    phRange: {
      min: 5.5,
      optimal: 6.2,
      max: 7.0
    },

    tempRange: {
      min: 20,
      optimal: 30,
      max: 38
    },

    info: {
      description: 'Légumineuse fixant azote. Très résistante à sécheresse.',
      tips: [
        'Faible besoin en engrais NPK',
        'Tolère sols pauvres',
        'Inoculer rhizobium pour meilleur rendement'
      ]
    }
  },

  rice: {
    id: 'rice',
    name: {
      fr: 'Riz irrigué',
      fon: 'Lɛsi',
      wolof: 'Ceeb'
    },
    emoji: '🍚',
    level: 3,
    unlockCost: 300,

    maxYield: 6.0,
    targetYield: 5.0,
    growthDuration: 120,

    waterNeed: {
      min: 70, // Besoin d'inondation
      optimal: 90,
      max: 100
    },

    npkNeed: {
      min: 80,
      optimal: 120,
      max: 160
    },

    phRange: {
      min: 5.0,
      optimal: 6.0,
      max: 7.0
    },

    tempRange: {
      min: 20,
      optimal: 28,
      max: 36
    },

    info: {
      description: 'Culture inondée. Besoin constant en eau.',
      tips: [
        'Maintenir 5-10 cm d\'eau en permanence',
        'Préfère sols légèrement acides',
        'Forte demande en phosphore (P)'
      ]
    }
  },

  cassava: {
    id: 'cassava',
    name: {
      fr: 'Manioc',
      fon: 'Gbagba',
      wolof: 'Manyɔk'
    },
    emoji: '🥔',
    level: 4,
    unlockCost: 500,

    maxYield: 20.0,
    targetYield: 15.0,
    growthDuration: 300, // 10 mois

    waterNeed: {
      min: 25,
      optimal: 45,
      max: 65
    },

    npkNeed: {
      min: 40,
      optimal: 70,
      max: 100
    },

    phRange: {
      min: 5.0,
      optimal: 6.0,
      max: 7.5
    },

    tempRange: {
      min: 20,
      optimal: 27,
      max: 35
    },

    info: {
      description: 'Plante-racine très résistante. Cycle long.',
      tips: [
        'Très tolérant à la sécheresse',
        'Éviter sols gorgés d\'eau',
        'Besoin important en potassium (K)'
      ]
    }
  },

  cacao: {
    id: 'cacao',
    name: {
      fr: 'Cacao',
      fon: 'Koko',
      wolof: 'Kakaw'
    },
    emoji: '🍫',
    level: 5,
    unlockCost: 1000,

    maxYield: 1.2, // kg/arbre
    targetYield: 0.8,
    growthDuration: 365, // Culture pérenne

    waterNeed: {
      min: 60,
      optimal: 80,
      max: 95
    },

    npkNeed: {
      min: 60,
      optimal: 90,
      max: 130
    },

    phRange: {
      min: 6.0,
      optimal: 6.5,
      max: 7.0
    },

    tempRange: {
      min: 21,
      optimal: 26,
      max: 32
    },

    info: {
      description: 'Culture pérenne. Besoin d\'ombrage et humidité constante.',
      tips: [
        'Planter sous arbres d\'ombrage',
        'Humidité élevée requise',
        'Sensible à sécheresse'
      ]
    }
  },

  cotton: {
    id: 'cotton',
    name: {
      fr: 'Coton',
      fon: 'Wlɛwu',
      wolof: 'Kotɔŋ'
    },
    emoji: '☁️',
    level: 6,
    unlockCost: 1500,

    maxYield: 3.0,
    targetYield: 2.5,
    growthDuration: 150,

    waterNeed: {
      min: 45,
      optimal: 70,
      max: 85
    },

    npkNeed: {
      min: 90,
      optimal: 130,
      max: 170
    },

    phRange: {
      min: 6.0,
      optimal: 7.0,
      max: 8.0
    },

    tempRange: {
      min: 20,
      optimal: 30,
      max: 38
    },

    info: {
      description: 'Culture industrielle. Gestion ravageurs critique.',
      tips: [
        'Fertilisation intensive nécessaire',
        'Surveillance ravageurs importante',
        'Éviter excès d\'eau pendant récolte'
      ]
    }
  }
};

/**
 * Récupérer culture par ID
 */
export function getCrop(cropId) {
  return CROPS[cropId] || null;
}

/**
 * Récupérer toutes les cultures
 */
export function getAllCrops() {
  return Object.values(CROPS);
}

/**
 * Récupérer cultures par niveau
 */
export function getCropsByLevel() {
  const crops = getAllCrops();
  return crops.sort((a, b) => a.level - b.level);
}

/**
 * Récupérer cultures débloquées
 */
export function getUnlockedCrops(unlockedLevels) {
  return getAllCrops().filter(crop => unlockedLevels.includes(crop.level));
}
