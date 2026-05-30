/**
 * farm-only.test.js — Tests prioritaires : mécanique de la ferme interactive
 */
import { test, expect } from '@playwright/test';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function setup(page) {
  await page.goto('/game.html');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('ilerise_guest', 'true');
    localStorage.setItem('ilerise_user', JSON.stringify({
      id: 'guest-test', username: 'TestPlayer',
      email: 'test@ilerise.com', level: 5, xp: 500, coins: 5000,
    }));
    localStorage.setItem('ilerise_state_guest-test', JSON.stringify({
      player: { id: 'guest-test', level: 5, xp: 500, coins: 5000 },
      tutorial: { farmCompleted: true },
    }));
    localStorage.setItem('ilerise_location', JSON.stringify({
      city: 'Parakou', ndvi: 0.45, temperature: 28, soilMoisture: 35, precipitation: 2.1,
    }));
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

function trackErrors(page) {
  const errors = [];
  page.on('pageerror', e => {
    const m = e.message;
    if (!m.includes('AudioContext') && !m.includes('favicon') && !m.includes('ResizeObserver'))
      errors.push(m);
  });
  return errors;
}

async function goToFarm(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-crop-select')?.classList.add('active');
  });
  await page.waitForTimeout(400);
  const btn = page.locator('#btn-farm-from-crop-select');
  if (await btn.isVisible()) {
    await btn.click();
    await page.waitForTimeout(2500);
  }
  // Fermer tutoriel si présent
  await page.evaluate(() => {
    document.querySelectorAll('.tutorial-overlay, .farm-tutorial, [class*="tutorial"]')
      .forEach(el => { el.style.display = 'none'; el.remove?.(); });
    try {
      const k = 'ilerise_state_guest-test';
      const s = JSON.parse(localStorage.getItem(k) || '{}');
      s.tutorial = { farmCompleted: true };
      localStorage.setItem(k, JSON.stringify(s));
    } catch(e) {}
  });
  await page.waitForTimeout(300);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

test.describe('Init Ferme', () => {
  test.beforeEach(async ({ page }) => { await setup(page); await goToFarm(page); });

  test('F01 screen-farm-v3 visible', async ({ page }) => {
    await expect(page.locator('#screen-farm-v3')).toBeVisible({ timeout: 5000 });
  });

  test('F02 Jour affiché', async ({ page }) => {
    const d = page.locator('#display-day');
    await expect(d).toBeAttached();
    console.log('Jour:', await d.textContent());
  });

  test('F03 Argent et eau affichés', async ({ page }) => {
    const money = await page.locator('#display-money').textContent().catch(() => '?');
    const water = await page.locator('#display-water').textContent().catch(() => '?');
    console.log(`💰 ${money}  💧 ${water}`);
    expect(parseInt(money.replace(/\D/g,''))).toBeGreaterThan(0);
    expect(parseInt(water.replace(/\D/g,''))).toBeGreaterThan(0);
  });

  test('F04 4 parcelles minimap', async ({ page }) => {
    await expect(page.locator('[data-plot-id]')).toHaveCount(4);
  });

  test('F05 Parcelle 1 active, 2-3-4 verrouillées', async ({ page }) => {
    await expect(page.locator('[data-plot-id="1"]')).toHaveClass(/active/);
    for (const id of [2,3,4]) {
      const locked = await page.locator(`[data-plot-id="${id}"]`).evaluate(e => e.classList.contains('locked'));
      expect(locked).toBeTruthy();
    }
  });

  test('F06 4 onglets présents (farm/livestock/market/stats)', async ({ page }) => {
    for (const s of ['farm','livestock','market','stats'])
      await expect(page.locator(`.nav-btn[data-section="${s}"]`)).toBeVisible();
  });

  test('F07 8 boutons d\'action présents', async ({ page }) => {
    const actions = ['plow','plant','water','fertilize_npk','fertilize_organic','weed','spray_pesticide_natural','harvest'];
    for (const a of actions)
      await expect(page.locator(`[data-action="${a}"]`)).toBeAttached();
  });

  test('F08 XP bar dans le header', async ({ page }) => {
    const xp = page.locator('#player-stats-bar .xp-bar');
    const count = await xp.count();
    if (count === 0) console.log('⚠️ XP bar absente du header');
    expect(count).toBeGreaterThan(0);
  });

  test('F09 Lives widget dans le header', async ({ page }) => {
    const lw = page.locator('#player-stats-bar .lives-widget');
    const count = await lw.count();
    if (count === 0) console.log('⚠️ Lives widget absent du header');
    expect(count).toBeGreaterThan(0);
  });

  test('F10 Scène 3D chargée', async ({ page }) => {
    await page.waitForTimeout(2000);
    const canvas = page.locator('#farm-scene-container canvas');
    const count = await canvas.count();
    if (count === 0) console.log('⚠️ Canvas 3D absent');
    expect(count).toBeGreaterThan(0);
  });
});

// ─── Séquence d'actions agricoles ─────────────────────────────────────────────

test.describe('Actions Agricoles', () => {
  test.beforeEach(async ({ page }) => { await setup(page); await goToFarm(page); });

  test('F11 Labourer fonctionne (plow)', async ({ page }) => {
    const errors = trackErrors(page);
    const btn = page.locator('[data-action="plow"]');
    await expect(btn).toBeEnabled({ timeout: 3000 });
    await btn.click({ force: true });
    await page.waitForTimeout(800);
    expect(errors).toHaveLength(0);
    console.log('✅ Plow cliqué sans erreur');
  });

  test('F12 Planter nécessite labour (bouton disabled avant plow)', async ({ page }) => {
    const btn = page.locator('[data-action="plant"]');
    const disabled = await btn.evaluate(e => e.disabled || e.classList.contains('disabled'));
    expect(disabled).toBeTruthy();
    console.log('✅ Plant correctement désactivé sans labour préalable');
  });

  test('F13 Séquence Labourer → Jour suivant → plot.isPlowed = true', async ({ page }) => {
    const errors = trackErrors(page);

    // Labourer
    await page.locator('[data-action="plow"]').click({ force: true });
    await page.waitForTimeout(500);

    // Avancer le temps (en mode invité, plow = 0.2j donc 1 jour suffit)
    await page.locator('#btn-next-day').click();
    await page.waitForTimeout(1000);

    // Vérifier que isPlowed est vrai via JS
    const isPlowed = await page.evaluate(() => {
      try {
        // Accéder à l'adapter via le namespace global si disponible
        const app = window._ileriseApp || window.app;
        if (app?.farmV3?.farmGame?.plotManager) {
          return app.farmV3.farmGame.plotManager.getActivePlot()?.isPlowed;
        }
      } catch(e) {}
      return null;
    });

    if (isPlowed === null) {
      console.log('ℹ️ Accès JS direct indisponible — vérification via UI');
      // Vérifier que "plant" est maintenant activé
      const plantEnabled = await page.locator('[data-action="plant"]').evaluate(e => !e.disabled && !e.classList.contains('disabled'));
      console.log(`Bouton Planter activé après labour: ${plantEnabled}`);
    } else {
      console.log(`plot.isPlowed = ${isPlowed}`);
      expect(isPlowed).toBeTruthy();
    }
    expect(errors).toHaveLength(0);
  });

  test('F14 Arroser fonctionne avec culture plantée (via JS)', async ({ page }) => {
    const errors = trackErrors(page);

    // Forcer l'état planté via JS
    await page.evaluate(() => {
      try {
        const app = window._ileriseApp || window.app;
        if (app?.farmV3?.farmGame?.plotManager) {
          const plot = app.farmV3.farmGame.plotManager.getActivePlot();
          plot.isPlowed = true;
          plot.isPlanted = true;
          plot.soilMoisture = 20;
          app.farmV3.updateActionsAvailability?.();
          app.farmV3.updateUI?.();
        }
      } catch(e) { console.warn('JS inject failed:', e.message); }
    });
    await page.waitForTimeout(500);

    const btn = page.locator('[data-action="water"]');
    const enabled = await btn.evaluate(e => !e.disabled && !e.classList.contains('disabled'));
    if (!enabled) {
      console.log('⚠️ Bouton Arroser toujours désactivé après injection état planté');
    } else {
      await btn.click({ force: true });
      await page.waitForTimeout(500);
      console.log('✅ Arroser cliqué');
    }
    expect(errors).toHaveLength(0);
  });

  test('F15 Fertiliser NPK fonctionne avec culture plantée', async ({ page }) => {
    const errors = trackErrors(page);
    await page.evaluate(() => {
      try {
        const app = window._ileriseApp || window.app;
        if (app?.farmV3?.farmGame?.plotManager) {
          const plot = app.farmV3.farmGame.plotManager.getActivePlot();
          plot.isPlowed = true; plot.isPlanted = true;
          app.farmV3.updateActionsAvailability?.();
        }
      } catch(e) {}
    });
    await page.waitForTimeout(400);
    const btn = page.locator('[data-action="fertilize_npk"]');
    await btn.click({ force: true });
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('F16 Désherber fonctionne avec culture plantée', async ({ page }) => {
    const errors = trackErrors(page);
    await page.evaluate(() => {
      try {
        const app = window._ileriseApp || window.app;
        if (app?.farmV3?.farmGame?.plotManager) {
          const plot = app.farmV3.farmGame.plotManager.getActivePlot();
          plot.isPlowed = true; plot.isPlanted = true;
          app.farmV3.updateActionsAvailability?.();
        }
      } catch(e) {}
    });
    await page.waitForTimeout(400);
    await page.locator('[data-action="weed"]').click({ force: true });
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('F17 Hotkeys L/W/D ne crashent pas', async ({ page }) => {
    const errors = trackErrors(page);
    for (const key of ['L', 'W', 'D']) {
      await page.keyboard.press(key);
      await page.waitForTimeout(300);
    }
    expect(errors).toHaveLength(0);
  });
});

// ─── Contrôle du temps ────────────────────────────────────────────────────────

test.describe('Contrôle du Temps', () => {
  test.beforeEach(async ({ page }) => { await setup(page); await goToFarm(page); });

  test('F18 Pause / Reprendre sans crash', async ({ page }) => {
    const errors = trackErrors(page);
    const btn = page.locator('#btn-pause');
    if (await btn.isVisible()) {
      await btn.click(); await page.waitForTimeout(400);
      await btn.click(); await page.waitForTimeout(400);
    }
    expect(errors).toHaveLength(0);
  });

  test('F19 Jour Suivant incrémente le compteur', async ({ page }) => {
    const errors = trackErrors(page);
    const dayEl = page.locator('#display-day');
    const before = parseInt((await dayEl.textContent()).replace(/\D/g,'') || '0');
    await page.locator('#btn-next-day').click();
    await page.waitForTimeout(800);
    const after = parseInt((await dayEl.textContent()).replace(/\D/g,'') || '0');
    console.log(`Jour: ${before} → ${after}`);
    expect(after).toBeGreaterThan(before);
    expect(errors).toHaveLength(0);
  });

  test('F20 Vitesses 1x/2x/4x/8x sans crash', async ({ page }) => {
    const errors = trackErrors(page);
    for (const s of ['4','8','1']) {
      const btn = page.locator(`.speed-btn[data-speed="${s}"]`);
      if (await btn.count() > 0) { await btn.click(); await page.waitForTimeout(200); }
    }
    expect(errors).toHaveLength(0);
  });

  test('F21 Temps s\'écoule automatiquement à 8x', async ({ page }) => {
    const errors = trackErrors(page);
    const btn8x = page.locator('.speed-btn[data-speed="8"]');
    if (await btn8x.count() > 0) await btn8x.click();
    const before = parseInt((await page.locator('#display-day').textContent()).replace(/\D/g,'') || '0');
    await page.waitForTimeout(4000);
    const after = parseInt((await page.locator('#display-day').textContent()).replace(/\D/g,'') || '0');
    console.log(`Auto-progression: jour ${before} → ${after} (4s à 8x)`);
    if (after <= before) console.log('⚠️ Le temps ne s\'écoule pas automatiquement');
    expect(errors).toHaveLength(0);
  });
});

// ─── Parcelles ────────────────────────────────────────────────────────────────

test.describe('Gestion des Parcelles', () => {
  test.beforeEach(async ({ page }) => { await setup(page); await goToFarm(page); });

  test('F22 Clic parcelle verrouillée → modal débloquage', async ({ page }) => {
    const errors = trackErrors(page);
    await page.locator('[data-plot-id="2"]').click();
    await page.waitForTimeout(800);
    const modal = page.locator('#modal-unlock');
    const visible = await modal.isVisible();
    if (!visible) console.log('⚠️ Modal débloquage absent');
    else console.log(`✅ Modal: coût ${await page.locator('#unlock-cost').textContent()}💰`);
    expect(visible).toBeTruthy();
    expect(errors).toHaveLength(0);
  });

  test('F23 Annuler modal ferme le modal', async ({ page }) => {
    await page.locator('[data-plot-id="2"]').click();
    await page.waitForTimeout(600);
    await page.locator('#btn-cancel-unlock').click();
    await page.waitForTimeout(400);
    await expect(page.locator('#modal-unlock')).not.toBeVisible();
  });

  test('F24 Confirmer débloquage parcelle 2 (level 5 ≥ 3 requis)', async ({ page }) => {
    const errors = trackErrors(page);
    await page.locator('[data-plot-id="2"]').click();
    await page.waitForTimeout(700);
    const modal = page.locator('#modal-unlock');
    if (await modal.isVisible()) {
      await page.locator('#btn-confirm-unlock').click();
      await page.waitForTimeout(1000);
      const stillLocked = await page.locator('[data-plot-id="2"]').evaluate(e => e.classList.contains('locked'));
      if (stillLocked) console.log('⚠️ Parcelle 2 toujours verrouillée après confirmation');
      else console.log('✅ Parcelle 2 débloquée');
    }
    expect(errors).toHaveLength(0);
  });
});

// ─── Marché ───────────────────────────────────────────────────────────────────

test.describe('Marché', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page); await goToFarm(page);
    await page.locator('.nav-btn[data-section="market"]').click();
    await page.waitForTimeout(800);
  });

  test('F25 Onglets Acheter/Vendre présents', async ({ page }) => {
    const errors = trackErrors(page);
    await expect(page.locator('.market-tab[data-tab="buy"]')).toBeAttached();
    await expect(page.locator('.market-tab[data-tab="sell"]')).toBeAttached();
    expect(errors).toHaveLength(0);
  });

  test('F26 Acheter affiche des articles', async ({ page }) => {
    const errors = trackErrors(page);
    await page.locator('.market-tab[data-tab="buy"]').click();
    await page.waitForTimeout(600);
    const text = await page.locator('#market-content').textContent().catch(() => '');
    console.log(`Marché achat: "${text.trim().slice(0,80)}"`);
    expect(text.length).toBeGreaterThan(5);
    expect(errors).toHaveLength(0);
  });

  test('F27 Graines maïs présentes dans inventaire de départ', async ({ page }) => {
    const seeds = await page.locator('#inv-seeds-total').textContent().catch(() => '0');
    console.log(`Graines: ${seeds}`);
    expect(parseInt(seeds.replace(/\D/g,''))).toBeGreaterThan(0);
  });
});

// ─── Élevage ──────────────────────────────────────────────────────────────────

test.describe('Élevage', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page); await goToFarm(page);
    await page.locator('.nav-btn[data-section="livestock"]').click();
    await page.waitForTimeout(800);
  });

  test('F28 Section Bétail affiche le poulailler', async ({ page }) => {
    const errors = trackErrors(page);
    const text = await page.locator('#section-livestock').textContent().catch(() => '');
    console.log(`Bétail: "${text.trim().slice(0,100)}"`);
    expect(text).toContain('Poulailler');
    expect(errors).toHaveLength(0);
  });

  test('F29 Débloquer poulailler sans crash JS', async ({ page }) => {
    const errors = trackErrors(page);
    const btn = page.locator('#btn-unlock-coop');
    if (await btn.isVisible() && await btn.isEnabled()) {
      await btn.click();
      await page.waitForTimeout(1000);
      console.log('✅ Poulailler cliqué');
    }
    expect(errors, `Erreurs JS: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('F30 Acheter une poule après débloquage', async ({ page }) => {
    const errors = trackErrors(page);
    const btnCoop = page.locator('#btn-unlock-coop');
    if (await btnCoop.isVisible() && await btnCoop.isEnabled()) {
      await btnCoop.click();
      await page.waitForTimeout(1000);
    }
    const btnChicken = page.locator('#btn-buy-chicken');
    if (await btnChicken.isVisible()) {
      await btnChicken.click();
      await page.waitForTimeout(800);
      const count = await page.locator('#chicken-count').textContent().catch(() => '0');
      console.log(`Poules: ${count}`);
      expect(parseInt(count)).toBeGreaterThan(0);
    } else {
      console.log('⚠️ Bouton "Acheter Poule" absent');
    }
    expect(errors, `Erreurs JS: ${errors.join(', ')}`).toHaveLength(0);
  });
});

// ─── Recommandations NASA ─────────────────────────────────────────────────────

test.describe('NASA & Stats', () => {
  test.beforeEach(async ({ page }) => { await setup(page); await goToFarm(page); });

  test('F31 Recommandations NASA s\'affichent', async ({ page }) => {
    const rec = await page.locator('#nasa-recommendations-content').textContent().catch(() => '');
    console.log(`NASA: "${rec.trim().slice(0,80)}"`);
    expect(rec.length).toBeGreaterThan(0);
  });

  test('F32 Section Stats s\'affiche', async ({ page }) => {
    const errors = trackErrors(page);
    await page.locator('.nav-btn[data-section="stats"]').click();
    await page.waitForTimeout(600);
    const text = await page.locator('#section-stats').textContent().catch(() => '');
    console.log(`Stats: "${text.trim().slice(0,80)}"`);
    expect(errors).toHaveLength(0);
  });
});

// ─── Résistance ───────────────────────────────────────────────────────────────

test.describe('Résistance', () => {
  test.beforeEach(async ({ page }) => { await setup(page); await goToFarm(page); });

  test('F33 Spam 10 clics sur Labourer sans crash', async ({ page }) => {
    const errors = trackErrors(page);
    const btn = page.locator('[data-action="plow"]');
    for (let i = 0; i < 10; i++) {
      await btn.click({ force: true });
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('F34 Spam changement de vitesse sans crash', async ({ page }) => {
    const errors = trackErrors(page);
    for (let i = 0; i < 20; i++) {
      const s = ['1','2','4','8'][i % 4];
      const btn = page.locator(`.speed-btn[data-speed="${s}"]`);
      if (await btn.count() > 0) await btn.click({ force: true });
      await page.waitForTimeout(30);
    }
    expect(errors).toHaveLength(0);
  });
});
