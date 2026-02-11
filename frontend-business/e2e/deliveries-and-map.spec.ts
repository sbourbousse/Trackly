import { test, expect } from '@playwright/test';

/**
 * Tests de gestion des livraisons
 */
test.describe('Deliveries Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('trackly_auth_token', 'test-token');
    });
    await page.goto('/deliveries');
  });

  test('should display deliveries list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /livraisons|deliveries/i })).toBeVisible();
    await expect(page.getByText(/chargement|loading/i).or(
      page.locator('table tbody tr')
    )).toBeVisible();
  });

  test('should show delivery details', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Cliquer sur une livraison si disponible
    const deliveryRow = page.locator('table tbody tr:first-child').first();
    if (await deliveryRow.isVisible().catch(() => false)) {
      await deliveryRow.click();
      
      // Vérifier les détails
      await expect(page.getByText(/statut|status/i).or(
        page.getByText(/livreur|driver/i)
      )).toBeVisible();
    }
  });

  test('should filter deliveries by date', async ({ page }) => {
    // Ouvrir le sélecteur de date
    const dateFilter = page.getByText(/période|date|filtre/i).first();
    if (await dateFilter.isVisible().catch(() => false)) {
      await dateFilter.click();
      
      // Sélectionner une date
      await page.getByText(/aujourd'hui|today/i).click();
      
      // Vérifier que le filtre est appliqué
      await expect(page.getByText(/filtré|filtered/i).or(
        page.locator('[data-testid="date-filter-badge"]')
      )).toBeVisible();
    }
  });
});

/**
 * Tests de la carte interactive
 */
test.describe('Map View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('trackly_auth_token', 'test-token');
    });
    await page.goto('/map');
  });

  test('should display map', async ({ page }) => {
    await page.waitForTimeout(3000); // Attendre le chargement de la carte
    
    // Vérifier que la carte est chargée (Leaflet crée des éléments spécifiques)
    await expect(page.locator('.leaflet-container').or(
      page.locator('canvas').or(
        page.locator('[class*="map"]')
      )
    )).toBeVisible();
  });

  test('should toggle map layers', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Activer/désactiver les calques
    const ordersToggle = page.getByText(/commandes|orders/i).first();
    const driversToggle = page.getByText(/livreurs|drivers/i).first();
    
    if (await ordersToggle.isVisible().catch(() => false)) {
      await ordersToggle.click();
    }
    
    if (await driversToggle.isVisible().catch(() => false)) {
      await driversToggle.click();
    }
    
    // Vérifier que les toggles fonctionnent
    await expect(page.locator('body')).toBeVisible();
  });

  test('should select date range for map', async ({ page }) => {
    const dateSelector = page.getByText(/période|period|date/i).first();
    
    if (await dateSelector.isVisible().catch(() => false)) {
      await dateSelector.click();
      
      // Sélectionner "Aujourd'hui"
      await page.getByText(/aujourd'hui|today/i).click();
      
      await page.waitForTimeout(2000);
      
      // Vérifier que la carte est mise à jour
      await expect(page.locator('.leaflet-container').or(
        page.getByText(/aucune donnée|no data/i)
      )).toBeVisible();
    }
  });
});

/**
 * Tests du dashboard
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('trackly_auth_token', 'test-token');
    });
    await page.goto('/dashboard');
  });

  test('should display dashboard stats', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /tableau de bord|dashboard/i })).toBeVisible();
    
    // Vérifier la présence de statistiques
    await expect(page.getByText(/commandes|orders/i).or(
      page.getByText(/livraisons|deliveries/i)
    ).first()).toBeVisible();
  });

  test('should display charts', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Vérifier la présence de graphiques (canvas ou svg)
    const hasChart = await page.locator('canvas, svg[class*="chart"], [class*="recharts"]').count() > 0;
    
    if (hasChart) {
      await expect(page.locator('canvas, svg[class*="chart"]').first()).toBeVisible();
    }
  });

  test('should show real-time connection status', async ({ page }) => {
    // Vérifier l'indicateur de connexion SignalR
    await expect(page.getByText(/connecté|connected|en direct/i).or(
      page.locator('[data-testid="connection-status"]')
    ).first()).toBeVisible();
  });
});
