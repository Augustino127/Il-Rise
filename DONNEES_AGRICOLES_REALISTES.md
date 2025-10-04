# DONNÉES AGRICOLES RÉALISTES - SYSTÈME DE JEU ÉDUCATIF

## 📋 TABLE DES MATIÈRES

1. [Tableau Général des Cultures](#tableau-général-des-cultures)
2. [Données Détaillées par Culture](#données-détaillées-par-culture)
3. [Objectifs par Niveau de Difficulté](#objectifs-par-niveau-de-difficulté)
4. [Contenu Éducatif - Cartes de Savoir](#contenu-éducatif---cartes-de-savoir)
5. [Format JSON Suggéré](#format-json-suggéré)
6. [Sources de Données](#sources-de-données)

---

## 1. TABLEAU GÉNÉRAL DES CULTURES

### Tableau Comparatif des 10 Cultures Principales

| Culture | Rendement Min (t/ha) | Rendement Moyen (t/ha) | Rendement Max (t/ha) | Temps de Croissance (jours) | pH Optimal | Température Optimale (°C) |
|---------|---------------------|------------------------|----------------------|----------------------------|------------|---------------------------|
| **Blé** | 3.0 | 6.0-6.5 | 10.0 | 90-130 | 5.5-7.5 | 16-25 |
| **Maïs** | 1.5 | 5.0-8.0 | 12.0 | 85-145 | 5.5-6.5 | 20-30 |
| **Riz** | 2.0 | 4.0-5.0 | 8.0 | 105-150 | 5.5-6.5 | 25-35 |
| **Pomme de terre** | 15.0 | 25.0-35.0 | 70.0 | 90-130 | 5.5-6.5 | 15-20 |
| **Tomate** | 15.0 | 35.0-50.0 | 80.0 | 80-120 | 6.0-6.8 | 20-28 |
| **Niébé (Cowpea)** | 0.5 | 1.2-1.8 | 5.7 | 60-90 | 6.0-7.0 | 28-30 |
| **Manioc** | 10.0 | 15.0-20.0 | 40.0 | 270-365 | 5.5-6.5 | 25-29 |
| **Haricot** | 0.8 | 1.5-2.5 | 4.0 | 60-90 | 6.0-7.0 | 18-25 |
| **Sorgho** | 1.0 | 2.5-3.5 | 6.0 | 90-120 | 5.5-6.5 | 26-30 |
| **Arachide** | 0.8 | 1.5-2.5 | 4.5 | 90-140 | 5.9-6.3 | 25-30 |

### Contexte Afrique de l'Ouest (Bénin)

**Rendements Moyens Actuels au Bénin :**
- Maïs : 1.3 t/ha (bien en dessous du potentiel)
- Riz irrigué : 3.0+ t/ha
- Manioc : 15-17 t/ha
- Niébé : 1.0-1.5 t/ha

---

## 2. DONNÉES DÉTAILLÉES PAR CULTURE

### 🌾 BLÉ (Wheat)

**Rendements (tonnes/ha) :**
- Minimum : 3.0 t/ha
- Moyen : 6.0-6.5 t/ha (France 2024)
- Maximum : 10.0 t/ha (bonnes conditions)

**Cycle de Culture :**
- Durée totale : 90-130 jours
- Blé d'hiver : 120-130 jours
- Blé de printemps : 90-100 jours

**Besoins en Eau :**
- Total saison : 300-380 mm (12-15 inches)
- Phase critique : Floraison et remplissage des grains

**Besoins NPK :**
- Azote (N) : 120-180 kg/ha
- Phosphore (P) : 20-40 kg/ha
- Potassium (K) : 40-80 kg/ha
- Formules courantes : 20-10-0, 24-40-0, 30-15-0

**Conditions Climatiques Optimales :**
- Température : 16-25°C (croissance), 14°C (maturation)
- pH : 5.5-7.5
- Type de sol : Limoneux profond, bien drainé
- Zones USDA : 7a-10b

**Pratiques Recommandées :**
- Rotation avec légumineuses
- Semis en lignes espacées de 15-20 cm
- Profondeur de semis : 3-5 cm
- Désherbage précoce crucial

---

### 🌽 MAÏS (Corn/Maize)

**Rendements (tonnes/ha) :**
- Minimum : 1.5 t/ha (conditions difficiles)
- Moyen Afrique : 1.3 t/ha (Bénin actuel)
- Moyen Optimal : 5.0-8.0 t/ha
- Maximum : 12.0 t/ha (variétés améliorées)

**Cycle de Culture :**
- Variétés précoces : 85-100 jours
- Variétés mi-saison : 110-130 jours
- Variétés tardives : 131-145 jours

**Besoins en Eau :**
- Total saison : 500-800 mm
- Phases critiques :
  - Floraison (V6-R1)
  - Remplissage des grains (R1-R6)

**Besoins NPK :**
- Azote (N) : 120-200 kg/ha
- Phosphore (P) : 60-100 kg/ha
- Potassium (K) : 80-120 kg/ha
- Ratio d'efficacité : 0.8-1.3 lb N/boisseau

**Conditions Climatiques Optimales :**
- Température : 20-30°C (idéal 25-28°C)
- Germination : Sol à 70°F (21°C) minimum
- pH : 5.5-6.5
- Type de sol : Limoneux riche en matière organique
- Zones USDA : 9b-10b

**Pratiques Recommandées :**
- Association avec niébé, manioc au Bénin
- Densité : variable selon système (10,000-75,000 plants/ha)
- Buttage pour stabilité
- Récolte à 20-25% humidité

---

### 🍚 RIZ (Rice)

**Rendements (tonnes/ha) :**
- Minimum : 2.0 t/ha
- Moyen irrigué : 4.0-5.0 t/ha
- Moyen pluvial : 2.5-3.5 t/ha
- Maximum : 8.0 t/ha (irrigué intensif)

**Cycle de Culture :**
- Courte durée : 100-120 jours
- Moyenne durée : 120-140 jours
- Longue durée : 160+ jours
- Hauteur plante : 90-120 cm

**Besoins en Eau :**
- Riz irrigué : Inondation permanente (5-15 cm)
- Riz pluvial : 1,200-2,000 mm/saison
- Phase critique : Tallage et floraison

**Besoins NPK :**
- Azote (N) : 100-150 kg/ha (split en 2-3 applications)
- Phosphore (P) : 30-60 kg/ha
- Potassium (K) : 40-80 kg/ha
- Formules : 15-15-15 courante

**Conditions Climatiques Optimales :**
- Température : 25-35°C (photosynthèse max 30-35°C)
- Nuits : >15°C minimum (>60°F)
- pH : 5.5-6.5 (tolère 5.0-7.0)
- Type de sol : Argileux pour irrigué, adaptable pour pluvial
- Zones USDA : 9b-10a

**Pratiques Recommandées :**
- Repiquage à 20-25 jours (pépinière)
- Espacement : 20x20 cm ou 25x25 cm
- Gestion eau précise (irrigué)
- Récolte à maturité complète (grain dur)

---

### 🥔 POMME DE TERRE (Potato)

**Rendements (tonnes/ha) :**
- Minimum : 15.0 t/ha (débutant)
- Moyen : 25.0-35.0 t/ha
- Bon (1ère année) : 25 t/ha
- Maximum : 70.0 t/ha (experts)

**Cycle de Culture :**
- Précoce : 60-80 jours
- Mi-saison : 80-100 jours
- Tardive : 100-130 jours

**Besoins en Eau :**
- Total saison : 500-700 mm
- Régularité cruciale (tubérisation)
- Éviter stress hydrique

**Besoins NPK :**
- Formule de base : 15-15-15 (au semis)
- Azote (N) : 120-180 kg/ha
- Phosphore (P) : 80-120 kg/ha
- Potassium (K) : 150-250 kg/ha (gourmand en K)

**Conditions Climatiques Optimales :**
- Température : 15-20°C (tubérisation)
- Sol : 60°F minimum pour plantation
- pH : 5.5-6.5 (légèrement acide)
- Type de sol : Limoneux sableux, bien drainé
- Exposition : Plein soleil

**Pratiques Recommandées :**
- Buttage progressif (lumière = verdissement)
- Plants certifiés sans virus
- Rotation 3-4 ans minimum
- Récolte quand fanes sèches

---

### 🍅 TOMATE (Tomato)

**Rendements (tonnes/ha) :**
- Minimum : 15.0 t/ha (plein champ)
- Moyen : 35.0-50.0 t/ha
- Maximum : 80.0 t/ha (sous-serre, tuteurage)

**Cycle de Culture :**
- Pépinière : 20-30 jours
- Transplant à récolte : 60-100 jours
- Total graines : 100-120 jours

**Besoins en Eau :**
- 25-50 mm/semaine (1-2 inches)
- Irrigation régulière (éviter stress)
- Paillage recommandé

**Besoins NPK :**
- Azote (N) : 150-200 kg/ha
- Phosphore (P) : 80-120 kg/ha
- Potassium (K) : 200-300 kg/ha
- Calcium : Important (prévenir nécrose apicale)

**Conditions Climatiques Optimales :**
- Température : 20-28°C (jour), 15-18°C (nuit)
- Sol : 60°F (15°C) minimum
- Germination : 75-85°F (24-29°C)
- pH : 6.0-6.8
- Type de sol : Bien drainé, riche en MO
- Exposition : Plein soleil (8h minimum)

**Pratiques Recommandées :**
- Tuteurage (variétés indéterminées)
- Taille des gourmands
- Paillage plastique/paille
- Rotation avec non-solanacées

---

### 🫘 NIÉBÉ / COWPEA (Vigna unguiculata)

**Rendements (tonnes/ha) :**
- Minimum : 0.5 t/ha (pluvial pauvre)
- Moyen : 1.2-1.8 t/ha
- Moyen Bénin actuel : 1.0-1.5 t/ha
- Maximum : 5.7 t/ha (irrigué + inoculé)

**Cycle de Culture :**
- Durée totale : 60-90 jours
- Variétés précoces : 60-75 jours
- Variétés tardives : 80-90 jours

**Besoins en Eau :**
- Pluviométrie : 400-700 mm (idéal)
- Minimum : 500 mm/saison
- Tolérant à la sécheresse

**Besoins NPK :**
- Azote (N) : 15 kg/ha (starter uniquement)
  - Fixation biologique N₂ via nodules racinaires
- Phosphore (P) : 30 kg/ha (super phosphate)
- Potassium (K) : 20-40 kg/ha

**Conditions Climatiques Optimales :**
- Température : 28-30°C (croissance)
- Pluviométrie : 500-1,200 mm/an
- pH : 6.0-7.0 (tolère 5.5-8.0)
- Type de sol : Sableux (préféré), tolère sols pauvres
- Tolérance : Sols acides et pauvres en N

**Pratiques Recommandées :**
- Inoculation rhizobium (augmente rendement)
- Cultures associées (maïs, mil)
- Semis direct après pluies
- Culture idéale ressources limitées

---

### 🍠 MANIOC / CASSAVA (Manihot esculenta)

**Rendements (tonnes/ha) :**
- Minimum : 10.0 t/ha (extensif)
- Moyen Afrique : 15.0-20.0 t/ha
- Moyen Bénin : 15-17 t/ha
- Potentiel variétés améliorées : 30-40 t/ha

**Cycle de Culture :**
- Durée totale : 9-12 mois (270-365 jours)
- Récolte possible : 6 mois minimum
- Optimum : 10-12 mois

**Besoins en Eau :**
- Pluviométrie : 1,000-1,500 mm/an
- Très tolérant à la sécheresse
- Irrigation non essentielle (améliore rendement)

**Besoins NPK :**
- Azote (N) : 80-120 kg/ha
- Phosphore (P) : 40-80 kg/ha
- Potassium (K) : 120-180 kg/ha (extractif élevé)
- Magnésium (Mg) : Important
- Fumier organique recommandé

**Conditions Climatiques Optimales :**
- Température : 25-29°C (air), 30°C (sol)
- Altitude : 0-1,500 m
- pH : 5.5-6.5 (tolère 4.5-8.0)
- Type de sol : Limoneux (préféré), tolère sols pauvres
- Drainage : Essentiel

**Pratiques Recommandées :**
- Boutures 20-25 cm (tiges matures)
- Espacement : 1m x 1m (10,000 plants/ha)
- Buttage améliore tubérisation
- Culture pérenne importante Afrique

---

### 🫘 HARICOT (Common Bean)

**Rendements (tonnes/ha) :**
- Minimum : 0.8 t/ha
- Moyen : 1.5-2.5 t/ha
- Maximum : 4.0 t/ha

**Cycle de Culture :**
- Durée : 60-90 jours
- Variété 'Blue Lake' : 60 jours (standard)

**Besoins en Eau :**
- Modérés : 400-600 mm
- Régularité floraison/formation gousses

**Besoins NPK :**
- Azote (N) : 30-60 kg/ha (fixation symbiotique)
- Phosphore (P) : 40-80 kg/ha
- Potassium (K) : 60-100 kg/ha

**Conditions Climatiques Optimales :**
- Température : 18-25°C
- pH : 6.0-7.0
- Type de sol : Limoneux bien drainé

**Pratiques Recommandées :**
- Inoculation Rhizobium
- Tuteurage (variétés grimpantes)
- Récolte progressive (haricots verts)

---

### 🌾 SORGHO (Sorghum)

**Rendements (tonnes/ha) :**
- Minimum : 1.0 t/ha
- Moyen : 2.5-3.5 t/ha
- Maximum : 6.0 t/ha

**Cycle de Culture :**
- Durée : 90-120 jours
- Variétés précoces : 90-100 jours

**Besoins en Eau :**
- Très résistant sécheresse
- 400-600 mm/saison

**Besoins NPK :**
- Azote (N) : 60-100 kg/ha
- Phosphore (P) : 30-60 kg/ha
- Potassium (K) : 40-80 kg/ha

**Conditions Climatiques Optimales :**
- Température : 26-30°C
- pH : 5.5-6.5
- Type de sol : Adaptable (préfère limoneux)

**Pratiques Recommandées :**
- Culture sèche importante Sahel
- Rotation avec légumineuses
- Stockage grains en épis

---

### 🥜 ARACHIDE (Groundnut/Peanut)

**Rendements (tonnes/ha) :**
- Minimum : 0.8 t/ha
- Moyen : 1.5-2.5 t/ha
- Maximum : 4.5 t/ha

**Cycle de Culture :**
- Durée : 90-140 jours
- Variétés précoces : 90-110 jours
- Variétés tardives : 120-140 jours

**Besoins en Eau :**
- Total : 500-700 mm
- Phase critique : Floraison et formation gousses

**Besoins NPK :**
- Azote (N) : 20-40 kg/ha (fixation symbiotique)
- Phosphore (P) : 40-80 kg/ha
- Potassium (K) : 60-100 kg/ha
- Calcium : Important (gypse)

**Conditions Climatiques Optimales :**
- Température : 25-30°C
- pH : 5.9-6.3
- Type de sol : Sableux léger (formation gousses)

**Pratiques Recommandées :**
- Sol meuble pour pénétration gynophores
- Chaulage si pH < 5.5
- Rotation avec céréales
- Arrachage à maturité complète

---

## 3. OBJECTIFS PAR NIVEAU DE DIFFICULTÉ

### 🟢 NIVEAU DÉBUTANT (Niveau 1-2)

**Objectifs Réalistes :**
- Atteindre 60-70% du rendement moyen
- Comprendre les bases de l'irrigation
- Identifier les besoins nutritifs de base

**Cultures Recommandées :**
1. **Maïs** : Objectif 3.0-4.0 t/ha (70% du moyen)
2. **Niébé** : Objectif 0.8-1.0 t/ha (60% du moyen)
3. **Haricot** : Objectif 1.0-1.5 t/ha (65% du moyen)

**Paramètres Simplifiés :**
- Irrigation : Indicateur visuel sec/humide
- NPK : Dose fixe recommandée
- pH : Prédéfini par zone

**Critères de Succès :**
- ✅ Rendement ≥ 60% optimal
- ✅ Pas de stress hydrique majeur
- ✅ Fertilisation minimale appliquée
- ⭐ Score : 500-700 points

---

### 🟡 NIVEAU INTERMÉDIAIRE (Niveau 3-5)

**Objectifs Réalistes :**
- Atteindre 75-85% du rendement moyen
- Optimiser eau et nutriments
- Comprendre rotations cultures

**Cultures Recommandées :**
1. **Riz irrigué** : Objectif 4.0-5.0 t/ha (80% du moyen)
2. **Pomme de terre** : Objectif 25-30 t/ha (80% du moyen)
3. **Tomate** : Objectif 35-45 t/ha (75% du moyen)
4. **Manioc** : Objectif 15-20 t/ha (70% du moyen)

**Paramètres Contrôlés :**
- Irrigation : Ajustement selon météo
- NPK : Split applications (2-3 fois)
- pH : Correction sol si nécessaire
- Rotation : 2 cultures/an

**Critères de Succès :**
- ✅ Rendement ≥ 75% optimal
- ✅ Gestion eau efficace
- ✅ Fertilisation fractionnée
- ✅ Prévention maladies de base
- ⭐ Score : 700-850 points

---

### 🔴 NIVEAU EXPERT (Niveau 6-8)

**Objectifs Réalistes :**
- Atteindre 90-100% du rendement maximal
- Optimisation multi-paramètres
- Pratiques agriculture de précision

**Cultures Recommandées :**
1. **Blé** : Objectif 8.0-10.0 t/ha (90% du max)
2. **Maïs hybride** : Objectif 10.0-12.0 t/ha (95% du max)
3. **Riz intensif** : Objectif 7.0-8.0 t/ha (95% du max)
4. **Pomme de terre** : Objectif 60-70 t/ha (90% du max)

**Paramètres Avancés :**
- Irrigation : Précision mm (tensiomètres virtuels)
- NPK : Formulations custom + micro-éléments
- pH : Ajustement dynamique
- Rotation : 3-4 cultures/système
- Gestion parasites intégrée

**Critères de Succès :**
- ✅ Rendement ≥ 90% optimal
- ✅ Efficience eau >80%
- ✅ Efficience NPK >70%
- ✅ Zéro stress majeur
- ✅ Rotation optimale
- ⭐ Score : 900-1000 points

---

### 🏆 SYSTÈME DE PROGRESSION

**Déblocage Niveaux :**
```
Niveau 1 (Maïs) → Gratuit
├─ Score ≥ 600 → Débloquer Niveau 2
│
Niveau 2 (Niébé) → 100 pièces
├─ Score ≥ 650 → Débloquer Niveau 3
│
Niveau 3 (Riz) → 300 pièces
├─ Score ≥ 700 → Débloquer Niveau 4
│
Niveau 4 (Manioc) → 500 pièces
├─ Score ≥ 750 → Débloquer Niveau 5
│
Niveau 5 (Pomme de terre) → 800 pièces
├─ Score ≥ 800 → Débloquer Niveau 6
│
Niveau 6 (Tomate) → 1000 pièces
├─ Score ≥ 850 → Débloquer Niveau 7
│
Niveau 7 (Blé) → 1500 pièces
├─ Score ≥ 900 → Débloquer Niveau 8
│
Niveau 8 (Expert Mix) → 2000 pièces
└─ Score ≥ 950 → Champion
```

**Calcul Score :**
```javascript
score = (rendement_obtenu / rendement_optimal) * 800
      + (efficience_eau) * 100
      + (efficience_NPK) * 100
      - (stress_detectes * 50)
```

---

## 4. CONTENU ÉDUCATIF - CARTES DE SAVOIR

### 🎓 SYSTÈME DE CARTES DE CONNAISSANCES

#### Structure des Cartes
- **3 niveaux** : Débutant, Intermédiaire, Expert
- **8-10 cultures** : Une carte par culture + thèmes transversaux
- **Format** : Audio + Visuel + Quiz validation

---

### NIVEAU DÉBUTANT - Fondamentaux

#### Carte 1 : Le Cycle de l'Eau dans les Plantes
**Titre** : "Pourquoi les plantes ont besoin d'eau ?"

**Contenu Audio (2 min) :**
> "L'eau est la vie de vos cultures ! Une plante c'est comme vous : elle a soif. L'eau entre par les racines, monte dans la tige, et sort par les feuilles. C'est comme boire et transpirer. Si pas assez d'eau, la plante flétrit. Si trop d'eau, les racines étouffent. Il faut juste ce qu'il faut !"

**Illustration** :
- Schéma plante avec flèches eau (racines → tige → feuilles)
- Comparaison : Plante hydratée vs flétrie

**Quiz Validation :**
1. Par où entre l'eau dans la plante ? → **Racines** ✓
2. Que se passe-t-il si trop d'eau ? → **Racines étouffent** ✓

**Déblocage** : Après 2 succès en maïs

---

#### Carte 2 : NPK - Les Trois Lettres Magiques
**Titre** : "N, P, K : La nourriture de vos plantes"

**Contenu Audio (2 min) :**
> "NPK, ce sont les vitamines des plantes ! N = Azote, pour les feuilles vertes. P = Phosphore, pour les racines fortes. K = Potassium, pour les fruits sucrés. C'est comme manger légumes, viande et fruits pour être fort. Vos plantes aussi ont besoin de tout !"

**Illustration** :
- N → Feuilles vertes (dessin maïs)
- P → Racines puissantes (dessin carotte)
- K → Fruits/graines (dessin tomate)

**Quiz Validation :**
1. Quelle lettre pour feuilles vertes ? → **N** ✓
2. Quelle lettre pour racines fortes ? → **P** ✓

**Déblocage** : Après 3 succès en niébé

---

#### Carte 3 : Le pH du Sol
**Titre** : "Acide ou basique ? Votre sol a un caractère !"

**Contenu Audio (2 min) :**
> "Le pH, c'est si votre sol est acide (citron) ou basique (savon). Les plantes préfèrent sol légèrement acide, comme une orange douce. pH 6-7 c'est parfait pour la plupart ! Trop acide (pH 4) = plantes malades. Trop basique (pH 8) = nutriments bloqués."

**Illustration** :
- Échelle pH 4-8 avec couleurs (rouge→jaune→vert→bleu)
- Zone verte = optimal 6-7
- Icônes : citron (acide), savon (basique)

**Quiz Validation :**
1. pH idéal pour la plupart ? → **6-7** ✓
2. pH 4 c'est quoi ? → **Trop acide** ✓

**Déblocage** : Après 1er échec pH inadapté

---

### NIVEAU INTERMÉDIAIRE - Techniques

#### Carte 4 : La Rotation des Cultures
**Titre** : "Ne jamais planter 2 fois la même chose !"

**Contenu Audio (3 min) :**
> "Rotation = tourner les cultures ! Après du maïs, plantez du niébé. Pourquoi ? Le maïs épuise l'azote, le niébé le remet ! C'est comme recharger une batterie. Ça évite aussi les maladies. Règle d'or : alterner céréale → légumineuse → racine. Maïs → Niébé → Manioc → Recommencer !"

**Illustration** :
- Cycle rotation : Maïs (consomme N) → Niébé (fixe N) → Manioc (nettoie sol)
- Flèches circulaires

**Quiz Validation :**
1. Après maïs, planter ? → **Légumineuse (niébé)** ✓
2. Pourquoi rotation ? → **Recharger sol + éviter maladies** ✓

**Déblocage** : Après 2 cultures complétées

---

#### Carte 5 : Le Fractionnement NPK
**Titre** : "Nourrir par petites doses = meilleur rendement"

**Contenu Audio (3 min) :**
> "Imaginez manger 3 repas/jour ou tout en 1 fois ! Les plantes aussi préfèrent manger régulièrement. Fractionnement = diviser l'engrais en 2-3 applications. Exemple riz : 1/3 au semis, 1/3 au tallage, 1/3 à la floraison. Résultat : 30% rendement en plus, moins de gaspillage !"

**Illustration** :
- Timeline culture riz avec 3 apports NPK
- Graphique rendement : dose unique vs fractionné

**Quiz Validation :**
1. Combien d'apports NPK idéal ? → **2-3** ✓
2. Avantage ? → **+30% rendement** ✓

**Déblocage** : Après niveau 4 complété

---

#### Carte 6 : Les Satellites NASA
**Titre** : "Des yeux dans l'espace pour vos cultures"

**Contenu Audio (3 min) :**
> "NASA envoie satellites qui voient vos champs de l'espace ! SMAP mesure humidité du sol (besoin irrigation ?). MODIS voit santé plantes (vertes = OK, jaunes = problème). GPM compte les pluies. C'est comme avoir docteur gratuit qui surveille vos cultures 24h/24 !"

**Illustration** :
- Satellite au-dessus champ
- 3 données : goutte eau (SMAP), feuille (NDVI), nuage pluie (GPM)

**Quiz Validation :**
1. SMAP mesure quoi ? → **Humidité sol** ✓
2. MODIS voit quoi ? → **Santé plantes** ✓

**Déblocage** : Première utilisation données NASA

---

### NIVEAU EXPERT - Optimisation

#### Carte 7 : Gestion Intégrée des Parasites
**Titre** : "Protéger sans polluer"

**Contenu Audio (4 min) :**
> "GIP = Gestion Intégrée Parasites. Stratégie intelligente : 1) Prévenir (rotation, variétés résistantes), 2) Observer (seuils tolérance), 3) Agir smart (bio d'abord, chimique en dernier). Exemple : coccinelles mangent pucerons = pesticide naturel ! Économise argent et protège santé."

**Illustration** :
- Pyramide : Base = prévention, Sommet = chimique
- Coccinelle mangeant puceron

**Quiz Validation :**
1. 1ère étape GIP ? → **Prévenir** ✓
2. Exemple bio ? → **Coccinelles** ✓

**Déblocage** : Niveau 6 complété

---

#### Carte 8 : Agriculture de Précision
**Titre** : "La science au service du rendement"

**Contenu Audio (4 min) :**
> "Agriculture précision = donner exactement ce qu'il faut, où il faut, quand il faut. GPS divise champ en zones. Capteurs mesurent sol réel. Drones voient stress avant vos yeux. Résultat : -30% engrais, +20% rendement ! C'est l'agriculture du futur, accessible aujourd'hui avec smartphone et NASA !"

**Illustration** :
- Champ divisé zones couleurs (besoins différents)
- Drone + satellite + smartphone

**Quiz Validation :**
1. Agriculture précision économise ? → **30% engrais** ✓
2. Outils ? → **GPS, capteurs, drones** ✓

**Déblocage** : Score >900 atteint

---

### CARTES THÉMATIQUES TRANSVERSALES

#### Carte 9 : Changement Climatique & Adaptation
**Titre** : "S'adapter pour survivre"

**Contenu Audio (3 min) :**
> "Climat change : pluies irrégulières, chaleurs extrêmes. Solutions : 1) Variétés résistantes sécheresse, 2) Paillage (garde humidité), 3) Agroforesterie (arbres = ombre), 4) Micro-irrigation goutte-à-goutte. Agriculture résiliente = votre assurance futur !"

**Illustration** :
- Thermomètre montant + nuage sec
- 4 solutions illustrées

**Déblocage** : Après 1er échec stress thermique

---

#### Carte 10 : Agriculture Biologique
**Titre** : "Cultiver sain, vendre cher"

**Contenu Audio (3 min) :**
> "Bio = sans chimie synthétique. Avantages : santé, environnement, prix +30-50% ! Techniques : compost (engrais naturel), associations plantes (maïs-niébé-courge), pièges insectes, extraits plantes (neem). Certification bio = passeport pour marchés premium !"

**Illustration** :
- Logo bio
- Compost → plante saine → marché premium

**Déblocage** : Score cumulé 5000 points

---

### 📊 RÉCAPITULATIF CARTES

| Carte | Niveau | Titre | Temps Audio | Déblocage |
|-------|--------|-------|-------------|-----------|
| 1 | Débutant | Cycle de l'eau | 2 min | 2 succès maïs |
| 2 | Débutant | NPK expliqué | 2 min | 3 succès niébé |
| 3 | Débutant | pH du sol | 2 min | 1er échec pH |
| 4 | Intermédiaire | Rotation cultures | 3 min | 2 cultures complètes |
| 5 | Intermédiaire | Fractionnement NPK | 3 min | Niveau 4 complété |
| 6 | Intermédiaire | Satellites NASA | 3 min | Utilisation données |
| 7 | Expert | Gestion parasites | 4 min | Niveau 6 complété |
| 8 | Expert | Agriculture précision | 4 min | Score >900 |
| 9 | Thématique | Climat adaptation | 3 min | Stress thermique |
| 10 | Thématique | Agriculture bio | 3 min | 5000 pts cumulés |

---

## 5. FORMAT JSON SUGGÉRÉ

### Structure de Base : crops-database.json

```json
{
  "version": "1.0",
  "lastUpdate": "2025-10-04",
  "source": "Données compilées - recherches agricoles 2024-2025",
  "crops": [
    {
      "id": "wheat",
      "names": {
        "fr": "Blé",
        "en": "Wheat",
        "local": {
          "fon": "Blé",
          "wolof": "Mburu blé"
        }
      },
      "category": "cereal",
      "icon": "/assets/icons/wheat.svg",
      "difficulty": 3,
      "yields": {
        "min": 3.0,
        "average": 6.2,
        "max": 10.0,
        "unit": "t/ha",
        "context": {
          "africa": 2.5,
          "benin": 2.0,
          "france": 6.5
        }
      },
      "growth": {
        "durationDays": {
          "min": 90,
          "typical": 110,
          "max": 130
        },
        "stages": [
          {
            "name": "germination",
            "days": 10,
            "description": "Émergence des plantules"
          },
          {
            "name": "tallage",
            "days": 30,
            "description": "Développement des tiges"
          },
          {
            "name": "montaison",
            "days": 25,
            "description": "Élongation des tiges"
          },
          {
            "name": "épiaison",
            "days": 20,
            "description": "Formation des épis"
          },
          {
            "name": "maturation",
            "days": 25,
            "description": "Remplissage des grains"
          }
        ]
      },
      "waterRequirements": {
        "totalMm": 350,
        "criticalStages": ["épiaison", "remplissage grains"],
        "irrigationStrategy": "2-3 apports si pluvio < 300mm",
        "droughtTolerance": "medium"
      },
      "nutrients": {
        "NPK": {
          "N": {
            "min": 120,
            "optimal": 150,
            "max": 180,
            "unit": "kg/ha",
            "splitApplications": 2,
            "timing": ["semis", "tallage"]
          },
          "P": {
            "min": 20,
            "optimal": 30,
            "max": 40,
            "unit": "kg/ha",
            "splitApplications": 1,
            "timing": ["semis"]
          },
          "K": {
            "min": 40,
            "optimal": 60,
            "max": 80,
            "unit": "kg/ha",
            "splitApplications": 1,
            "timing": ["semis"]
          }
        },
        "micronutrients": ["S", "Zn"],
        "organicAlternatives": {
          "compost": "20-30 t/ha",
          "manure": "15-25 t/ha"
        }
      },
      "climate": {
        "temperature": {
          "min": 5,
          "optimal": 20,
          "max": 30,
          "unit": "°C",
          "criticalPhases": {
            "germination": "10-15°C",
            "floraison": "18-24°C"
          }
        },
        "rainfall": {
          "min": 300,
          "optimal": 450,
          "max": 750,
          "unit": "mm"
        },
        "sunlight": "full",
        "usdaZones": ["7a", "7b", "8a", "8b", "9a", "9b", "10a", "10b"]
      },
      "soil": {
        "pH": {
          "min": 5.5,
          "optimal": 6.5,
          "max": 7.5
        },
        "types": ["limoneux", "argileux"],
        "texture": "profond et bien drainé",
        "organicMatter": "2-4%"
      },
      "practices": {
        "rotation": {
          "previous": ["légumineuses", "prairies"],
          "following": ["maïs", "tournesol"],
          "avoidAfter": ["blé", "orge"]
        },
        "seedingRate": "150-220 kg/ha",
        "rowSpacing": "15-20 cm",
        "depth": "3-5 cm",
        "weedControl": "précoce et régulier",
        "diseaseRisks": ["rouille", "septoriose", "fusariose"]
      },
      "economics": {
        "costPerHa": {
          "seeds": 80,
          "fertilizers": 150,
          "pesticides": 100,
          "labor": 200,
          "total": 530,
          "currency": "EUR"
        },
        "revenue": {
          "pricePerTon": 200,
          "expectedRevenue": 1240,
          "netProfit": 710,
          "currency": "EUR"
        }
      },
      "educational": {
        "level": "intermediate",
        "funFacts": [
          "Le blé est cultivé depuis 10,000 ans !",
          "1 épi de blé = 40-50 grains",
          "Le blé couvre 17% des terres cultivées mondiales"
        ],
        "commonMistakes": [
          "Semer trop profond (>5cm)",
          "Négliger désherbage précoce",
          "Sur-fertilisation azotée (verse)"
        ]
      },
      "media": {
        "images": [
          "/assets/images/wheat-plant.jpg",
          "/assets/images/wheat-field.jpg",
          "/assets/images/wheat-harvest.jpg"
        ],
        "audio": {
          "fr": "/assets/audio/wheat-fr.mp3",
          "fon": "/assets/audio/wheat-fon.mp3"
        },
        "video": "https://youtube.com/watch?v=wheat-growing"
      }
    },
    {
      "id": "maize",
      "names": {
        "fr": "Maïs",
        "en": "Maize/Corn",
        "local": {
          "fon": "Gbado",
          "wolof": "Mburu",
          "bambara": "Kaba"
        }
      },
      "category": "cereal",
      "icon": "/assets/icons/maize.svg",
      "difficulty": 2,
      "yields": {
        "min": 1.5,
        "average": 6.0,
        "max": 12.0,
        "unit": "t/ha",
        "context": {
          "africa": 2.2,
          "benin": 1.3,
          "france": 8.9
        }
      },
      "growth": {
        "durationDays": {
          "min": 85,
          "typical": 120,
          "max": 145
        },
        "stages": [
          {"name": "VE", "days": 5, "description": "Émergence"},
          {"name": "V6", "days": 30, "description": "6 feuilles"},
          {"name": "VT", "days": 25, "description": "Floraison mâle"},
          {"name": "R1", "days": 5, "description": "Soies"},
          {"name": "R3", "days": 20, "description": "Grain laiteux"},
          {"name": "R6", "days": 35, "description": "Maturité"}
        ]
      },
      "waterRequirements": {
        "totalMm": 650,
        "criticalStages": ["VT-R1", "R1-R3"],
        "irrigationStrategy": "Maintenir 60-80% capacité champ",
        "droughtTolerance": "medium-low"
      },
      "nutrients": {
        "NPK": {
          "N": {
            "min": 120,
            "optimal": 160,
            "max": 200,
            "unit": "kg/ha",
            "splitApplications": 3,
            "timing": ["semis", "V6", "VT"]
          },
          "P": {
            "min": 60,
            "optimal": 80,
            "max": 100,
            "unit": "kg/ha",
            "splitApplications": 1,
            "timing": ["semis"]
          },
          "K": {
            "min": 80,
            "optimal": 100,
            "max": 120,
            "unit": "kg/ha",
            "splitApplications": 1,
            "timing": ["semis"]
          }
        },
        "micronutrients": ["Zn", "Mg"],
        "organicAlternatives": {
          "compost": "25-35 t/ha",
          "manure": "20-30 t/ha"
        }
      },
      "climate": {
        "temperature": {
          "min": 10,
          "optimal": 25,
          "max": 35,
          "unit": "°C",
          "criticalPhases": {
            "germination": "21°C minimum sol",
            "floraison": "25-28°C"
          }
        },
        "rainfall": {
          "min": 500,
          "optimal": 650,
          "max": 900,
          "unit": "mm"
        },
        "sunlight": "full",
        "usdaZones": ["9b", "10a", "10b"]
      },
      "soil": {
        "pH": {
          "min": 5.5,
          "optimal": 6.0,
          "max": 6.5
        },
        "types": ["limoneux", "argilo-limoneux"],
        "texture": "profond, riche en MO",
        "organicMatter": "3-5%"
      },
      "practices": {
        "rotation": {
          "previous": ["légumineuses", "prairies"],
          "following": ["blé", "soja"],
          "avoidAfter": ["maïs"]
        },
        "seedingRate": "60,000-75,000 grains/ha",
        "rowSpacing": "75-80 cm",
        "depth": "4-6 cm",
        "weedControl": "précoce crucial (1-3 feuilles)",
        "diseaseRisks": ["pyrale", "helminthosporiose"]
      },
      "educational": {
        "level": "beginner",
        "funFacts": [
          "Culture associée traditionnelle : maïs-niébé-courge (3 sœurs)",
          "Chaque épi = 400-600 grains",
          "Origine : Mexique il y a 9,000 ans"
        ],
        "commonMistakes": [
          "Planter avant sol à 21°C",
          "Négliger irrigation floraison",
          "Densité trop faible ou trop élevée"
        ]
      }
    }
  ],
  "learningCards": [
    {
      "id": "card_water_cycle",
      "level": "beginner",
      "title": {
        "fr": "Le Cycle de l'Eau",
        "en": "Water Cycle"
      },
      "content": {
        "text": "L'eau est absorbée par les racines, monte par la tige, et s'évapore par les feuilles (transpiration). Trop d'eau = asphyxie racinaire. Pas assez = flétrissement.",
        "audioUrl": "/assets/audio/cards/water-cycle-fr.mp3",
        "duration": 120
      },
      "illustration": "/assets/images/cards/water-cycle.svg",
      "quiz": [
        {
          "question": "Par où entre l'eau ?",
          "options": ["Feuilles", "Racines", "Tige"],
          "correct": 1
        }
      ],
      "unlockCondition": {
        "type": "successes",
        "crop": "maize",
        "count": 2
      }
    }
  ],
  "gameLevels": [
    {
      "id": 1,
      "name": "Apprenti Agriculteur",
      "crop": "maize",
      "difficulty": "beginner",
      "unlockCost": 0,
      "targetYield": {
        "min": 3.0,
        "good": 4.0,
        "excellent": 5.0,
        "unit": "t/ha"
      },
      "parameters": {
        "irrigation": "simplified",
        "npk": "fixed_dose",
        "pH": "auto"
      },
      "rewards": {
        "baseCoins": 50,
        "bonusExcellent": 30,
        "xp": 100
      }
    },
    {
      "id": 2,
      "name": "Cultivateur",
      "crop": "cowpea",
      "difficulty": "beginner",
      "unlockCost": 100,
      "targetYield": {
        "min": 0.8,
        "good": 1.2,
        "excellent": 1.5,
        "unit": "t/ha"
      },
      "parameters": {
        "irrigation": "simplified",
        "npk": "split_2",
        "pH": "manual"
      },
      "rewards": {
        "baseCoins": 70,
        "bonusExcellent": 40,
        "xp": 150
      }
    }
  ]
}
```

---

### Structure : game-objectives.json

```json
{
  "difficulties": {
    "beginner": {
      "name": "Débutant",
      "yieldTarget": "60-70%",
      "parameters": ["irrigation_simple", "npk_fixe"],
      "scoreRange": [500, 700],
      "crops": ["maize", "cowpea", "beans"]
    },
    "intermediate": {
      "name": "Intermédiaire",
      "yieldTarget": "75-85%",
      "parameters": ["irrigation_weather", "npk_split", "pH_adjust"],
      "scoreRange": [700, 850],
      "crops": ["rice", "potato", "tomato", "cassava"]
    },
    "expert": {
      "name": "Expert",
      "yieldTarget": "90-100%",
      "parameters": ["precision_irrigation", "custom_npk", "dynamic_pH", "ipm"],
      "scoreRange": [900, 1000],
      "crops": ["wheat", "hybrid_maize", "intensive_rice"]
    }
  },
  "scoreCalculation": {
    "formula": "(yield/optimal)*800 + water_efficiency*100 + npk_efficiency*100 - stress*50",
    "maxScore": 1000,
    "components": {
      "yieldRatio": {"weight": 0.8, "max": 800},
      "waterEfficiency": {"weight": 0.1, "max": 100},
      "npkEfficiency": {"weight": 0.1, "max": 100},
      "stressPenalty": {"value": -50, "perIncident": true}
    }
  }
}
```

---

## 6. SOURCES DE DONNÉES

### 📚 Sources Principales

#### Rendements Agricoles
1. **FAO - Organisation des Nations Unies pour l'Alimentation et l'Agriculture**
   - Base de données FAOSTAT
   - URL: https://www.fao.org/faostat/
   - Données utilisées : Rendements moyens par pays et culture

2. **Our World in Data - Crop Yields**
   - URL: https://ourworldindata.org/crop-yields
   - Données : Évolution rendements mondiaux 1961-2024

3. **Banque Mondiale - Indicateurs Agricoles**
   - URL: https://donnees.banquemondiale.org/indicateur/AG.YLD.CREL.KG
   - Données : Rendements céréales par pays

4. **INSTAD Bénin - Statistiques Agricoles**
   - Document : Résultats définitifs campagne 2023
   - Données : Rendements spécifiques Bénin

#### Pratiques Agronomiques
5. **Wikifarmer - Agricultural Knowledge Base**
   - URL: https://wikifarmer.com
   - Guides : Wheat, Potato, Cassava fertilization

6. **EOS Data Analytics - Crop Management Guides**
   - URL: https://eos.com/crop-management-guide/
   - Guides : Wheat, Rice, Potato growth stages

7. **IRRI - International Rice Research Institute**
   - URL: http://www.knowledgebank.irri.org/
   - Données : Rice cultivation, NPK calculator

#### Conditions Climatiques
8. **USDA Extension Services**
   - Multiples états (Minnesota, Ohio, SDSU)
   - Données : Optimal growing conditions

9. **Rodale Institute - Organic Farming**
   - URL: https://rodaleinstitute.org
   - Données : Crop rotation, organic practices

10. **SARE - Sustainable Agriculture Research**
    - URL: https://www.sare.org
    - Manuel : Crop Rotation on Organic Farms

#### Données NASA (Intégration Future)
11. **NASA AppEEARS**
    - Produits : SMAP (humidité), MODIS (NDVI, température)
    - Note : Limiter usage comme demandé

12. **GPM - Global Precipitation Measurement**
    - Données précipitations temps réel

---

### 🔬 Méthodologie de Compilation

**Critères de Sélection des Données :**
1. ✅ **Fiabilité** : Sources académiques, gouvernementales, ONG reconnues
2. ✅ **Actualité** : Priorité données 2023-2025
3. ✅ **Contextualisation** : Données Afrique/Bénin privilégiées
4. ✅ **Réalisme** : Fourchettes larges (min-moy-max) pour diversité conditions
5. ✅ **Pédagogie** : Simplification sans dénaturation scientifique

**Traitement des Données :**
- Conversion unités : Bushels → tonnes, inches → mm, °F → °C
- Agrégation : Moyennes sur 3-5 ans (lisser variations annuelles)
- Validation croisée : 2-3 sources par donnée clé

---

### 📊 Limitations et Notes

**Limitations Identifiées :**
1. **Variabilité géographique** : Rendements varient selon zone (données moyennées)
2. **Variétés** : Données moyennes (variétés locales vs améliorées différentes)
3. **Année climatique** : 2024 exceptionnelle (sécheresses) ≠ moyennes historiques
4. **Pratiques** : Données conventionnelles (bio/traditionnel peut différer)

**Adaptations Suggérées :**
- Permettre ajustement régional dans jeu (Bénin, Sénégal, Mali)
- Offrir choix variétés (locale/améliorée) avec rendements différents
- Intégrer météo aléatoire (sécheresse, inondation) pour réalisme

---

### 📝 Crédits et Citations

**Comment citer ces données dans l'application :**

```
Pied de page application :
"Données agricoles compilées depuis FAO, Our World in Data, INSTAD Bénin,
Wikifarmer, EOS, IRRI, USDA Extension Services, Rodale Institute, SARE (2023-2025).
Données satellites NASA : SMAP, MODIS, GPM (utilisation limitée)."
```

**Page "À Propos" détaillée :**
```markdown
# Sources de Données

Les informations agricoles de IleRise proviennent de sources scientifiques fiables :

**Rendements et Statistiques**
- FAO (Organisation des Nations Unies pour l'Alimentation)
- Banque Mondiale (Indicateurs de développement)
- INSTAD Bénin (Institut National de la Statistique)
- Our World in Data (Université d'Oxford)

**Pratiques Agronomiques**
- Wikifarmer (Guides de culture)
- EOS Data Analytics (Gestion des cultures)
- IRRI (Institut International de Recherche sur le Riz)
- USDA Extension (Services agricoles USA)

**Agriculture Durable**
- Rodale Institute (Agriculture biologique)
- SARE (Recherche agriculture durable)

**Données Environnementales (usage limité)**
- NASA SMAP, MODIS, GPM

Dernière mise à jour : Octobre 2025
```

---

## 📈 UTILISATION DES DONNÉES

### Implémentation dans le Jeu

**Étape 1 : Charger les Données**
```javascript
// main.js
async function loadCropsDatabase() {
  const response = await fetch('/public/data/crops-database.json');
  const cropsData = await response.json();
  return cropsData;
}
```

**Étape 2 : Calculer Rendement (Simulation)**
```javascript
function calculateYield(crop, waterLevel, npk, pH, temperature) {
  const cropData = cropsDatabase.crops.find(c => c.id === crop);

  // Facteurs de stress (0-1)
  const waterStress = calculateWaterStress(waterLevel, cropData.waterRequirements);
  const nutrientStress = calculateNutrientStress(npk, cropData.nutrients.NPK);
  const pHStress = calculatePHStress(pH, cropData.soil.pH);
  const tempStress = calculateTempStress(temperature, cropData.climate.temperature);

  // Rendement potentiel
  const potentialYield = cropData.yields.max;

  // Rendement réel
  const actualYield = potentialYield * waterStress * nutrientStress * pHStress * tempStress;

  return {
    actual: actualYield,
    potential: potentialYield,
    percentage: (actualYield / potentialYield) * 100,
    stresses: { waterStress, nutrientStress, pHStress, tempStress }
  };
}
```

**Étape 3 : Afficher Résultats**
```javascript
function displayResults(result) {
  const score = calculateScore(result);
  const stars = getStars(result.percentage);
  const coins = Math.floor(score / 10);

  UI.showResults({
    yield: `${result.actual.toFixed(1)} t/ha`,
    score: score,
    stars: stars,
    coins: coins,
    message: getEncouragementMessage(result.percentage)
  });
}
```

---

## 🎯 CONCLUSION

### Résumé des Données Compilées

✅ **10 cultures documentées** avec données réalistes
✅ **Rendements min-moy-max** basés sur sources fiables
✅ **Temps de croissance** (60-365 jours selon culture)
✅ **Besoins NPK détaillés** (kg/ha, fractionnement)
✅ **Conditions optimales** (T°, pH, eau, sol)
✅ **Pratiques recommandées** (rotation, espacement, etc.)
✅ **10 cartes de savoir** (débutant → expert)
✅ **3 niveaux de difficulté** avec objectifs clairs
✅ **Format JSON structuré** prêt pour implémentation
✅ **Sources tracées** (12 références académiques/gouvernementales)

### Prochaines Étapes Recommandées

1. **Créer fichier JSON** : `crops-database.json` avec structure complète
2. **Développer moteur simulation** : Intégrer calculs rendement
3. **Enregistrer audio** : 10 cartes x 3 langues = 30 fichiers
4. **Designer icônes** : 10 cultures + paramètres (eau, NPK, pH)
5. **Tester équilibrage** : Ajuster difficultés selon feedback joueurs

### Adaptabilité Future

Ce système de données permet :
- ✅ Ajout nouvelles cultures facilement (JSON modulaire)
- ✅ Adaptation contexte régional (Afrique, Asie, Amérique)
- ✅ Mise à jour annuelle (nouvelles données FAO)
- ✅ Extension variétés (locale vs hybride)
- ✅ Intégration changement climatique (scénarios)

---

**Document créé le : 2025-10-04**
**Par : Claude Code (Assistant IA)**
**Pour : Projet IleRise - NASA Space Apps Challenge 2025**
