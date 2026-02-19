# Workflows CI/CD Simplifiés

Ce dossier contient les workflows GitHub Actions simplifiés pour Trackly.

## Structure

| Fichier | Description | Déclenchement |
|---------|-------------|---------------|
| `1-ci-build.yml` | Build & Test | Auto: push/PR sur main/develop/testing |
| `2-deploy-backend.yml` | Déploie le backend sur Railway | **Manuel** |
| `3-deploy-frontends.yml` | Déploie les frontends sur Vercel | **Manuel** |
| `4-deploy-all.yml` | Déploie tout (backend + frontends) | **Manuel** |

## Utilisation

### 1. CI Automatique (Build & Test)
Se déclenche automatiquement sur:
- Push sur `main`, `develop`, `testing`
- Pull requests vers `main` ou `develop`

**Vérifie:**
- Backend: `dotnet build`
- Frontends: `npm run build`

### 2. Déployer uniquement le Backend
1. Va sur GitHub → Actions → "Deploy Backend (Manual)"
2. Clique "Run workflow"
3. Choisis:
   - **Environnement**: `production` ou `testing`
   - **Branche**: la branche à déployer (défaut: `main`)
4. Clique "Run"

### 3. Déployer uniquement les Frontends
1. Va sur GitHub → Actions → "Deploy Frontends (Manual)"
2. Clique "Run workflow"
3. Choisis:
   - **Environnement**: `preview` ou `production`
   - **Branche**: la branche à déployer
   - **Frontend(s)**: `all` ou un frontend spécifique
4. Clique "Run"

### 4. Déployer Tout (Backend + Frontends)
1. Va sur GitHub → Actions → "Deploy All (Manual)"
2. Clique "Run workflow"
3. Choisis:
   - **Backend env**: `production` ou `testing`
   - **Frontend env**: `preview` ou `production`
   - **Branche**: la branche à déployer
4. Clique "Run"

## Secrets Requis

### Railway (Backend)
- `RAILWAY_API_TOKEN` - Token API Railway
- `RAILWAY_ENVIRONMENT_ID` - ID environnement production
- `RAILWAY_TESTING_ENVIRONMENT_ID` - ID environnement testing
- `RAILWAY_SERVICE_ID_BACKEND` - ID du service backend

### Vercel (Frontends)
- `VERCEL_TOKEN` - Token Vercel
- `VERCEL_ORG_ID` - ID Organisation Vercel
- `VERCEL_PROJECT_ID_BUSINESS` - ID projet Business
- `VERCEL_PROJECT_ID_DRIVER` - ID projet Driver
- `VERCEL_PROJECT_ID_TRACKING` - ID projet Tracking
- `VERCEL_PROJECT_ID_LANDING` - ID projet Landing (optionnel)

## Avantages de cette approche

✅ **Plus de déploiements automatiques intempestifs**  
✅ **Contrôle total sur quand déployer**  
✅ **Pas de conflits entre workflows**  
✅ **CI rapide (juste build/test)**  
✅ **Déploiement ciblé (un seul service si besoin)**

## Migration depuis l'ancien système

Les anciens workflows sont dans le dossier `old/`:
- `ci.yml`
- `e2e-tests.yml`
- `ghcr.yml`
- `railway-redeploy.yml`
- `testing.yml`
- `vercel-deploy-manual.yml`

Pour revenir en arrière, déplace les fichiers de `old/` vers le dossier parent.
