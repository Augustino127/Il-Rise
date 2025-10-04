"""
Conversion JSON → CSV pour données NASA
IleRise - NASA Space Apps Challenge 2025

Usage:
    python convert_json_to_csv.py
"""

import json
import csv
from pathlib import Path

# Configuration
DATA_DIR = Path(r"C:\Projet\ilerise-nasa\public\data")
OUTPUT_DIR = Path(r"C:\Projet\ilerise-nasa\public\data\csv")

def convert_temperature_to_csv():
    """Convertir température JSON → CSV"""

    json_file = DATA_DIR / "nasa-temperature-benin.json"

    if not json_file.exists():
        print(f"⚠️  {json_file.name} introuvable")
        return

    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Créer CSV avec toutes les données
    csv_file = OUTPUT_DIR / "nasa-temperature-benin.csv"
    csv_file.parent.mkdir(parents=True, exist_ok=True)

    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)

        # En-tête
        writer.writerow([
            'City', 'Country', 'Latitude', 'Longitude',
            'Date', 'Temperature_C', 'Raw_Value',
            'Average_C', 'Min_C', 'Max_C', 'Current_C'
        ])

        # Données
        for location in data['locations']:
            city = location['city']
            country = location['country']
            lat = location['latitude']
            lon = location['longitude']
            avg = location['temperature']['average_c']
            min_temp = location['temperature']['min_c']
            max_temp = location['temperature']['max_c']
            current = location['temperature']['current_c']

            for ts in location['timeseries']:
                writer.writerow([
                    city, country, lat, lon,
                    ts['date'], ts['temperature_c'], ts.get('raw_value', ''),
                    avg, min_temp, max_temp, current
                ])

    print(f"✅ {csv_file.name} créé ({count_rows(csv_file)} lignes)")
    return csv_file

def convert_ndvi_to_csv():
    """Convertir NDVI JSON → CSV"""

    json_file = DATA_DIR / "nasa-ndvi-benin.json"

    if not json_file.exists():
        print(f"⚠️  {json_file.name} introuvable")
        return

    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Créer CSV
    csv_file = OUTPUT_DIR / "nasa-ndvi-benin.csv"

    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)

        # En-tête
        writer.writerow([
            'City', 'Country', 'Latitude', 'Longitude',
            'Date', 'NDVI', 'Health_Status', 'Health_Description', 'Color',
            'Raw_Value', 'Average_NDVI', 'Min_NDVI', 'Max_NDVI', 'Current_NDVI'
        ])

        # Données
        for location in data['locations']:
            city = location['city']
            country = location['country']
            lat = location['latitude']
            lon = location['longitude']
            veg = location['vegetation_health']
            avg_ndvi = veg['average_ndvi']
            min_ndvi = veg['min_ndvi']
            max_ndvi = veg['max_ndvi']
            current_ndvi = veg['current_ndvi']

            for ts in location['timeseries']:
                writer.writerow([
                    city, country, lat, lon,
                    ts['date'], ts['ndvi'], ts['status'], ts['health'],
                    location['vegetation_health']['color'],
                    ts.get('raw_value', ''),
                    avg_ndvi, min_ndvi, max_ndvi, current_ndvi
                ])

    print(f"✅ {csv_file.name} créé ({count_rows(csv_file)} lignes)")
    return csv_file

def create_summary_csv():
    """Créer CSV résumé avec données actuelles seulement"""

    csv_file = OUTPUT_DIR / "nasa-benin-summary.csv"

    # Charger les deux JSON
    temp_file = DATA_DIR / "nasa-temperature-benin.json"
    ndvi_file = DATA_DIR / "nasa-ndvi-benin.json"

    if not (temp_file.exists() and ndvi_file.exists()):
        print("⚠️  Fichiers JSON manquants pour le résumé")
        return

    with open(temp_file, 'r', encoding='utf-8') as f:
        temp_data = json.load(f)

    with open(ndvi_file, 'r', encoding='utf-8') as f:
        ndvi_data = json.load(f)

    # Créer dictionnaire par ville
    cities = {}

    for loc in temp_data['locations']:
        city = loc['city']
        cities[city] = {
            'country': loc['country'],
            'latitude': loc['latitude'],
            'longitude': loc['longitude'],
            'temperature_current': loc['temperature']['current_c'],
            'temperature_avg': loc['temperature']['average_c'],
            'temperature_min': loc['temperature']['min_c'],
            'temperature_max': loc['temperature']['max_c']
        }

    for loc in ndvi_data['locations']:
        city = loc['city']
        if city in cities:
            veg = loc['vegetation_health']
            cities[city].update({
                'ndvi_current': veg['current_ndvi'],
                'ndvi_avg': veg['average_ndvi'],
                'health_status': veg['status'],
                'health_description': veg['health_description']
            })

    # Écrire CSV
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)

        writer.writerow([
            'City', 'Country', 'Latitude', 'Longitude',
            'Temperature_Current_C', 'Temperature_Avg_C', 'Temperature_Min_C', 'Temperature_Max_C',
            'NDVI_Current', 'NDVI_Avg', 'Health_Status', 'Health_Description'
        ])

        for city, info in cities.items():
            writer.writerow([
                city, info['country'], info['latitude'], info['longitude'],
                info.get('temperature_current', ''),
                info.get('temperature_avg', ''),
                info.get('temperature_min', ''),
                info.get('temperature_max', ''),
                info.get('ndvi_current', ''),
                info.get('ndvi_avg', ''),
                info.get('health_status', ''),
                info.get('health_description', '')
            ])

    print(f"✅ {csv_file.name} créé ({count_rows(csv_file)} lignes)")
    return csv_file

def count_rows(csv_file):
    """Compter le nombre de lignes dans un CSV"""
    with open(csv_file, 'r', encoding='utf-8') as f:
        return sum(1 for line in f) - 1  # -1 pour l'en-tête

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  CONVERSION JSON → CSV")
    print("  IleRise - NASA Space Apps Challenge 2025")
    print("=" * 60 + "\n")

    print("📊 Conversion des données NASA...\n")

    # Convertir température
    convert_temperature_to_csv()

    # Convertir NDVI
    convert_ndvi_to_csv()

    # Créer résumé
    print("\n📋 Création fichier résumé...\n")
    create_summary_csv()

    print("\n" + "=" * 60)
    print("  ✅ CONVERSION TERMINÉE !")
    print(f"  📁 Fichiers dans : {OUTPUT_DIR}")
    print("=" * 60)

    # Lister les fichiers créés
    print("\n📂 Fichiers CSV créés :")
    for csv_file in sorted(OUTPUT_DIR.glob("*.csv")):
        size_kb = csv_file.stat().st_size / 1024
        print(f"   → {csv_file.name:40} ({size_kb:.1f} KB)")
