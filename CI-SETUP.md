# Configuration Déploiement CI/CD - Trackly

Ce document explique comment configurer les secrets GitHub pour les déploiements automatiques sur Vercel et Railway.

## Secrets GitHub Requis

### Vercel (Déploiement Preview & Production)

Va sur [vercel.com](https://vercel.com) → Settings → Tokens :

1. **VERCEL_TOKEN** : Token d'accès personnel Vercel
2. **VERCEL_ORG_ID** : ID de l'organisation (dans les settings du projet)
3. **VERCEL_TEAM** : Nom de l'équipe Vercel (si applicable)

Pour chaque projet frontend, récupère le **Project ID** dans les settings :
- **VERCEL_PROJECT_ID_BUSINESS** : ID du projet frontend-business
- **VERCEL_PROJECT_ID_TRACKING** : ID du projet frontend-tracking  
- **VERCEL_PROJECT_ID_LANDING** : ID du projet frontend-landing-page
- **VERCEL_PROJECT_ID_DRIVER** : ID du projet frontend-driver (optionnel)

### Railway (Backend + Frontends)

Va sur [railway.app](https://railway.app) → Account Settings → Tokens :

1. **RAILWAY_API_TOKEN** : Token API Railway (Account level)
2. **RAILWAY_PROJECT_ID** : ID du projet Trackly
3. **RAILWAY_ENVIRONMENT_ID** : ID de l'environnement production

Pour chaque service :
- **RAILWAY_SERVICE_ID_BACKEND** : ID du service backend
- **RAILWAY_SERVICE_ID_FRONTEND_BUSINESS** : ID du service frontend-business
- **RAILWAY_SERVICE_ID_FRONTEND_DRIVER** : ID du service frontend-driver
- **RAILWAY_SERVICE_ID_FRONTEND_TRACKING** : ID du service frontend-tracking

## Workflow CI

### Déclencheurs

- **Push sur `main`** : Build + Tests + Déploiement Production Vercel
- **Pull Request** : Build + Tests + Déploiement Preview Vercel + Environnement PR Railway
- **Workflow Dispatch** : Permet de skipper les tests si nécessaire

### Jobs

| Job | Condition | Description |
|-----|-----------|-------------|
| `build-and-test` | Toujours | Build, lint et tests (optionnel) |
| `deploy-vercel-preview` | PR uniquement | Déploiement preview sur Vercel |
| `deploy-railway-preview` | PR uniquement | Création environnement PR sur Railway |
| `deploy-vercel-production` | Push main uniquement | Déploiement production Vercel |

## Commandes Manuelles

### Skip les tests pour déploiement rapide

Via l'interface GitHub :
1. Va dans **Actions** → **CI (Turborepo)**
2. Clique **Run workflow**
3. Coche **Skip tests (déploiement rapide)**
4. Clique **Run workflow**

### Vérifier les déploiements Vercel

```bash
cd frontend-business
npx vercel --token <TOKEN> --prod=false
```

### Vérifier les déploiements Railway

```bash
# Login
railway login --token <TOKEN>

# Voir les environnements
railway environment list

# Switch environnement
railway environment select <env-name>

# Redeploy
railway up
```

## URLs de Preview

Les URLs de preview sont automatiquement commentées sur les PR GitHub :

- **Vercel** : URLs uniques par PR (ex: `https://trackly-business-pr-123-xyz.vercel.app`)
- **Railway** : Environnement PR dédié avec sa propre URL

## Troubleshooting

### Erreur "Project not found" sur Vercel

Vérifie que :
1. Le projet est lié à Vercel (`vercel link`)
2. Le `VERCEL_PROJECT_ID` est correct
3. Le token a accès au projet

### Erreur "Service not found" sur Railway

Vérifie que :
1. Le `RAILWAY_PROJECT_ID` est correct
2. Les `RAILWAY_SERVICE_ID_*` correspondent aux bons services
3. Le token a les droits sur le projet

### Les tests échouent systématiquement

Utilise le workflow dispatch avec "Skip tests" pour déployer malgré tout, puis debug localement :

```bash
npm run test
```
