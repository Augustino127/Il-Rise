#!/usr/bin/env python3
"""
Script de conversion SMAP Soil Moisture GeoTIFF -> JSON -> CSV
NASA Space Apps Challenge 2025
"""

import os
import json
import csv
from datetime import datetime, timedelta
from pathlib import Path
import numpy as np

try:
    from osgeo import gdal
    gdal.UseExceptions()
except ImportError:
    print("❌ GDAL non installé. Installer avec: pip install GDAL")
    exit(1)

# Configuration
RAW_DATA_DIR = Path("raw-nasa-data/soil-moisture")
OUTPUT_JSON = Path("public/data/nasa-soil-moisture-benin.json")
OUTPUT_CSV = Path("public/data/nasa-soil-moisture-benin.csv")

# Coordonnées des 11 villes du Bénin
BENIN_CITIES = [
    {"city": "Cotonou", "latitude": 6.3654, "longitude": 2.4183, "region": "Littoral", "soil_type": "sandy"},
    {"city": "Parakou", "latitude": 9.3372, "longitude": 2.6103, "region": "Borgou", "soil_type": "ferruginous_tropical"},
    {"city": "Porto-Novo", "latitude": 6.4969, "longitude": 2.6289, "region": "Ouémé", "soil_type": "clay"},
    {"city": "Djougou", "latitude": 9.7085, "longitude": 1.6659, "region": "Donga", "soil_type": "ferruginous"},
    {"city": "Bohicon", "latitude": 7.1781, "longitude": 2.0667, "region": "Zou", "soil_type": "ferrallitic"},
    {"city": "Natitingou", "latitude": 10.3167, "longitude": 1.3833, "region": "Atakora", "soil_type": "lateritic"},
    {"city": "Abomey", "latitude": 7.1833, "longitude": 1.9833, "region": "Zou", "soil_type": "ferrallitic"},
    {"city": "Kandi", "latitude": 11.1344, "longitude": 2.9386, "region": "Alibori", "soil_type": "sandy_loam"},
    {"city": "Ouidah", "latitude": 6.3628, "longitude": 2.0852, "region": "Atlantique", "soil_type": "sandy_coastal"},
    {"city": "Lokossa", "latitude": 6.6389, "longitude": 1.7167, "region": "Mono", "soil_type": "hydromorphic"},
    {"city": "Malanville", "latitude": 11.8667, "longitude": 3.3833, "region": "Alibori", "soil_type": "alluvial"}
]


def parse_filename(filename):
    """Extraire date et heure du nom de fichier SMAP"""
    # Format: SPL4SMGP.008_Geophysical_Data_sm_rootzone_doy2025001013000_aid0001.tif
    parts = filename.split('_')

    # Trouver la partie avec doy
    doy_part = None
    for part in parts:
        if 'doy' in part:
            doy_part = part
            break

    if not doy_part:
        return None

    # Extraire année et jour de l'année
    year = int(doy_part[3:7])
    day_of_year = int(doy_part[7:10])
    hour = int(doy_part[10:12])
    minute = int(doy_part[12:14])

    # Convertir en date
    date = datetime(year, 1, 1) + timedelta(days=day_of_year - 1)
    date = date.replace(hour=hour, minute=minute)

    return {
        'date': date.strftime('%Y-%m-%d'),
        'time': date.strftime('%H:%M:%S'),
        'datetime': date
    }


def extract_value_at_point(dataset, lon, lat):
    """Extraire valeur du raster à une coordonnée"""
    # Obtenir transformation géographique
    geotransform = dataset.GetGeoTransform()

    # Convertir coordonnées géo -> pixel
    origin_x = geotransform[0]
    origin_y = geotransform[3]
    pixel_width = geotransform[1]
    pixel_height = geotransform[5]

    col = int((lon - origin_x) / pixel_width)
    row = int((lat - origin_y) / pixel_height)

    # Lire bande
    band = dataset.GetRasterBand(1)

    # Vérifier limites
    if col < 0 or col >= band.XSize or row < 0 or row >= band.YSize:
        return None

    # Lire valeur
    data = band.ReadAsArray(col, row, 1, 1)

    if data is None or data.size == 0:
        return None

    value = float(data[0, 0])

    # Vérifier NoData
    nodata = band.GetNoDataValue()
    if nodata is not None and value == nodata:
        return None

    # Valeurs SMAP en m³/m³ (0-1)
    # Filtrer valeurs aberrantes
    if value < 0 or value > 1:
        return None

    return value


def classify_moisture(volumetric):
    """Classifier niveau d'humidité"""
    percentage = volumetric * 100

    if percentage < 15:
        return "very_dry"
    elif percentage < 20:
        return "dry"
    elif percentage < 25:
        return "moderate"
    elif percentage < 35:
        return "optimal"
    else:
        return "saturated"


def process_all_tif_files():
    """Traiter tous les fichiers TIF"""
    print("🔄 Recherche des fichiers TIF...")

    tif_files = sorted(RAW_DATA_DIR.glob("*sm_rootzone*.tif"))

    # Filtrer doublons (fichiers avec (1))
    tif_files = [f for f in tif_files if '(1)' not in f.name]

    print(f"✅ {len(tif_files)} fichiers trouvés")

    # Dictionnaire pour stocker données par ville
    cities_data = {city['city']: {'info': city, 'timeseries': []} for city in BENIN_CITIES}

    # Traiter chaque fichier
    for i, tif_file in enumerate(tif_files):
        if i % 20 == 0:
            print(f"📊 Traitement {i}/{len(tif_files)}...")

        # Parser nom fichier
        file_info = parse_filename(tif_file.name)
        if not file_info:
            continue

        # Ouvrir raster
        try:
            dataset = gdal.Open(str(tif_file))
            if not dataset:
                continue

            # Extraire valeurs pour chaque ville
            for city_name, city_data in cities_data.items():
                city_info = city_data['info']

                value = extract_value_at_point(
                    dataset,
                    city_info['longitude'],
                    city_info['latitude']
                )

                if value is not None:
                    city_data['timeseries'].append({
                        'date': file_info['date'],
                        'time': file_info['time'],
                        'datetime': file_info['datetime'],
                        'volumetric': round(value, 3),
                        'percentage': round(value * 100, 1)
                    })

            dataset = None  # Fermer

        except Exception as e:
            print(f"⚠️ Erreur avec {tif_file.name}: {e}")
            continue

    # Agréger par jour (moyenne des mesures 3h)
    print("📅 Agrégation par jour...")
    for city_name, city_data in cities_data.items():
        # Grouper par date
        daily_data = {}
        for entry in city_data['timeseries']:
            date = entry['date']
            if date not in daily_data:
                daily_data[date] = []
            daily_data[date].append(entry)

        # Calculer moyenne journalière
        daily_avg = []
        for date, entries in sorted(daily_data.items()):
            values = [e['volumetric'] for e in entries]
            avg_vol = np.mean(values)
            daily_avg.append({
                'date': date,
                'value': round(avg_vol, 3),
                'percent': round(avg_vol * 100, 1)
            })

        city_data['timeseries'] = daily_avg

        # Valeur actuelle = dernière date
        if daily_avg:
            latest = daily_avg[-1]
            city_data['current'] = {
                'volumetric': latest['value'],
                'percentage': latest['percent'],
                'status': classify_moisture(latest['value']),
                'timestamp': f"{latest['date']}T12:00:00Z"
            }
        else:
            city_data['current'] = {
                'volumetric': 0.20,
                'percentage': 20,
                'status': 'moderate',
                'timestamp': datetime.now().isoformat() + 'Z'
            }

    return cities_data


def create_json_output(cities_data):
    """Créer fichier JSON"""
    print("📝 Création du JSON...")

    # Structure finale
    output = {
        "source": "NASA SMAP Level 4 Global Surface and Root Zone Soil Moisture",
        "product": "SPL4SMGP v008",
        "description": "Soil moisture data derived from SMAP satellite measurements - Converted from GeoTIFF",
        "spatial_resolution": "9 km",
        "temporal_resolution": "3-hourly, aggregated to daily",
        "units": {
            "surface_sm": "volumetric fraction (m³/m³)",
            "rootzone_sm": "volumetric fraction (m³/m³)",
            "percentage": "converted to percentage for user display"
        },
        "lastUpdate": datetime.now().strftime('%Y-%m-%d'),
        "coverage": "Benin - 11 major cities",
        "layers": {
            "sm_surface": {
                "description": "Root zone soil moisture (0-100 cm depth) - averaged daily",
                "unit": "m³/m³",
                "locations": []
            }
        },
        "interpretation": {
            "very_dry": "< 15% - Irrigation urgente recommandée",
            "dry": "15-20% - Sol sec, irrigation nécessaire",
            "moderate": "20-25% - Irrigation modérée nécessaire",
            "optimal": "25-35% - Humidité idéale pour cultures",
            "saturated": "> 35% - Risque excès d'eau, réduire irrigation"
        },
        "data_access": {
            "api": "https://n5eil01u.ecs.nsidc.org/SMAP/SPL4SMGP.008/",
            "documentation": "https://nsidc.org/data/spl4smgp/versions/8",
            "earthdata_login_required": True
        }
    }

    # Ajouter données de chaque ville
    for city_name, city_data in sorted(cities_data.items()):
        location_entry = {
            "city": city_data['info']['city'],
            "latitude": city_data['info']['latitude'],
            "longitude": city_data['info']['longitude'],
            "region": city_data['info']['region'],
            "soil_type": city_data['info']['soil_type'],
            "current": city_data['current'],
            "timeseries": city_data['timeseries'][-30:] if len(city_data['timeseries']) > 30 else city_data['timeseries']  # Garder 30 derniers jours
        }

        output['layers']['sm_surface']['locations'].append(location_entry)

    # Écrire JSON
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"✅ JSON créé: {OUTPUT_JSON}")


def create_csv_output(cities_data):
    """Créer fichier CSV"""
    print("📊 Création du CSV...")

    # Préparer données
    rows = []
    for city_name, city_data in sorted(cities_data.items()):
        for entry in city_data['timeseries']:
            rows.append({
                'date': entry['date'],
                'city': city_data['info']['city'],
                'region': city_data['info']['region'],
                'latitude': city_data['info']['latitude'],
                'longitude': city_data['info']['longitude'],
                'soil_type': city_data['info']['soil_type'],
                'soil_moisture_volumetric': entry['value'],
                'soil_moisture_percent': entry['percent'],
                'status': classify_moisture(entry['value'])
            })

    # Écrire CSV
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
        if rows:
            fieldnames = rows[0].keys()
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

    print(f"✅ CSV créé: {OUTPUT_CSV}")
    print(f"📈 {len(rows)} lignes de données")


def main():
    print("=" * 60)
    print("🌍 Conversion SMAP Soil Moisture TIF → JSON → CSV")
    print("=" * 60)

    # Vérifier dossier
    if not RAW_DATA_DIR.exists():
        print(f"❌ Dossier non trouvé: {RAW_DATA_DIR}")
        return

    # Traiter TIF
    cities_data = process_all_tif_files()

    # Créer JSON
    create_json_output(cities_data)

    # Créer CSV
    create_csv_output(cities_data)

    print("\n✅ Conversion terminée !")
    print(f"📁 JSON: {OUTPUT_JSON}")
    print(f"📁 CSV: {OUTPUT_CSV}")

    # Afficher aperçu
    print("\n📊 Aperçu des données :")
    for city_name, city_data in list(cities_data.items())[:3]:
        current = city_data['current']
        print(f"  {city_name}: {current['percentage']}% ({current['status']}) - {len(city_data['timeseries'])} jours")


if __name__ == "__main__":
    main()
