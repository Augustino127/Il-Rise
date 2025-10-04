"""
Conversion données SMAP (humidité des sols) GeoTIFF → JSON
IleRise - NASA Space Apps Challenge 2025

Usage:
    python convert_smap_to_json.py
"""

import rasterio
from rasterio.warp import transform as warp_transform
from rasterio.crs import CRS
import json
import csv
from pathlib import Path
from datetime import datetime
import re
import numpy as np

# Configuration
RAW_DATA_DIR = Path(r"C:\Projet\ilerise-nasa\raw-nasa-data\soil-moisture")
OUTPUT_DIR = Path(r"C:\Projet\ilerise-nasa\public\data")
CSV_DIR = Path(r"C:\Projet\ilerise-nasa\public\data\csv")

# Villes du Bénin
CITIES = {
    "Cotonou": {"lat": 6.3667, "lon": 2.3833},
    "Porto-Novo": {"lat": 6.4969, "lon": 2.6289},
    "Parakou": {"lat": 9.3372, "lon": 2.6103},
    "Djougou": {"lat": 9.7084, "lon": 1.6660},
    "Bohicon": {"lat": 7.1782, "lon": 2.0667},
    "Natitingou": {"lat": 10.3045, "lon": 1.3797},
    "Abomey-Calavi": {"lat": 6.4489, "lon": 2.3553},
    "Kandi": {"lat": 11.1342, "lon": 2.9386}
}

# Couches SMAP prioritaires
PRIORITY_LAYERS = [
    "sm_surface",      # Humidité surface (0-5cm)
    "sm_rootzone"      # Humidité zone racinaire (0-100cm)
]

def get_pixel_value(dataset, lon, lat):
    """Extraire la valeur d'un pixel pour des coordonnées lat/lon"""
    try:
        # Transformer coordonnées WGS84 vers projection du dataset
        xs, ys = warp_transform(
            CRS.from_epsg(4326),  # Source: WGS84
            dataset.crs,          # Destination: projection SMAP
            [lon],
            [lat]
        )

        # Obtenir indices de pixel
        row, col = dataset.index(xs[0], ys[0])

        # Lire la valeur
        window = rasterio.windows.Window(col, row, 1, 1)
        data = dataset.read(1, window=window)

        value = data[0, 0]

        # Valeurs invalides SMAP
        if value == dataset.nodata or np.isnan(value) or value < 0 or value > 1:
            return None

        return value

    except Exception as e:
        return None

def convert_smap_value(raw_value):
    """Convertir valeur SMAP en pourcentage"""
    if raw_value is None:
        return None

    # SMAP valeurs en m³/m³ (0.0 - 1.0)
    # Convertir en pourcentage
    percentage = round(raw_value * 100, 2)

    return percentage

def interpret_soil_moisture(moisture_percent):
    """Interpréter humidité du sol pour agriculteurs"""
    if moisture_percent is None:
        return {
            "status": "unknown",
            "description": "Données non disponibles",
            "recommendation": "Vérifier manuellement",
            "color": "gray"
        }

    if moisture_percent < 10:
        return {
            "status": "very_dry",
            "description": "Sol très sec",
            "recommendation": "Irrigation urgente nécessaire",
            "color": "brown"
        }
    elif moisture_percent < 20:
        return {
            "status": "dry",
            "description": "Sol sec",
            "recommendation": "Irrigation recommandée",
            "color": "orange"
        }
    elif moisture_percent < 30:
        return {
            "status": "moderate",
            "description": "Humidité modérée",
            "recommendation": "Surveiller, irrigation possible",
            "color": "yellow"
        }
    elif moisture_percent < 40:
        return {
            "status": "good",
            "description": "Bonne humidité",
            "recommendation": "Niveau optimal pour la plupart des cultures",
            "color": "lightgreen"
        }
    else:
        return {
            "status": "saturated",
            "description": "Sol saturé",
            "recommendation": "Risque d'excès d'eau, drainage nécessaire",
            "color": "blue"
        }

def extract_date_from_filename(filename):
    """Extraire date du nom de fichier AppEEARS"""
    # SPL4SMGP.008_Soil_Moisture_doy2025001000000_aid0001.tif
    try:
        parts = filename.split('_doy')
        if len(parts) < 2:
            return None

        date_part = parts[1].split('_')[0]

        year = int(date_part[:4])
        day_of_year = int(date_part[4:7])

        date = datetime.strptime(f"{year}-{day_of_year}", "%Y-%j")
        return date.strftime("%Y-%m-%d")
    except:
        return None

def identify_layer_type(filename):
    """Identifier le type de couche SMAP"""
    filename_lower = filename.lower()

    for layer in PRIORITY_LAYERS:
        if layer in filename_lower:
            return layer

    return "other"

def process_smap_data():
    """Traiter tous les fichiers SMAP"""

    print("\n" + "=" * 60)
    print("  CONVERSION SMAP → JSON")
    print("  IleRise - NASA Space Apps Challenge 2025")
    print("=" * 60)

    if not RAW_DATA_DIR.exists():
        print(f"\n❌ Répertoire introuvable : {RAW_DATA_DIR}")
        print("   Assurez-vous que les fichiers SMAP sont téléchargés.")
        return

    # Trouver tous les fichiers GeoTIFF
    tif_files = list(RAW_DATA_DIR.glob("*.tif"))

    if not tif_files:
        print(f"\n❌ Aucun fichier .tif trouvé dans {RAW_DATA_DIR}")
        return

    print(f"\n📂 Fichiers trouvés : {len(tif_files)}")

    # Grouper par type de couche
    layer_files = {layer: [] for layer in PRIORITY_LAYERS}
    other_files = []

    for file in tif_files:
        layer_type = identify_layer_type(file.name)
        if layer_type in PRIORITY_LAYERS:
            layer_files[layer_type].append(file)
        else:
            other_files.append(file)

    print(f"\n🎯 Couches prioritaires détectées :")
    for layer in PRIORITY_LAYERS:
        count = len(layer_files[layer])
        print(f"   {layer:20} : {count} fichiers")

    if other_files:
        print(f"   Autres couches         : {len(other_files)} fichiers (ignorés)")

    # Traiter chaque couche prioritaire
    results = {}

    for layer in PRIORITY_LAYERS:
        files = layer_files[layer]

        if not files:
            print(f"\n⚠️  Aucun fichier pour {layer}")
            continue

        print(f"\n{'=' * 60}")
        print(f"  Traitement : {layer.upper()}")
        print(f"{'=' * 60}")

        layer_data = process_layer(layer, files)
        if layer_data:
            results[layer] = layer_data

    # Créer fichiers de sortie
    if results:
        create_json_output(results)
        create_csv_output(results)
    else:
        print("\n❌ Aucune donnée extraite")

def process_layer(layer_name, files):
    """Traiter une couche SMAP spécifique"""

    layer_data = {
        "layer": layer_name,
        "description": get_layer_description(layer_name),
        "unit": "percent",
        "source": "SMAP SPL4SMGP.008",
        "locations": []
    }

    # Structure pour stocker données par ville
    city_data = {city: {"dates": []} for city in CITIES.keys()}

    # Traiter chaque fichier
    for file_path in files:
        date = extract_date_from_filename(file_path.name)

        if not date:
            print(f"   ⚠️  Date non trouvée : {file_path.name}")
            continue

        print(f"\n   📅 {date} - {file_path.name}")

        try:
            with rasterio.open(file_path) as dataset:
                print(f"      Projection : {dataset.crs}")

                for city_name, coords in CITIES.items():
                    raw_value = get_pixel_value(dataset, coords['lon'], coords['lat'])
                    moisture_percent = convert_smap_value(raw_value)

                    if moisture_percent is not None:
                        interpretation = interpret_soil_moisture(moisture_percent)

                        city_data[city_name]["dates"].append({
                            "date": date,
                            "moisture_percent": moisture_percent,
                            "status": interpretation["status"],
                            "description": interpretation["description"],
                            "recommendation": interpretation["recommendation"]
                        })

                        print(f"      ✅ {city_name:15} : {moisture_percent:5.1f}% - {interpretation['status']}")
                    else:
                        print(f"      ⚠️  {city_name:15} : Pas de données")

        except Exception as e:
            print(f"      ❌ Erreur : {e}")

    # Calculer statistiques par ville
    for city_name, coords in CITIES.items():
        dates_data = city_data[city_name]["dates"]

        if not dates_data:
            continue

        # Trier par date
        dates_data.sort(key=lambda x: x["date"])

        # Calculer moyennes
        moisture_values = [d["moisture_percent"] for d in dates_data]
        avg_moisture = sum(moisture_values) / len(moisture_values)
        min_moisture = min(moisture_values)
        max_moisture = max(moisture_values)
        current_moisture = moisture_values[-1]  # Dernière valeur

        layer_data["locations"].append({
            "city": city_name,
            "country": "Benin",
            "latitude": coords["lat"],
            "longitude": coords["lon"],
            "moisture": {
                "current_percent": round(current_moisture, 2),
                "average_percent": round(avg_moisture, 2),
                "min_percent": round(min_moisture, 2),
                "max_percent": round(max_moisture, 2)
            },
            "current_status": interpret_soil_moisture(current_moisture),
            "timeseries": dates_data
        })

    cities_with_data = len(layer_data["locations"])
    print(f"\n   ✅ {cities_with_data} villes avec données pour {layer_name}")

    return layer_data if cities_with_data > 0 else None

def get_layer_description(layer_name):
    """Description de la couche SMAP"""
    descriptions = {
        "sm_surface": "Humidité du sol en surface (0-5cm)",
        "sm_rootzone": "Humidité du sol en zone racinaire (0-100cm)"
    }
    return descriptions.get(layer_name, layer_name)

def create_json_output(results):
    """Créer fichier JSON de sortie"""

    output_data = {
        "source": "SMAP SPL4SMGP.008",
        "product": "Soil Moisture",
        "region": "Benin",
        "lastUpdate": datetime.now().strftime("%Y-%m-%d"),
        "layers": results
    }

    json_file = OUTPUT_DIR / "nasa-smap-benin.json"
    json_file.parent.mkdir(parents=True, exist_ok=True)

    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"\n{'=' * 60}")
    print(f"✅ JSON créé : {json_file}")
    print(f"📊 {len(results)} couches traitées")

    # Résumé
    print(f"\n📊 Résumé humidité du sol :")
    for layer_name, layer_data in results.items():
        print(f"\n   {get_layer_description(layer_name)} :")
        for loc in layer_data["locations"]:
            city = loc["city"]
            current = loc["moisture"]["current_percent"]
            status = loc["current_status"]["status"]
            print(f"      {city:20} : {current:5.1f}% - {status}")

def create_csv_output(results):
    """Créer fichier CSV de sortie"""

    csv_file = CSV_DIR / "nasa-smap-benin.csv"
    csv_file.parent.mkdir(parents=True, exist_ok=True)

    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)

        # En-tête
        writer.writerow([
            'Layer', 'Layer_Description', 'City', 'Country',
            'Latitude', 'Longitude', 'Date', 'Moisture_Percent',
            'Status', 'Description', 'Recommendation',
            'Current_Percent', 'Average_Percent', 'Min_Percent', 'Max_Percent'
        ])

        # Données
        for layer_name, layer_data in results.items():
            layer_desc = layer_data["description"]

            for location in layer_data["locations"]:
                city = location["city"]
                country = location["country"]
                lat = location["latitude"]
                lon = location["longitude"]
                moisture_stats = location["moisture"]

                for ts in location["timeseries"]:
                    writer.writerow([
                        layer_name, layer_desc, city, country,
                        lat, lon,
                        ts["date"], ts["moisture_percent"],
                        ts["status"], ts["description"], ts["recommendation"],
                        moisture_stats["current_percent"],
                        moisture_stats["average_percent"],
                        moisture_stats["min_percent"],
                        moisture_stats["max_percent"]
                    ])

    num_rows = sum(1 for _ in open(csv_file, encoding='utf-8')) - 1
    print(f"✅ CSV créé : {csv_file.name} ({num_rows} lignes)")

if __name__ == "__main__":
    # Installer dépendances si nécessaire
    try:
        import rasterio
        import numpy
    except ImportError:
        print("Installation des dépendances...")
        import subprocess
        subprocess.check_call(['pip', 'install', '--user', 'rasterio', 'numpy'])
        import rasterio
        import numpy

    # Traiter données
    process_smap_data()

    print("\n" + "=" * 60)
    print("  ✅ CONVERSION TERMINÉE !")
    print("=" * 60)
