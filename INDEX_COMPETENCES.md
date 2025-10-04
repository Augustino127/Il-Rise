# Index - Documentation Systeme de Competences

## Navigation rapide

### Pour commencer (5 min)
1. **[QUICK_START_COMPETENCES.md](QUICK_START_COMPETENCES.md)** - Demarrage ultra-rapide avec code copy-paste
2. **[COMPETENCE_SYSTEM_TREE.txt](COMPETENCE_SYSTEM_TREE.txt)** - Vue d'ensemble visuelle de l'architecture

### Pour comprendre le systeme (15 min)
3. **[src/game/COMPETENCE_SYSTEM_README.md](src/game/COMPETENCE_SYSTEM_README.md)** - Explication complete des 5 competences
4. **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Resume technique de l'implementation

### Pour integrer dans votre code (30 min)
5. **[src/game/INTEGRATION_GUIDE.md](src/game/INTEGRATION_GUIDE.md)** - Guide developpeur avec exemples

### Pour tester
6. **[src/game/CompetenceSystem.test.js](src/game/CompetenceSystem.test.js)** - Tests unitaires executables

---

## Structure par type de lecteur

### Je suis un developpeur frontend 💻
**Je veux integrer le systeme dans l'UI**

Ordre de lecture :
1. QUICK_START_COMPETENCES.md (exemples code)
2. INTEGRATION_GUIDE.md (API reference)
3. CompetenceSystem.test.js (voir donnees esperees)

### Je suis game designer 🎮
**Je veux comprendre le gameplay**

Ordre de lecture :
1. COMPETENCE_SYSTEM_README.md (regles du jeu)
2. IMPLEMENTATION_SUMMARY.md (exemples scenarios)
3. COMPETENCE_SYSTEM_TREE.txt (vue globale)

### Je suis chef de projet 📊
**Je veux voir ce qui a ete fait**

Ordre de lecture :
1. IMPLEMENTATION_SUMMARY.md (resume executif)
2. COMPETENCE_SYSTEM_TREE.txt (livrables)
3. INTEGRATION_GUIDE.md (prochaines etapes)

---

## Par fonctionnalite

### Calcul des scores
- **Fichier** : `src/game/CompetenceSystem.js`
- **Documentation** : COMPETENCE_SYSTEM_README.md > "Calcul du Score Global"
- **Exemple** : IMPLEMENTATION_SUMMARY.md > "Exemples de Calcul"

### Systeme de vies
- **Fichier** : `src/game/LivesSystem.js`
- **Documentation** : COMPETENCE_SYSTEM_README.md > "Systeme de Vies"
- **Integration** : INTEGRATION_GUIDE.md > "Systeme de Vies"

### Deverrouillage niveaux
- **Fichier** : `src/game/UnlockSystem.js`
- **Documentation** : COMPETENCE_SYSTEM_README.md > "Deverrouillage des Niveaux"
- **Exemple** : INTEGRATION_GUIDE.md > "Systeme d'Etoiles"

### Progression et sauvegarde
- **Fichier** : `src/game/ProgressManager.js`
- **Documentation** : INTEGRATION_GUIDE.md > "Progression et Statistiques"
- **API** : INTEGRATION_GUIDE.md > "Sauvegarde / Chargement"

### Integration GameEngine
- **Fichier** : `src/game/GameEngine.js`
- **Documentation** : INTEGRATION_GUIDE.md > "Utilisation"
- **Workflow** : COMPETENCE_SYSTEM_TREE.txt > "WORKFLOW DE JEU"

---

## Par competence

### Water Management (25%)
- **Algorithme** : IMPLEMENTATION_SUMMARY.md > "Water Score"
- **Criteres** : COMPETENCE_SYSTEM_README.md > "1. Water Management"
- **Code** : CompetenceSystem.js > `calculateWaterScore()`

### NPK Management (25%)
- **Algorithme** : IMPLEMENTATION_SUMMARY.md > "NPK Score"
- **Criteres** : COMPETENCE_SYSTEM_README.md > "2. NPK Management"
- **Code** : CompetenceSystem.js > `calculateNPKScore()`

### Soil Management (20%)
- **Algorithme** : IMPLEMENTATION_SUMMARY.md > "Soil Score"
- **Criteres** : COMPETENCE_SYSTEM_README.md > "3. Soil Management"
- **Code** : CompetenceSystem.js > `calculateSoilScore()`

### Crop Rotation (15%)
- **Algorithme** : IMPLEMENTATION_SUMMARY.md > "Rotation Score"
- **Criteres** : COMPETENCE_SYSTEM_README.md > "4. Crop Rotation"
- **Code** : CompetenceSystem.js > `calculateRotationScore()`

### NASA Data Usage (15%)
- **Algorithme** : IMPLEMENTATION_SUMMARY.md > "NASA Score"
- **Criteres** : COMPETENCE_SYSTEM_README.md > "5. NASA Data Usage"
- **Code** : CompetenceSystem.js > `calculateNASAScore()`

---

## FAQ - Liens rapides

**Q: Comment calculer le score d'une partie ?**
→ INTEGRATION_GUIDE.md > "Exemple complet"

**Q: Quelles sont les valeurs optimales par culture ?**
→ QUICK_START_COMPETENCES.md > "Valeurs recommandees par culture"

**Q: Comment deverrouiller un niveau ?**
→ COMPETENCE_SYSTEM_README.md > "Deverrouillage des Niveaux"

**Q: Comment gerer les vies ?**
→ INTEGRATION_GUIDE.md > "Systeme de Vies"

**Q: Comment sauvegarder la progression ?**
→ INTEGRATION_GUIDE.md > "Sauvegarde / Chargement"

**Q: Quels sont les seuils d'etoiles ?**
→ COMPETENCE_SYSTEM_README.md > "Systeme d'Etoiles"

**Q: Comment utiliser les donnees NASA ?**
→ INTEGRATION_GUIDE.md > "Utilisation" > Etape 5

**Q: Comment voir les statistiques joueur ?**
→ INTEGRATION_GUIDE.md > "Progression et Statistiques"

**Q: Ou sont les algorithmes detailles ?**
→ IMPLEMENTATION_SUMMARY.md > "Algorithmes"

**Q: Quels fichiers ont ete crees ?**
→ COMPETENCE_SYSTEM_TREE.txt

---

## Exemples par cas d'usage

### Cas 1 : Afficher le score apres une partie
```javascript
// Voir : QUICK_START_COMPETENCES.md > "Exemple complet"
const result = engine.completeLevel(gameData);
console.log(`Score: ${result.game.globalScore}/100`);
```

### Cas 2 : Afficher les vies restantes
```javascript
// Voir : INTEGRATION_GUIDE.md > "UI" > "Affichage Vies"
const lives = engine.getLivesUI();
console.log(lives.hearts); // ❤️❤️❤️🖤🖤
```

### Cas 3 : Verifier progression vers deverrouillage
```javascript
// Voir : INTEGRATION_GUIDE.md > "Progression et Statistiques"
const history = engine.progressManager.getLevelHistory('maize_1');
console.log(history.unlockProgress.percentage);
```

### Cas 4 : Obtenir feedback par competence
```javascript
// Voir : INTEGRATION_GUIDE.md > "Exemple complet" > Etape 7
Object.keys(result.feedback.competences).forEach(comp => {
  console.log(result.feedback.competences[comp]);
});
```

---

## Code source - Navigation

```
src/game/
├── CompetenceSystem.js       → Classe principale calcul scores
│   ├── calculateWaterScore()      (lignes 48-115)
│   ├── calculateNPKScore()        (lignes 117-168)
│   ├── calculateSoilScore()       (lignes 170-218)
│   ├── calculateRotationScore()   (lignes 220-274)
│   └── calculateNASAScore()       (lignes 276-312)
│
├── LivesSystem.js            → Gestion vies
│   ├── getLivesState()            (lignes 19-29)
│   ├── useLife()                  (lignes 52-66)
│   └── getUIInfo()                (lignes 125-138)
│
├── UnlockSystem.js           → Deverrouillage
│   ├── checkUnlock()              (lignes 19-75)
│   └── getProgressToUnlock()      (lignes 130-150)
│
├── ProgressManager.js        → Orchestration
│   ├── recordGame()               (lignes 71-109)
│   ├── getProgressSummary()       (lignes 158-172)
│   └── exportProgress()           (lignes 263-275)
│
└── GameEngine.js             → Integration
    ├── startGame()                (lignes 215-225)
    ├── completeLevel()            (lignes 276-321)
    └── getLivesUI()               (lignes 171-173)
```

---

## Glossaire

**Competence** : Une des 5 categories evaluees (Water, NPK, Soil, Rotation, NASA)

**Score global** : Moyenne ponderee des 5 competences (0-100)

**Etoiles** : Evaluation visuelle du score (1⭐ / 2⭐⭐ / 3⭐⭐⭐)

**Deverrouillage** : Acces au niveau suivant (3⭐ x1 OU 2⭐ x3 consecutifs)

**Vies** : Ressource consommee a chaque partie (5 max, regen 15min)

**Rotation** : Alternance familles de cultures pour fertilite sol

**NASA Data** : Donnees satellites (temperature, NDVI, precipitation, SMAP)

**ProgressManager** : Systeme central gestion progression et sauvegarde

**gameData** : Objet contenant tous les parametres d'une partie

**levelKey** : Identifiant unique niveau (ex: "maize_1", "rice_2")

---

## Checklist d'integration

### Phase 1 : Backend (Fait ✅)
- [x] CompetenceSystem.js
- [x] LivesSystem.js
- [x] UnlockSystem.js
- [x] ProgressManager.js
- [x] GameEngine.js modifie

### Phase 2 : Frontend UI (A faire)
- [ ] Ecran resultats avec breakdown competences
- [ ] Affichage vies (coeurs + timer)
- [ ] Barre progression deverrouillage
- [ ] Graphiques stats par competence
- [ ] Feedback contextuel

### Phase 3 : Integration donnees
- [ ] Connecter CropDatabase aux competences
- [ ] Parser donnees NASA en temps reel
- [ ] Recommandations basees sur scores

### Phase 4 : Polish
- [ ] Animations scores
- [ ] Sons feedback
- [ ] Tutoriel 5 competences
- [ ] Achievements

---

## Changelog

**Version 1.0 - 4 octobre 2025**
- Implementation complete systeme 5 competences
- Suppression references hectares
- Systeme vies avec regeneration
- Deverrouillage progressif
- Sauvegarde localStorage
- Documentation complete

---

## Liens externes

- **NASA POWER API** : https://power.larc.nasa.gov/
- **NDVI explique** : https://earthobservatory.nasa.gov/features/MeasuringVegetation
- **SMAP Mission** : https://smap.jpl.nasa.gov/

---

**Navigation** : [Retour au README principal](README.md)
