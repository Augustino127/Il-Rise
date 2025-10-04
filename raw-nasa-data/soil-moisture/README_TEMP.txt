DONNÉES SMAP - STATUT TÉLÉCHARGEMENT
=====================================

Statut: EN ATTENTE (75% au dernier contrôle)

Fichiers temporaires créés:
- public/data/nasa-smap-benin.json (données par défaut)
- public/data/csv/nasa-smap-benin.csv (données par défaut)

Ces fichiers permettent à l'application de fonctionner pendant le téléchargement.

QUAND TÉLÉCHARGEMENT TERMINÉ:
1. Vérifier présence fichiers .tif dans ce dossier
2. Exécuter: python scripts/convert_smap_to_json.py
3. Les vrais fichiers SMAP remplaceront les temporaires

Valeurs temporaires utilisées:
- Humidité surface: 12-20% (saison sèche janvier)
- Sol généralement "sec" à "très sec"
- Recommandation: irrigation nécessaire

Ces valeurs sont réalistes pour le Bénin en janvier (saison sèche).
