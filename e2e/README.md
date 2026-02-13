# 🧪 Tests E2E Playwright - Trackly

Suite de tests end-to-end complète pour toutes les applications Trackly.

## 📁 Structure

```
e2e-tests/
├── frontend-business/
│   ├── playwright.config.ts
│   └── e2e/
│       ├── auth-and-nav.spec.ts    # Authentification & navigation
│       ├── orders.spec.ts          # Commandes & Import CSV
│       └── deliveries-and-map.spec.ts  # Livraisons & carte
│
├── frontend-driver/
│   ├── playwright.config.ts
│   └── e2e/
│       └── driver.spec.ts          # App livreur PWA
│
├── frontend-tracking/
│   ├── playwright.config.ts
│   └── e2e/
│       └── tracking.spec.ts        # Tracking client public
│
├── e2e/package.json               # Scripts globaux
└── .github/workflows/e2e-tests.yml # CI/CD GitHub Actions
```

## 🚀 Installation

### 1. Installer Playwright dans chaque frontend

```bash
# Frontend Business
cd frontend-business
npm install -D @playwright/test
npx playwright install

# Frontend Driver
cd ../frontend-driver
npm install -D @playwright/test
npx playwright install

# Frontend Tracking
cd ../frontend-tracking
npm install -D @playwright/test
npx playwright install
```

### 2. Ou utiliser le script global

```bash
cd e2e
npm install
npm run install:browsers
```

## 🎯 Exécution des tests

### Tous les tests
```bash
cd e2e
npm run test:all
```

### Tests spécifiques
```bash
# Business uniquement
npm run test:business

# Driver uniquement
npm run test:driver

# Tracking uniquement
npm run test:tracking
```

### Mode UI interactif
```bash
npm run test:ui:business
npm run test:ui:driver
npm run test:ui:tracking
```

### Avec debug
```bash
cd frontend-business
npx playwright test --debug
```

## 📊 Navigateurs testés

| Navigateur | Business | Driver | Tracking |
|------------|----------|--------|----------|
| Chromium ✅ | ✅ | ✅ | ✅ |
| Firefox ✅ | ✅ | - | ✅ |
| WebKit ✅ | ✅ | - | ✅ |
| Mobile Chrome | ✅ | ✅ | ✅ |
| Mobile Safari | ✅ | ✅ | ✅ |

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env.test` à la racine de chaque frontend :

```env
# Frontend Business
PLAYWRIGHT_BASE_URL=http://localhost:5173
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword

# Frontend Driver
PLAYWRIGHT_BASE_URL=http://localhost:5175

# Frontend Tracking
PLAYWRIGHT_BASE_URL=http://localhost:3004
```

### CI/CD

Les tests s'exécutent automatiquement sur :
- **Push** sur `develop` et `main`
- **Pull Request** vers `develop` et `main`
- **Manuellement** via `workflow_dispatch`

## 📝 Scénarios couverts

### Frontend Business
- ✅ Login/Logout
- ✅ Navigation entre pages
- ✅ CRUD Commandes
- ✅ Import CSV avec validation
- ✅ Gestion des livraisons
- ✅ Carte interactive
- ✅ Dashboard avec statistiques

### Frontend Driver (PWA)
- ✅ Login avec Driver ID
- ✅ Liste des livraisons
- ✅ Détails livraison
- ✅ GPS et tracking
- ✅ Validation livraison (boutons tactiles)
- ✅ Fonctionnement offline

### Frontend Tracking (Public)
- ✅ Page de tracking
- ✅ Affichage carte en temps réel
- ✅ Position livreur
- ✅ Statut livraison
- ✅ ETA estimée
- ✅ Responsive mobile

## 🎭 Bonnes pratiques

### 1. Sélecteurs robustes
```typescript
// ✅ Bon : Utiliser des data-testid
await page.getByTestId('login-button').click();

// ✅ Bon : Utiliser les rôles ARIA
await page.getByRole('button', { name: /connexion/i }).click();

// ❌ Éviter : Sélecteurs CSS fragiles
await page.locator('.btn-primary:nth-child(2)').click();
```

### 2. Attentes explicites
```typescript
// ✅ Bon : Attendre l'élément
await expect(page.getByText('Chargement terminé')).toBeVisible();

// ❌ Éviter : Timeouts arbitraires
await page.waitForTimeout(2000);
```

### 3. Tests isolés
Chaque test doit être indépendant et ne pas dépendre de l'état d'un autre test.

## 📈 Rapports

Les rapports HTML sont générés automatiquement :

```bash
# Voir le rapport
npm run report:business
npm run report:driver
npm run report:tracking
```

En CI/CD, les rapports sont téléchargeables depuis les artifacts GitHub Actions.

## 🔍 Debugging

### Traces
```bash
npx playwright test --trace on
```

### Screenshots
```bash
npx playwright test --screenshot on
```

### Vidéos
```bash
npx playwright test --video on
```

## 🚨 Gestion des erreurs

Les tests sont conçus pour être résilients :
- Pas d'erreur si les données sont vides
- Fallback sur les éléments optionnels
- Vérification de visibilité avant interaction

## 📚 Ressources

- [Documentation Playwright](https://playwright.dev/docs/intro)
- [API Playwright](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
