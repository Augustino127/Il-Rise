/**
 * LocationSelector.js
 * Interactive map for selecting farming locations in Benin
 * Uses Leaflet.js with NASA satellite data overlay
 */

import L from 'leaflet';

export class LocationSelector {
  constructor(nasaData) {
    this.nasaData = nasaData;
    this.map = null;
    this.selectedLocation = null;
    this.markers = [];
  }

  /**
   * Initialize the Leaflet map
   */
  initMap(containerId) {
    // Center on Benin (approximate center)
    this.map = L.map(containerId).setView([9.3, 2.3], 7);

    // Satellite imagery layer (Esri World Imagery)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, NASA, USGS',
      maxZoom: 18
    }).addTo(this.map);

    // Add location markers
    this.addLocationMarkers();

    console.log('✅ Carte satellite initialisée');
  }

  /**
   * Add markers for each location in Benin
   */
  addLocationMarkers() {
    if (!this.nasaData?.ndvi?.locations) {
      console.error('❌ Données NDVI non disponibles');
      return;
    }

    const locations = this.nasaData.ndvi.locations;

    locations.forEach(loc => {
      // Get NDVI value for marker color
      const ndvi = loc.vegetation_health?.current_ndvi || 0.3;
      const color = this.getNDVIColor(ndvi);

      // Create custom marker icon
      const iconHtml = `
        <div class="location-marker-container">
          <div class="location-marker-pin" style="background: ${color};">
            <span class="marker-icon">📍</span>
          </div>
          <div class="location-marker-label">${loc.city}</div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-location-marker',
        html: iconHtml,
        iconSize: [40, 60],
        iconAnchor: [20, 60]
      });

      // Create marker
      const marker = L.marker([loc.latitude, loc.longitude], { icon })
        .addTo(this.map);

      // Create popup content
      const popupContent = this.createPopupContent(loc);
      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'location-popup'
      });

      // Click event to select location
      marker.on('click', () => {
        this.selectLocation(loc);
      });

      this.markers.push({ marker, location: loc });
    });

    console.log(`✅ ${locations.length} localités ajoutées à la carte`);
  }

  /**
   * Create popup content for a location
   */
  createPopupContent(location) {
    // Get related NASA data
    const temp = this.nasaData.temperature?.locations.find(l => l.city === location.city);
    const precip = this.nasaData.precipitation?.locations.find(l => l.city === location.city);
    const moisture = this.nasaData.smap?.layers?.sm_surface?.locations.find(l => l.city === location.city);

    const ndvi = location.vegetation_health?.current_ndvi || 0;
    const ndviStatus = location.vegetation_health?.status || 'unknown';
    const tempC = temp?.temperature?.current_c || 'N/A';
    const precipMm = precip?.precipitation?.total_mm || 'N/A';
    const moisturePercent = moisture?.moisture?.current_percent || 'N/A';

    return `
      <div class="location-popup-content">
        <h3 class="popup-city-name">${location.city}</h3>
        <div class="popup-coordinates">
          📍 ${location.latitude.toFixed(4)}°N, ${location.longitude.toFixed(4)}°E
        </div>

        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-icon">🌱</span>
            <div class="stat-info">
              <span class="stat-label">NDVI (Santé plantes)</span>
              <span class="stat-value ${ndviStatus}">${ndvi.toFixed(2)}</span>
            </div>
          </div>

          <div class="popup-stat">
            <span class="stat-icon">🌡️</span>
            <div class="stat-info">
              <span class="stat-label">Température</span>
              <span class="stat-value">${tempC}°C</span>
            </div>
          </div>

          <div class="popup-stat">
            <span class="stat-icon">💧</span>
            <div class="stat-info">
              <span class="stat-label">Humidité Sol</span>
              <span class="stat-value">${moisturePercent}%</span>
            </div>
          </div>

          <div class="popup-stat">
            <span class="stat-icon">🌧️</span>
            <div class="stat-info">
              <span class="stat-label">Précipitations</span>
              <span class="stat-value">${precipMm} mm</span>
            </div>
          </div>
        </div>

        <button class="btn-select-location btn-primary" onclick="window.app.confirmLocationSelection('${location.city}')">
          Sélectionner cette localité
        </button>
      </div>
    `;
  }

  /**
   * Select a location
   */
  selectLocation(location) {
    this.selectedLocation = location;

    // Zoom to location
    this.map.setView([location.latitude, location.longitude], 10, {
      animate: true,
      duration: 1
    });

    // Highlight selected marker
    this.highlightMarker(location);

    // Display selected location info panel
    this.displaySelectedLocationInfo(location);

    console.log('📍 Localité sélectionnée:', location.city);
  }

  /**
   * Highlight selected marker
   */
  highlightMarker(location) {
    this.markers.forEach(({ marker, location: loc }) => {
      const markerElement = marker.getElement();
      if (markerElement) {
        if (loc.city === location.city) {
          markerElement.classList.add('selected');
        } else {
          markerElement.classList.remove('selected');
        }
      }
    });
  }

  /**
   * Display selected location info in sidebar
   */
  displaySelectedLocationInfo(location) {
    const panel = document.getElementById('location-selected');
    if (!panel) return;

    // Get NASA data
    const temp = this.nasaData.temperature?.locations.find(l => l.city === location.city);
    const precip = this.nasaData.precipitation?.locations.find(l => l.city === location.city);
    const moisture = this.nasaData.smap?.layers?.sm_surface?.locations.find(l => l.city === location.city);

    // Update panel content
    document.getElementById('selected-city-name').textContent = location.city;
    document.getElementById('selected-ndvi').textContent = (location.vegetation_health?.current_ndvi || 0).toFixed(2);
    document.getElementById('selected-temp').textContent = `${temp?.temperature?.current_c || 'N/A'}°C`;
    document.getElementById('selected-moisture').textContent = `${moisture?.moisture?.current_percent || 'N/A'}%`;
    document.getElementById('selected-precip').textContent = `${precip?.precipitation?.total_mm || 'N/A'} mm`;

    // Add health status
    const ndviStatus = location.vegetation_health?.status || 'unknown';
    const statusElement = document.getElementById('selected-status');
    if (statusElement) {
      const statusText = {
        'excellent': '🟢 Excellente végétation',
        'good': '🟢 Bonne végétation',
        'fair': '🟡 Végétation moyenne',
        'poor': '🟠 Végétation faible',
        'critical': '🔴 Végétation critique'
      };
      statusElement.textContent = statusText[ndviStatus] || '⚪ Statut inconnu';
      statusElement.className = `status-badge ${ndviStatus}`;
    }

    // Show panel
    panel.style.display = 'block';
    panel.classList.add('active');
  }

  /**
   * Get color based on NDVI value
   */
  getNDVIColor(ndvi) {
    if (ndvi >= 0.6) return '#2E7D32'; // Dark green - Excellent
    if (ndvi >= 0.4) return '#82CC68'; // Green - Good
    if (ndvi >= 0.2) return '#F9A94B'; // Orange - Fair
    return '#F00000'; // Red - Poor
  }

  /**
   * Get selected location data
   */
  getSelectedLocationData() {
    if (!this.selectedLocation) return null;

    const cityName = this.selectedLocation.city;
    const temp = this.nasaData.temperature?.locations.find(l => l.city === cityName);
    const precip = this.nasaData.precipitation?.locations.find(l => l.city === cityName);
    const moisture = this.nasaData.smap?.layers?.sm_surface?.locations.find(l => l.city === cityName);

    return {
      city: cityName,
      coordinates: {
        lat: this.selectedLocation.latitude,
        lon: this.selectedLocation.longitude
      },
      ndvi: this.selectedLocation.vegetation_health?.current_ndvi || 0.3,
      ndviStatus: this.selectedLocation.vegetation_health?.status || 'unknown',
      temperature: temp?.temperature?.current_c || 28,
      precipitation: precip?.precipitation?.total_mm || 0,
      soilMoisture: moisture?.moisture?.current_percent || 20,
      rawData: {
        ndvi: this.selectedLocation,
        temperature: temp,
        precipitation: precip,
        soilMoisture: moisture
      }
    };
  }

  /**
   * Reset selection
   */
  resetSelection() {
    this.selectedLocation = null;

    // Remove highlight from all markers
    this.markers.forEach(({ marker }) => {
      const markerElement = marker.getElement();
      if (markerElement) {
        markerElement.classList.remove('selected');
      }
    });

    // Hide selection panel
    const panel = document.getElementById('location-selected');
    if (panel) {
      panel.style.display = 'none';
      panel.classList.remove('active');
    }

    // Reset map view
    this.map.setView([9.3, 2.3], 7);
  }

  /**
   * Destroy map instance
   */
  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.markers = [];
      console.log('🗺️ Carte détruite');
    }
  }
}

export default LocationSelector;
