/**
 * test-simulation.js
 * Test script for DSSAT-like simulation engine
 */

import { SimulationEngine } from './SimulationEngine.js';
import { WeatherEngine } from './WeatherEngine.js';

// Mock crop data (Maize)
const maizeCrop = {
  id: 'maize',
  name: 'Maïs',
  maxYield: 12.0, // t/ha
  harvestIndex: 0.50,
  baseTemp: 10,
  optTemp: 28,
  maxTemp: 35,
  growth: {
    stages: [
      { name: 'Germination', days: 7, description: 'Émergence' },
      { name: 'Végétation', days: 35, description: 'Croissance végétative' },
      { name: 'Floraison', days: 20, description: 'Floraison et pollinisation' },
      { name: 'Remplissage', days: 20, description: 'Remplissage des grains' },
      { name: 'Maturation', days: 8, description: 'Maturité physiologique' }
    ]
  },
  waterNeed: { min: 40, optimal: 60, max: 80 },
  npkNeed: { min: 60, optimal: 100, max: 140 },
  phRange: { min: 5.5, optimal: 6.5, max: 7.5 }
};

// Mock NASA data
const nasaData = {
  temperature: {
    locations: [{
      city: 'Parakou',
      temperature: { current_c: 28 }
    }]
  },
  precipitation: {
    locations: [{
      city: 'Parakou',
      precipitation: { daily_avg_mm: 4 }
    }]
  }
};

console.log('='.repeat(80));
console.log('DSSAT-LIKE CROP SIMULATION ENGINE - TEST REPORT');
console.log('='.repeat(80));
console.log('');

// Test 1: Optimal management
console.log('TEST 1: OPTIMAL MANAGEMENT');
console.log('-'.repeat(80));

const weatherEngine1 = new WeatherEngine(nasaData, 'Parakou');
const sim1 = new SimulationEngine(maizeCrop, nasaData, weatherEngine1);

const result1 = sim1.runFullSimulation({
  irrigation: 60,
  npk: 100,
  ph: 6.5,
  duration: 90
});

console.log('\nSummary:');
console.log(`  Final Yield: ${result1.summary.finalYield} t/ha (${result1.summary.yieldPercentage}% of potential)`);
console.log(`  Total Biomass: ${result1.summary.totalBiomass} kg/ha`);
console.log(`  Final NDVI: ${result1.summary.finalNDVI}`);
console.log(`  Harvest Index: ${result1.summary.harvestIndex}`);

console.log('\nPerformance Metrics:');
console.log(`  Overall Health: ${result1.performance.overallHealth}%`);
console.log(`  Avg Water Stress: ${result1.performance.avgWaterStress}%`);
console.log(`  Avg Nutrient Stress: ${result1.performance.avgNutrientStress}%`);
console.log(`  Avg Temperature Stress: ${result1.performance.avgTempStress}%`);
console.log(`  Stress Days: ${result1.performance.stressDays}/${result1.summary.duration}`);
console.log(`  Stress-Free %: ${result1.performance.stressFreePercentage}%`);

console.log('\nWeather Events:');
result1.events.slice(0, 5).forEach(event => {
  console.log(`  Day ${event.day}: ${event.type} (${event.severity}) - ${event.description}`);
});
if (result1.events.length > 5) {
  console.log(`  ... and ${result1.events.length - 5} more events`);
}

console.log('\nSnapshots (Timeline):');
result1.snapshots.forEach(snap => {
  console.log(`  Day ${snap.day} (${snap.phenoStage}): NDVI=${snap.ndvi}, LAI=${snap.lai}, Moisture=${snap.soilMoisture}% - ${snap.status.text}`);
});

console.log('\n');

// Test 2: Poor management (low irrigation, low NPK)
console.log('TEST 2: POOR MANAGEMENT (Low irrigation, Low NPK)');
console.log('-'.repeat(80));

const weatherEngine2 = new WeatherEngine(nasaData, 'Parakou');
const sim2 = new SimulationEngine(maizeCrop, nasaData, weatherEngine2);

const result2 = sim2.runFullSimulation({
  irrigation: 20,
  npk: 40,
  ph: 6.5,
  duration: 90
});

console.log('\nSummary:');
console.log(`  Final Yield: ${result2.summary.finalYield} t/ha (${result2.summary.yieldPercentage}% of potential)`);
console.log(`  Total Biomass: ${result2.summary.totalBiomass} kg/ha`);
console.log(`  Final NDVI: ${result2.summary.finalNDVI}`);

console.log('\nPerformance Metrics:');
console.log(`  Overall Health: ${result2.performance.overallHealth}%`);
console.log(`  Avg Water Stress: ${result2.performance.avgWaterStress}%`);
console.log(`  Avg Nutrient Stress: ${result2.performance.avgNutrientStress}%`);
console.log(`  Stress Days: ${result2.performance.stressDays}/${result2.summary.duration}`);

console.log('\nTop 5 Critical Events:');
result2.events.slice(0, 5).forEach(event => {
  console.log(`  Day ${event.day}: ${event.type} - ${event.description}`);
});

console.log('\n');

// Test 3: Weather engine standalone test
console.log('TEST 3: WEATHER ENGINE');
console.log('-'.repeat(80));

const weatherEngine3 = new WeatherEngine(nasaData, 'Parakou');
const forecast = weatherEngine3.generateSeasonForecast(90);
const weatherRisk = weatherEngine3.getWeatherRisk(forecast);

console.log('\nSeason Statistics:');
console.log(`  Temperature: ${weatherRisk.statistics.temperature.avg}°C (${weatherRisk.statistics.temperature.min}°C - ${weatherRisk.statistics.temperature.max}°C)`);
console.log(`  Total Rainfall: ${weatherRisk.statistics.precipitation.total} mm`);
console.log(`  Rainy Days: ${weatherRisk.statistics.precipitation.rainyDays}`);
console.log(`  Avg Radiation: ${weatherRisk.statistics.radiation.avg} MJ/m²/day`);

console.log('\nWeather Events Distribution:');
console.log(`  Drought Days: ${weatherRisk.statistics.events.droughtDays}`);
console.log(`  Heatwave Days: ${weatherRisk.statistics.events.heatwaveDays}`);
console.log(`  Heavy Rain Days: ${weatherRisk.statistics.events.heavyRainDays}`);
console.log(`  Optimal Days: ${weatherRisk.statistics.events.optimalDays}`);

console.log('\nWeather Risk Assessment:');
console.log(`  Overall Risk: ${weatherRisk.overallRisk}`);
console.log('\n  Identified Risks:');
weatherRisk.risks.forEach(risk => {
  console.log(`    - ${risk.type} (${risk.severity}): ${risk.message}`);
  console.log(`      → ${risk.recommendation}`);
});

console.log('\n');

// Test 4: Daily progression example
console.log('TEST 4: DAILY PROGRESSION SAMPLE (First 10 days)');
console.log('-'.repeat(80));

console.log('\n Day | Stage      | Temp | Rain | NDVI  | LAI  | Biomass | Water% | Nutr% | Status');
console.log('-'.repeat(80));

result1.dailyData.slice(0, 10).forEach(day => {
  const stage = day.phenoStage.padEnd(10);
  const temp = day.temp.toFixed(1).padStart(5);
  const rain = day.rain.toFixed(1).padStart(5);
  const ndvi = day.ndvi.toFixed(2).padStart(6);
  const lai = day.lai.toFixed(2).padStart(5);
  const biomass = Math.round(day.biomass).toString().padStart(8);
  const water = Math.round(day.waterStress * 100).toString().padStart(6);
  const nutr = Math.round(day.nutrientStress * 100).toString().padStart(5);
  const event = day.weatherEvent || 'OK';

  console.log(`  ${day.day.toString().padStart(2)} | ${stage} | ${temp} | ${rain} | ${ndvi} | ${lai} | ${biomass} | ${water} | ${nutr} | ${event}`);
});

console.log('\n');

// Test 5: Comparison table
console.log('TEST 5: MANAGEMENT STRATEGY COMPARISON');
console.log('-'.repeat(80));

const strategies = [
  { name: 'Optimal', irrigation: 60, npk: 100, ph: 6.5 },
  { name: 'Low Water', irrigation: 30, npk: 100, ph: 6.5 },
  { name: 'Low NPK', irrigation: 60, npk: 50, ph: 6.5 },
  { name: 'Poor Both', irrigation: 30, npk: 50, ph: 6.5 },
  { name: 'Excessive', irrigation: 90, npk: 140, ph: 6.5 }
];

console.log('\n Strategy     | Irrig | NPK  | Yield(t/ha) | Yield% | Health | Stress Days');
console.log('-'.repeat(80));

strategies.forEach(strategy => {
  const weather = new WeatherEngine(nasaData, 'Parakou');
  const sim = new SimulationEngine(maizeCrop, nasaData, weather);
  const result = sim.runFullSimulation(strategy);

  const name = strategy.name.padEnd(12);
  const irrig = strategy.irrigation.toString().padStart(5);
  const npk = strategy.npk.toString().padStart(5);
  const yieldVal = result.summary.finalYield.toFixed(1).padStart(11);
  const yieldPct = result.summary.yieldPercentage.toString().padStart(6);
  const health = result.performance.overallHealth.toString().padStart(6);
  const stress = result.performance.stressDays.toString().padStart(11);

  console.log(` ${name} | ${irrig} | ${npk} | ${yieldVal} | ${yieldPct} | ${health} | ${stress}`);
});

console.log('\n');
console.log('='.repeat(80));
console.log('END OF SIMULATION REPORT');
console.log('='.repeat(80));
