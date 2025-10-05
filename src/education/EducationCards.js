/**
 * Système de cartes éducatives
 * Affiche des informations pédagogiques après chaque simulation
 */

export class EducationCards {
  constructor() {
    this.cards = this.initializeCards();
  }

  /**
   * Base de données des cartes éducatives
   */
  initializeCards() {
    return {
      // Cartes sur l'eau
      water: [
        {
          id: 'water-1',
          title: 'Importance de l\'irrigation 💧',
          content: 'L\'eau est essentielle pour la photosynthèse et le transport des nutriments. Un manque d\'eau réduit la croissance et le rendement.',
          funFact: 'Une plante de maïs peut transpirer jusqu\'à 200 litres d\'eau pendant son cycle!',
          source: 'NASA SMAP',
          quiz: {
            question: 'Pourquoi l\'eau est-elle essentielle pour les plantes ?',
            answers: [
              { text: 'Pour la photosynthèse et le transport des nutriments', correct: true },
              { text: 'Seulement pour refroidir les feuilles', correct: false },
              { text: 'Pour donner du goût aux fruits', correct: false }
            ]
          }
        },
        {
          id: 'water-2',
          title: 'Excès d\'eau ⚠️',
          content: 'Trop d\'eau peut asphyxier les racines et favoriser les maladies fongiques. L\'équilibre est crucial.',
          funFact: 'Les racines ont besoin d\'oxygène pour respirer. Un sol trop humide peut les "noyer".',
          source: 'Données NASA'
        },
        {
          id: 'water-3',
          title: 'Humidité du sol 🌍',
          content: 'La NASA utilise le satellite SMAP pour mesurer l\'humidité du sol à l\'échelle mondiale, aidant les agriculteurs à optimiser l\'irrigation.',
          funFact: 'SMAP peut détecter l\'humidité du sol jusqu\'à 5cm de profondeur depuis l\'espace!',
          source: 'NASA SMAP'
        }
      ],

      // Cartes sur les nutriments
      nutrients: [
        {
          id: 'npk-1',
          title: 'NPK: Les 3 essentiels 🌱',
          content: 'N (Azote): Croissance des feuilles. P (Phosphore): Racines et fleurs. K (Potassium): Résistance et fruits.',
          funFact: 'L\'azote représente 78% de l\'atmosphère, mais les plantes ne peuvent pas l\'utiliser directement!',
          source: 'Agronomie'
        },
        {
          id: 'npk-2',
          title: 'Signes de carences 🔍',
          content: 'Feuilles jaunes = manque d\'azote. Croissance lente = manque de phosphore. Bords brûlés = manque de potassium.',
          funFact: 'Les carences nutritives apparaissent souvent d\'abord sur les vieilles feuilles.',
          source: 'Diagnostic foliaire'
        },
        {
          id: 'npk-3',
          title: 'Engrais organiques vs chimiques 🌿',
          content: 'Les engrais organiques libèrent les nutriments lentement. Les engrais chimiques agissent rapidement mais peuvent acidifier le sol.',
          funFact: 'Le compost améliore la structure du sol en plus d\'apporter des nutriments!',
          source: 'Agronomie durable'
        }
      ],

      // Cartes sur le pH
      ph: [
        {
          id: 'ph-1',
          title: 'Qu\'est-ce que le pH? ⚗️',
          content: 'Le pH mesure l\'acidité du sol (0-14). pH 7 = neutre, <7 = acide, >7 = alcalin. La plupart des cultures préfèrent pH 6-7.',
          funFact: 'Le pH affecte la disponibilité des nutriments. À pH trop bas, certains nutriments deviennent toxiques!',
          source: 'Chimie du sol'
        },
        {
          id: 'ph-2',
          title: 'Corriger le pH 🔧',
          content: 'Sol trop acide? Ajoutez de la chaux. Sol trop alcalin? Ajoutez du soufre ou du compost acide.',
          funFact: 'Les myrtilles adorent les sols acides (pH 4.5-5.5) tandis que les épinards préfèrent pH 7-7.5!',
          source: 'Agronomie'
        }
      ],

      // Cartes sur le NDVI
      ndvi: [
        {
          id: 'ndvi-1',
          title: 'Qu\'est-ce que le NDVI? 🛰️',
          content: 'Le NDVI (Normalized Difference Vegetation Index) mesure la santé des plantes depuis l\'espace. Plus il est élevé, plus les plantes sont vigoureuses.',
          funFact: 'La NASA utilise MODIS et Landsat pour surveiller la végétation mondiale en temps réel!',
          source: 'NASA MODIS'
        },
        {
          id: 'ndvi-2',
          title: 'Interprétation du NDVI 📊',
          content: 'NDVI 0-0.2: Sol nu. 0.2-0.5: Végétation clairsemée. 0.5-0.8: Végétation dense. 0.8-1.0: Végétation très dense.',
          funFact: 'Les plantes saines réfléchissent beaucoup d\'infrarouge, invisible à l\'œil nu!',
          source: 'Télédétection'
        }
      ],

      // Cartes sur le climat
      climate: [
        {
          id: 'climate-1',
          title: 'Température et croissance 🌡️',
          content: 'Chaque culture a une température optimale. Trop froid ralentit la croissance. Trop chaud peut brûler les feuilles.',
          funFact: 'Le maïs pousse mieux entre 25-30°C le jour et 15-20°C la nuit!',
          source: 'Climatologie agricole'
        },
        {
          id: 'climate-2',
          title: 'Changement climatique 🌍',
          content: 'Les données NASA aident à prédire l\'impact du changement climatique sur l\'agriculture et à adapter les pratiques.',
          funFact: 'La NASA prévoit que certaines zones agricoles devront changer leurs cultures d\'ici 2050.',
          source: 'NASA Climate Change'
        }
      ],

      // Cartes générales
      general: [
        {
          id: 'general-1',
          title: 'L\'agriculture de précision 🎯',
          content: 'Utiliser les données satellites pour optimiser l\'utilisation des ressources: eau, engrais, pesticides.',
          funFact: 'L\'agriculture de précision peut réduire l\'usage d\'engrais de 30% tout en augmentant les rendements!',
          source: 'FAO'
        },
        {
          id: 'general-2',
          title: 'La rotation des cultures 🔄',
          content: 'Alterner différentes cultures améliore la fertilité du sol et réduit les maladies.',
          funFact: 'Les légumineuses (haricots, arachides) enrichissent le sol en azote naturellement!',
          source: 'Agronomie durable'
        }
      ]
    };
  }

  /**
   * Sélectionner une carte pertinente selon les résultats
   * @param {Object} results - Résultats de simulation
   * @returns {Object} Carte éducative
   */
  selectRelevantCard(results) {
    let category = 'general';

    // Déterminer la catégorie selon les problèmes détectés
    if (results.stressFactor.water < 60) {
      category = 'water';
    } else if (results.stressFactor.nutrient < 60) {
      category = 'nutrients';
    } else if (results.stressFactor.ph < 60) {
      category = 'ph';
    } else if (results.ndvi < 0.5) {
      category = 'ndvi';
    } else {
      // Rotation entre différentes catégories si tout va bien
      const categories = ['general', 'climate', 'ndvi'];
      category = categories[Math.floor(Math.random() * categories.length)];
    }

    // Sélectionner une carte aléatoire dans la catégorie
    const categoryCards = this.cards[category];
    return categoryCards[Math.floor(Math.random() * categoryCards.length)];
  }

  /**
   * Obtenir plusieurs cartes pour affichage
   * @param {Object} results - Résultats de simulation
   * @param {number} count - Nombre de cartes à retourner
   * @returns {Array} Liste de cartes
   */
  getCards(results, count = 2) {
    const cards = [];
    const usedIds = new Set();

    // Première carte: basée sur les résultats
    const relevantCard = this.selectRelevantCard(results);
    cards.push(relevantCard);
    usedIds.add(relevantCard.id);

    // Cartes supplémentaires: aléatoires mais différentes
    const allCards = Object.values(this.cards).flat();

    while (cards.length < count && cards.length < allCards.length) {
      const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
      if (!usedIds.has(randomCard.id)) {
        cards.push(randomCard);
        usedIds.add(randomCard.id);
      }
    }

    return cards;
  }
}
