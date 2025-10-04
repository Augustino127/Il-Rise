/**
 * WeatherEngine.js
 * Weather generation engine with NASA data integration
 * NASA Space Apps Challenge 2025
 *
 * Features:
 * - Realistic daily weather patterns
 * - Integration with NASA satellite data
 * - Stochastic weather events (drought, heavy rain, heatwave)
 * - Seasonal variations
 */

export class WeatherEngine {
  constructor(nasaData = null, location = 'Parakou') {
    this.nasaData = nasaData;
    this.location = location;

    // Weather parameters for West Africa (Benin)
    this.baseTemp = 28; // Average temperature (C)
    this.tempRange = 8; // Temperature variation
    this.baseRain = 4; // Average daily rain (mm)
    this.baseRadiation = 18; // MJ/m2/day

    // Probabilities for weather events
    this.PROB_DROUGHT = 0.20;
    this.PROB_HEAVY_RAIN = 0.15;
    this.PROB_HEATWAVE = 0.10;
    this.PROB_OPTIMAL = 0.55;

    // Current weather state
    this.weatherPattern = null;
    this.patternStartDay = 0;
    this.patternDuration = 0;

    // Cache for daily weather
    this.weatherCache = {};
  }

  /**
   * Get daily weather for simulation
   * @param {number} day - Day of simulation (1-90)
   * @returns {Object} Weather data
   */
  getDailyWeather(day) {
    // Check cache
    if (this.weatherCache[day]) {
      return this.weatherCache[day];
    }

    // Generate weather
    const weather = this.generateDailyWeather(day);

    // Cache it
    this.weatherCache[day] = weather;

    return weather;
  }

  /**
   * Generate realistic daily weather
   */
  generateDailyWeather(day) {
    // Seasonal variation (sinusoidal)
    const seasonalFactor = Math.sin((day / 90) * Math.PI * 2);

    // Base weather from seasonal pattern
    let temp = this.baseTemp + (this.tempRange / 2) * seasonalFactor;
    let rain = this.baseRain + 3 * Math.max(0, seasonalFactor);
    let radiation = this.baseRadiation + 3 * seasonalFactor;

    // Integrate NASA data if available
    if (this.nasaData) {
      const nasaWeather = this.getNASAWeather(day);
      if (nasaWeather) {
        temp = nasaWeather.temp || temp;
        rain = nasaWeather.rain || rain;
      }
    }

    // Apply weather events
    const event = this.getWeatherEvent(day);
    if (event) {
      ({ temp, rain, radiation } = this.applyWeatherEvent(event, temp, rain, radiation));
    }

    // Add daily random variation
    temp += (Math.random() - 0.5) * 3;
    rain += (Math.random() - 0.5) * 2;
    radiation += (Math.random() - 0.5) * 2;

    // Constraints
    temp = Math.max(20, Math.min(42, temp));
    rain = Math.max(0, rain);
    radiation = Math.max(10, Math.min(25, radiation));

    return {
      day,
      temp: Math.round(temp * 10) / 10,
      rain: Math.round(rain * 10) / 10,
      radiation: Math.round(radiation * 10) / 10,
      humidity: this.calculateHumidity(temp, rain),
      windSpeed: 2 + Math.random() * 3,
      event: event?.type || null
    };
  }

  /**
   * Get NASA weather data for specific day
   */
  getNASAWeather(day) {
    if (!this.nasaData) return null;

    try {
      // Get temperature from NASA MODIS
      const tempData = this.nasaData.temperature?.locations?.find(
        loc => loc.city === this.location
      );

      // Get precipitation from NASA GPM
      const precipData = this.nasaData.precipitation?.locations?.find(
        loc => loc.city === this.location
      );

      const temp = tempData?.temperature?.current_c || null;
      const rain = precipData?.precipitation?.daily_avg_mm || null;

      return { temp, rain };
    } catch (error) {
      console.warn('Error accessing NASA data:', error);
      return null;
    }
  }

  /**
   * Determine weather event for the day
   */
  getWeatherEvent(day) {
    // Check if we're in an ongoing weather pattern
    if (this.weatherPattern && day < this.patternStartDay + this.patternDuration) {
      return this.weatherPattern;
    }

    // Random chance for new weather event
    const rand = Math.random();

    if (rand < this.PROB_DROUGHT) {
      this.weatherPattern = {
        type: 'drought',
        severity: Math.random() > 0.5 ? 'moderate' : 'severe'
      };
      this.patternStartDay = day;
      this.patternDuration = Math.floor(7 + Math.random() * 7); // 7-14 days

      return this.weatherPattern;
    }

    if (rand < this.PROB_DROUGHT + this.PROB_HEAVY_RAIN) {
      this.weatherPattern = {
        type: 'heavy_rain',
        severity: Math.random() > 0.5 ? 'moderate' : 'severe'
      };
      this.patternStartDay = day;
      this.patternDuration = Math.floor(3 + Math.random() * 3); // 3-6 days

      return this.weatherPattern;
    }

    if (rand < this.PROB_DROUGHT + this.PROB_HEAVY_RAIN + this.PROB_HEATWAVE) {
      this.weatherPattern = {
        type: 'heatwave',
        severity: Math.random() > 0.5 ? 'moderate' : 'severe'
      };
      this.patternStartDay = day;
      this.patternDuration = Math.floor(5 + Math.random() * 5); // 5-10 days

      return this.weatherPattern;
    }

    // Optimal conditions (most common)
    this.weatherPattern = null;
    return null;
  }

  /**
   * Apply weather event effects
   */
  applyWeatherEvent(event, temp, rain, radiation) {
    switch (event.type) {
      case 'drought':
        rain = event.severity === 'severe' ? 0 : rain * 0.3;
        temp += event.severity === 'severe' ? 4 : 2;
        radiation += 2;
        break;

      case 'heavy_rain':
        rain *= event.severity === 'severe' ? 8 : 4;
        temp -= 2;
        radiation -= 3;
        break;

      case 'heatwave':
        temp += event.severity === 'severe' ? 8 : 5;
        rain *= 0.5;
        radiation += 3;
        break;
    }

    return { temp, rain, radiation };
  }

  /**
   * Calculate humidity from temp and rain
   */
  calculateHumidity(temp, rain) {
    // Inverse relationship with temperature
    // Direct relationship with rainfall
    let humidity = 70 - (temp - 25) * 2 + rain * 2;
    return Math.max(30, Math.min(95, humidity));
  }

  /**
   * Generate full season weather forecast
   */
  generateSeasonForecast(days = 90) {
    const forecast = [];

    for (let day = 1; day <= days; day++) {
      forecast.push(this.getDailyWeather(day));
    }

    return forecast;
  }

  /**
   * Get weather statistics for the season
   */
  getSeasonStatistics(forecast) {
    const temps = forecast.map(d => d.temp);
    const rains = forecast.map(d => d.rain);
    const radiations = forecast.map(d => d.radiation);

    const totalRain = rains.reduce((sum, r) => sum + r, 0);
    const rainyDays = rains.filter(r => r > 1).length;
    const droughtDays = forecast.filter(d => d.event === 'drought').length;
    const heatwaveDays = forecast.filter(d => d.event === 'heatwave').length;

    return {
      temperature: {
        avg: Math.round(temps.reduce((s, t) => s + t, 0) / temps.length * 10) / 10,
        min: Math.round(Math.min(...temps) * 10) / 10,
        max: Math.round(Math.max(...temps) * 10) / 10
      },
      precipitation: {
        total: Math.round(totalRain * 10) / 10,
        avg: Math.round(totalRain / forecast.length * 10) / 10,
        rainyDays,
        maxDaily: Math.round(Math.max(...rains) * 10) / 10
      },
      radiation: {
        avg: Math.round(radiations.reduce((s, r) => s + r, 0) / radiations.length * 10) / 10,
        total: Math.round(radiations.reduce((s, r) => s + r, 0))
      },
      events: {
        droughtDays,
        heatwaveDays,
        heavyRainDays: forecast.filter(d => d.event === 'heavy_rain').length,
        optimalDays: forecast.length - droughtDays - heatwaveDays - forecast.filter(d => d.event === 'heavy_rain').length
      }
    };
  }

  /**
   * Reset weather engine (for new simulation)
   */
  reset() {
    this.weatherPattern = null;
    this.patternStartDay = 0;
    this.patternDuration = 0;
    this.weatherCache = {};
  }

  /**
   * Get weather risk assessment
   */
  getWeatherRisk(forecast) {
    const stats = this.getSeasonStatistics(forecast);
    const risks = [];

    // Drought risk
    if (stats.events.droughtDays > 15) {
      risks.push({
        type: 'drought',
        severity: 'high',
        message: `${stats.events.droughtDays} jours de sécheresse prévus`,
        recommendation: 'Irrigation intensive recommandée'
      });
    } else if (stats.events.droughtDays > 7) {
      risks.push({
        type: 'drought',
        severity: 'moderate',
        message: `${stats.events.droughtDays} jours de sécheresse prévus`,
        recommendation: 'Prévoir irrigation supplémentaire'
      });
    }

    // Heatwave risk
    if (stats.events.heatwaveDays > 10) {
      risks.push({
        type: 'heatwave',
        severity: 'high',
        message: `${stats.events.heatwaveDays} jours de canicule prévus`,
        recommendation: 'Irrigation accrue, variétés tolérantes à la chaleur'
      });
    }

    // Heavy rain risk
    if (stats.precipitation.maxDaily > 50) {
      risks.push({
        type: 'flooding',
        severity: 'moderate',
        message: `Pluie intense jusqu'à ${stats.precipitation.maxDaily} mm/jour`,
        recommendation: 'Drainage adéquat nécessaire'
      });
    }

    // Optimal conditions
    if (risks.length === 0) {
      risks.push({
        type: 'optimal',
        severity: 'low',
        message: 'Conditions météo favorables prévues',
        recommendation: 'Conditions idéales pour la culture'
      });
    }

    return {
      overallRisk: this.calculateOverallRisk(risks),
      risks,
      statistics: stats
    };
  }

  /**
   * Calculate overall risk level
   */
  calculateOverallRisk(risks) {
    const highRisks = risks.filter(r => r.severity === 'high').length;
    const moderateRisks = risks.filter(r => r.severity === 'moderate').length;

    if (highRisks > 1) return 'very_high';
    if (highRisks > 0) return 'high';
    if (moderateRisks > 1) return 'moderate';
    if (moderateRisks > 0) return 'low';
    return 'very_low';
  }
}
