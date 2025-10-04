"""
Script de conversion des données NASA GeoTIFF vers JSON
Pour le projet IleRise - NASA Space Apps Challenge 2025

Usage:
    python convert_nasa_geotiff.py

Requis:
    pip install rasterio numpy
"""

import rasterio
import numpy as np
import json
from pathlib import Path
import glob
from datetime import datetime

# Configuration
INPUT_DIR = r"C:\Projet\ilerise-nasa\raw-nasa-data\temperature"  # Dossier avec vos GeoTIFF
OUTPUT_FILE = r"C:\Projet\ilerise-nasa\public\data\nasa-temperature-benin.json"

# Villes principales du Bénin (coordonnées GPS)
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

def kelvin_to_celsius(kelvin_value):
    """Convertir Kelvin en Celsius"""
    if kelvin_value == 0 or kelvin_value is None or np.isnan(kelvin_value):
        return None
    # Les données MODIS sont multipliées par 50 (scale factor = 0.02)
    # Formule: Celsius = (value * 0.02) - 273.15
    celsius = (kelvin_value * 0.02) - 273.15
    return round(celsius, 2)

def get_pixel_value(dataset, lon, lat):
    """Extraire la valeur d'un pixel pour des coordonnées lat/lon"""
    try:
        # Rasterio gère automatiquement la transformation
        # Pour MODIS Sinusoidal, on doit transformer lat/lon -> projection native
        from rasterio.warp import transform as warp_transform
        from rasterio.crs import CRS

        # Transformer lat/lon (EPSG:4326) vers la projection du raster
        xs, ys = warp_transform(
            CRS.from_epsg(4326),  # Source: WGS84 lat/lon
            dataset.crs,           # Destination: Sinusoidal
            [lon],                 # Longitude
            [lat]                  # Latitude
        )

        # Convertir coordonnées projetées en pixel row/col
        row, col = dataset.index(xs[0], ys[0])

        # Vérifier que c'est dans les limites du raster
        if row < 0 or row >= dataset.height or col < 0 or col >= dataset.width:
            return None

        # Lire la valeur
        data = dataset.read(1)
        value = data[row, col]

        # Vérifier si c'est une valeur valide (pas fill value)
        if value == dataset.nodata or value == 0:
            return None

        return value
    except Exception as e:
        # print(f"   Erreur extraction pixel: {e}")
        return None

def extract_date_from_filename(filename):
    """Extraire la date du nom de fichier NASA
    Format: MOD11A2.061_LST_Day_1km_doy2025001000000_aid0001.tif
    """
    try:
        # Extraire doy2025001000000 (année + jour julien + timestamp)
        parts = filename.split('_doy')
        if len(parts) < 2:
            return None

        date_part = parts[1].split('_')[0]  # 2025001000000
        year = int(date_part[:4])  # 2025
        day_of_year = int(date_part[4:7])  # 001

        # Convertir jour julien en date
        date = datetime.strptime(f"{year}-{day_of_year}", "%Y-%j")
        return date.strftime("%Y-%m-%d")
    except Exception as e:
        print(f"   Erreur parsing date '{filename}': {e}")
        return None

def process_temperature_data():
    """Traiter tous les fichiers GeoTIFF de température"""

    print("🔍 Recherche des fichiers GeoTIFF...")

    # Trouver tous les fichiers LST_Day (température jour)
    tif_files = glob.glob(f"{INPUT_DIR}/*LST_Day_1km*.tif")

    if not tif_files:
        print(f"❌ Aucun fichier GeoTIFF trouvé dans {INPUT_DIR}")
        print(f"   Assurez-vous d'avoir extrait les fichiers .tif dans ce dossier")
        return

    print(f"✅ {len(tif_files)} fichiers trouvés")

    # Structure pour stocker les données
    temperature_data = {}

    for city_name, coords in CITIES.items():
        temperature_data[city_name] = {
            "latitude": coords["lat"],
            "longitude": coords["lon"],
            "temperatures": []
        }

    # Traiter chaque fichier
    for tif_path in sorted(tif_files):
        filename = Path(tif_path).name
        date = extract_date_from_filename(filename)

        if not date:
            print(f"⚠️  Date non trouvée dans {filename}")
            continue

        print(f"📊 Traitement: {filename} ({date})")

        try:
            with rasterio.open(tif_path) as dataset:
                for city_name, coords in CITIES.items():
                    value = get_pixel_value(dataset, coords["lon"], coords["lat"])

                    if value is not None:
                        temp_celsius = kelvin_to_celsius(value)

                        if temp_celsius is not None:
                            temperature_data[city_name]["temperatures"].append({
                                "date": date,
                                "temperature_c": temp_celsius,
                                "raw_value": int(value)
                            })
        except Exception as e:
            print(f"❌ Erreur avec {filename}: {e}")

    # Calculer températures moyennes par ville
    result = {
        "source": "NASA MODIS MOD11A2.061",
        "product": "Land Surface Temperature (8-Day)",
        "resolution": "1km",
        "region": "Benin",
        "dateRange": {
            "start": "2025-01-01",
            "end": "2025-01-31"
        },
        "lastUpdate": datetime.now().strftime("%Y-%m-%d"),
        "locations": []
    }

    for city_name, data in temperature_data.items():
        if data["temperatures"]:
            temps = [t["temperature_c"] for t in data["temperatures"]]
            avg_temp = round(sum(temps) / len(temps), 2)
            min_temp = round(min(temps), 2)
            max_temp = round(max(temps), 2)

            result["locations"].append({
                "city": city_name,
                "country": "Benin",
                "latitude": data["latitude"],
                "longitude": data["longitude"],
                "temperature": {
                    "average_c": avg_temp,
                    "min_c": min_temp,
                    "max_c": max_temp,
                    "current_c": temps[-1] if temps else None  # Dernière valeur
                },
                "timeseries": data["temperatures"][-5:]  # Garder 5 dernières dates
            })

    # Sauvegarder JSON
    output_path = Path(OUTPUT_FILE)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Conversion terminée !")
    print(f"📁 Fichier créé : {output_path}")
    print(f"📊 {len(result['locations'])} villes avec données")

    # Afficher aperçu
    print("\n📈 Aperçu des températures moyennes :")
    for loc in result["locations"]:
        city = loc["city"]
        temp = loc["temperature"]["average_c"]
        print(f"   {city:20} : {temp}°C")

if __name__ == "__main__":
    print("=" * 60)
    print("  CONVERSION DONNÉES NASA GEOTIFF → JSON")
    print("  IleRise - NASA Space Apps Challenge 2025")
    print("=" * 60)
    print()

    process_temperature_data()

    print("\n" + "=" * 60)
    print("  TERMINÉ !")
    print("=" * 60)
