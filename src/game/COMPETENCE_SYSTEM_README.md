# Systeme de Competences - IleRise

## Introduction

Le systeme de progression d'IleRise est base sur l'evaluation de **5 competences agronomiques essentielles**. Chaque partie jouee est evaluee selon ces competences, et un score global determine le nombre d'etoiles obtenues.

## Les 5 Competences

### 1. Water Management (25%) 💧

**Objectif** : Optimiser l'irrigation et l'humidite du sol

**Criteres d'evaluation** :
- Irrigation dans la plage optimale de la culture (400-800mm selon culture)
- Humidite du sol maintenue autour de 40%
- Adaptation aux conditions meteorologiques (secheresse, pluie)

**Points** :
- 60 pts : Irrigation optimale
- 30 pts : Humidite du sol optimale
- 10 pts : Adaptation meteo

**Exemple** :
```javascript
// Culture de mais : besoin 400-600mm
irrigation: 500mm        => 60/60 points
soilMoisture: 40%        => 30/30 points
weather: 'optimal'       => 5/10 points
-----------------------------------
TOTAL Water Score: 95/100
```

### 2. NPK Management (25%) 🌱

**Objectif** : Equilibrer les apports en nutriments (Azote, Phosphore, Potassium)

**Criteres d'evaluation** :
- Azote (N) : element principal pour croissance vegetative
- Phosphore (P) : crucial pour racines et floraison
- Potassium (K) : resistance stress et qualite
- Efficience budgetaire : optimiser couts/benefices

**Points** :
- 35 pts : Azote optimal
- 30 pts : Phosphore optimal
- 25 pts : Potassium optimal
- 10 pts : Efficience budgetaire

**Exemple** :
```javascript
// Culture de mais : N=120, P=60, K=80
npk: {
  nitrogen: 120    => 35/35 points
  phosphorus: 60   => 30/30 points
  potassium: 80    => 25/25 points
}
budget: 80/100     => 2/10 points (peu efficient)
-----------------------------------
TOTAL NPK Score: 92/100
```

### 3. Soil Management (20%) 🏜️

**Objectif** : Adapter le pH et la texture du sol a la culture

**Criteres d'evaluation** :
- pH dans la plage optimale (generalement 6.0-7.0)
- Texture du sol adaptee (sableux, limoneux, argileux)

**Points** :
- 60 pts : pH optimal
- 40 pts : Texture adaptee

**Exemple** :
```javascript
// Culture de mais : pH 6.0-7.0, texture loam
soil: {
  ph: 6.5              => 60/60 points (optimal)
  texture: 'loam'      => 40/40 points (parfait)
}
-----------------------------------
TOTAL Soil Score: 100/100
```

### 4. Crop Rotation (15%) 🔄

**Objectif** : Pratiquer une rotation diversifiee pour maintenir la fertilite

**Criteres d'evaluation** :
- Eviter de replanter la meme famille de culture consecutivement
- Diversifier les cultures plantees
- Integrer des legumineuses (fixation azote)

**Points** :
- 50 pts : Score de base
- +30 pts : Rotation correcte (famille differente)
- +30 pts : Diversite des cultures
- +20 pts : Bonus legumineuses

**Familles de cultures** :
- Cereales : Mais, Riz
- Legumineuses : Niebe (fixe azote)
- Tubercules : Manioc
- Arbres : Cacao
- Fibres : Coton

**Exemple** :
```javascript
// Culture actuelle : Mais (cereal)
previousCrops: [
  { family: 'legume' },  // Niebe avant
  { family: 'cereal' }   // Riz avant
]
=> Rotation correcte (+30), diversite (+20), bonus legume (+20)
-----------------------------------
TOTAL Rotation Score: 100/100
```

### 5. NASA Data Usage (15%) 🛰️

**Objectif** : Utiliser les donnees satellites pour optimiser les decisions

**Criteres d'evaluation** :
- Utilisation des donnees NASA disponibles
- Ne pas depasser la limite (3 utilisations/niveau)
- Diversite des types de donnees (temperature, NDVI, precipitation, SMAP)

**Points** :
- 70 pts : Donnees NASA utilisees
- 20 pts : Pas de surconsommation (<= 3 fois)
- 10 pts : Diversite des donnees

**Donnees disponibles** :
- Temperature : Optimiser periodes de plantation
- NDVI : Sante de la vegetation
- Precipitation : Planifier irrigation
- SMAP : Humidite du sol

**Exemple** :
```javascript
nasaDataUsed: {
  types: ['temperature', 'ndvi', 'precipitation']
}
nasaUsageCount: 2
maxNASAUsage: 3
=> 70 (utilise) + 20 (pas depassement) + 9 (3 types)
-----------------------------------
TOTAL NASA Score: 99/100
```

## Calcul du Score Global

Le score global est calcule par **moyenne ponderee** :

```
Score Global =
  Water × 25% +
  NPK × 25% +
  Soil × 20% +
  Rotation × 15% +
  NASA × 15%
```

### Exemple complet

```javascript
Water:     95/100 × 25% = 23.75
NPK:       92/100 × 25% = 23.00
Soil:     100/100 × 20% = 20.00
Rotation: 100/100 × 15% = 15.00
NASA:      99/100 × 15% = 14.85
-----------------------------------
SCORE GLOBAL:           = 96.6/100
```

## Systeme d'Etoiles

Le score global determine le nombre d'etoiles :

| Score | Etoiles | Evaluation |
|-------|---------|------------|
| 0-50  | ⭐      | Echec - Revoir les bases |
| 50-75 | ⭐⭐    | Moyen - Ameliorations possibles |
| 75-100| ⭐⭐⭐  | Excellent - Maitrise parfaite |

## Deverrouillage des Niveaux

Pour debloquer le niveau suivant, **2 methodes** :

### Methode 1 : Score parfait
Obtenir **3 etoiles** (>= 75 points) **une seule fois**

### Methode 2 : Reussites consecutives
Obtenir **3 reussites consecutives** avec minimum **2 etoiles** (>= 50 points)

## Recompenses

### Pieces gagnees

```javascript
Base : Score / 2
Bonus 3 etoiles : +50 pieces
Bonus 2 etoiles : +20 pieces

Exemple :
Score 96.6/100 + 3 etoiles
=> 96.6/2 + 50 = 98 pieces
```

### Progression

- Historique des parties sauvegarde
- Statistiques par competence
- Meilleurs scores enregistres
- Tendances d'evolution (progression/regression)

## Feedback Personnalise

Chaque competence genere un feedback :

**Water - Excellent (>75)** :
> "Excellente gestion de l'irrigation ! Vos cultures sont parfaitement hydratees."

**NPK - Moyen (50-75)** :
> "Bon apport en nutriments, quelques ajustements possibles."

**Soil - Faible (<50)** :
> "Le pH ou la texture du sol ne conviennent pas a cette culture."

## Strategies de Reussite

### Pour 3 etoiles (>75 points)

1. **Consulter les donnees NASA** avant de planter
2. **Verifier les besoins** de la culture (eau, NPK, pH)
3. **Planifier la rotation** (eviter meme famille)
4. **Adapter a la meteo** (irrigation selon pluie/secheresse)
5. **Optimiser le budget** (efficience NPK)

### Erreurs courantes

❌ Sur-irrigation (gaspillage, pourriture)
❌ Sous-fertilisation (faible rendement)
❌ pH inadapte (blocage nutriments)
❌ Monoculture (epuisement du sol)
❌ Ignorer les donnees NASA

## Exemples de Scenarios

### Scenario 1 : Mais en saison seche

```
Probleme : Secheresse annoncee
Solution :
- Augmenter irrigation (550mm au lieu de 500mm)
- Verifier SMAP pour humidite sol
- Appliquer mulching (non implemente)
=> Water: 90/100, NASA: 90/100
```

### Scenario 2 : Niebe apres Mais

```
Avantage : Legumineuse fixe azote
Solution :
- Reduire apport azote (40 au lieu de 120)
- Rotation excellente (cereal -> legume)
- Economie budget
=> NPK: 95/100, Rotation: 100/100, Budget efficient
```

### Scenario 3 : Riz en sol acide

```
Probleme : pH 5.0 (trop acide pour certaines cultures)
Solution :
- Riz tolere pH 5.0-7.0 => OK
- Maintenir inondation (90% eau)
- Texture argileuse adaptee
=> Soil: 100/100, Water: 95/100
```

## Progression des Joueurs

### Debutant (Moyenne < 40)
- Apprendre les bases de chaque competence
- Consulter systematiquement les donnees NASA
- Suivre les recommandations

### Intermediaire (Moyenne 40-60)
- Optimiser les rotations
- Gerer le budget efficacement
- Anticiper les conditions meteo

### Avance (Moyenne 60-80)
- Maitriser toutes les competences
- Strategies avancees (legumineuses, pH)
- Scores reguliers > 2 etoiles

### Expert (Moyenne > 80)
- Scores parfaits reguliers
- Comprehension approfondie agronomie
- Toutes cultures debloquees

## Donnees Techniques

### Structure gameData

```javascript
{
  crop: {
    id: 'maize',
    family: 'cereal',
    water_requirements: { min_mm, max_mm },
    nutrient_requirements: { nitrogen, phosphorus, potassium },
    soil_requirements: { ph, texture }
  },
  irrigation: 500,           // mm
  weather: 'optimal',        // optimal/dry/rainy/drought
  soilMoisture: 40,          // %
  npk: { nitrogen, phosphorus, potassium },
  budget: { spent, max },
  soil: { ph, texture },
  previousCrops: [...],
  nasaDataUsed: { types: [...] },
  nasaUsageCount: 2,
  maxNASAUsage: 3
}
```

### Structure result

```javascript
{
  game: {
    timestamp,
    levelKey: 'maize_1',
    scores: {
      water: 95,
      npk: 92,
      soil: 100,
      rotation: 100,
      nasa: 99
    },
    globalScore: 96.6,
    stars: 3,
    details: { breakdown: [...] }
  },
  unlocks: {
    levels: [...],
    crops: [...],
    achievements: [...]
  },
  coins: 98,
  feedback: {
    overall: { title, emoji, message },
    competences: { water: "...", npk: "...", ... }
  }
}
```

## Conclusion

Le systeme de competences transforme IleRise en un veritable outil pedagogique d'agriculture de precision, ou chaque decision compte et ou les donnees satellitaires NASA jouent un role crucial dans la reussite.

**Objectif** : Former les agriculteurs africains aux meilleures pratiques agronomiques grace a la gamification et aux donnees spatiales.
