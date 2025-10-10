# 🎮 Guide Mode Invité - IleRise Farm V3

## ✅ Corrections Appliquées

### 1. **Problème de redirection résolu** ✅
**Avant:** Les invités étaient constamment redirigés vers l'écran de connexion à cause d'une "session expirée"
**Maintenant:** Les invités peuvent jouer sans interruption!

### Corrections techniques:
- `checkAuth()` ne valide plus le token pour les invités
- L'événement `auth:expired` ignore les invités
- L'API ne déclenche plus de déconnexion pour les invités

---

## 🚀 Mode Test Rapide (Invités)

Les invités bénéficient automatiquement d'un **mode test rapide** pour tester le jeu plus facilement:

### 📈 Ressources de Départ Augmentées (5x - 10x)

| Ressource | Normal | Mode Invité |
|-----------|--------|-------------|
| 💰 Argent | 500 | **2500** (5x) |
| 💧 Eau | 1000L | **5000L** (5x) |
| 🌾 Graines (maïs) | 50 | **500** (10x) |
| 🌾 Graines (niébé) | 30 | **300** (10x) |
| 🧪 NPK | 50kg | **250kg** (5x) |
| 💩 Compost | 100kg | **500kg** (5x) |
| 🪲 Pesticide bio | 10L | **50L** (5x) |

### ⚡ Durées de Croissance Réduites (10x plus rapide)

| Culture | Normal | Mode Invité |
|---------|--------|-------------|
| 🌽 Maïs | 90 jours | **9 jours** |
| 🫘 Niébé | 70 jours | **7 jours** |
| 🍚 Riz | 120 jours | **12 jours** |
| 🥔 Manioc | 300 jours | **30 jours** |
| 🍫 Cacao | 365 jours | **37 jours** |
| ☁️ Coton | 150 jours | **15 jours** |

### ⏱️ Actions Quasi-Instantanées (10x plus rapide)

| Action | Normal | Mode Invité |
|--------|--------|-------------|
| 🚜 Labour | 2 jours | **0.2 jour** (~5h) |
| 💩 Compost | 1 jour | **0.1 jour** (~2h) |
| 🌿 Désherbage | 2 jours | **0.2 jour** (~5h) |
| 🌱 Plantation | 1 jour | **0.1 jour** (~2h) |
| 🌾 Récolte | 1 jour | **0.1 jour** (~2h) |

---

## 🎯 Comment Jouer en Mode Invité

### Étape 1: Cliquez sur "Jouer en tant qu'invité"
1. Ouvrir http://localhost:3000
2. Sur l'écran de connexion, cliquer sur **"Jouer en tant qu'invité"**
3. Vous serez connecté instantanément!

### Étape 2: Profitez des Avantages
- ✅ **Pas de compte requis**
- ✅ **Pas de redirection forcée**
- ✅ **Vies illimitées** ❤️❤️❤️❤️❤️ (toujours 5/5)
- ✅ **Tests rapides** (10x plus rapide)
- ✅ **Ressources abondantes**
- ✅ **Sauvegarde locale** (localStorage)

### Étape 3: Testez Rapidement
Avec le mode test rapide, vous pouvez:
- **Planter et récolter du maïs en 9 jours** au lieu de 90!
- **Tester toutes les cultures** rapidement
- **Expérimenter** sans crainte de manquer de ressources
- **Voir les résultats** en quelques minutes

---

## 🔄 Workflow de Test Rapide

### Cycle Complet: Maïs (9 jours au lieu de 90)

```
Jour 0   : 🚜 Labour (~5h au lieu de 2 jours)
Jour 0.2 : 🌱 Plantation maïs (~2h)
Jour 0.3 : 💧 Arrosage
Jour 1   : 🧪 Fertiliser NPK
Jour 3   : 💧 Arrosage
Jour 5   : 🌿 Désherbage (~5h)
Jour 7   : 💧 Arrosage
Jour 9   : 🌾 RÉCOLTE! (~2h)
```

**Total: 9 jours au lieu de 90 jours** = Vous pouvez tester un cycle complet en moins de 2 semaines de jeu!

---

## 💡 Conseils pour Tests Rapides

### Stratégie de Test Optimale

1. **Utilisez la vitesse 8x** pour accélérer encore plus
   - 9 jours × vitesse 8x = ~1 jour réel de simulation!

2. **Testez plusieurs cultures simultanément**
   - 4 parcelles disponibles
   - Testez maïs, niébé, riz en parallèle

3. **Expérimentez sans limite**
   - Ressources abondantes
   - Ne vous inquiétez pas de l'argent!

4. **Utilisez le bouton "Jour Suivant"** (⏭️)
   - Avancez rapidement quand rien ne se passe

---

## 📊 Comparaison Mode Normal vs Mode Invité

| Aspect | Normal | Invité (Test Rapide) |
|--------|--------|----------------------|
| **Inscription** | Requise | ❌ Pas nécessaire |
| **Redirection** | Possible si session expire | ✅ Jamais |
| **Vies** | 5 max (régénération 30min) | ✅ **Illimitées** |
| **Ressources début** | 500💰, 1000L | 2500💰, 5000L |
| **Cycle maïs** | 90 jours | 9 jours |
| **Labour** | 2 jours | ~5 heures |
| **Tests possibles** | Limités | ✅ Illimités |
| **Sync backend** | Oui | Non (local) |
| **Idéal pour** | Jouer sérieusement | **Tester rapidement** |

---

## 🐛 Dépannage

### "Je suis toujours redirigé"
→ Videz le cache du navigateur (Ctrl+Shift+R) et reconnectez-vous en tant qu'invité

### "Mes vies sont à 0"
→ **Impossible!** Les invités ont des vies illimitées. Si vous voyez 0/5:
1. Vérifiez que vous êtes bien en mode invité:
```javascript
localStorage.getItem('ilerise_guest') // Doit retourner "true"
```
2. Rafraîchissez la page (Ctrl+R)
3. Les vies devraient revenir à 5/5 automatiquement

### "Les durées sont encore longues"
→ Vérifiez dans la console (F12):
```javascript
localStorage.getItem('ilerise_guest')
// Doit retourner "true"
```

### "Je veux recommencer à zéro"
→ Cliquez sur **"Quitter"** dans le menu principal, puis reconnectez-vous en tant qu'invité

OU supprimez les données locales manuellement:
```javascript
// Dans la console
localStorage.removeItem('ilerise_guest')
localStorage.removeItem('ilerise_user')
// Puis rafraîchir
```

---

## 🎓 Pour les Développeurs

### Activer/Désactiver le Mode Test

Le mode test est automatiquement activé pour les invités. Pour forcer le mode normal:

```javascript
// Dans la console
localStorage.removeItem('ilerise_guest')
// Puis reconnexion
```

### Variables de Debug

```javascript
// Vérifier le mode
const isGuest = localStorage.getItem('ilerise_guest') === 'true'
console.log('Mode invité:', isGuest)

// Voir les durées ajustées
import { CROPS } from './src/game/CropDatabase.js'
console.log('Maïs durée:', CROPS.maize.growthDuration) // 9 jours pour invités

// Voir les ressources
window.farm?.resourceManager?.resources
```

---

## ✨ Résumé des Avantages Mode Invité

| Avantage | Impact |
|----------|--------|
| **Pas de compte requis** | Testez immédiatement |
| **Pas de redirection** | Jouez sans interruption |
| **Vies illimitées** ❤️❤️❤️❤️❤️ | Jouez autant que vous voulez |
| **Cultures 10x plus rapides** | Résultats en 9 jours au lieu de 90 |
| **Actions quasi-instantanées** | Labour en 5h au lieu de 2 jours |
| **Ressources 5-10x plus** | Expérimentez librement |
| **Gameplay accéléré** | Testez tout rapidement |

---

## 🎮 Profitez du Jeu!

Le mode invité est **parfait pour**:
- ✅ Découvrir le jeu rapidement
- ✅ Tester toutes les fonctionnalités
- ✅ Expérimenter avec différentes stratégies
- ✅ Voir les résultats immédiatement
- ✅ Développer et déboguer

**Amusez-vous bien! 🌾**
