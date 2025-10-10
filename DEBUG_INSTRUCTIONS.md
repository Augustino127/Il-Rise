# 🔍 Instructions de Débogage - IleRise Farm V3

## Serveur démarré ✅
Le serveur Vite tourne sur **http://localhost:3000/**

## Comment tester la ferme virtuelle :

### 1. Ouvrir l'application
- Aller sur http://localhost:3000/game-v3.html
- Ouvrir la **Console JavaScript** (F12 → Console)

### 2. Vérifier les logs de démarrage
Vous devriez voir :
```
🌾 Initialisation IleRise Farm V3...
📡 Chargement fichiers NASA...
  ✓ Température chargée
  ✓ NDVI chargé
  ✓ Précipitations chargées
✅ Données NASA chargées
```

### 3. Sélectionner une localité
- Cliquez sur une ville sur la carte (Parakou, Cotonou, etc.)
- Cliquez sur "Commencer dans cette région"
- La ferme devrait se charger

### 4. Logs de configuration des événements
Après le chargement de la ferme, vous devriez voir :
```
🎮 Configuration des event listeners...
✅ Bouton retour configuré
✅ Bouton pause configuré
✅ Bouton jour suivant configuré
📊 Boutons de vitesse trouvés: 4
🎬 Boutons d'action trouvés: 8
  ✓ Action #1: plow
  ✓ Action #2: plant
  ✓ Action #3: water
  ...
```

### 5. Tester une action
1. **Labourer** d'abord (bouton 🚜)
   - Devrait afficher : `🎯 Clic sur action: plow`
   - Puis : `✅ Action "plow" effectuée`

2. **Sélectionner une culture** (dropdown en haut)
   - Choisir "Maïs" ou "Niébé"

3. **Planter** (bouton 🌱)
   - Devrait afficher : `🌱 Tentative de plantation: maize`
   - Puis : `✅ Plantation réussie`

4. **Arroser** (bouton 💧)
   - Devrait afficher : `✅ Action "water" effectuée`

## 🐛 Problèmes possibles et solutions

### Problème : Aucun bouton ne fonctionne
**Vérifier dans la console :**
- Y a-t-il des erreurs rouges ?
- Les event listeners sont-ils bien configurés ?

### Problème : "Action non définie"
**Cause :** Les attributs `data-action` manquent sur les boutons
**Vérifier :** dans game-v3.html:331-386, tous les boutons ont `data-action="xxx"`

### Problème : Boutons toujours désactivés
**Cause :** Conditions de disponibilité trop strictes
**Solution :** Survoler le bouton pour voir la raison (tooltip)
- Si "Champ non labouré" → Labourer d'abord
- Si "Ressources insuffisantes" → Vérifier l'argent/eau/graines

### Problème : Données NASA ne chargent pas
**Vérifier :**
```javascript
// Dans la console
fetch('/data/nasa-ndvi-benin.json').then(r => r.json()).then(console.log)
```
Si erreur 404 → Les fichiers sont bien dans `public/data/` ?

## 📊 Commandes de débogage utiles

```javascript
// Accéder au jeu depuis la console
window.app  // L'application
window.farm // Le FarmGame

// Voir l'état complet
window.farm.getState()

// Voir les ressources
window.farm.resourceManager.resources

// Voir la parcelle active
window.farm.plotManager.getActivePlot()

// Forcer une action (bypass vérifications)
window.farm.resourceManager.resources.money = 10000
window.farm.resourceManager.resources.water = 10000

// Passer au jour suivant
window.farm.skipToNextDay()
```

## ✅ Test de bon fonctionnement

**Checklist :**
- [ ] La carte de sélection de localité s'affiche
- [ ] On peut cliquer sur une ville et confirmer
- [ ] L'écran de ferme se charge avec la parcelle 3D
- [ ] Les boutons de vitesse (1x, 2x, 4x, 8x) fonctionnent
- [ ] Le bouton "Labourer" fonctionne et affiche un message
- [ ] On peut sélectionner une culture dans le dropdown
- [ ] Le bouton "Planter" fonctionne après labour
- [ ] Le bouton "Arroser" fonctionne après plantation
- [ ] Les ressources (💰, 💧) diminuent après actions
- [ ] Le temps avance (Jour 1 → Jour 2)

## 🆘 Si rien ne marche

1. **Vérifier les erreurs dans la console** (F12)
2. **Rafraîchir la page** (Ctrl+R)
3. **Vider le cache** (Ctrl+Shift+R)
4. **Vérifier que le serveur Vite tourne bien** (voir terminal)
5. **Tester avec game-v3.html directement** : http://localhost:3000/game-v3.html

## 📝 Rapport d'erreur

Si vous trouvez un bug, noter :
1. **Étape qui ne fonctionne pas**
2. **Message d'erreur dans la console** (copier/coller)
3. **Actions effectuées avant l'erreur**
4. **Capture d'écran** si possible
