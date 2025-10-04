/**
 * LevelSystem.js
 * Système de niveaux par culture
 * NASA Space Apps Challenge 2025
 */

export const LEVEL_SYSTEM = {
  maize: {
    id: 'maize',
    name: { fr: 'Maïs', fon: 'Gbàdò', wolof: 'Mburu' },
    emoji: '🌽',
    unlockCost: 0, // Gratuit

    levels: [
      {
        id: 1,
        name: 'Débutant',
        difficulty: 'easy',
        targetYield: 3.0,
        maxYield: 5.0,
        description: 'Conditions optimales. Apprenez les bases.',
        constraints: {
          budget: null, // Pas de limite
          weather: 'optimal',
          soilQuality: 'good'
        },
        rewards: { coins: 50, stars: 3 }
      },
      {
        id: 2,
        name: 'Intermédiaire',
        difficulty: 'medium',
        targetYield: 4.0,
        maxYield: 5.5,
        description: 'Saison sèche. Gestion de l\'eau critique.',
        constraints: {
          budget: 100, // 100 pièces max pour NPK
          weather: 'dry',
          soilQuality: 'medium'
        },
        rewards: { coins: 100, stars: 3 }
      },
      {
        id: 3,
        name: 'Expert',
        difficulty: 'hard',
        targetYield: 4.5,
        maxYield: 6.0,
        description: 'Sol pauvre + sécheresse. Optimisation maximale.',
        constraints: {
          budget: 80,
          weather: 'drought',
          soilQuality: 'poor'
        },
        rewards: { coins: 200, stars: 3 }
      }
    ]
  },

  cowpea: {
    id: 'cowpea',
    name: { fr: 'Niébé', fon: 'Ayikun', wolof: 'Niebe' },
    emoji: '🫘',
    unlockCost: 100,

    levels: [
      {
        id: 1,
        name: 'Débutant',
        difficulty: 'easy',
        targetYield: 1.2,
        maxYield: 2.0,
        description: 'Introduction au niébé. Culture résistante.',
        constraints: {
          budget: null,
          weather: 'optimal',
          soilQuality: 'medium'
        },
        rewards: { coins: 60, stars: 3 }
      },
      {
        id: 2,
        name: 'Intermédiaire',
        difficulty: 'medium',
        targetYield: 1.5,
        maxYield: 2.2,
        description: 'Conditions semi-arides. Fixation azote optimale.',
        constraints: {
          budget: 50, // Peu d'engrais (légumineuse)
          weather: 'dry',
          soilQuality: 'poor'
        },
        rewards: { coins: 120, stars: 3 }
      },
      {
        id: 3,
        name: 'Expert',
        difficulty: 'hard',
        targetYield: 1.8,
        maxYield: 2.5,
        description: 'Sécheresse extrême. Tolérance maximale testée.',
        constraints: {
          budget: 40,
          weather: 'extreme_dry',
          soilQuality: 'very_poor'
        },
        rewards: { coins: 250, stars: 3 }
      }
    ]
  },

  rice: {
    id: 'rice',
    name: { fr: 'Riz irrigué', fon: 'Lɛsi', wolof: 'Ceeb' },
    emoji: '🍚',
    unlockCost: 300,

    levels: [
      {
        id: 1,
        name: 'Débutant',
        difficulty: 'easy',
        targetYield: 4.0,
        maxYield: 6.0,
        description: 'Rizière inondée. Gestion eau simple.',
        constraints: {
          budget: null,
          weather: 'rainy',
          soilQuality: 'good'
        },
        rewards: { coins: 80, stars: 3 }
      },
      {
        id: 2,
        name: 'Intermédiaire',
        difficulty: 'medium',
        targetYield: 5.0,
        maxYield: 7.0,
        description: 'Irrigation contrôlée. pH critique.',
        constraints: {
          budget: 120,
          weather: 'optimal',
          soilQuality: 'acidic'
        },
        rewards: { coins: 150, stars: 3 }
      },
      {
        id: 3,
        name: 'Expert',
        difficulty: 'hard',
        targetYield: 6.0,
        maxYield: 8.0,
        description: 'Production intensive. Fertilisation précise.',
        constraints: {
          budget: 150,
          weather: 'variable',
          soilQuality: 'medium'
        },
        rewards: { coins: 300, stars: 3 }
      }
    ]
  },

  cassava: {
    id: 'cassava',
    name: { fr: 'Manioc', fon: 'Gbagba', wolof: 'Manyɔk' },
    emoji: '🥔',
    unlockCost: 500,

    levels: [
      {
        id: 1,
        name: 'Débutant',
        difficulty: 'easy',
        targetYield: 12.0,
        maxYield: 20.0,
        description: 'Culture de subsistance. Cycle long.',
        constraints: {
          budget: null,
          weather: 'optimal',
          soilQuality: 'medium'
        },
        rewards: { coins: 100, stars: 3 }
      },
      {
        id: 2,
        name: 'Intermédiaire',
        difficulty: 'medium',
        targetYield: 15.0,
        maxYield: 22.0,
        description: 'Sol pauvre. Tolérance sécheresse.',
        constraints: {
          budget: 70,
          weather: 'dry',
          soilQuality: 'poor'
        },
        rewards: { coins: 180, stars: 3 }
      },
      {
        id: 3,
        name: 'Expert',
        difficulty: 'hard',
        targetYield: 18.0,
        maxYield: 25.0,
        description: 'Production commerciale. Rendement maximal.',
        constraints: {
          budget: 100,
          weather: 'variable',
          soilQuality: 'good'
        },
        rewards: { coins: 350, stars: 3 }
      }
    ]
  },

  cacao: {
    id: 'cacao',
    name: { fr: 'Cacao', fon: 'Koko', wolof: 'Kakaw' },
    emoji: '🍫',
    unlockCost: 1000,

    levels: [
      {
        id: 1,
        name: 'Débutant',
        difficulty: 'easy',
        targetYield: 0.6,
        maxYield: 1.2,
        description: 'Jeune cacaoyer. Ombrage optimal.',
        constraints: {
          budget: null,
          weather: 'humid',
          soilQuality: 'rich'
        },
        rewards: { coins: 150, stars: 3 }
      },
      {
        id: 2,
        name: 'Intermédiaire',
        difficulty: 'medium',
        targetYield: 0.8,
        maxYield: 1.4,
        description: 'Cacaoyer mature. Gestion humidité.',
        constraints: {
          budget: 90,
          weather: 'variable',
          soilQuality: 'medium'
        },
        rewards: { coins: 250, stars: 3 }
      },
      {
        id: 3,
        name: 'Expert',
        difficulty: 'hard',
        targetYield: 1.0,
        maxYield: 1.6,
        description: 'Production intensive. Qualité premium.',
        constraints: {
          budget: 130,
          weather: 'stress',
          soilQuality: 'good'
        },
        rewards: { coins: 500, stars: 3 }
      }
    ]
  },

  cotton: {
    id: 'cotton',
    name: { fr: 'Coton', fon: 'Wlɛwu', wolof: 'Kotɔŋ' },
    emoji: '☁️',
    unlockCost: 1500,

    levels: [
      {
        id: 1,
        name: 'Débutant',
        difficulty: 'easy',
        targetYield: 2.0,
        maxYield: 3.0,
        description: 'Culture de base. Fertilisation simple.',
        constraints: {
          budget: null,
          weather: 'optimal',
          soilQuality: 'good'
        },
        rewards: { coins: 120, stars: 3 }
      },
      {
        id: 2,
        name: 'Intermédiaire',
        difficulty: 'medium',
        targetYield: 2.5,
        maxYield: 3.5,
        description: 'Culture commerciale. NPK intensif.',
        constraints: {
          budget: 150,
          weather: 'dry',
          soilQuality: 'medium'
        },
        rewards: { coins: 280, stars: 3 }
      },
      {
        id: 3,
        name: 'Expert',
        difficulty: 'hard',
        targetYield: 3.0,
        maxYield: 4.0,
        description: 'Production export. Qualité fibres maximale.',
        constraints: {
          budget: 170,
          weather: 'variable',
          soilQuality: 'rich'
        },
        rewards: { coins: 600, stars: 3 }
      }
    ]
  }
};

/**
 * Récupérer culture par ID
 */
export function getCropSystem(cropId) {
  return LEVEL_SYSTEM[cropId] || null;
}

/**
 * Récupérer toutes les cultures
 */
export function getAllCropSystems() {
  return Object.values(LEVEL_SYSTEM);
}

/**
 * Récupérer niveau spécifique
 */
export function getCropLevel(cropId, levelId) {
  const crop = LEVEL_SYSTEM[cropId];
  if (!crop) return null;

  return crop.levels.find(l => l.id === levelId) || null;
}

/**
 * Vérifier si culture débloquée
 */
export function isCropUnlocked(cropId, playerCoins) {
  const crop = LEVEL_SYSTEM[cropId];
  if (!crop) return false;

  return playerCoins >= crop.unlockCost;
}
