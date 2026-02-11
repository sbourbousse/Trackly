import { test, expect } from '@playwright/test';

/**
 * Tests de gestion des commandes
 */
test.describe('Orders Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('trackly_auth_token', 'test-token');
    });
    await page.goto('/orders');
  });

  test('should display orders list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /commandes/i })).toBeVisible();
    await expect(page.getByText(/chargement|loading/i).or(
      page.locator('table tbody tr')
    )).toBeVisible();
  });

  test('should filter orders by status', async ({ page }) => {
    // Attendre le chargement des données
    await page.waitForTimeout(2000);
    
    // Cliquer sur un filtre de statut s'il existe
    const statusFilter = page.getByText(/en attente|pending|livrée|delivered/i).first();
    if (await statusFilter.isVisible().catch(() => false)) {
      await statusFilter.click();
      // Vérifier que le filtre est appliqué
      await expect(page.getByText(/filtre actif/i).or(
        page.locator('[data-testid="status-badge"]')
      )).toBeVisible();
    }
  });

  test('should create new order', async ({ page }) => {
    await page.goto('/orders/new');
    
    await page.getByLabel(/nom du client|customer name/i).fill('Client Test E2E');
    await page.getByLabel(/adresse|address/i).fill('1 Place de la Comédie, 34000 Montpellier');
    await page.getByLabel(/téléphone|phone/i).fill('+33 6 12 34 56 78');
    
    await page.getByRole('button', { name: /créer|ajouter|save/i }).click();
    
    // Vérifier la redirection ou le message de succès
    await expect(page.getByText(/succès|créée|created/i).or(
      page.locator('[data-testid="success-message"]')
    )).toBeVisible();
  });

  test('should show validation errors for invalid order', async ({ page }) => {
    await page.goto('/orders/new');
    
    await page.getByRole('button', { name: /créer|ajouter|save/i }).click();
    
    await expect(page.getByText(/champ requis|required|obligatoire/i).or(
      page.locator('input:invalid')
    )).toBeVisible();
  });

  test('should delete selected orders', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForTimeout(2000);
    
    // Sélectionner une commande si disponible
    const checkbox = page.locator('table tbody tr:first-child input[type="checkbox"]').first();
    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.click();
      
      // Cliquer sur supprimer
      await page.getByRole('button', { name: /supprimer|delete/i }).click();
      
      // Confirmer la suppression
      await page.getByRole('button', { name: /confirmer|oui|ok/i }).click();
      
      await expect(page.getByText(/supprimée|deleted/i)).toBeVisible();
    }
  });
});

/**
 * Tests d'import CSV
 */
test.describe('CSV Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('trackly_auth_token', 'test-token');
    });
    await page.goto('/orders/import');
  });

  test('should display import page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /import/i })).toBeVisible();
    await expect(page.getByText(/csv|fichier|file/i)).toBeVisible();
  });

  test('should upload and parse CSV file', async ({ page }) => {
    // Créer un fichier CSV de test
    const csvContent = `Nom,Adresse,Téléphone,Commentaire
Jean Test,1 Rue Test 34000 Montpellier,+33612345678,Test commentaire
Marie Test,2 Avenue Test 34000 Montpellier,+33687654321,Autre commentaire`;
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-import.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });
    
    // Attendre le parsing
    await page.waitForTimeout(1000);
    
    // Vérifier que les données sont affichées
    await expect(page.getByText(/2 commande/i).or(
      page.getByText(/Jean Test|Marie Test/)
    )).toBeVisible();
  });

  test('should show error for invalid CSV', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'invalid.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Contenu invalide sans colonnes requises'),
    });
    
    await page.waitForTimeout(1000);
    
    await expect(page.getByText(/erreur|error|invalide/i)).toBeVisible();
  });

  test('should validate data before import', async ({ page }) => {
    // CSV avec données invalides (nom trop court)
    const csvContent = `Nom,Adresse
A,1 Rue Test 34000 Montpellier`;
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'invalid-data.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });
    
    await page.waitForTimeout(1000);
    
    // Vérifier la validation
    await expect(page.getByText(/erreur|validation|problème/i).or(
      page.getByRole('button', { name: /corrigez|fix/i })
    )).toBeVisible();
  });
});
