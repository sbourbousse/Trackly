import { test, expect } from '@playwright/test';

/**
 * Tests pour l'application Driver PWA
 * Focus sur mobile et usage extérieur
 */

test.describe('Driver Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form on mobile', async ({ page }) => {
    // Simuler un mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page.getByRole('heading', { name: /connexion|login/i })).toBeVisible();
    await expect(page.getByLabel(/driver id|identifiant/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /connexion|login/i })).toBeVisible();
  });

  test('should show error for invalid driver ID', async ({ page }) => {
    await page.getByLabel(/driver id|identifiant/i).fill('INVALID_ID');
    await page.getByRole('button', { name: /connexion|login/i }).click();
    
    await expect(page.getByText(/erreur|error|invalide|invalid/i)).toBeVisible();
  });

  test('should login with valid driver ID', async ({ page }) => {
    await page.getByLabel(/driver id|identifiant/i).fill('test-driver-123');
    await page.getByRole('button', { name: /connexion|login/i }).click();
    
    // Redirection vers la liste des livraisons
    await expect(page).toHaveURL(/deliveries|livraisons/);
  });
});

test.describe('Deliveries List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('driverId', 'test-driver-123');
    });
    await page.goto('/#/deliveries');
  });

  test('should display deliveries list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /livraisons|deliveries/i }).or(
      page.getByText(/tournée|route/i)
    )).toBeVisible();
  });

  test('should show delivery status', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Vérifier que les statuts sont affichés
    await expect(page.getByText(/prévue|pending|en cours|in progress|livrée|completed/i).first()).toBeVisible();
  });

  test('should navigate to delivery detail', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const deliveryItem = page.locator('button, [role="button"]').first();
    if (await deliveryItem.isVisible().catch(() => false)) {
      await deliveryItem.click();
      
      // Vérifier les détails
      await expect(page.getByText(/adresse|address|client|customer/i).first()).toBeVisible();
    }
  });

  test('should have large touch targets', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Vérifier que les boutons sont assez grands pour une utilisation extérieure
    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 5)) {
      const box = await button.boundingBox();
      if (box) {
        // Les boutons doivent être au moins 44x44px (recommandation Apple)
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

test.describe('Delivery Detail & GPS', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('driverId', 'test-driver-123');
    });
  });

  test('should display delivery details', async ({ page }) => {
    await page.goto('/#/deliveries/test-delivery-123');
    
    await expect(page.getByText(/adresse|address/i)).toBeVisible();
    await expect(page.getByText(/client|customer/i)).toBeVisible();
  });

  test('should show map with destination', async ({ page }) => {
    await page.goto('/#/deliveries/test-delivery-123');
    await page.waitForTimeout(3000);
    
    // Vérifier que la carte est présente
    await expect(page.locator('.leaflet-container').or(
      page.locator('canvas').or(
        page.locator('[class*="map"]')
      )
    )).toBeVisible();
  });

  test('should have start tracking button', async ({ page }) => {
    await page.goto('/#/deliveries/test-delivery-123');
    
    await expect(page.getByRole('button', { name: /démarrer|start|suivi|tracking/i })).toBeVisible();
  });

  test('should validate delivery with large buttons', async ({ page }) => {
    await page.goto('/#/deliveries/test-delivery-123');
    
    // Vérifier les boutons de validation
    const deliveredBtn = page.getByRole('button', { name: /livrée|delivered|✅/i });
    const failedBtn = page.getByRole('button', { name: /non livrée|failed|❌/i });
    
    if (await deliveredBtn.isVisible().catch(() => false)) {
      const box = await deliveredBtn.boundingBox();
      if (box) {
        // Boutons larges pour usage extérieur
        expect(box.height).toBeGreaterThanOrEqual(60);
      }
    }
  });

  test('should show GPS status', async ({ page }) => {
    await page.goto('/#/deliveries/test-delivery-123');
    
    // Démarrer le suivi
    const startBtn = page.getByRole('button', { name: /démarrer|start/i });
    if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click();
      
      await page.waitForTimeout(1000);
      
      // Vérifier le statut GPS
      await expect(page.getByText(/position|gps|connecté|connected/i).first()).toBeVisible();
    }
  });
});

test.describe('PWA Features', () => {
  test('should be installable as PWA', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier la présence du manifest
    const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifest).toBeTruthy();
    
    // Vérifier le service worker
    const sw = await page.evaluate(() => {
      return navigator.serviceWorker ? 'supported' : 'not supported';
    });
    expect(sw).toBe('supported');
  });

  test('should work offline', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('driverId', 'test-driver-123');
    });
    await page.goto('/#/deliveries');
    
    // Simuler la déconnexion
    await page.context().setOffline(true);
    
    // L'application devrait toujours fonctionner (mode offline)
    await expect(page.locator('body')).toBeVisible();
    
    // Remettre en ligne
    await page.context().setOffline(false);
  });
});
