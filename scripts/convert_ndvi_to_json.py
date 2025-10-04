"""
Conversion NDVI (Santé Végétation) GeoTIFF → JSON
NASA MODIS MOD13Q1 ou MOD13A1
IleRise - NASA Space Apps Challenge 2025

Usage:
    python convert_ndvi_to_json.py
"""

import rasterio
import numpy as np
import json
from pathlib import Path
import glob
from datetime import datetime
from rasterio.warp import transform as warp_transform
from rasterio.crs import CRS

# Configuration
INPUT_DIR = r"C:\Projet\ilerise-nasa\raw-nasa-data\ndvi"
OUTPUT_FILE = r"C:\Projet\ilerise-nasa\public\data\nasa-ndvi-benin.json"

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

def convert_ndvi_value(raw_value):
    """Convertir valeur NDVI brute en valeur normalisée

    MODIS NDVI : valeurs stockées en int16, multipliées par 10000
    Formule : NDVI = raw_value * 0.0001
    Plage valide : -1.0 à 1.0
    """
    if raw_value is None or raw_value <= -3000:  # Fill value
        return None

    ndvi = raw_value * 0.0001

    # Limiter à la plage valide
    if ndvi < -1.0 or ndvi > 1.0:
        return None

    return round(ndvi, 4)

def interpret_ndvi(ndvi_value):
    """Interpréter la valeur NDVI pour l'agriculteur"""
    if ndvi_value is None:
        return {"status": "unknown", "health": "Données manquantes", "color": "gray"}

    if ndvi_value < 0:
        return {"status": "water", "health": "Eau", "color": "blue"}
    elif ndvi_value < 0.2:
        return {"status": "bare", "health": "Sol nu / Très mauvaise", "color": "brown"}
    elif ndvi_value < 0.4:
        return {"status": "poor", "health": "Végétation faible", "color": "orange"}
    elif ndvi_value < 0.6:
        return {"status": "moderate", "health": "Bonne santé", "color": "lightgreen"}
    elif ndvi_value < 0.8:
        return {"status": "good", "health": "Excellente santé", "color": "green"}
    else:
        return {"status": "excellent", "health": "Végétation très dense", "color": "darkgreen"}

def get_pixel_value(dataset, lon, lat):
    """Extraire valeur pixel avec transformation de coordonnées"""
    try:
        # Transformer lat/lon vers projection du raster
        xs, ys = warp_transform(
            CRS.from_epsg(4326),
            dataset.crs,
            [lon],
            [lat]
        )

        row, col = dataset.index(xs[0], ys[0])

        if row < 0 or row >= dataset.height or col < 0 or col >= dataset.width:
            return None

        data = dataset.read(1)
        value = data[row, col]

        # Vérifier fill value
        if dataset.nodata and value == dataset.nodata:
            return None

        return value
    except:
        return None

def extract_date_from_filename(filename):
    """Extraire date du nom de fichier MODIS
    Formats possibles:
    - MOD13Q1.061__250m_16_days_NDVI_doy2025001000000_aid0001.tif
    - MOD13A1.061_NDVI_doy2025001_aid0001.tif
    """
    try:
        parts = filename.split('_doy')
        if len(parts) < 2:
            return None

        date_part = parts[1].split('_')[0]
        year = int(date_part[:4])
        day_of_year = int(date_part[4:7])

        date = datetime.strptime(f"{year}-{day_of_year}", "%Y-%j")
        return date.strftime("%Y-%m-%d")
    except Exception as e:
        print(f"   ⚠️  Erreur parsing date '{filename}': {e}")
        return None

def process_ndvi_data():
    """Traiter fichiers GeoTIFF NDVI"""

    print("🌱 Traitement NDVI (Santé Végétation)")
    print("=" * 60)

    # Chercher fichiers NDVI
    tif_files = glob.glob(f"{INPUT_DIR}/*NDVI*.tif")

    if not tif_files:
        print(f"❌ Aucun fichier NDVI trouvé dans {INPUT_DIR}")
        return None

    print(f"✅ {len(tif_files)} fichiers trouvés")

    # Structure données
    ndvi_data = {}
    for city_name, coords in CITIES.items():
        ndvi_data[city_name] = {
            "latitude": coords["lat"],
            "longitude": coords["lon"],
            "ndvi_values": []
        }

    # Traiter chaque fichier
    for tif_path in sorted(tif_files):
        filename = Path(tif_path).name
        date = extract_date_from_filename(filename)

        if not date:
            continue

        print(f"📊 Traitement: {filename} ({date})")

        try:
            with rasterio.open(tif_path) as dataset:
                for city_name, coords in CITIES.items():
                    value = get_pixel_value(dataset, coords["lon"], coords["lat"])

                    if value is not None:
                        ndvi = convert_ndvi_value(value)

                        if ndvi is not None:
                            interpretation = interpret_ndvi(ndvi)

                            ndvi_data[city_name]["ndvi_values"].append({
                                "date": date,
                                "ndvi": ndvi,
                                "health": interpretation["health"],
                                "status": interpretation["status"],
                                "raw_value": int(value)
                            })
        except Exception as e:
            print(f"❌ Erreur avec {filename}: {e}")

    # Créer JSON final
    result = {
        "source": "NASA MODIS NDVI",
        "product": "Vegetation Health Index",
        "resolution": "250m or 500m",
        "region": "Benin",
        "lastUpdate": datetime.now().strftime("%Y-%m-%d"),
        "locations": [],
        "interpretation": {
            "ranges": {
                "< 0": "Eau",
                "0 - 0.2": "Sol nu / Végétation très faible",
                "0.2 - 0.4": "Végétation faible",
                "0.4 - 0.6": "Bonne santé",
                "0.6 - 0.8": "Excellente santé",
                "0.8 - 1.0": "Végétation très dense"
            }
        }
    }

    for city, data in ndvi_data.items():
        if data["ndvi_values"]:
            ndvi_vals = [v["ndvi"] for v in data["ndvi_values"]]

            avg_ndvi = sum(ndvi_vals) / len(ndvi_vals)
            current_ndvi = ndvi_vals[-1]
            current_interpretation = interpret_ndvi(current_ndvi)

            result["locations"].append({
                "city": city,
                "country": "Benin",
                "latitude": data["latitude"],
                "longitude": data["longitude"],
                "vegetation_health": {
                    "current_ndvi": current_ndvi,
                    "average_ndvi": round(avg_ndvi, 4),
                    "min_ndvi": round(min(ndvi_vals), 4),
                    "max_ndvi": round(max(ndvi_vals), 4),
                    "status": current_interpretation["status"],
                    "health_description": current_interpretation["health"],
                    "color": current_interpretation["color"]
                },
                "timeseries": data["ndvi_values"][-5:]  # 5 dernières dates
            })

    # Sauvegarder JSON
    output_path = Path(OUTPUT_FILE)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Conversion terminée !")
    print(f"📁 Fichier créé : {output_path}")
    print(f"📊 {len(result['locations'])} villes avec données")

    # Aperçu
    print("\n📈 Aperçu santé végétation :")
    for loc in result["locations"]:
        city = loc["city"]
        ndvi = loc["vegetation_health"]["current_ndvi"]
        health = loc["vegetation_health"]["health_description"]
        print(f"   {city:20} : NDVI={ndvi:6.3f} → {health}")

    return output_path

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  CONVERSION NDVI → JSON")
    print("  IleRise - NASA Space Apps Challenge 2025")
    print("=" * 60 + "\n")

    process_ndvi_data()

    print("\n" + "=" * 60)
    print("  ✅ TERMINÉ !")
    print("=" * 60)
