# Turborepo - Trackly

## Structure

Le dépôt est configuré en **monorepo npm workspaces** avec **Turborepo** pour les tâches build, lint et test.

### Workspaces

| Package | Rôle |
|---------|------|
| `frontend-business` | App SvelteKit (business) |
| `frontend-driver` | App Vite/Svelte (chauffeur) |
| `frontend-tracking` | App Next.js (suivi) |
| `frontend-landing-page` | Landing Next.js |
| `e2e` | Scripts E2E centralisés (optionnel) |

Le **backend** (.NET) reste dans `backend/` et n’est pas dans le workspace npm (build via Railway/dotnet).

## Où va le build ? (dossier de sortie)

Après `npm run build`, chaque app écrit dans **son propre dossier** (chemin relatif au dossier de l'app) :

| App | Dossier de sortie | Remarque |
|-----|-------------------|----------|
| **frontend-business** | `.svelte-kit/output` (Vercel) ou `build/` (local) | SvelteKit + adapter-auto : sur Vercel la sortie est serverless (pas un dossier à pointer). En local, le serveur Node est dans `build/`. |
| **frontend-driver** | **`dist/`** | Vite : sortie dans `frontend-driver/dist/`. Vercel utilise ce dossier (`vercel.json` → `outputDirectory: "dist"`). |
| **frontend-tracking** | **`.next/`** | Next.js : sortie dans `frontend-tracking/.next/`. Vercel détecte Next et gère le déploiement. |
| **frontend-landing-page** | **`.next/`** | Next.js : idem, `frontend-landing-page/.next/`. |

En résumé : **frontend-driver** → `dist/` ; **frontend-tracking** et **frontend-landing-page** → `.next/` ; **frontend-business** → sur Vercel pas de dossier "output" classique (serverless), en local → `build/`.

## Commandes à la racine

À exécuter depuis la **racine du repo** après `npm install` :

```bash
# Installer les dépendances (une fois)
npm install

# Build de tous les fronts
npm run build

# Lint de tous les fronts
npm run lint

# Tests E2E (Playwright) sur les apps qui en ont
npm run test

# Dev en parallèle (tous les fronts)
npm run dev
```

## Premier passage

1. **À la racine uniquement** : `npm install`  
   - À faire **depuis la racine du repo** (pas depuis un sous-dossier).  
   - Installe Turbo, remplit les `node_modules` des workspaces et génère/met à jour `package-lock.json` à la racine.

2. **Commit du lock file** : committer `package-lock.json` à la racine pour que la CI utilise des builds reproductibles (puis tu pourras passer à `npm ci` dans la CI si tu veux).

3. **Vérifier** :  
   - `npm run build`  
   - `npm run lint`  
   - `npm run test` (nécessite les binaires Playwright : `npx playwright install` une fois si besoin)

Sans `npm install` à la racine, les commandes dans un sous-dossier (ex. `frontend-business`) peuvent échouer car les binaires (vite, turbo, etc.) ne sont pas disponibles.

## CI (GitHub Actions)

Le workflow **`.github/workflows/ci.yml`** :

1. Checkout
2. Node 20 + cache npm
3. `npm install`
4. `npx playwright install --with-deps`
5. `npm run build` (turbo)
6. `npm run lint` (turbo)
7. `npm run test` (turbo, E2E)

En cas d’échec des tests, les rapports Playwright sont publiés en artefacts.

## Déploiement

### Vercel (frontends)

- Un **projet Vercel par app**.
- Pour chaque projet, définir le **Root Directory** :
  - `frontend-business`
  - `frontend-driver`
  - `frontend-tracking`
  - `frontend-landing-page`
- Chaque app a un **`vercel.json`** dans son dossier avec `installCommand: "npm install"` et `buildCommand: "npm run build"` pour forcer l’install dans le dossier de l’app. Sinon Vercel détecte Turbo et lance `npm install --prefix=..` (racine du monorepo), ce qui peut faire échouer le build (dépendances à la racine, build dans l’app).
- Vercel détecte SvelteKit / Vite / Next selon le dossier.

### Railway (backend)

- Un seul service pour le backend.
- **Root Directory** : `backend`
- Build : `dotnet publish` (ou la commande configurée dans Railway).
- Le monorepo Turbo ne change rien pour Railway : il ne build que `backend/`.

## Fichiers clés

- **`package.json`** (racine) : workspaces, scripts turbo, dépendance `turbo`
- **`turbo.json`** : tâches `build`, `dev`, `lint`, `test` et options de cache
- **`.github/workflows/ci.yml`** : CI build + lint + test via turbo

## Cache Turbo

Turbo met en cache les sorties des tâches (build, lint, etc.). Le cache est local par défaut (dossier `.turbo`). Pour partager le cache en CI :

- **Vercel Remote Cache** : possible en reliant le repo à Vercel.
- **GitHub Actions** : utiliser `turbo run build --cache-dir .turbo` et un cache sur `.turbo` si tu veux accélérer les runs.

## Tests E2E

- **frontend-business** : `playwright test` (dossier `e2e/`)
- **frontend-driver** : `playwright test`
- **frontend-tracking** : `playwright test`
- **frontend-landing-page** : pas d’E2E (`test` = no-op)

`npm run test` à la racine lance les E2E pour toutes les apps qui ont des tests, en parallèle (chaque app lance son serveur de dev si configuré dans Playwright).
