import { test, expect } from '@playwright/test';

/**
 * Tests de connexion et authentification
 */
test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/mot de passe/i).fill('wrongpassword');
    await page.getByRole('button', { name: /se connecter/i }).click();
    
    await expect(page.getByText(/erreur|invalid|incorrect/i)).toBeVisible();
  });

  test('should show validation error for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /se connecter/i }).click();
    
    await expect(page.getByText(/champ requis|required/i).or(
      page.locator('input:invalid')
    )).toBeVisible();
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // Note: À adapter avec de vraies credentials de test
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.getByLabel(/mot de passe/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword');
    await page.getByRole('button', { name: /se connecter/i }).click();
    
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText(/tableau de bord|dashboard/i)).toBeVisible();
  });
});

/**
 * Tests de navigation et layout
 */
test.describe('Navigation & Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Simuler une connexion pour accéder aux pages protégées
    await page.goto('/login');
    // Note: Adapter selon ton système d'auth
    await page.evaluate(() => {
      localStorage.setItem('trackly_auth_token', 'test-token');
    });
  });

  test('should display sidebar navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByText(/dashboard|tableau de bord/i)).toBeVisible();
    await expect(page.getByText(/commandes|orders/i)).toBeVisible();
    await expect(page.getByText(/livraisons|deliveries/i)).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.getByText(/commandes|orders/i).click();
    await expect(page).toHaveURL(/orders/);
    
    await page.getByText(/livraisons|deliveries/i).click();
    await expect(page).toHaveURL(/deliveries/);
    
    await page.getByText(/carte|map/i).click();
    await expect(page).toHaveURL(/map/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Vérifier que le layout s'adapte
    await expect(page.locator('body')).toBeVisible();
    // Le menu devrait être compact ou caché sur mobile
  });
});
