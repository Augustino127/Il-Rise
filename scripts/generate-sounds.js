/**
 * generate-sounds.js
 * Génère tous les fichiers audio du jeu en WAV pur Node.js (aucune dépendance)
 * Run: node scripts/generate-sounds.js
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const CHANNELS = 1;
const BIT_DEPTH = 16;

// ─── Primitives audio ────────────────────────────────────────────────────────

function createBuffer(durationSec) {
  return new Float32Array(Math.floor(SAMPLE_RATE * durationSec));
}

// Onde sinusoïdale avec ADSR
function sine(buf, freq, start, duration, amplitude = 0.5, attack = 0.01, decay = 0.05, sustain = 0.8, release = 0.1) {
  const s = Math.floor(start * SAMPLE_RATE);
  const n = Math.floor(duration * SAMPLE_RATE);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const total = duration;
    let env;
    if (t < attack)            env = t / attack;
    else if (t < attack + decay) env = 1 - (1 - sustain) * (t - attack) / decay;
    else if (t < total - release) env = sustain;
    else                        env = sustain * (1 - (t - (total - release)) / release);
    env = Math.max(0, env);
    const idx = s + i;
    if (idx < buf.length) buf[idx] += Math.sin(2 * Math.PI * freq * t) * amplitude * env;
  }
}

// Bruit blanc filtré (passe-bas simple)
function noise(buf, start, duration, amplitude = 0.3, filterCoeff = 0.15) {
  const s = Math.floor(start * SAMPLE_RATE);
  const n = Math.floor(duration * SAMPLE_RATE);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = Math.sin(Math.PI * t); // fade in/out
    const raw = (Math.random() * 2 - 1);
    prev = prev * (1 - filterCoeff) + raw * filterCoeff;
    const idx = s + i;
    if (idx < buf.length) buf[idx] += prev * amplitude * env;
  }
}

// Arpège montant ou descendant
function arpeggio(buf, freqs, noteDuration, amplitude = 0.4) {
  freqs.forEach((freq, i) => {
    sine(buf, freq, i * noteDuration, noteDuration, amplitude, 0.005, 0.05, 0.7, 0.15);
  });
}

// Clip to [-1, 1]
function normalize(buf) {
  let max = 0;
  for (let i = 0; i < buf.length; i++) max = Math.max(max, Math.abs(buf[i]));
  if (max > 0.98) for (let i = 0; i < buf.length; i++) buf[i] = (buf[i] / max) * 0.95;
}

// ─── Encodeur WAV ────────────────────────────────────────────────────────────

function toWAV(buf) {
  const numSamples = buf.length;
  const dataSize = numSamples * CHANNELS * (BIT_DEPTH / 8);
  const wavBuf = Buffer.alloc(44 + dataSize);

  wavBuf.write('RIFF', 0);
  wavBuf.writeUInt32LE(36 + dataSize, 4);
  wavBuf.write('WAVE', 8);
  wavBuf.write('fmt ', 12);
  wavBuf.writeUInt32LE(16, 16);
  wavBuf.writeUInt16LE(1, 20);         // PCM
  wavBuf.writeUInt16LE(CHANNELS, 22);
  wavBuf.writeUInt32LE(SAMPLE_RATE, 24);
  wavBuf.writeUInt32LE(SAMPLE_RATE * CHANNELS * (BIT_DEPTH / 8), 28);
  wavBuf.writeUInt16LE(CHANNELS * (BIT_DEPTH / 8), 32);
  wavBuf.writeUInt16LE(BIT_DEPTH, 34);
  wavBuf.write('data', 36);
  wavBuf.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, buf[i]));
    const int16 = Math.floor(s * 32767);
    wavBuf.writeInt16LE(int16, 44 + i * 2);
  }
  return wavBuf;
}

function save(relativePath, buf) {
  normalize(buf);
  const fullPath = path.join(__dirname, '..', 'public', relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, toWAV(buf));
  console.log(`✅ ${relativePath}`);
}

// ─── Génération des sons ─────────────────────────────────────────────────────

// ── UI ──
{
  // click — clic sec 50ms
  const b = createBuffer(0.06);
  sine(b, 800, 0, 0.04, 0.4, 0.002, 0.01, 0.3, 0.025);
  save('assets/audio/ui/click.wav', b);

  // hover — très discret
  const h = createBuffer(0.04);
  sine(h, 1200, 0, 0.03, 0.12, 0.002, 0.005, 0.2, 0.02);
  save('assets/audio/ui/hover.wav', h);

  // success — ding montant
  const s = createBuffer(0.4);
  sine(s, 523, 0,    0.12, 0.45, 0.005, 0.02, 0.7, 0.08);
  sine(s, 659, 0.10, 0.12, 0.45, 0.005, 0.02, 0.7, 0.08);
  sine(s, 784, 0.20, 0.18, 0.45, 0.005, 0.02, 0.7, 0.12);
  save('assets/audio/ui/success.wav', s);

  // error — descente grave
  const e = createBuffer(0.35);
  sine(e, 300, 0,    0.12, 0.4, 0.005, 0.02, 0.7, 0.08);
  sine(e, 220, 0.10, 0.22, 0.4, 0.005, 0.02, 0.5, 0.12);
  save('assets/audio/ui/error.wav', e);

  // notification — pop doux
  const n = createBuffer(0.18);
  sine(n, 880, 0, 0.06, 0.35, 0.003, 0.02, 0.5, 0.1);
  sine(n, 1100, 0.06, 0.10, 0.25, 0.003, 0.02, 0.4, 0.07);
  save('assets/audio/ui/notification.wav', n);
}

// ── Game ──
{
  // coin — cling métallique
  const c = createBuffer(0.25);
  sine(c, 1568, 0, 0.08, 0.5, 0.001, 0.03, 0.4, 0.14);
  sine(c, 2093, 0.03, 0.08, 0.3, 0.001, 0.02, 0.3, 0.1);
  save('assets/audio/game/coin.wav', c);

  // xp — sparkle
  const x = createBuffer(0.2);
  sine(x, 1046, 0,    0.06, 0.3, 0.002, 0.01, 0.5, 0.05);
  sine(x, 1318, 0.05, 0.06, 0.3, 0.002, 0.01, 0.5, 0.05);
  sine(x, 1568, 0.10, 0.08, 0.35, 0.002, 0.01, 0.5, 0.06);
  save('assets/audio/game/xp.wav', x);

  // level-up — fanfare montante (1.5s)
  const lu = createBuffer(1.6);
  const melody = [523, 659, 784, 1046, 784, 1046, 1318];
  melody.forEach((freq, i) => {
    const dur = i < melody.length - 1 ? 0.15 : 0.5;
    sine(lu, freq, i * 0.15, dur, 0.5, 0.01, 0.03, 0.8, 0.08);
    // Harmonique
    sine(lu, freq * 1.5, i * 0.15, dur * 0.7, 0.2, 0.01, 0.02, 0.6, 0.06);
  });
  save('assets/audio/game/level-up.wav', lu);

  // achievement — court + brillant
  const ach = createBuffer(0.9);
  [523, 659, 784, 1046].forEach((freq, i) => {
    sine(ach, freq, i * 0.12, 0.2, 0.45, 0.005, 0.02, 0.75, 0.1);
  });
  sine(ach, 1318, 0.48, 0.4, 0.5, 0.01, 0.03, 0.8, 0.15);
  save('assets/audio/game/achievement.wav', ach);
}

// ── Farm actions ──
{
  // plow — grondement sourd + bruit
  const pl = createBuffer(0.6);
  noise(pl, 0, 0.6, 0.5, 0.08);
  sine(pl, 80,  0,    0.3, 0.4, 0.02, 0.1, 0.6, 0.15);
  sine(pl, 120, 0.1,  0.3, 0.3, 0.02, 0.1, 0.5, 0.15);
  save('assets/audio/farm/plow.wav', pl);

  // plant — pop doux + froufrout
  const pt = createBuffer(0.25);
  noise(pt, 0, 0.15, 0.2, 0.25);
  sine(pt, 440, 0.05, 0.12, 0.25, 0.005, 0.02, 0.4, 0.08);
  save('assets/audio/farm/plant.wav', pt);

  // water — ruissellement (bruit filtré grave)
  const wa = createBuffer(0.5);
  noise(wa, 0, 0.5, 0.45, 0.06);
  sine(wa, 200, 0, 0.3, 0.2, 0.05, 0.1, 0.7, 0.15);
  save('assets/audio/farm/water.wav', wa);

  // harvest — froissement
  const hv = createBuffer(0.55);
  noise(hv, 0, 0.55, 0.4, 0.12);
  sine(hv, 350, 0.1, 0.25, 0.3, 0.02, 0.05, 0.6, 0.15);
  save('assets/audio/farm/harvest.wav', hv);

  // fertilize — dispersion douce
  const fe = createBuffer(0.35);
  noise(fe, 0, 0.35, 0.3, 0.2);
  sine(fe, 600, 0, 0.2, 0.2, 0.02, 0.05, 0.5, 0.1);
  save('assets/audio/farm/fertilize.wav', fe);

  // weed — arrachage
  const wd = createBuffer(0.3);
  noise(wd, 0, 0.2, 0.45, 0.15);
  noise(wd, 0.18, 0.1, 0.3, 0.1);
  save('assets/audio/farm/weed.wav', wd);

  // spray — vaporisateur hiss
  const sp = createBuffer(0.4);
  noise(sp, 0, 0.4, 0.35, 0.3);
  // Léger sifflement
  sine(sp, 3000, 0, 0.3, 0.1, 0.02, 0.05, 0.6, 0.1);
  save('assets/audio/farm/spray.wav', sp);
}

// ── Ambiances (3s loop) ──
{
  // birds — gazouillis synthétiques
  const br = createBuffer(3.0);
  const birdFreqs = [1200, 1500, 1800, 1350, 1650, 2000];
  for (let i = 0; i < 8; i++) {
    const t = Math.random() * 2.2;
    const f = birdFreqs[Math.floor(Math.random() * birdFreqs.length)];
    const dur = 0.06 + Math.random() * 0.1;
    sine(br, f, t, dur, 0.15 + Math.random() * 0.1, 0.005, 0.01, 0.6, 0.04);
    sine(br, f * 1.1, t + 0.04, dur * 0.7, 0.1, 0.005, 0.01, 0.5, 0.03);
  }
  // Fond grave léger
  noise(br, 0, 3.0, 0.04, 0.01);
  save('assets/audio/ambient/birds.wav', br);

  // wind — bruit grave filtré
  const wi = createBuffer(3.0);
  noise(wi, 0, 3.0, 0.3, 0.03);
  sine(wi, 60,  0, 3.0, 0.15, 0.3, 0.5, 0.8, 0.3);
  sine(wi, 100, 0, 3.0, 0.1,  0.3, 0.5, 0.7, 0.3);
  save('assets/audio/ambient/wind.wav', wi);

  // rain — pluie (bruit dense)
  const ra = createBuffer(3.0);
  noise(ra, 0, 3.0, 0.5, 0.18);
  // Quelques gouttes
  for (let i = 0; i < 20; i++) {
    const t = Math.random() * 2.8;
    noise(ra, t, 0.05, 0.3, 0.4);
  }
  save('assets/audio/ambient/rain.wav', ra);
}

// ── Musiques de fond (8s loop simple) ──
{
  // menu — mélodie calme
  const menu = createBuffer(8.0);
  const menuMelody = [
    [392, 0.0], [440, 0.5], [494, 1.0], [523, 1.5],
    [494, 2.5], [440, 3.0], [392, 3.5], [349, 4.0],
    [392, 5.0], [440, 5.5], [494, 6.0], [523, 6.5],
  ];
  menuMelody.forEach(([freq, t]) => {
    sine(menu, freq,       t, 0.45, 0.18, 0.02, 0.05, 0.7, 0.1);
    sine(menu, freq / 2,   t, 0.45, 0.1,  0.02, 0.05, 0.6, 0.1);
  });
  noise(menu, 0, 8.0, 0.02, 0.005); // fond très discret
  save('assets/audio/music/menu.wav', menu);

  // farm — boucle agricole douce
  const farm = createBuffer(8.0);
  const farmMelody = [
    [261, 0.0], [294, 0.6], [330, 1.2], [349, 1.8],
    [330, 2.5], [294, 3.1], [261, 3.7],
    [261, 4.5], [294, 5.1], [330, 5.7], [392, 6.3], [349, 7.0],
  ];
  farmMelody.forEach(([freq, t]) => {
    sine(farm, freq,     t, 0.55, 0.2,  0.02, 0.06, 0.65, 0.12);
    sine(farm, freq * 2, t, 0.4,  0.08, 0.02, 0.04, 0.5,  0.1);
  });
  save('assets/audio/music/farm.wav', farm);

  // game — plus rythmé / tendu
  const game = createBuffer(8.0);
  const gameMelody = [
    [440, 0.0], [494, 0.3], [523, 0.6], [587, 0.9],
    [659, 1.2], [587, 1.5], [523, 1.8], [494, 2.1],
    [440, 2.5], [494, 2.8], [523, 3.1], [587, 3.4],
    [659, 3.8], [698, 4.3], [659, 4.8], [587, 5.3],
    [523, 5.8], [494, 6.3], [440, 6.8],
  ];
  gameMelody.forEach(([freq, t]) => {
    sine(game, freq,       t, 0.25, 0.22, 0.01, 0.03, 0.75, 0.06);
    sine(game, freq * 0.5, t, 0.25, 0.12, 0.01, 0.03, 0.6,  0.06);
  });
  save('assets/audio/music/game.wav', game);
}

console.log('\n🎵 Tous les sons ont été générés dans public/assets/audio/');
console.log('📁 Structure :');
console.log('   ui/      → click, hover, success, error, notification');
console.log('   game/    → coin, xp, level-up, achievement');
console.log('   farm/    → plow, plant, water, harvest, fertilize, weed, spray');
console.log('   ambient/ → birds, wind, rain');
console.log('   music/   → menu, farm, game');
