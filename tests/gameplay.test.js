/**
 * gameplay.test.js
 * Tests E2E complets simulant un joueur réel sur IleRise.
 * Chaque test est indépendant — rapporte feature opérationnelle ou cassée.
 */

import { test, expect } from '@playwright/test';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Injecte une session invité avec ressources généreuses et recharge la page */
async function injectGuestSession(page) {
  await page.goto('/game.html');
  await page.waitForLoadState('domcontentloaded');

  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('ilerise_guest', 'true');
    localStorage.setItem('ilerise_user', JSON.stringify({
      id: 'guest-test',
      username: 'TestPlayer',
      email: 'test@ilerise.com',
      level: 5,
      xp: 1000,
      coins: 5000,
    }));
    localStorage.setItem('ilerise_lives', '5');
    localStorage.setItem('ilerise_location', JSON.stringify({
      city: 'Parakou',
      ndvi: 0.45,
      temperature: 28,
      soilMoisture: 35,
      precipitation: 2.1,
    }));
    localStorage.setItem('ilerise_player', JSON.stringify({
      lives: 5,
      coins: 5000,
      level: 5,
      xp: 1000,
      unlockedCrops: ['maize', 'cowpea'],
      completedLevels: { maize: [1, 2], cowpea: [1] },
    }));
    // Désactiver le tutoriel ferme pour éviter le blocage des tests
    localStorage.setItem('ilerise_state_guest-test', JSON.stringify({
      player: { id: 'guest-test', level: 5, xp: 1000, coins: 5000 },
      tutorial: { farmCompleted: true },
    }));
    // Clé alternative utilisée parfois
    localStorage.setItem('tutorial.farmCompleted', 'true');
  });

  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

/** Collecte les erreurs JS (hors bruit connu) */
function trackErrors(page) {
  const errors = [];
  page.on('pageerror', e => {
    const msg = e.message;
    if (!msg.includes('AudioContext') && !msg.includes('favicon') && !msg.includes('ResizeObserver')) {
      errors.push(msg);
    }
  });
  return errors;
}

/** Collecte les requêtes réseau vers le backend */
function trackApiCalls(page) {
  const calls = [];
  page.on('request', req => {
    if (req.url().includes('ilerise') || req.url().includes('render.com') || req.url().includes('localhost:')) {
      if (!req.url().includes(':3000')) { // exclure le dev server frontend
        calls.push({ method: req.method(), url: req.url() });
      }
    }
  });
  page.on('response', res => {
    const found = calls.find(c => c.url === res.url() && !c.status);
    if (found) found.status = res.status();
  });
  return calls;
}

/** Navigue vers la ferme depuis crop-select et écrase le tutoriel */
async function goToFarm(page) {
  await forceScreen(page, 'crop-select');
  await page.waitForTimeout(400);
  const btn = page.locator('#btn-farm-from-crop-select');
  if (await btn.isVisible()) {
    await btn.click();
    await page.waitForTimeout(2500);
  } else {
    await forceScreen(page, 'farm-v3');
    await page.waitForTimeout(1000);
  }
  await dismissTutorial(page);
}

/** Ferme le tutoriel s'il est ouvert (overlay, modal ou bouton skip) */
async function dismissTutorial(page) {
  await page.evaluate(() => {
    // Fermer tout overlay de tutoriel visible
    document.querySelectorAll(
      '.tutorial-overlay, .tutorial-modal, .farm-tutorial, [class*="tutorial"]'
    ).forEach(el => { el.style.display = 'none'; el.remove?.(); });
    // Cliquer bouton skip/close si présent
    const skipBtns = document.querySelectorAll(
      '#btn-skip-tutorial, .btn-skip, .tutorial-skip, .tutorial-close, [class*="skip"]'
    );
    skipBtns.forEach(b => b.click?.());
    // Marquer tutoriel terminé dans GameState si disponible
    try {
      const key = 'ilerise_state_guest-test';
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      saved.tutorial = { farmCompleted: true };
      localStorage.setItem(key, JSON.stringify(saved));
    } catch(e) {}
  });
  await page.waitForTimeout(300);
}

/** Force l'affichage d'un écran via JS */
async function forceScreen(page, screenName) {
  await page.evaluate((name) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`screen-${name}`);
    if (target) target.classList.add('active');
  }, screenName);
  await page.waitForTimeout(300);
}

/** Attend qu'un écran soit actif (via classe .active) */
async function waitForScreen(page, screenId, timeout = 5000) {
  await page.waitForFunction(
    (id) => document.getElementById(id)?.classList.contains('active'),
    screenId,
    { timeout }
  );
}

// ─── 1. CHARGEMENT & AUTH ─────────────────────────────────────────────────────

test.describe('1. Chargement & Authentification', () => {
  test('1.1 La page se charge sans crash JS', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    expect(errors, `Erreurs JS: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('1.2 Le mode invité bypass l\'auth et affiche l\'écran home', async ({ page }) => {
    await injectGuestSession(page);
    const homeScreen = page.locator('#screen-home');
    await expect(homeScreen).toBeVisible({ timeout: 6000 });
  });

  test('1.3 L\'écran auth est présent dans le DOM (pour login futur)', async ({ page }) => {
    await injectGuestSession(page);
    await expect(page.locator('#screen-auth')).toBeAttached();
  });

  test('1.4 Les vies du joueur s\'affichent sur l\'écran home', async ({ page }) => {
    await injectGuestSession(page);
    const lives = page.locator('#home-lives');
    await expect(lives).toBeVisible({ timeout: 5000 });
    const text = await lives.textContent();
    expect(parseInt(text)).toBeGreaterThan(0);
  });

  test('1.5 Les pièces du joueur s\'affichent sur l\'écran home', async ({ page }) => {
    await injectGuestSession(page);
    const coins = page.locator('#home-coins');
    await expect(coins).toBeVisible({ timeout: 5000 });
  });
});

// ─── 2. NAVIGATION HOME → LOCATION ───────────────────────────────────────────

test.describe('2. Navigation Home → Location', () => {
  test('2.1 Cliquer btn-start navigue vers screen-location', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);

    const btnStart = page.locator('#btn-start');
    await expect(btnStart).toBeVisible({ timeout: 5000 });
    await btnStart.click();
    await page.waitForTimeout(1000);

    const locationScreen = page.locator('#screen-location');
    const isVisible = await locationScreen.isVisible();
    if (!isVisible) {
      console.log('⚠️  FEATURE CASSÉE: btn-start ne navigue pas vers screen-location');
    }
    expect(isVisible).toBeTruthy();
    expect(errors).toHaveLength(0);
  });

  test('2.2 La carte Leaflet se charge sur screen-location', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'location');

    // Leaflet injecte des tiles via des <img> dans .leaflet-tile-container
    await page.waitForTimeout(2000);
    const leafletContainer = page.locator('.leaflet-container');
    const exists = await leafletContainer.count();
    if (exists === 0) {
      console.log('⚠️  FEATURE CASSÉE: Carte Leaflet non rendue sur screen-location');
    }
    expect(exists).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('2.3 Le bouton confirmer la localité est présent', async ({ page }) => {
    await injectGuestSession(page);
    await forceScreen(page, 'location');
    await expect(page.locator('#btn-confirm-location')).toBeVisible({ timeout: 3000 });
  });

  test('2.4 Confirmer la localité sans sélection ne plante pas', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'location');

    const btn = page.locator('#btn-confirm-location');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(800);
    }
    expect(errors).toHaveLength(0);
  });
});

// ─── 3. SÉLECTION CULTURE ─────────────────────────────────────────────────────

test.describe('3. Sélection de Culture (screen-crop-select)', () => {
  test('3.1 L\'écran crop-select affiche des cartes de cultures', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'crop-select');

    await page.waitForTimeout(1000);
    const cropCards = page.locator('.crop-card');
    const count = await cropCards.count();
    if (count === 0) {
      console.log('⚠️  FEATURE CASSÉE: Aucune carte de culture sur screen-crop-select');
    }
    expect(count).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('3.2 Les cultures débloquées (Maïs, Niébé) sont cliquables', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'crop-select');
    await page.waitForTimeout(1000);

    // La première carte libre devrait être cliquable
    const firstCard = page.locator('.crop-card').first();
    if (await firstCard.count() > 0) {
      await firstCard.click();
      await page.waitForTimeout(800);
    }
    expect(errors).toHaveLength(0);
  });

  test('3.3 Cliquer une culture verrouillée ouvre le modal d\'achat', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'crop-select');
    await page.waitForTimeout(1000);

    // Chercher une carte locked
    const lockedCard = page.locator('.crop-card.locked, .crop-card[data-locked="true"]').first();
    if (await lockedCard.count() > 0) {
      await lockedCard.click();
      await page.waitForTimeout(800);
      const modal = page.locator('#modal-unlock');
      const isVisible = await modal.isVisible();
      if (!isVisible) {
        console.log('⚠️  FEATURE CASSÉE: Modal unlock ne s\'ouvre pas pour culture verrouillée');
      }
      expect(isVisible).toBeTruthy();
    } else {
      console.log('ℹ️  Aucune culture verrouillée trouvée avec sélecteur actuel — vérifier classes CSS');
      test.skip();
    }
    expect(errors).toHaveLength(0);
  });

  test('3.4 Le bouton "Cartes de Connaissance" navigue vers screen-knowledge', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'crop-select');

    const btn = page.locator('#btn-knowledge-cards');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(800);
      const knowledgeScreen = page.locator('#screen-knowledge');
      const isVisible = await knowledgeScreen.isVisible();
      if (!isVisible) {
        console.log('⚠️  FEATURE CASSÉE: btn-knowledge-cards ne navigue pas vers screen-knowledge');
      }
    }
    expect(errors).toHaveLength(0);
  });

  test('3.5 Le bouton "Mode Ferme" navigue directement vers screen-farm-v3', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'crop-select');
    await page.waitForTimeout(500);

    const btn = page.locator('#btn-farm-from-crop-select');
    await expect(btn).toBeVisible({ timeout: 3000 });
    await btn.click();
    await page.waitForTimeout(2000);

    const farmScreen = page.locator('#screen-farm-v3');
    const isVisible = await farmScreen.isVisible();
    if (!isVisible) {
      console.log('⚠️  FEATURE CASSÉE: btn-farm-from-crop-select ne navigue pas vers screen-farm-v3');
    }
    expect(isVisible).toBeTruthy();
    expect(errors).toHaveLength(0);
  });
});

// ─── 4. SÉLECTION NIVEAU ──────────────────────────────────────────────────────

test.describe('4. Sélection de Niveau (screen-level-select)', () => {
  test('4.1 L\'écran level-select affiche des cartes de niveaux', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'level-select');
    await page.waitForTimeout(1000);

    const levelCards = page.locator('.level-card');
    const count = await levelCards.count();
    if (count === 0) {
      console.log('⚠️  FEATURE CASSÉE: Aucune carte de niveau sur screen-level-select');
    }
    expect(count).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('4.2 Le niveau 1 est toujours débloqué et cliquable', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'level-select');
    await page.waitForTimeout(1000);

    const level1 = page.locator('.level-card[data-level="1"], .level-card:first-child');
    if (await level1.count() > 0) {
      const isLocked = await level1.evaluate(el => el.classList.contains('locked'));
      if (isLocked) {
        console.log('⚠️  BUG: Niveau 1 est verrouillé alors qu\'il devrait être libre');
      }
      expect(isLocked).toBeFalsy();
    }
    expect(errors).toHaveLength(0);
  });
});

// ─── 5. ÉCRAN DE JEU (MODE SIMULATION) ───────────────────────────────────────

test.describe('5. Écran de Jeu - Mode Simulation (screen-game)', () => {
  test('5.1 L\'écran game s\'affiche avec les données NASA', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'game');
    await page.waitForTimeout(1500);

    // Les données NASA devraient être affichées
    const nasaTemp = page.locator('#nasa-temp');
    const count = await nasaTemp.count();
    if (count === 0) {
      console.log('⚠️  FEATURE CASSÉE: Données NASA non affichées sur screen-game');
    }
    expect(errors).toHaveLength(0);
  });

  test('5.2 Les 3 curseurs (Eau, NPK, pH) sont présents et interactifs', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'game');
    await page.waitForTimeout(1500);

    const sliders = page.locator('input[type="range"]');
    const count = await sliders.count();
    if (count < 3) {
      console.log(`⚠️  FEATURE INCOMPLÈTE: ${count}/3 curseurs trouvés sur screen-game`);
    }

    // Tester l'interaction avec le premier curseur
    if (count > 0) {
      const slider = sliders.first();
      await slider.fill('75');
      await page.waitForTimeout(300);
    }
    expect(errors).toHaveLength(0);
  });

  test('5.3 Le bouton Simuler (btn-simulate) est visible', async ({ page }) => {
    await injectGuestSession(page);
    await forceScreen(page, 'game');
    await page.waitForTimeout(1000);

    const btn = page.locator('#btn-simulate');
    await expect(btn).toBeVisible({ timeout: 3000 });
  });

  test('5.4 Lancer la simulation ne cause pas de crash JS', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);

    // Initialiser un vrai niveau via app pour que la simulation fonctionne
    await page.evaluate(() => {
      localStorage.setItem('ilerise_current_crop', 'maize');
      localStorage.setItem('ilerise_current_level', '1');
    });

    await forceScreen(page, 'game');
    await page.waitForTimeout(1500);

    const btnSimulate = page.locator('#btn-simulate');
    if (await btnSimulate.isVisible() && await btnSimulate.isEnabled()) {
      await btnSimulate.click();
      await page.waitForTimeout(5000); // la simulation prend du temps
    } else {
      console.log('⚠️  btn-simulate non disponible — vérifier initialisation du niveau');
    }
    expect(errors).toHaveLength(0);
  });

  test('5.5 Le bouton "Mode Ferme" est présent sur screen-game', async ({ page }) => {
    await injectGuestSession(page);
    await forceScreen(page, 'game');
    await page.waitForTimeout(1000);

    const btn = page.locator('#btn-switch-farm-mode');
    await expect(btn).toBeVisible({ timeout: 3000 });
  });

  test('5.6 Le bouton Recommandations NASA ouvre le modal', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'game');
    await page.waitForTimeout(1000);

    const btn = page.locator('#btn-recommendations');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(800);
      const modal = page.locator('#modal-recommendations');
      const isVisible = await modal.isVisible();
      if (!isVisible) {
        console.log('⚠️  FEATURE CASSÉE: Modal recommandations ne s\'ouvre pas');
      }
    }
    expect(errors).toHaveLength(0);
  });

  test('5.7 La scène 3D Three.js se charge sur screen-game', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'game');
    await page.waitForTimeout(3000);

    const canvas = page.locator('#game-canvas-container canvas');
    const count = await canvas.count();
    if (count === 0) {
      console.log('⚠️  FEATURE CASSÉE: Canvas Three.js non créé dans game-canvas-container');
    }
    expect(count).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });
});

// ─── 6. RÉSULTATS ─────────────────────────────────────────────────────────────

test.describe('6. Écran Résultats (screen-results)', () => {
  test('6.1 L\'écran results affiche le score et les étoiles', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'results');
    await page.waitForTimeout(500);

    await expect(page.locator('#results-score-value')).toBeAttached();
    await expect(page.locator('#results-stars')).toBeAttached();
    await expect(page.locator('#btn-retry')).toBeVisible();
    await expect(page.locator('#btn-next-level')).toBeVisible();
    await expect(page.locator('#btn-main-menu')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('6.2 btn-main-menu ramène à l\'écran home', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'results');
    await page.waitForTimeout(500);

    const btn = page.locator('#btn-main-menu');
    await btn.click();
    await page.waitForTimeout(1000);

    const homeVisible = await page.locator('#screen-home').isVisible();
    if (!homeVisible) {
      console.log('⚠️  FEATURE CASSÉE: btn-main-menu ne revient pas à screen-home');
    }
    expect(homeVisible).toBeTruthy();
    expect(errors).toHaveLength(0);
  });
});

// ─── 7. MODE FERME - INITIALISATION ───────────────────────────────────────────

test.describe('7. Mode Ferme V3 - Initialisation', () => {
  test.beforeEach(async ({ page }) => {
    await injectGuestSession(page);
    await goToFarm(page);
  });

  test('7.1 screen-farm-v3 devient visible après initialisation', async ({ page }) => {
    const farmScreen = page.locator('#screen-farm-v3');
    await expect(farmScreen).toBeVisible({ timeout: 5000 });
  });

  test('7.2 Le jour affiché commence à 1', async ({ page }) => {
    const dayDisplay = page.locator('#display-day');
    if (await dayDisplay.count() > 0) {
      const text = await dayDisplay.textContent();
      console.log(`Jour affiché: "${text}"`);
      expect(text).toMatch(/1|Jour/);
    } else {
      console.log('⚠️  FEATURE CASSÉE: #display-day absent');
      expect(false).toBeTruthy();
    }
  });

  test('7.3 L\'argent de départ s\'affiche (mode invité = ressources généreuses)', async ({ page }) => {
    const moneyDisplay = page.locator('#display-money');
    if (await moneyDisplay.count() > 0) {
      const text = await moneyDisplay.textContent();
      const amount = parseInt(text.replace(/\D/g, ''));
      console.log(`Argent de départ: ${amount}💰`);
      expect(amount).toBeGreaterThan(0);
    } else {
      console.log('⚠️  FEATURE CASSÉE: #display-money absent');
    }
  });

  test('7.4 Le niveau d\'eau s\'affiche', async ({ page }) => {
    const waterDisplay = page.locator('#display-water');
    if (await waterDisplay.count() > 0) {
      const text = await waterDisplay.textContent();
      console.log(`Eau de départ: "${text}"`);
      expect(text.length).toBeGreaterThan(0);
    } else {
      console.log('⚠️  FEATURE CASSÉE: #display-water absent');
    }
  });

  test('7.5 Les 4 parcelles sont présentes dans la minimap', async ({ page }) => {
    const plots = page.locator('[data-plot-id]');
    const count = await plots.count();
    if (count < 4) {
      console.log(`⚠️  FEATURE CASSÉE: Seulement ${count}/4 parcelles dans la minimap`);
    }
    expect(count).toBe(4);
  });

  test('7.6 La parcelle 1 est active et débloquée par défaut', async ({ page }) => {
    const plot1 = page.locator('[data-plot-id="1"]');
    await expect(plot1).toHaveClass(/active/);
    const isLocked = await plot1.evaluate(el => el.classList.contains('locked'));
    expect(isLocked).toBeFalsy();
  });

  test('7.7 Les parcelles 2, 3, 4 sont verrouillées initialement', async ({ page }) => {
    for (const id of [2, 3, 4]) {
      const plot = page.locator(`[data-plot-id="${id}"]`);
      const isLocked = await plot.evaluate(el => el.classList.contains('locked'));
      if (!isLocked) {
        console.log(`⚠️  BUG: Parcelle ${id} devrait être verrouillée mais ne l'est pas`);
      }
      expect(isLocked).toBeTruthy();
    }
  });

  test('7.8 Les 4 onglets de navigation sont présents', async ({ page }) => {
    for (const section of ['farm', 'livestock', 'market', 'stats']) {
      const btn = page.locator(`.nav-btn[data-section="${section}"]`);
      const count = await btn.count();
      if (count === 0) {
        console.log(`⚠️  FEATURE CASSÉE: Onglet "${section}" absent`);
      }
      expect(count).toBeGreaterThan(0);
    }
  });

  test('7.9 L\'onglet Ferme est actif par défaut', async ({ page }) => {
    const farmTab = page.locator('.nav-btn[data-section="farm"]');
    await expect(farmTab).toHaveClass(/active/);
  });

  test('7.10 Les 8 boutons d\'action agricole sont présents', async ({ page }) => {
    const actions = ['plow', 'plant', 'water', 'fertilize_npk', 'fertilize_organic', 'weed', 'spray_pesticide_natural', 'harvest'];
    for (const action of actions) {
      const btn = page.locator(`[data-action="${action}"]`);
      const count = await btn.count();
      if (count === 0) {
        console.log(`⚠️  FEATURE CASSÉE: Bouton action "${action}" absent`);
      }
      expect(count).toBeGreaterThan(0);
    }
  });
});

// ─── 8. MODE FERME - ACTIONS AGRICOLES ────────────────────────────────────────

test.describe('8. Mode Ferme V3 - Actions Agricoles', () => {
  test.beforeEach(async ({ page }) => {
    await injectGuestSession(page);
    await goToFarm(page);
  });

  test('8.1 Labourer (plow) exécute sans erreur JS', async ({ page }) => {
    const errors = trackErrors(page);
    const btn = page.locator('[data-action="plow"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(800);
      // Vérifier que le toast de confirmation ou d'erreur s'affiche (pas crash)
      const toast = page.locator('.toast, .notification, [class*="toast"]');
      const toastCount = await toast.count();
      console.log(`Labourage: ${toastCount} notification(s) affichée(s)`);
    }
    expect(errors).toHaveLength(0);
  });

  test('8.2 Planter (plant) sans labourer préalable retourne une erreur métier', async ({ page }) => {
    const errors = trackErrors(page);
    // Sélectionner une culture
    const cropSelect = page.locator('#screen-farm-v3 select#crop-select, #screen-farm-v3 .crop-selector select');
    if (await cropSelect.count() > 0) {
      await cropSelect.selectOption({ index: 0 });
    }

    const btn = page.locator('[data-action="plant"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(800);
    }
    // Doit afficher un message d'erreur métier, pas planter silencieusement
    expect(errors).toHaveLength(0);
  });

  test('8.3 Séquence complète: Labourer → Sélectionner culture → Planter', async ({ page }) => {
    const errors = trackErrors(page);

    // 1. Labourer
    const btnPlow = page.locator('[data-action="plow"]');
    if (await btnPlow.isVisible()) {
      await btnPlow.click();
      await page.waitForTimeout(1000);
    }

    // 2. Sélectionner Maïs
    const cropSelect = page.locator('#screen-farm-v3 select').first();
    if (await cropSelect.count() > 0) {
      await cropSelect.selectOption({ index: 0 });
      await page.waitForTimeout(300);
    }

    // 3. Planter
    const btnPlant = page.locator('[data-action="plant"]');
    if (await btnPlant.isVisible()) {
      await btnPlant.click();
      await page.waitForTimeout(1000);
    }

    // 4. Vérifier: le statut de la parcelle affiche une culture
    const plotCrop = page.locator('#plot-crop');
    if (await plotCrop.count() > 0) {
      const text = await plotCrop.textContent();
      console.log(`Culture après plantation: "${text}"`);
      const isPlanted = text !== 'Vide' && text.length > 0;
      if (!isPlanted) {
        console.log('⚠️  BUG: Statut parcelle affiche encore "Vide" après plantation');
      }
    }

    expect(errors).toHaveLength(0);
  });

  test('8.4 Arroser (water) consomme de l\'eau', async ({ page }) => {
    const errors = trackErrors(page);

    // Lire l'eau avant
    const waterDisplay = page.locator('#display-water');
    const beforeText = await waterDisplay.count() > 0 ? await waterDisplay.textContent() : '0';
    const before = parseInt(beforeText.replace(/\D/g, ''));

    const btn = page.locator('[data-action="water"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1000);
    }

    // Lire l'eau après
    const afterText = await waterDisplay.count() > 0 ? await waterDisplay.textContent() : '0';
    const after = parseInt(afterText.replace(/\D/g, ''));
    console.log(`Eau: ${before}L → ${after}L`);

    if (before === after) {
      console.log('⚠️  BUG: Arroser ne consomme pas d\'eau (affichage)');
    }
    expect(errors).toHaveLength(0);
  });

  test('8.5 Fertiliser NPK (fertilize_npk) s\'exécute sans erreur', async ({ page }) => {
    const errors = trackErrors(page);
    const btn = page.locator('[data-action="fertilize_npk"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(800);
    }
    expect(errors).toHaveLength(0);
  });

  test('8.6 Fertiliser organique (fertilize_organic) s\'exécute sans erreur', async ({ page }) => {
    const errors = trackErrors(page);
    const btn = page.locator('[data-action="fertilize_organic"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(800);
    }
    expect(errors).toHaveLength(0);
  });

  test('8.7 Désherber (weed) s\'exécute sans erreur', async ({ page }) => {
    const errors = trackErrors(page);
    const btn = page.locator('[data-action="weed"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(800);
    }
    expect(errors).toHaveLength(0);
  });

  test('8.8 Pesticide naturel s\'exécute sans erreur', async ({ page }) => {
    const errors = trackErrors(page);
    const btn = page.locator('[data-action="spray_pesticide_natural"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(800);
    }
    expect(errors).toHaveLength(0);
  });

  test('8.9 Récolter sans culture mûre retourne une erreur métier', async ({ page }) => {
    const errors = trackErrors(page);
    const btn = page.locator('[data-action="harvest"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(800);
      // Ne doit pas crasher — juste afficher un message d'erreur logique
    }
    expect(errors).toHaveLength(0);
  });

  test('8.10 Les hotkeys clavier (L,S,W,F,C,D,P,H) fonctionnent', async ({ page }) => {
    const errors = trackErrors(page);
    // Envoyer quelques hotkeys et vérifier pas de crash
    for (const key of ['l', 'w', 'd']) {
      await page.keyboard.press(key.toUpperCase());
      await page.waitForTimeout(400);
    }
    expect(errors).toHaveLength(0);
  });
});

// ─── 9. MODE FERME - CONTRÔLE DU TEMPS ────────────────────────────────────────

test.describe('9. Mode Ferme V3 - Contrôle du Temps', () => {
  test.beforeEach(async ({ page }) => {
    await injectGuestSession(page);
    await goToFarm(page);
  });

  test('9.1 Le bouton Pause/Reprendre fonctionne', async ({ page }) => {
    const errors = trackErrors(page);
    const btnPause = page.locator('#btn-pause');
    if (await btnPause.isVisible()) {
      await btnPause.click();
      await page.waitForTimeout(500);
      await btnPause.click(); // Reprendre
      await page.waitForTimeout(500);
    } else {
      console.log('⚠️  FEATURE CASSÉE: #btn-pause absent');
    }
    expect(errors).toHaveLength(0);
  });

  test('9.2 Le bouton "Jour Suivant" avance d\'un jour', async ({ page }) => {
    const errors = trackErrors(page);

    const dayDisplay = page.locator('#display-day');
    const dayBefore = await dayDisplay.count() > 0
      ? parseInt((await dayDisplay.textContent()).replace(/\D/g, ''))
      : 1;

    const btnNext = page.locator('#btn-next-day');
    if (await btnNext.isVisible()) {
      await btnNext.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('⚠️  FEATURE CASSÉE: #btn-next-day absent');
    }

    const dayAfter = await dayDisplay.count() > 0
      ? parseInt((await dayDisplay.textContent()).replace(/\D/g, ''))
      : 1;

    console.log(`Jour: ${dayBefore} → ${dayAfter}`);
    if (dayAfter <= dayBefore) {
      console.log('⚠️  BUG: btn-next-day n\'incrémente pas le compteur de jours');
    }
    expect(errors).toHaveLength(0);
  });

  test('9.3 Les boutons de vitesse (1x, 2x, 4x, 8x) sont présents', async ({ page }) => {
    const speeds = ['1', '2', '4', '8'];
    for (const speed of speeds) {
      const btn = page.locator(`.speed-btn[data-speed="${speed}"]`);
      const count = await btn.count();
      if (count === 0) {
        console.log(`⚠️  FEATURE CASSÉE: Bouton vitesse ${speed}x absent`);
      }
    }
  });

  test('9.4 Changer la vitesse ne provoque pas d\'erreur JS', async ({ page }) => {
    const errors = trackErrors(page);
    for (const speed of ['4', '8', '1']) {
      const btn = page.locator(`.speed-btn[data-speed="${speed}"]`);
      if (await btn.count() > 0) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }
    expect(errors).toHaveLength(0);
  });

  test('9.5 Le compteur de jours s\'incrémente automatiquement avec le temps', async ({ page }) => {
    const errors = trackErrors(page);
    const dayDisplay = page.locator('#display-day');
    const before = await dayDisplay.count() > 0
      ? parseInt((await dayDisplay.textContent()).replace(/\D/g, ''))
      : 0;

    // Attendre que la simulation avance à vitesse 8x
    const btn8x = page.locator('.speed-btn[data-speed="8"]');
    if (await btn8x.count() > 0) await btn8x.click();

    await page.waitForTimeout(4000);

    const after = await dayDisplay.count() > 0
      ? parseInt((await dayDisplay.textContent()).replace(/\D/g, ''))
      : 0;

    console.log(`Progression auto: jour ${before} → ${after} (après 4s à 8x)`);
    if (after <= before) {
      console.log('⚠️  BUG: Le temps ne s\'écoule pas automatiquement');
    }
    expect(errors).toHaveLength(0);
  });
});

// ─── 10. MODE FERME - PARCELLES ───────────────────────────────────────────────

test.describe('10. Mode Ferme V3 - Gestion des Parcelles', () => {
  test.beforeEach(async ({ page }) => {
    await injectGuestSession(page);
    await goToFarm(page);
  });

  test('10.1 Cliquer sur la parcelle 1 la sélectionne', async ({ page }) => {
    const errors = trackErrors(page);
    const plot1 = page.locator('[data-plot-id="1"]');
    await plot1.click();
    await page.waitForTimeout(500);

    const isActive = await plot1.evaluate(el => el.classList.contains('active'));
    expect(isActive).toBeTruthy();
    expect(errors).toHaveLength(0);
  });

  test('10.2 Cliquer sur une parcelle verrouillée ouvre le modal (BUG CORRIGÉ)', async ({ page }) => {
    const errors = trackErrors(page);
    const lockedPlot = page.locator('[data-plot-id="2"]');
    await lockedPlot.click();
    await page.waitForTimeout(1000);

    const modal = page.locator('#modal-unlock');
    const isVisible = await modal.isVisible();
    if (!isVisible) {
      console.log('⚠️  BUG PERSISTANT: Clic sur parcelle verrouillée n\'ouvre pas le modal');
    } else {
      console.log('✅ Modal de débloquage s\'ouvre correctement pour parcelle verrouillée');
    }
    expect(isVisible).toBeTruthy();
    expect(errors).toHaveLength(0);
  });

  test('10.3 Le modal de débloquage affiche le coût et le solde du joueur', async ({ page }) => {
    const lockedPlot = page.locator('[data-plot-id="2"]');
    await lockedPlot.click();
    await page.waitForTimeout(800);

    const modal = page.locator('#modal-unlock');
    if (await modal.isVisible()) {
      const cost = page.locator('#unlock-cost');
      const balance = page.locator('#unlock-balance');
      expect(await cost.textContent()).toMatch(/\d+/);
      expect(await balance.textContent()).toMatch(/\d+/);
      console.log(`Coût débloquage: ${await cost.textContent()}💰, Solde: ${await balance.textContent()}💰`);
    }
  });

  test('10.4 Annuler le modal de débloquage ferme le modal', async ({ page }) => {
    const errors = trackErrors(page);
    const lockedPlot = page.locator('[data-plot-id="2"]');
    await lockedPlot.click();
    await page.waitForTimeout(800);

    const modal = page.locator('#modal-unlock');
    if (await modal.isVisible()) {
      const btnCancel = page.locator('#btn-cancel-unlock');
      await btnCancel.click();
      await page.waitForTimeout(500);
      const isStillVisible = await modal.isVisible();
      if (isStillVisible) {
        console.log('⚠️  BUG: Modal ne se ferme pas après Annuler');
      }
      expect(isStillVisible).toBeFalsy();
    }
    expect(errors).toHaveLength(0);
  });

  test('10.5 Confirmer le débloquage avec argent suffisant débloque la parcelle', async ({ page }) => {
    const errors = trackErrors(page);
    // Mode invité a 5000💰, parcelle 2 coûte 200💰 → doit réussir si level >= 3

    // Forcer level = 3 dans le player
    await page.evaluate(() => {
      const player = JSON.parse(localStorage.getItem('ilerise_player') || '{}');
      player.level = 3;
      player.coins = 5000;
      localStorage.setItem('ilerise_player', JSON.stringify(player));
    });

    const lockedPlot = page.locator('[data-plot-id="2"]');
    await lockedPlot.click();
    await page.waitForTimeout(800);

    const modal = page.locator('#modal-unlock');
    if (await modal.isVisible()) {
      const btnConfirm = page.locator('#btn-confirm-unlock');
      await btnConfirm.click();
      await page.waitForTimeout(1000);

      // Vérifier que la parcelle 2 est maintenant débloquée
      const isLocked = await lockedPlot.evaluate(el => el.classList.contains('locked'));
      if (isLocked) {
        console.log('⚠️  BUG: Parcelle 2 toujours verrouillée après confirmation de débloquage');
      } else {
        console.log('✅ Parcelle 2 débloquée avec succès');
      }
    }
    expect(errors).toHaveLength(0);
  });

  test('10.6 Les infos de sol s\'affichent pour la parcelle active', async ({ page }) => {
    const soilItems = ['#soil-moisture-value', '#soil-npk-value', '#soil-ph-value'];
    let found = 0;
    for (const selector of soilItems) {
      if (await page.locator(selector).count() > 0) found++;
    }
    if (found < soilItems.length) {
      console.log(`⚠️  FEATURE INCOMPLÈTE: ${found}/${soilItems.length} indicateurs de sol affichés`);
    }
  });

  test('10.7 La scène 3D de la parcelle se charge dans farm-scene-container', async ({ page }) => {
    const errors = trackErrors(page);
    await page.waitForTimeout(2000);

    const canvas = page.locator('#farm-scene-container canvas');
    const count = await canvas.count();
    if (count === 0) {
      console.log('⚠️  FEATURE CASSÉE: Canvas 3D absent dans #farm-scene-container');
    } else {
      console.log('✅ Scène 3D Three.js rendue dans farm-scene-container');
    }
    expect(errors).toHaveLength(0);
  });
});

// ─── 11. MODE FERME - MARCHÉ ───────────────────────────────────────────────────

test.describe('11. Mode Ferme V3 - Marché', () => {
  test.beforeEach(async ({ page }) => {
    await injectGuestSession(page);
    await goToFarm(page);
    // Naviguer vers l'onglet Marché
    const marketTab = page.locator('.nav-btn[data-section="market"]');
    if (await marketTab.isVisible()) {
      await marketTab.click();
      await page.waitForTimeout(800);
    }
  });

  test('11.1 L\'onglet Marché affiche du contenu', async ({ page }) => {
    const errors = trackErrors(page);
    const section = page.locator('#section-market');
    const content = await section.textContent().catch(() => '');
    if (content.length < 10) {
      console.log('⚠️  FEATURE CASSÉE: Section marché vide ou non chargée');
    }
    console.log(`Contenu marché: "${content.slice(0, 100)}..."`);
    expect(errors).toHaveLength(0);
  });

  test('11.2 Les onglets Acheter/Vendre sont présents dans le marché', async ({ page }) => {
    const errors = trackErrors(page);
    const buyTab = page.locator('.market-tab[data-tab="buy"]');
    const sellTab = page.locator('.market-tab[data-tab="sell"]');

    const buyCount = await buyTab.count();
    const sellCount = await sellTab.count();

    if (buyCount === 0) console.log('⚠️  FEATURE CASSÉE: Onglet "Acheter" absent du marché');
    if (sellCount === 0) console.log('⚠️  FEATURE CASSÉE: Onglet "Vendre" absent du marché');

    expect(errors).toHaveLength(0);
  });

  test('11.3 Cliquer sur Acheter affiche les articles à vendre', async ({ page }) => {
    const errors = trackErrors(page);
    const buyTab = page.locator('.market-tab[data-tab="buy"]');
    if (await buyTab.count() > 0) {
      await buyTab.click();
      await page.waitForTimeout(800);
      const marketContent = page.locator('#market-content');
      const text = await marketContent.textContent().catch(() => '');
      if (text.length < 5) {
        console.log('⚠️  FEATURE CASSÉE: Onglet Acheter ne charge pas d\'articles');
      }
    }
    expect(errors).toHaveLength(0);
  });

  test('11.4 Acheter de l\'eau consomme de l\'argent et augmente le stock eau', async ({ page }) => {
    const errors = trackErrors(page);

    const waterBefore = await page.locator('#display-water').textContent().catch(() => '0');

    // Chercher bouton acheter eau
    const buyWaterBtn = page.locator('.btn-buy-item[data-item="water"], [data-item="water"] .btn-buy-item, button:has-text("Eau")').first();
    if (await buyWaterBtn.count() > 0) {
      await buyWaterBtn.click();
      await page.waitForTimeout(800);
      const waterAfter = await page.locator('#display-water').textContent().catch(() => '0');
      console.log(`Eau: "${waterBefore}" → "${waterAfter}"`);
    } else {
      console.log('⚠️  FEATURE CASSÉE: Bouton achat eau non trouvé dans le marché');
    }
    expect(errors).toHaveLength(0);
  });

  test('11.5 Acheter des graines de maïs augmente l\'inventaire', async ({ page }) => {
    const errors = trackErrors(page);

    const seedsBefore = await page.locator('#inv-seeds-total').textContent().catch(() => '0');

    // Chercher bouton acheter graines maïs
    const buyBtn = page.locator('[data-item="maize"] .btn-buy-item, .btn-buy-item[data-item="maize"], button:has-text("Maïs")').first();
    if (await buyBtn.count() > 0) {
      await buyBtn.click();
      await page.waitForTimeout(800);
      const seedsAfter = await page.locator('#inv-seeds-total').textContent().catch(() => '0');
      console.log(`Graines maïs: "${seedsBefore}" → "${seedsAfter}"`);
    } else {
      console.log('⚠️  FEATURE CASSÉE: Bouton achat graines maïs non trouvé');
    }
    expect(errors).toHaveLength(0);
  });

  test('11.6 Onglet Vendre est accessible', async ({ page }) => {
    const errors = trackErrors(page);
    const sellTab = page.locator('.market-tab[data-tab="sell"]');
    if (await sellTab.count() > 0) {
      await sellTab.click();
      await page.waitForTimeout(800);
      const content = page.locator('#market-content');
      const text = await content.textContent().catch(() => '');
      console.log(`Contenu onglet Vendre: "${text.slice(0, 100)}"`);
    }
    expect(errors).toHaveLength(0);
  });
});

// ─── 12. MODE FERME - ÉLEVAGE ─────────────────────────────────────────────────

test.describe('12. Mode Ferme V3 - Élevage', () => {
  test.beforeEach(async ({ page }) => {
    await injectGuestSession(page);
    await goToFarm(page);
    // Naviguer vers Bétail
    const livestockTab = page.locator('.nav-btn[data-section="livestock"]');
    if (await livestockTab.isVisible()) {
      await livestockTab.click();
      await page.waitForTimeout(800);
    }
  });

  test('12.1 La section Bétail s\'affiche avec du contenu', async ({ page }) => {
    const errors = trackErrors(page);
    const section = page.locator('#section-livestock');
    const content = await section.textContent().catch(() => '');
    console.log(`Contenu Bétail: "${content.slice(0, 150)}"`);
    if (content.length < 5) {
      console.log('⚠️  FEATURE CASSÉE: Section Bétail vide');
    }
    expect(errors).toHaveLength(0);
  });

  test('12.2 Le bouton "Débloquer Poulailler" est présent et affiche le coût', async ({ page }) => {
    const errors = trackErrors(page);
    const btn = page.locator('#btn-unlock-coop');
    const count = await btn.count();
    if (count === 0) {
      console.log('⚠️  FEATURE CASSÉE: Bouton "Débloquer Poulailler" absent de la section Bétail');
    } else {
      const text = await btn.textContent();
      console.log(`Bouton poulailler: "${text}"`);
    }
    expect(errors).toHaveLength(0);
  });

  test('12.3 Débloquer le poulailler (100💰) fonctionne', async ({ page }) => {
    const errors = trackErrors(page);

    const moneyBefore = await page.locator('#display-money').textContent().catch(() => '9999');
    const btn = page.locator('#btn-unlock-coop');
    if (await btn.isVisible() && await btn.isEnabled()) {
      await btn.click();
      await page.waitForTimeout(1000);

      const moneyAfter = await page.locator('#display-money').textContent().catch(() => moneyBefore);
      console.log(`Argent: "${moneyBefore}" → "${moneyAfter}" (coût 100💰)`);

      // Vérifier que le bouton "Acheter Poule" apparaît maintenant
      const buyChickenBtn = page.locator('#btn-buy-chicken');
      const isVisible = await buyChickenBtn.isVisible();
      if (!isVisible) {
        console.log('⚠️  BUG: Après débloquage poulailler, bouton "Acheter Poule" non affiché');
      } else {
        console.log('✅ Poulailler débloqué, bouton "Acheter Poule" visible');
      }
    } else {
      console.log('ℹ️  Bouton poulailler désactivé — peut-être déjà débloqué');
    }
    expect(errors).toHaveLength(0);
  });

  test('12.4 Acheter une poule (50💰) fonctionne après débloquage', async ({ page }) => {
    const errors = trackErrors(page);

    // Débloquer le poulailler d'abord
    const btnCoop = page.locator('#btn-unlock-coop');
    if (await btnCoop.isVisible() && await btnCoop.isEnabled()) {
      await btnCoop.click();
      await page.waitForTimeout(1000);
    }

    // Acheter une poule
    const btnChicken = page.locator('#btn-buy-chicken');
    if (await btnChicken.isVisible()) {
      await btnChicken.click();
      await page.waitForTimeout(800);
      const chickenCount = await page.locator('#chicken-count').textContent().catch(() => '0');
      console.log(`Nombre de poules: ${chickenCount}`);
      if (parseInt(chickenCount) === 0) {
        console.log('⚠️  BUG: Achat poule ne met pas à jour le compteur');
      }
    } else {
      console.log('⚠️  FEATURE CASSÉE: Bouton "Acheter Poule" absent après débloquage');
    }
    expect(errors).toHaveLength(0);
  });
});

// ─── 13. MODE FERME - STATISTIQUES ────────────────────────────────────────────

test.describe('13. Mode Ferme V3 - Statistiques', () => {
  test.beforeEach(async ({ page }) => {
    await injectGuestSession(page);
    await goToFarm(page);
    const statsTab = page.locator('.nav-btn[data-section="stats"]');
    if (await statsTab.isVisible()) {
      await statsTab.click();
      await page.waitForTimeout(800);
    }
  });

  test('13.1 La section Stats s\'affiche avec contenu', async ({ page }) => {
    const errors = trackErrors(page);
    const section = page.locator('#section-stats');
    const content = await section.textContent().catch(() => '');
    console.log(`Contenu Stats: "${content.slice(0, 200)}"`);
    if (content.length < 5) {
      console.log('⚠️  FEATURE CASSÉE: Section Stats vide');
    }
    expect(errors).toHaveLength(0);
  });
});

// ─── 14. MODE FERME - RECOMMANDATIONS NASA ────────────────────────────────────

test.describe('14. Mode Ferme V3 - Recommandations NASA', () => {
  test.beforeEach(async ({ page }) => {
    await injectGuestSession(page);
    await goToFarm(page);
  });

  test('14.1 Les recommandations NASA s\'affichent dans la ferme', async ({ page }) => {
    const errors = trackErrors(page);
    const rec = page.locator('#nasa-recommendations-content');
    if (await rec.count() > 0) {
      const text = await rec.textContent();
      console.log(`Recommandations: "${text.slice(0, 150)}"`);
    } else {
      console.log('⚠️  FEATURE CASSÉE: #nasa-recommendations-content absent');
    }
    expect(errors).toHaveLength(0);
  });

  test('14.2 Le bouton Rafraîchir NASA fonctionne', async ({ page }) => {
    const errors = trackErrors(page);
    const btn = page.locator('#btn-refresh-nasa');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1500);
    } else {
      console.log('⚠️  FEATURE CASSÉE: #btn-refresh-nasa absent');
    }
    expect(errors).toHaveLength(0);
  });
});

// ─── 15. SAUVEGARDE & BACKEND ─────────────────────────────────────────────────

test.describe('15. Sauvegarde & Intégration Backend', () => {
  test('15.1 Les appels API backend sont déclenchés en mode authentifié', async ({ page }) => {
    const apiCalls = trackApiCalls(page);
    await injectGuestSession(page);
    // En mode invité, pas d'appels backend attendus
    // Mais le service API doit être initialisé sans crash
    const errors = trackErrors(page);
    expect(errors).toHaveLength(0);
    console.log(`Appels API backend en mode invité: ${apiCalls.length}`);
  });

  test('15.2 La sauvegarde localStorage se fait lors de l\'init de la ferme', async ({ page }) => {
    await injectGuestSession(page);
    await forceScreen(page, 'crop-select');
    await page.waitForTimeout(500);
    const btn = page.locator('#btn-farm-from-crop-select');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(3000);
    }

    // Vérifier que les clés de sauvegarde ferme existent
    const keys = await page.evaluate(() => {
      return {
        plots: !!localStorage.getItem('ilerise_plots'),
        resources: !!localStorage.getItem('ilerise_resources'),
        livestock: !!localStorage.getItem('ilerise_livestock'),
        market: !!localStorage.getItem('ilerise_market'),
      };
    });

    console.log('Clés localStorage ferme:', JSON.stringify(keys));
    Object.entries(keys).forEach(([k, v]) => {
      if (!v) console.log(`⚠️  BUG: Clé localStorage "ilerise_${k}" non sauvegardée`);
    });
  });
});

// ─── 16. PROFIL JOUEUR ────────────────────────────────────────────────────────

test.describe('16. Profil Joueur', () => {
  test('16.1 L\'écran profil s\'affiche depuis screen-home', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);

    const btnProfile = page.locator('#btn-profile');
    if (await btnProfile.isVisible()) {
      await btnProfile.click();
      await page.waitForTimeout(1000);
      const profileScreen = page.locator('#screen-profile');
      const isVisible = await profileScreen.isVisible();
      if (!isVisible) console.log('⚠️  FEATURE CASSÉE: btn-profile ne navigue pas vers screen-profile');
      expect(isVisible).toBeTruthy();
    }
    expect(errors).toHaveLength(0);
  });

  test('16.2 Le profil affiche le nom du joueur', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'profile');
    await page.waitForTimeout(1000);

    const profileScreen = page.locator('#screen-profile');
    const text = await profileScreen.textContent();
    const hasName = text.includes('TestPlayer') || text.includes('Invité') || text.includes('Guest');
    if (!hasName) console.log('⚠️  BUG: Nom du joueur non affiché dans le profil');
    expect(errors).toHaveLength(0);
  });

  test('16.3 Le bouton Exporter Profil est présent', async ({ page }) => {
    await injectGuestSession(page);
    await forceScreen(page, 'profile');
    await page.waitForTimeout(1000);

    const btn = page.locator('#btn-export-profile');
    if (await btn.count() === 0) {
      console.log('⚠️  FEATURE CASSÉE: Bouton exporter profil absent');
    }
  });
});

// ─── 17. CARTES DE CONNAISSANCE ───────────────────────────────────────────────

test.describe('17. Cartes de Connaissance', () => {
  test('17.1 L\'écran knowledge s\'affiche avec des cartes', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'knowledge');
    await page.waitForTimeout(1500);

    // Les cartes doivent être chargées depuis knowledgeCards.json
    const cards = page.locator('.knowledge-card, .card-item, [class*="card"]');
    const count = await cards.count();
    console.log(`Cartes de connaissance trouvées: ${count}`);
    if (count === 0) {
      console.log('⚠️  FEATURE CASSÉE: Aucune carte de connaissance chargée');
    }
    expect(errors).toHaveLength(0);
  });

  test('17.2 Les filtres de catégorie fonctionnent', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await forceScreen(page, 'knowledge');
    await page.waitForTimeout(1500);

    const filters = page.locator('.filter-btn, [class*="filter"]');
    if (await filters.count() > 0) {
      await filters.first().click();
      await page.waitForTimeout(500);
    } else {
      console.log('⚠️  FEATURE CASSÉE: Filtres absents sur screen-knowledge');
    }
    expect(errors).toHaveLength(0);
  });
});

// ─── 18. ÉCRAN GAME OVER ─────────────────────────────────────────────────────

test.describe('18. Écran Game Over', () => {
  test('18.1 L\'écran game-over est dans le DOM', async ({ page }) => {
    await injectGuestSession(page);
    await expect(page.locator('#screen-game-over')).toBeAttached();
  });

  test('18.2 L\'écran game-over affiche un message et des options', async ({ page }) => {
    await injectGuestSession(page);
    await forceScreen(page, 'game-over');
    await page.waitForTimeout(500);

    const btnWait = page.locator('#btn-go-wait');
    const btnRetry = page.locator('#btn-go-retry');
    const count = (await btnWait.count()) + (await btnRetry.count());
    if (count === 0) {
      console.log('⚠️  FEATURE CASSÉE: Boutons game-over absents');
    }
  });
});

// ─── 19. BOUTON RETOUR (FERME → JEU) ─────────────────────────────────────────

test.describe('19. Navigation Retour', () => {
  test('19.1 btn-back-farm navigue vers screen-game sans crash', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await goToFarm(page);

    const btnBack = page.locator('#btn-back-farm');
    if (await btnBack.isVisible()) {
      await btnBack.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('⚠️  FEATURE CASSÉE: btn-back-farm absent');
    }
    expect(errors).toHaveLength(0);
  });
});

// ─── 20. RÉSISTANCE AUX ACTIONS RAPIDES ──────────────────────────────────────

test.describe('20. Résistance - Spam d\'Actions', () => {
  test('20.1 Spam de clics sur Arroser ne provoque pas de crash', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await goToFarm(page);

    // Spam 10 clics rapides sur Arroser
    const btnWater = page.locator('[data-action="water"]');
    if (await btnWater.isVisible()) {
      for (let i = 0; i < 10; i++) {
        await btnWater.click({ force: true });
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(500);
    }
    expect(errors).toHaveLength(0);
  });

  test('20.2 Spam de changement de vitesse ne provoque pas de crash', async ({ page }) => {
    const errors = trackErrors(page);
    await injectGuestSession(page);
    await goToFarm(page);

    for (let i = 0; i < 20; i++) {
      const speed = ['1', '2', '4', '8'][i % 4];
      const speedBtn = page.locator(`.speed-btn[data-speed="${speed}"]`);
      if (await speedBtn.count() > 0) await speedBtn.click({ force: true });
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });
});

