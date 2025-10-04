"""
Téléchargement automatique des données de précipitations
via NASA POWER API
IleRise - NASA Space Apps Challenge 2025

Usage:
    python download_precipitation.py
"""

import requests
import json
import csv
from pathlib import Path
from datetime import datetime

# Configuration
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

def download_precipitation_for_city(city_name, lat, lon, start_date, end_date):
    """Télécharger données précipitations pour une ville via NASA POWER API"""

    # Construire URL API
    base_url = "https://power.larc.nasa.gov/api/temporal/daily/point"

    params = {
        "parameters": "PRECTOTCORR",  # Precipitation Corrected
        "community": "AG",  # Agriculture
        "longitude": lon,
        "latitude": lat,
        "start": start_date.replace("-", ""),  # 20250101
        "end": end_date.replace("-", ""),      # 20250131
        "format": "JSON"
    }

    print(f"  📡 Téléchargement pour {city_name}...", end=" ")

    try:
        response = requests.get(base_url, params=params, timeout=30)
        response.raise_for_status()

        data = response.json()

        # Extraire données de précipitations
        precip_data = data['properties']['parameter']['PRECTOTCORR']

        print(f"✅ {len(precip_data)} jours")

        return precip_data

    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None

def process_precipitation_data(start_date="2025-01-01", end_date="2025-01-31"):
    """Télécharger et traiter toutes les données de précipitations"""

    print("\n" + "=" * 60)
    print("  TÉLÉCHARGEMENT PRÉCIPITATIONS NASA POWER")
    print("  IleRise - NASA Space Apps Challenge 2025")
    print("=" * 60)
    print(f"\n📅 Période : {start_date} → {end_date}")
    print(f"🌍 Région : Bénin ({len(CITIES)} villes)\n")

    # Structure pour stocker les données
    all_data = {
        "source": "NASA POWER API",
        "product": "Precipitation Corrected (PRECTOTCORR)",
        "region": "Benin",
        "dateRange": {
            "start": start_date,
            "end": end_date
        },
        "lastUpdate": datetime.now().strftime("%Y-%m-%d"),
        "locations": []
    }

    # Télécharger pour chaque ville
    for city_name, coords in CITIES.items():
        precip_data = download_precipitation_for_city(
            city_name,
            coords['lat'],
            coords['lon'],
            start_date,
            end_date
        )

        if precip_data:
            # Convertir dictionnaire en liste de tuples (date, valeur)
            daily_data = []
            total_precip = 0
            rainy_days = 0
            max_precip = 0

            for date_str, precip_mm in precip_data.items():
                # Convertir YYYYMMDD en YYYY-MM-DD
                year = date_str[:4]
                month = date_str[4:6]
                day = date_str[6:8]
                formatted_date = f"{year}-{month}-{day}"

                daily_data.append({
                    "date": formatted_date,
                    "precipitation_mm": round(precip_mm, 2)
                })

                total_precip += precip_mm
                if precip_mm > 0.1:  # Seuil pour jour pluvieux
                    rainy_days += 1
                if precip_mm > max_precip:
                    max_precip = precip_mm

            # Calculer statistiques
            num_days = len(daily_data)
            avg_precip = total_precip / num_days if num_days > 0 else 0

            all_data['locations'].append({
                "city": city_name,
                "country": "Benin",
                "latitude": coords['lat'],
                "longitude": coords['lon'],
                "precipitation": {
                    "total_mm": round(total_precip, 2),
                    "average_daily_mm": round(avg_precip, 2),
                    "max_daily_mm": round(max_precip, 2),
                    "rainy_days": rainy_days
                },
                "timeseries": daily_data
            })

    # Sauvegarder JSON
    json_file = OUTPUT_DIR / "nasa-precipitation-benin.json"
    json_file.parent.mkdir(parents=True, exist_ok=True)

    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ JSON créé : {json_file}")
    print(f"📊 {len(all_data['locations'])} villes avec données")

    # Créer CSV
    create_precipitation_csv(all_data)

    # Afficher résumé
    print("\n📊 Résumé précipitations (période complète) :")
    for loc in all_data['locations']:
        city = loc['city']
        total = loc['precipitation']['total_mm']
        rainy = loc['precipitation']['rainy_days']
        print(f"   {city:20} : {total:6.1f} mm ({rainy} jours pluvieux)")

    return json_file

def create_precipitation_csv(data):
    """Créer fichier CSV des précipitations"""

    csv_file = CSV_DIR / "nasa-precipitation-benin.csv"
    csv_file.parent.mkdir(parents=True, exist_ok=True)

    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)

        # En-tête
        writer.writerow([
            'City', 'Country', 'Latitude', 'Longitude',
            'Date', 'Precipitation_mm',
            'Total_mm', 'Average_Daily_mm', 'Max_Daily_mm', 'Rainy_Days'
        ])

        # Données
        for location in data['locations']:
            city = location['city']
            country = location['country']
            lat = location['latitude']
            lon = location['longitude']
            precip_stats = location['precipitation']

            for ts in location['timeseries']:
                writer.writerow([
                    city, country, lat, lon,
                    ts['date'], ts['precipitation_mm'],
                    precip_stats['total_mm'],
                    precip_stats['average_daily_mm'],
                    precip_stats['max_daily_mm'],
                    precip_stats['rainy_days']
                ])

    num_rows = sum(1 for _ in open(csv_file)) - 1
    print(f"✅ CSV créé : {csv_file.name} ({num_rows} lignes)")

if __name__ == "__main__":
    # Installer requests si nécessaire
    try:
        import requests
    except ImportError:
        print("Installation de requests...")
        import subprocess
        subprocess.check_call(['pip', 'install', 'requests'])
        import requests

    # Télécharger données
    process_precipitation_data(
        start_date="2025-01-01",
        end_date="2025-01-31"
    )

    print("\n" + "=" * 60)
    print("  ✅ TÉLÉCHARGEMENT TERMINÉ !")
    print("=" * 60)
