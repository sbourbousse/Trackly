# Configuration Déploiement CI/CD - Trackly

> Test CI deploy - $(date +%Y-%m-%d)

## Secrets GitHub Requis

### 1. Secrets Globaux (Repository Settings → Secrets)

Ces secrets sont utilisés par tous les workflows :

| Secret | Description | Comment l'obtenir |
|--------|-------------|-------------------|
| `VERCEL_TOKEN` | Token Vercel | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | ID Organisation Vercel | `vercel teams list` ou dans les settings du projet |
| `VERCEL_PROJECT_ID_BUSINESS` | ID projet frontend-business | Vercel Dashboard → Project → Settings → General |
| `VERCEL_PROJECT_ID_TRACKING` | ID projet frontend-tracking | Vercel Dashboard → Project → Settings → General |
| `VERCEL_PROJECT_ID_LANDING` | ID projet frontend-landing-page | Vercel Dashboard → Project → Settings → General |

### 2. Secrets d'Environnement "main"

Ces secrets sont dans l'environnement protégé `main` (Settings → Environments → main) :

| Secret | Description |
|--------|-------------|
| `RAILWAY_API_TOKEN` | Token API Railway (Account level) |
| `RAILWAY_ENVIRONMENT_ID` | ID de l'environnement Railway |
| `RAILWAY_SERVICE_ID_BACKEND` | ID du service backend |
| `RAILWAY_SERVICE_ID_FRONTEND_BUSINESS` | ID du service frontend-business |
| `RAILWAY_SERVICE_ID_FRONTEND_DRIVER` | ID du service frontend-driver |

**⚠️ Important** : L'environnement "main" permet de protéger les déploiements Railway (require approval).

## Workflows

### CI (ci.yml)

| Événement | Jobs exécutés |
|-----------|---------------|
| **PR sur develop/main** | Build + Lint + Déploiement Vercel Preview |
| **Push sur main** | Build + Lint + Déploiement Vercel Prod + Redeploy Railway |
| **Workflow dispatch** | Build + Lint |

**Note** : Les tests E2E ont été retirés car trop lourds. Ils peuvent être exécutés localement si nécessaire.

### Railway Redeploy (railway-redeploy.yml)

Peut être déclenché manuellement ou après un build GHCR.

## Configuration Vercel

### Par projet

Dans chaque dossier frontend (frontend-business, frontend-tracking, frontend-landing-page) :

```bash
# Lier le projet à Vercel (une fois)
vercel link
```

Cela crée un dossier `.vercel/` avec le project.json contenant l'ID.

### Variables d'environnement Vercel

Configure dans le dashboard Vercel :
- `PUBLIC_API_URL` : URL du backend Railway
- `NODE_ENV` : production

## Dépannage

### "Resource not accessible by integration" sur Vercel

Vérifie que :
1. Le token Vercel est valide et non expiré
2. Le projet est bien lié (`vercel link`)
3. Le `VERCEL_PROJECT_ID` correspond bien au projet

### "Environment not found" sur Railway

Vérifie que :
1. Le job a bien `environment: main` pour accéder aux secrets
2. Les secrets sont bien dans l'environnement "main" et pas juste dans les secrets globaux

### Les commentaires PR ne s'affichent pas

Vérifie que le workflow a la permission `pull-requests: write` dans les permissions GitHub.
