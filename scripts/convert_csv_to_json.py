"""
Conversion CSV NASA → JSON pour IleRise
NASA Space Apps Challenge 2025

Usage:
    python convert_csv_to_json.py

Requis:
    pip install pandas
"""

import pandas as pd
import json
from pathlib import Path
from datetime import datetime

# Configuration
RAW_DATA_DIR = Path(r"C:\Projet\ilerise-nasa\raw-nasa-data")
OUTPUT_DIR = Path(r"C:\Projet\ilerise-nasa\public\data")

# Villes du Bénin (pour filtrer les données)
BENIN_CITIES = {
    "Cotonou": {"lat": 6.37, "lon": 2.38},
    "Porto-Novo": {"lat": 6.50, "lon": 2.63},
    "Parakou": {"lat": 9.34, "lon": 2.61},
    "Djougou": {"lat": 9.71, "lon": 1.67},
    "Bohicon": {"lat": 7.18, "lon": 2.07}
}

def find_csv_file(directory, pattern):
    """Trouver le fichier CSV principal"""
    csv_files = list(directory.glob(pattern))
    if csv_files:
        return csv_files[0]
    return None

def kelvin_to_celsius(value):
    """Convertir Kelvin en Celsius (si nécessaire)"""
    if pd.isna(value) or value == 0:
        return None
    # MOD11A2 : valeurs en Kelvin * 50
    # Formule : (value * 0.02) - 273.15
    celsius = (value * 0.02) - 273.15
    return round(celsius, 2)

def find_closest_city(lat, lon):
    """Trouver la ville la plus proche des coordonnées"""
    min_distance = float('inf')
    closest_city = None

    for city, coords in BENIN_CITIES.items():
        # Distance euclidienne simple
        distance = ((lat - coords['lat'])**2 + (lon - coords['lon'])**2)**0.5
        if distance < min_distance:
            min_distance = distance
            closest_city = city

    # Si distance > 1 degré (~110km), rejeter
    if min_distance > 1.0:
        return None

    return closest_city

def process_temperature_csv():
    """Convertir CSV température → JSON"""

    print("🌡️  Traitement TEMPÉRATURE (MOD11A2)")
    print("=" * 60)

    # Chercher le fichier CSV
    csv_file = find_csv_file(RAW_DATA_DIR / "temperature", "*results*.csv")

    if not csv_file:
        # Chercher à la racine si pas de sous-dossier
        csv_file = find_csv_file(RAW_DATA_DIR, "*MOD11A2*results*.csv")

    if not csv_file:
        print("❌ Fichier CSV MOD11A2 introuvable !")
        print(f"   Cherché dans : {RAW_DATA_DIR}")
        return None

    print(f"✅ Fichier trouvé : {csv_file.name}")

    # Lire le CSV
    df = pd.read_csv(csv_file)
    print(f"📊 {len(df)} lignes trouvées")

    # Afficher les colonnes pour debug
    print(f"📋 Colonnes : {list(df.columns)[:5]}...")  # 5 premières colonnes

    # Grouper par ville
    city_data = {}

    for city in BENIN_CITIES.keys():
        city_data[city] = {
            "temperatures": [],
            "latitude": BENIN_CITIES[city]["lat"],
            "longitude": BENIN_CITIES[city]["lon"]
        }

    # Traiter chaque ligne
    for idx, row in df.iterrows():
        # Extraire lat/lon (adapter selon vos colonnes CSV)
        # Les noms de colonnes peuvent varier : 'Latitude', 'lat', 'LAT', etc.
        lat_col = next((col for col in df.columns if 'lat' in col.lower()), None)
        lon_col = next((col for col in df.columns if 'lon' in col.lower()), None)
        date_col = next((col for col in df.columns if 'date' in col.lower()), None)

        if not (lat_col and lon_col and date_col):
            print("⚠️  Colonnes lat/lon/date non trouvées, colonnes disponibles :")
            print(f"   {list(df.columns)}")
            break

        lat = row[lat_col]
        lon = row[lon_col]
        date = row[date_col]

        # Trouver ville la plus proche
        city = find_closest_city(lat, lon)

        if city:
            # Extraire température (chercher colonne LST_Day)
            temp_col = next((col for col in df.columns if 'LST_Day' in col or 'LST' in col), None)

            if temp_col:
                temp_raw = row[temp_col]
                temp_celsius = kelvin_to_celsius(temp_raw)

                if temp_celsius:
                    city_data[city]["temperatures"].append({
                        "date": str(date),
                        "temperature_c": temp_celsius
                    })

    # Créer JSON final
    result = {
        "source": "NASA MODIS MOD11A2.061",
        "product": "Land Surface Temperature (8-Day)",
        "region": "Benin",
        "lastUpdate": datetime.now().strftime("%Y-%m-%d"),
        "locations": []
    }

    for city, data in city_data.items():
        if data["temperatures"]:
            temps = [t["temperature_c"] for t in data["temperatures"]]

            result["locations"].append({
                "city": city,
                "country": "Benin",
                "latitude": data["latitude"],
                "longitude": data["longitude"],
                "temperature": {
                    "average_c": round(sum(temps) / len(temps), 2),
                    "min_c": round(min(temps), 2),
                    "max_c": round(max(temps), 2),
                    "current_c": temps[-1]
                },
                "timeseries": data["temperatures"][-5:]  # 5 dernières dates
            })

    # Sauvegarder
    output_file = OUTPUT_DIR / "nasa-temperature-benin.json"
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"✅ JSON créé : {output_file}")
    print(f"📍 {len(result['locations'])} villes avec données")

    # Aperçu
    print("\n📊 Aperçu températures :")
    for loc in result["locations"]:
        print(f"   {loc['city']:15} : {loc['temperature']['average_c']:5.1f}°C")

    return output_file

def process_all_datasets():
    """Traiter tous les datasets disponibles"""

    print("\n" + "=" * 60)
    print("  CONVERSION DONNÉES NASA CSV → JSON")
    print("  IleRise - NASA Space Apps Challenge 2025")
    print("=" * 60 + "\n")

    # Température
    temp_file = process_temperature_csv()

    # TODO: Ajouter NDVI, SMAP, GPM quand téléchargés
    # process_ndvi_csv()
    # process_soil_moisture_csv()
    # process_precipitation_csv()

    print("\n" + "=" * 60)
    print("  ✅ CONVERSION TERMINÉE !")
    print("=" * 60)

    if temp_file:
        print(f"\n📂 Fichiers générés dans : {OUTPUT_DIR}")
        print(f"   → {temp_file.name}")

if __name__ == "__main__":
    process_all_datasets()
