# Tests E2E Playwright - Trackly Frontend Business

## Installation

```bash
npm install
npx playwright install
```

## Exécution des tests

```bash
# Tous les tests
npx playwright test

# Mode UI interactif
npx playwright test --ui

# Un fichier spécifique
npx playwright test auth-and-nav.spec.ts

# Avec debug
npx playwright test --debug

# En mode headless (CI)
npx playwright test --headless
```

## Structure des tests

```
e2e/
├── auth-and-nav.spec.ts    # Authentification et navigation
├── orders.spec.ts          # Gestion des commandes + Import CSV
└── deliveries-and-map.spec.ts  # Livraisons et carte
```

## Variables d'environnement

Créer un fichier `.env.test` :

```
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword
PLAYWRIGHT_BASE_URL=http://localhost:5173
```

## Bonnes pratiques

1. **Isoler les tests** : Chaque test doit être indépendant
2. **Utiliser des data-testid** : Préférer les attributs data-testid aux sélecteurs CSS
3. **Attendre les éléments** : Utiliser `expect().toBeVisible()` plutôt que `waitForTimeout`
4. **Gérer les erreurs** : Les tests doivent passer même avec des données vides

## CI/CD

Les tests sont configurés pour s'exécuter sur :
- Chromium
- Firefox
- WebKit
- Mobile Chrome
- Mobile Safari

## Debugging

```bash
# Traces détaillées
npx playwright test --trace on

# Capture d'écran sur erreur (déjà activé)
npx playwright test --screenshot on

# Vidéo de la session
npx playwright test --video on
```
