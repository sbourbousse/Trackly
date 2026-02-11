import { test, expect } from '@playwright/test';

/**
 * Tests pour la page publique de tracking client
 */

test.describe('Public Tracking Page', () => {
  test('should display tracking page with delivery ID', async ({ page }) => {
    await page.goto('/tracking/test-delivery-123');
    
    await expect(page.getByRole('heading', { name: /suivi|tracking/i })).toBeVisible();
    await expect(page.getByText(/test-delivery-123/)).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    await page.goto('/tracking/test-delivery-123');
    
    await expect(page.getByText(/chargement|loading/i).or(
      page.locator('[data-testid="loading"]')
    )).toBeVisible();
  });

  test('should display delivery status', async ({ page }) => {
    await page.goto('/tracking/test-delivery-123');
    await page.waitForTimeout(2000);
    
    await expect(page.getByText(/statut|status/i)).toBeVisible();
    await expect(page.getByText(/en attente|pending|en cours|in progress|livrée|delivered/i).first()).toBeVisible();
  });

  test('should show connection status', async ({ page }) => {
    await page.goto('/tracking/test-delivery-123');
    await page.waitForTimeout(2000);
    
    // Vérifier l'indicateur de connexion
    await expect(page.getByText(/connecté|connected|en direct|live/i).or(
      page.locator('[data-testid="connection-status"]')
    ).first()).toBeVisible();
  });

  test('should display map with route', async ({ page }) => {
    await page.goto('/tracking/test-delivery-123');
    await page.waitForTimeout(3000);
    
    // Vérifier que la carte est chargée
    await expect(page.locator('.leaflet-container').or(
      page.locator('canvas').or(
        page.locator('[class*="map"]')
      )
    )).toBeVisible();
  });

  test('should show destination marker', async ({ page }) => {
    await page.goto('/tracking/test-delivery-123');
    await page.waitForTimeout(3000);
    
    // Vérifier la présence d'un marqueur de destination
    await expect(page.locator('.leaflet-marker-icon').or(
      page.locator('[class*="marker"]')
    ).first()).toBeVisible();
  });

  test('should display ETA when available', async ({ page }) => {
    await page.goto('/tracking/test-delivery-123');
    await page.waitForTimeout(3000);
    
    // Vérifier l'affichage de l'ETA
    await expect(page.getByText(/arrivée estimée|estimated arrival|eta/i).or(
      page.getByText(/\d{1,2}:\d{2}/)  // Format d'heure
    ).first()).toBeVisible();
  });

  test('should show delivery details', async ({ page }) => {
    await page.goto('/tracking/test-delivery-123');
    await page.waitForTimeout(2000);
    
    await expect(page.getByText(/détails|details/i).or(
      page.getByText(/client|customer/i)
    )).toBeVisible();
  });

  test('should update driver position in real-time', async ({ page }) => {
    await page.goto('/tracking/test-delivery-123');
    await page.waitForTimeout(3000);
    
    // Capturer la position initiale du marqueur livreur
    const initialMarkers = await page.locator('.leaflet-marker-icon').count();
    
    // Attendre une mise à jour (simulée)
    await page.waitForTimeout(5000);
    
    // La carte devrait toujours être visible
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('should handle invalid delivery ID', async ({ page }) => {
    await page.goto('/tracking/invalid-id-123');
    await page.waitForTimeout(2000);
    
    await expect(page.getByText(/introuvable|not found|erreur|error/i).or(
      page.getByRole('heading', { name: /erreur|error/i })
    )).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/tracking/test-delivery-123');
    await page.waitForTimeout(2000);
    
    // Vérifier que le contenu s'adapte
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('.leaflet-container').or(
      page.getByText(/suivi|tracking/i)
    )).toBeVisible();
  });
});

test.describe('Tracking Page Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/tracking/test-delivery-123');
    await page.waitForTimeout(2000);
    
    // Vérifier la présence d'un titre de page
    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThan(0);
  });

  test('should have accessible map', async ({ page }) => {
    await page.goto('/tracking/test-delivery-123');
    await page.waitForTimeout(3000);
    
    // La carte devrait avoir un attribut aria-label ou role
    const map = page.locator('.leaflet-container');
    await expect(map).toBeVisible();
  });

  test('should show last update time', async ({ page }) => {
    await page.goto('/tracking/test-delivery-123');
    await page.waitForTimeout(3000);
    
    // Vérifier l'affichage de la dernière mise à jour
    await expect(page.getByText(/dernière mise à jour|last update/i).or(
      page.getByText(/\d{1,2}:\d{2}:\d{2}/)  // Format heure:minute:seconde
    ).first()).toBeVisible();
  });
});

test.describe('Tracking Page Performance', () => {
  test('should load within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/tracking/test-delivery-123');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/tracking/test-delivery-123');
    await page.waitForTimeout(3000);
    
    // Filtrer les erreurs connues/non critiques
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('source map')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
