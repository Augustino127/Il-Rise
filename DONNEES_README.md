# 📊 DONNÉES AGRICOLES RÉALISTES - README

## 🎯 Objectif

Ce package contient toutes les données agricoles réalistes compilées pour le système de jeu éducatif **IleRise**. Les données proviennent de sources scientifiques fiables (FAO, Our World in Data, INSTAD Bénin, IRRI, USDA, etc.) et couvrent 10 cultures principales avec informations détaillées sur rendements, croissance, besoins nutritifs, et conditions climatiques.

---

## 📁 FICHIERS DISPONIBLES

### 1. **DONNEES_AGRICOLES_REALISTES.md** (42 KB)
📘 **Documentation complète avec tableaux et analyses**

**Contenu :**
- ✅ Tableau comparatif 10 cultures (rendement min/moy/max, durée, pH, température)
- ✅ Fiches détaillées par culture (blé, maïs, riz, pomme de terre, tomate, niébé, manioc, haricot, sorgho, arachide)
- ✅ Objectifs par niveau de difficulté (débutant, intermédiaire, expert)
- ✅ Contenu éducatif : 10 cartes de savoir (3 niveaux)
- ✅ Format JSON suggéré avec exemples complets
- ✅ Sources de données (12 références principales)

**Pour qui :** Développeurs, designers, content managers

**Lire en priorité si :** Vous voulez comprendre les données en profondeur

---

### 2. **crops-database-sample.json** (Fichier dans /public/data/)
💾 **Données structurées JSON prêtes pour implémentation**

**Contenu :**
- 5 cultures détaillées : Maïs, Niébé, Riz, Manioc, Pomme de terre
- Chaque culture inclut :
  - Rendements (min, average, max, contexte régional)
  - Croissance (durée, stades phénologiques)
  - Besoins NPK (kg/ha, fractionnement, timing)
  - Climat (température, pluviométrie, zones USDA)
  - Sol (pH, types, texture)
  - Pratiques (rotation, densité, gestion)
  - Économie (coûts, revenus)
  - Éducation (fun facts, erreurs courantes, tips)
  - Média (images, audio, vidéos)
- 5 niveaux de jeu avec objectifs et récompenses
- Formule calcul score (max 1000 points)

**Pour qui :** Développeurs frontend/backend

**Utiliser si :** Vous implémentez le moteur de jeu

---

### 3. **GUIDE_UTILISATION_DONNEES.md** (18 KB)
🚀 **Guide pratique d'intégration avec exemples de code**

**Contenu :**
- ✅ Intégration rapide (charger JSON, obtenir infos culture)
- ✅ Exemples code JavaScript complets :
  - Fonction `simulateCropYield()` avec calcul stress
  - Fonction `calculateScore()` avec formule complète
  - Gestion progression joueur (LocalStorage)
- ✅ Exemples d'utilisation complète (scénario joueur)
- ✅ Données par niveau de jeu
- ✅ Intégration cartes de savoir
- ✅ Personnalisation (ajouter culture, ajuster difficulté)
- ✅ Adaptation régionale (Bénin, France, etc.)
- ✅ Checklist implémentation (7 phases)

**Pour qui :** Développeurs (débutant → avancé)

**Utiliser si :** Vous codez le système de simulation

---

### 4. **SOURCES_DONNEES.md** (18 KB)
📚 **Documentation complète des sources avec citations**

**Contenu :**
- ✅ 15 sources principales détaillées :
  - FAO FAOSTAT
  - Our World in Data
  - Banque Mondiale
  - INSTAD Bénin
  - Agreste France
  - Wikifarmer, EOS, IRRI, USDA Extension
  - Rodale Institute, SARE, ATTRA
  - Journaux scientifiques (Nature, Frontiers, etc.)
- ✅ Évaluation fiabilité (★★★★★)
- ✅ Méthodologie de compilation
- ✅ Citations recommandées (format APA)
- ✅ Sources complémentaires pour extension
- ✅ Validation et limitations connues

**Pour qui :** Toute l'équipe, documentation projet

**Utiliser si :** Vous devez citer les sources ou justifier les données

---

### 5. **Ce fichier - DONNEES_README.md**
📖 **Guide de navigation et démarrage rapide**

---

## 🚀 DÉMARRAGE RAPIDE

### Pour Développeurs

1. **Lire** : `GUIDE_UTILISATION_DONNEES.md` (section "Intégration Rapide")
2. **Copier** : `crops-database-sample.json` vers `/public/data/`
3. **Coder** : Utiliser exemples JavaScript du guide
4. **Tester** : Vérifier simulation avec données maïs

### Pour Designers

1. **Lire** : `DONNEES_AGRICOLES_REALISTES.md` (section "Tableau Général")
2. **Créer icônes** : 10 cultures (maïs, niébé, riz, etc.)
3. **Illustrations** : 10 cartes de savoir (voir section "Contenu Éducatif")
4. **Assets** : Référencer chemin dans JSON (`/assets/icons/`, `/assets/images/`)

### Pour Content Managers

1. **Lire** : `DONNEES_AGRICOLES_REALISTES.md` (section "Cartes de Savoir")
2. **Rédiger scripts audio** : 10 cartes × 3 langues (FR, Fon, Wolof)
3. **Enregistrer audio** : Durées 2-4 min selon niveau
4. **Traduire** : Textes clés en langues locales

### Pour Chefs de Projet

1. **Lire** : `SOURCES_DONNEES.md` (crédibilité sources)
2. **Vérifier** : Checklist implémentation (dans `GUIDE_UTILISATION_DONNEES.md`)
3. **Planifier** : 7 phases développement
4. **Documenter** : Utiliser citations pour rapport final

---

## 📊 RÉSUMÉ DES DONNÉES

### 10 Cultures Documentées

| # | Culture | Rendement Moyen | Durée (jours) | Niveau |
|---|---------|-----------------|---------------|--------|
| 1 | Maïs | 6.0 t/ha | 120 | Débutant |
| 2 | Niébé | 1.5 t/ha | 75 | Débutant |
| 3 | Riz | 4.5 t/ha | 130 | Intermédiaire |
| 4 | Manioc | 17.0 t/ha | 300 | Intermédiaire |
| 5 | Pomme de terre | 30.0 t/ha | 100 | Expert |
| 6 | Tomate | 40.0 t/ha | 100 | Intermédiaire |
| 7 | Haricot | 2.0 t/ha | 75 | Débutant |
| 8 | Sorgho | 3.0 t/ha | 105 | Débutant |
| 9 | Arachide | 2.0 t/ha | 115 | Intermédiaire |
| 10 | Blé | 6.5 t/ha | 110 | Expert |

### 10 Cartes de Savoir

| # | Titre | Niveau | Durée Audio |
|---|-------|--------|-------------|
| 1 | Le Cycle de l'Eau | Débutant | 2 min |
| 2 | NPK - Les Trois Lettres Magiques | Débutant | 2 min |
| 3 | Le pH du Sol | Débutant | 2 min |
| 4 | La Rotation des Cultures | Intermédiaire | 3 min |
| 5 | Le Fractionnement NPK | Intermédiaire | 3 min |
| 6 | Les Satellites NASA | Intermédiaire | 3 min |
| 7 | Gestion Intégrée des Parasites | Expert | 4 min |
| 8 | Agriculture de Précision | Expert | 4 min |
| 9 | Changement Climatique & Adaptation | Thématique | 3 min |
| 10 | Agriculture Biologique | Thématique | 3 min |

### 3 Niveaux de Difficulté

- **🟢 Débutant (Niveau 1-2)** : Objectif 60-70% rendement optimal, paramètres simplifiés
- **🟡 Intermédiaire (Niveau 3-5)** : Objectif 75-85%, gestion eau + NPK avancée
- **🔴 Expert (Niveau 6-8)** : Objectif 90-100%, agriculture de précision

---

## 💡 EXEMPLES D'UTILISATION

### Charger Données Culture (JavaScript)

```javascript
// Charger base de données
const response = await fetch('/public/data/crops-database-sample.json');
const cropsDB = await response.json();

// Obtenir info maïs
const maize = cropsDB.crops.find(c => c.id === 'maize');
console.log(maize.yields.average); // 6.0 t/ha
console.log(maize.growth.durationDays.typical); // 120 jours
```

### Simuler Rendement

```javascript
// Inputs joueur
const inputs = {
  waterMm: 600,
  npk: { N: 140, P: 70, K: 90 },
  pH: 6.0,
  temperature: 26
};

// Simulation
const result = simulateCropYield('maize', inputs);
console.log(`Rendement: ${result.actual.toFixed(1)} t/ha`);
console.log(`Performance: ${result.percentage.toFixed(0)}%`);
```

### Calculer Score

```javascript
const score = calculateScore(result, inputs, maize);
console.log(`Score: ${score.total}/1000`);
console.log(`Étoiles: ${score.stars} ⭐`);
console.log(`Pièces: ${score.coins} 🪙`);
```

*(Voir code complet dans `GUIDE_UTILISATION_DONNEES.md`)*

---

## 🎯 OBJECTIFS PAR NIVEAU

### Niveau 1 - Maïs (Gratuit)
- **Objectif** : 4.0 t/ha (sur 12.0 max)
- **Score** : 600+ pour débloquer Niveau 2
- **Récompense** : 50 pièces + Carte "Cycle de l'Eau"

### Niveau 3 - Riz (300 pièces)
- **Objectif** : 5.0 t/ha (sur 8.0 max)
- **Score** : 700+ pour débloquer Niveau 4
- **Difficulté** : Gestion lame d'eau + fractionnement NPK
- **Récompense** : 100 pièces + Carte "Satellites NASA"

### Niveau 5 - Pomme de terre (800 pièces)
- **Objectif** : 50.0 t/ha (sur 70.0 max)
- **Score** : 850+ pour débloquer Niveau 6
- **Difficulté** : Buttage + irrigation précise + pH dynamique
- **Récompense** : 200 pièces + Carte "Agriculture de Précision"

---

## 📈 FORMULE DE SCORE

```javascript
Score = (Rendement/Optimal) × 800
      + Efficience_Eau × 100
      + Efficience_NPK × 100
      - Pénalités_Stress × 50

Max : 1000 points
```

**Étoiles :**
- ⭐ (1 étoile) : 500-699 points → "Bon début !"
- ⭐⭐ (2 étoiles) : 700-899 points → "Bien joué !"
- ⭐⭐⭐ (3 étoiles) : 900-1000 points → "Excellent travail !"

**Pièces :** `Score / 10` (ex: 720 points = 72 pièces)

---

## 🌍 ADAPTATION RÉGIONALE

### Contexte Bénin (Actuellement Implémenté)

**Rendements moyens actuels :**
- Maïs : 1.3 t/ha (Bénin) vs 6.0 t/ha (mondial)
- Riz irrigué : 3.0+ t/ha
- Manioc : 15-17 t/ha
- Niébé : 1.0-1.5 t/ha

**Objectifs jeu ajustés :**
- Niveau débutant : Viser rendements Bénin actuels
- Niveau intermédiaire : Rendements moyens mondiaux
- Niveau expert : Potentiels variétés améliorées

### Extension Future (Mali, Sénégal, Togo)

**Ajouter dans JSON :**
```json
"context": {
  "benin": 1.3,
  "senegal": 1.5,
  "mali": 1.1,
  "world": 5.9
}
```

---

## ✅ CHECKLIST IMPLÉMENTATION

### Phase 1 : Data Setup (2h)
- [ ] Copier `crops-database-sample.json` dans `/public/data/`
- [ ] Créer `loadCropsDatabase()` fonction
- [ ] Tester chargement console

### Phase 2 : Simulation Engine (6h)
- [ ] Coder `calculateWaterStress()`
- [ ] Coder `calculateNPKStress()`
- [ ] Coder `calculatepHStress()`
- [ ] Coder `calculateTempStress()`
- [ ] Coder `simulateCropYield()`
- [ ] Tests unitaires

### Phase 3 : Scoring System (3h)
- [ ] Coder `calculateScore()`
- [ ] Coder `getStars()`
- [ ] Équilibrage scores

### Phase 4 : UI Integration (8h)
- [ ] Affichage infos culture
- [ ] Curseurs (eau, NPK, pH)
- [ ] Résultats visuels
- [ ] Animations

### Phase 5 : Progression (4h)
- [ ] LocalStorage sauvegarde
- [ ] Déblocage niveaux
- [ ] Déblocage cartes savoir
- [ ] Économie (pièces)

### Phase 6 : Content (10h)
- [ ] Audio 10 cartes FR
- [ ] Audio 10 cartes Fon
- [ ] Audio 10 cartes Wolof
- [ ] Illustrations cartes
- [ ] Icônes cultures

### Phase 7 : Testing (4h)
- [ ] Test tous niveaux
- [ ] Équilibrage difficulté
- [ ] Tests mobiles
- [ ] Tests hors-ligne

**Total estimé : 37 heures**

---

## 🔧 PERSONNALISATION

### Ajouter une Nouvelle Culture

1. **Rechercher données** (sources fiables : FAO, IRRI, USDA)
2. **Compléter JSON** :
```json
{
  "id": "cocoa",
  "names": { "fr": "Cacao", "en": "Cocoa" },
  "yields": { "min": 0.3, "average": 0.8, "max": 2.0 },
  // ... (voir structure complète)
}
```
3. **Créer niveau de jeu** associé
4. **Ajouter icône** `/assets/icons/cocoa.svg`
5. **Enregistrer audio** `/assets/audio/cocoa-fr.mp3`

### Ajuster Difficulté

**Rendre plus facile :**
- Augmenter tolérance stress (seuil 0.5 → 0.3)
- Réduire pénalités (-50 → -30)
- Augmenter multiplicateur score (×1.2)

**Rendre plus difficile :**
- Réduire tolérance stress (seuil 0.7 → 0.9)
- Augmenter pénalités (-50 → -70)
- Exiger 3 étoiles pour déblocage (au lieu de 2)

---

## 📚 RESSOURCES EXTERNES

### Documentation Complète
- **Tableaux détaillés** : `DONNEES_AGRICOLES_REALISTES.md`
- **Guide code** : `GUIDE_UTILISATION_DONNEES.md`
- **Sources** : `SOURCES_DONNEES.md`

### Sources Principales
- FAO FAOSTAT : https://www.fao.org/faostat/
- Our World in Data : https://ourworldindata.org/crop-yields
- INSTAD Bénin : Statistiques agricoles
- Wikifarmer : https://wikifarmer.com
- IRRI Rice KB : http://www.knowledgebank.irri.org/

### Outils Développement
- **JSON Validator** : https://jsonlint.com/
- **Color Picker** : Pour charte graphique
- **Audio Recorder** : Audacity (gratuit)

---

## 🐛 RÉSOLUTION PROBLÈMES

### Problème : JSON ne se charge pas
**Solution :**
1. Vérifier chemin : `/public/data/crops-database-sample.json`
2. Tester avec `fetch()` dans console
3. Vérifier syntaxe JSON (https://jsonlint.com/)

### Problème : Scores incohérents
**Solution :**
1. Vérifier formule `calculateScore()`
2. Tester avec valeurs connues (inputs optimaux)
3. Ajuster poids composantes si nécessaire

### Problème : Rendements irréalistes
**Solution :**
1. Vérifier facteurs de stress (0-1)
2. S'assurer multiplication (pas addition)
3. Comparer avec données sources

---

## 🤝 CONTRIBUTION

### Comment Contribuer

1. **Identifier besoin** : Nouvelle culture, donnée manquante, erreur
2. **Rechercher sources** : Minimum ★★★★ fiabilité
3. **Documenter** : Méthodologie, sources, calculs
4. **Proposer** : Via GitHub Issues/PR
5. **Validation** : Review par équipe avant merge

### Standards Qualité

- ✅ Sources fiables (académiques, gouvernementales)
- ✅ Données récentes (<5 ans priorité)
- ✅ Validation croisée (2-3 sources minimum)
- ✅ Documentation complète
- ✅ Format JSON conforme

---

## 📞 SUPPORT

### Questions Fréquentes

**Q : Combien de cultures sont implémentées ?**
R : 5 complètes dans JSON (maïs, niébé, riz, manioc, pomme de terre). 5 documentées pour extension (tomate, haricot, sorgho, arachide, blé).

**Q : Les données sont-elles réalistes ?**
R : Oui, compilées depuis FAO, Our World in Data, INSTAD Bénin, IRRI, USDA. Sources tracées dans `SOURCES_DONNEES.md`.

**Q : Puis-je adapter à mon pays ?**
R : Oui ! Voir section "Adaptation Régionale" dans `GUIDE_UTILISATION_DONNEES.md`.

**Q : Comment ajouter des langues ?**
R : Ajouter clés dans `names.local` et audio dans `media.audio` (ex: `bambara`, `yoruba`).

### Contact

- **Issues GitHub** : (à créer)
- **Email équipe** : (à définir)
- **Documentation** : Lire d'abord les 4 fichiers MD

---

## 🎉 REMERCIEMENTS

**Sources de données :**
- FAO, Our World in Data, Banque Mondiale
- INSTAD Bénin, Agreste France
- Wikifarmer, EOS Data Analytics, IRRI
- USDA Extension Services (Minnesota, Ohio, SDSU, UNH)
- Rodale Institute, SARE, ATTRA
- Journaux scientifiques (Nature, Frontiers, ScienceDirect)

**Méthodologie scientifique :**
- Validation croisée multi-sources
- Agrégation données 2023-2025
- Contexte Afrique/Bénin prioritaire

---

## 📝 CHANGELOG

### Version 1.0 (2025-10-04)
- ✅ Compilation 10 cultures (rendements, croissance, NPK, climat, sol)
- ✅ Création JSON 5 cultures complètes
- ✅ 10 cartes de savoir (3 niveaux)
- ✅ 3 niveaux de difficulté avec objectifs
- ✅ Documentation complète (4 fichiers MD)
- ✅ Guide d'implémentation code JavaScript
- ✅ 15 sources fiables documentées

### Prochaines Versions (Roadmap)
- [ ] v1.1 : Ajouter 5 cultures manquantes dans JSON
- [ ] v1.2 : Étendre contexte régional (Sénégal, Mali, Togo)
- [ ] v1.3 : Variétés spécifiques (locale vs améliorée)
- [ ] v1.4 : Scénarios changement climatique (2030, 2050)
- [ ] v1.5 : Intégration données NASA temps réel

---

## 📦 STRUCTURE FICHIERS

```
ilerise-nasa/
├── DONNEES_AGRICOLES_REALISTES.md    (42 KB) - Doc complète
├── GUIDE_UTILISATION_DONNEES.md       (18 KB) - Guide code
├── SOURCES_DONNEES.md                 (18 KB) - Références
├── DONNEES_README.md                  (ce fichier)
│
└── public/data/
    └── crops-database-sample.json    (JSON complet)
```

**Total documentation : ~100 KB**
**Format : Markdown + JSON**
**Encodage : UTF-8**

---

## 🚀 DÉMARRER MAINTENANT

### Développeurs → Lire en 1er
📘 **GUIDE_UTILISATION_DONNEES.md** (section "Intégration Rapide")

### Designers → Lire en 1er
📊 **DONNEES_AGRICOLES_REALISTES.md** (section "Tableau Général" + "Cartes de Savoir")

### Content Managers → Lire en 1er
🎓 **DONNEES_AGRICOLES_REALISTES.md** (section "Contenu Éducatif")

### Chefs de Projet → Lire en 1er
📚 **SOURCES_DONNEES.md** (validation crédibilité)

### Tout le monde → Référence
📖 **DONNEES_README.md** (ce fichier - navigation)

---

**Bon développement ! 🌾🚀**

**Projet IleRise - NASA Space Apps Challenge 2025**
**Document créé le : 2025-10-04**
**Version : 1.0**
