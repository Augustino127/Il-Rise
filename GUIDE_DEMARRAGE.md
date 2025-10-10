# 🎮 Guide de Démarrage - IleRise Farm V3

## ✅ Corrections Appliquées

### 1. **Fichiers dupliqués supprimés**
- ❌ `app-v3.js` supprimé (conflit avec `farm-v3-adapter.js`)
- ❌ `game-v3.html` supprimé (conflit avec `game.html`)

### 2. **Carte des localités corrigée**
Ajout de 3 nouvelles villes (8 localités au total):
- **Cotonou** (capitale économique) - NDVI: 0.28
- **Porto-Novo** (capitale administrative) - NDVI: 0.27
- **Abomey-Calavi** (zone urbaine) - NDVI: 0.27
- Parakou - NDVI: 0.31
- Djougou - NDVI: 0.12
- Bohicon - NDVI: 0.16
- Natitingou - NDVI: 0.23
- Kandi - NDVI: 0.13

### 3. **Bug critique de plantation corrigé**
**Problème:** L'ordre des paramètres dans `plantCrop()` était inversé
**Solution:** Correction de `plantCrop(cropId, plotId)` → `plantCrop(plotId, cropId)`

---

## 🚀 Comment Jouer

### Étape 1: Se connecter
1. Ouvrir http://localhost:3000
2. S'inscrire ou se connecter
3. Sélectionner une localité sur la carte

### Étape 2: Choisir sa région
- Cliquez sur une ville (marqueur 📍)
- Consultez les données NASA:
  - 🌱 NDVI (santé végétation)
  - 🌡️ Température
  - 💧 Humidité du sol
  - 🌧️ Précipitations
- Cliquez sur "Sélectionner cette localité"

### Étape 3: Activer le mode Ferme
1. Depuis l'écran de jeu, cliquez sur **"Mode Ferme Interactive"**
2. La ferme se charge avec votre parcelle 3D

### Étape 4: Commencer à cultiver

#### **Séquence obligatoire:**

**1️⃣ LABOURER d'abord** (🚜)
- Coût: 20💰
- Durée: 2 jours
- **C'est l'étape obligatoire avant de planter!**

**2️⃣ SÉLECTIONNER une culture** (dropdown en haut)
- Maïs 🌽
- Niébé 🫘
- Riz 🍚
- Manioc 🥔
- Cacao 🍫
- Coton ☁️

**3️⃣ PLANTER** (🌱)
- Coût: 10 graines
- Durée: 1 jour
- **Nécessite labour!**

**4️⃣ ENTRETENIR**
- 💧 **Arroser** (100L) → +10% humidité sol
- 🧪 **Fertiliser NPK** (20kg) → +20 NPK
- 💩 **Compost bio** (30kg) → +12 NPK +5 organique
- 🌿 **Désherber** (10💰) → -50% mauvaises herbes
- 🪲 **Pesticide bio** (2L) → +30% résistance

**5️⃣ RÉCOLTER** (🌾)
- Coût: 20💰
- **Nécessite culture mature!**
- Attendre que la barre de croissance soit complète

---

## 🎮 Contrôles

### Temps
- ⏸️ **Pause** - Mettre en pause
- ⏭️ **Jour suivant** - Avancer d'un jour
- **1x, 2x, 4x, 8x** - Vitesse de simulation

### Raccourcis clavier
- `W` - Arroser
- `F` - Fertiliser NPK
- `C` - Compost
- `D` - Désherber
- `P` - Pesticide bio
- `H` - Récolter
- `L` - Labourer

### Navigation
- 🚜 **Ferme** - Vue parcelles
- 🐔 **Élevage** - Poulailler (coût: 100💰)
- 🏪 **Marché** - Acheter/Vendre

---

## 💰 Ressources de Départ

Vous commencez avec:
- **500💰** d'argent
- **1000L** d'eau
- **Graines:**
  - Maïs: 50
  - Niébé: 30
  - Riz: 20
  - Manioc: 15
  - Cacao: 10
  - Coton: 25
- **Engrais:**
  - Compost: 100kg
  - NPK: 50kg
  - Urée: 30kg
  - Phosphate: 20kg
- **Pesticides:**
  - Naturels: 10L
  - Chimiques: 5L

---

## 📊 Comprendre les Indicateurs

### Santé de la parcelle (%)
- 🟢 80-100% : Excellente
- 🟡 50-79% : Bonne
- 🟠 30-49% : Moyenne
- 🔴 <30% : Mauvaise

### Humidité du sol (%)
- 🟢 60-80% : Optimal
- 🟡 40-59% : Correct
- 🟠 20-39% : Sec → **Arroser!**
- 🔴 <20% : Très sec

### Niveau NPK
- 🟢 100-150 : Excellent
- 🟡 50-99 : Bon
- 🟠 20-49 : Faible → **Fertiliser!**
- 🔴 <20 : Très faible

### Mauvaises herbes (%)
- 🟢 <20% : Propre
- 🟡 20-40% : Acceptable
- 🟠 40-60% : Élevé → **Désherber!**
- 🔴 >60% : Critique

---

## 🐛 Débogage

### Console JavaScript (F12)

Vous devriez voir ces logs au démarrage:
```
🌾 Initialisation Mode Ferme V3...
✅ Mode Ferme V3 initialisé
🎮 [FarmV3Adapter] Configuration des event listeners...
✅ Bouton retour configuré
✅ Sélecteur de culture configuré
📊 Boutons de vitesse trouvés: 4
🎬 Boutons d'action trouvés: 8
  ✓ Action #1: plow
  ✓ Action #2: plant
  ...
✅ Tous les event listeners configurés
```

### Lors d'un clic sur action:
```
🎯 [CLIC] Action: water
🎬 [FarmV3Adapter] Exécution action: water sur parcelle 1
📦 Parcelle active: 1, plantée: true, labourée: true
💰 Ressources avant action: {water: 1000, ...}
📊 Résultat: {success: true}
💰 Ressources après action: {water: 900, ...}
```

### Commandes de débogage utiles

Ouvrir la console (F12) et taper:

```javascript
// Voir l'état complet
window.farm.getState()

// Voir les ressources
window.farm.resourceManager.resources

// Ajouter de l'argent (triche)
window.farm.resourceManager.resources.money = 10000

// Ajouter de l'eau
window.farm.resourceManager.resources.water = 5000

// Passer au jour suivant
window.farm.skipToNextDay()

// Voir la parcelle active
window.farm.plotManager.getActivePlot()
```

---

## ❓ FAQ

**Q: Pourquoi je ne peux pas planter?**
→ Vous devez d'abord **labourer** (bouton 🚜)

**Q: Le bouton Labourer est grisé?**
→ Vérifiez que vous avez au moins 20💰

**Q: J'ai labouré mais je ne peux toujours pas planter?**
→ Avez-vous sélectionné une culture dans le dropdown?

**Q: L'arrosage ne fait rien?**
→ Il faut avoir **planté** une culture d'abord

**Q: Combien de temps pour récolter?**
→ Dépend de la culture:
  - Maïs: ~90 jours
  - Niébé: ~70 jours
  - Riz: ~120 jours
  - Manioc: ~240 jours
  - Cacao: ~365 jours
  - Coton: ~150 jours

**Q: Comment gagner plus d'argent?**
→ Récoltez et vendez au marché (section 🏪)

**Q: Je vois seulement 5 localités sur la carte?**
→ Rafraîchissez la page (Ctrl+R) - 8 villes devraient maintenant s'afficher

---

## 🏆 Conseils de Pro

1. **Labourez tôt** - Ça prend 2 jours, anticipez!
2. **Arrosez régulièrement** - Visez 60-80% humidité
3. **Fertilisez avant de planter** - NPK élevé = meilleure croissance
4. **Désherbez rapidement** - Les mauvaises herbes ralentissent la croissance
5. **Utilisez les données NASA** - Elles donnent des recommandations!
6. **Gérez votre budget** - Ne dépensez pas tout d'un coup
7. **Variez les cultures** - Diversifiez pour minimiser les risques

---

## 📝 Cycle de Culture Complet

**Exemple: Cultiver du Maïs (90 jours)**

| Jour | Action | Coût | État |
|------|--------|------|------|
| 0 | 🚜 Labourer | 20💰 | Labour en cours |
| 2 | 🌱 Planter maïs | 10 graines | Plantation terminée, germination |
| 3 | 💧 Arroser | 100L | Humidité +10% |
| 5 | 🧪 Fertiliser NPK | 20kg | NPK +20 |
| 10 | 🌿 Désherber | 10💰 | Mauvaises herbes -50% |
| 20 | 💧 Arroser | 100L | Humidité +10% |
| 30 | 🧪 Fertiliser | 20kg | NPK +20 |
| 40 | 💧 Arroser | 100L | Stade végétatif |
| 60 | 🌿 Désherber | 10💰 | Stade reproductif |
| 75 | 💧 Arroser | 100L | Maturation en cours |
| 92 | 🌾 Récolter | 20💰 | **Récolte!** 🎉 |

**Total dépensé:** 50💰 + 400L + 40kg NPK + 10 graines
**Revenu attendu:** ~300-500💰 (selon qualité)

---

## 🎯 Objectifs de Jeu

1. **Court terme** (Jour 1-30)
   - Labourer et planter votre première culture
   - Maintenir l'humidité > 50%
   - Accumuler 1000💰

2. **Moyen terme** (Jour 30-90)
   - Débloquer la 2ème parcelle (coût: 200💰)
   - Récolter votre première culture
   - Débloquer le poulailler (100💰)

3. **Long terme** (Jour 90+)
   - Cultiver 3+ parcelles simultanément
   - Gérer un élevage de poules
   - Atteindre 5000💰
   - Débloquer toutes les parcelles

---

Bon jeu! 🌾🎮
