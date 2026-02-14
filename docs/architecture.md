---
layout: default
title: Architecture
---

# 🏗️ Architecture & CI/CD

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE TRACKLY                        │
└─────────────────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────────┐
  │                         FRONTENDS                              │
  │                         (Vercel)                               │
  ├─────────────────┬──────────────────┬──────────────────────────┤
  │                 │                  │                          │
  │  🎨 Business    │  📱 Driver       │  🔍 Tracking             │
  │  SvelteKit      │  SvelteKit       │  Next.js                 │
  │                 │  PWA             │                          │
  │  Port: 5173     │  Port: 5175      │  Port: 3004              │
  │                 │                  │                          │
  └────────┬────────┴────────┬─────────┴────────────┬─────────────┘
           │                 │                      │
           │    API Calls    │      API Calls       │  Public API
           │   (Authenticated)                    │   (Read-only)
           │                 │                      │
           └─────────────────┼──────────────────────┘
                             │
                             ▼
           ┌─────────────────────────────────────┐
           │           BACKEND                    │
           │       (Railway + Docker)             │
           │                                      │
           │  ⚙️ .NET 8 API                      │
           │  📡 SignalR /hubs/tracking          │
           │  🗄️ PostgreSQL                      │
           │                                      │
           │  URL: backend-production-050e       │
           │       .up.railway.app               │
           └─────────────────────────────────────┘
```

---

## 🚀 CI/CD Workflows

### Triggers et Actions

| Événement | Workflows lancés | Cible |
|-----------|------------------|-------|
| Push sur `develop` | Build & Lint, Vercel Preview | Preview |
| Push sur `main` | Build & Lint, Vercel Production, Railway Deploy | Production |
| PR vers `develop` | Build & Lint, Vercel Preview | Preview PR |
| Manual (workflow_dispatch) | E2E Tests | - |

### Séquence de déploiement

```
┌─────────────────────────────────────────────────────────────────┐
│                    DÉPLOIEMENT PRODUCTION                       │
└─────────────────────────────────────────────────────────────────┘

  Développeur
       │
       │ git push origin main
       ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                      GITHUB ACTIONS                          │
  ├─────────────────────────────────────────────────────────────┤
  │                                                              │
  │  1. CHECKOUT                                                  │
  │     └─ Récupérer le code                                     │
  │                                                              │
  │  2. SETUP NODE.JS                                            │
  │     └─ Version 20, cache npm                                 │
  │                                                              │
  │  3. INSTALL DEPENDENCIES                                     │
  │     └─ npm ci                                                │
  │                                                              │
  │  4. BUILD                                                    │
  │     └─ npm run build                                         │
  │     └─ Vérifie TypeScript, génère dist/                     │
  │                                                              │
  │  5. VERCEL DEPLOY                                            │
  │     ├─ frontend-business → production                       │
  │     ├─ frontend-tracking → production                       │
  │     └─ frontend-landing    → production                     │
  │                                                              │
  │  6. RAILWAY REDEPLOY                                         │
  │     └─ Backend uniquement                                   │
  │                                                              │
  └─────────────────────────────────────────────────────────────┘
       │
       ├──────────────────────────────────────┐
       ▼                                      ▼
  ┌────────────┐                      ┌──────────────┐
  │  VERCEL    │                      │   RAILWAY    │
  │            │                      │              │
  │ 🎨 Business│                      │ ⚙️ Backend   │
  │ 📱 Driver  │                      │ 🗄️ Database │
  │ 🔍 Tracking│                      │ 📡 SignalR   │
  └────────────┘                      └──────────────┘
```

---

## 📁 Workflows GitHub Actions

### CI (Turborepo)

**Fichier** : `.github/workflows/ci.yml`

**Jobs** :
1. **Build & Lint** (toujours)
   - Install dependencies
   - Build
   - ~~Lint~~ (désactivé)

2. **Vercel Preview** (PR uniquement)
   - Déploie les 3 frontends en preview
   - Commente la PR avec les URLs

3. **Vercel Production** (main uniquement)
   - Déploie en production

4. **Railway Redeploy** (main uniquement)
   - Redéploie uniquement le backend

### E2E Tests (Manuel uniquement)

**Fichier** : `.github/workflows/e2e-tests.yml`

⚠️ **Déclenchement manuel uniquement** via `workflow_dispatch`

Pour lancer :
```
GitHub → Actions → E2E Tests → Run workflow
```

**Jobs** :
- test-business (Playwright)
- test-driver (Playwright)
- test-tracking (Playwright)

### GHCR Images

**Fichier** : `.github/workflows/ghcr.yml`

- Build les images Docker
- Push vers GitHub Container Registry
- Déclenche Railway redeploy

---

## 🌐 Configuration des Services

### Vercel (Frontends)

| Projet | Framework | Build Command | Output |
|--------|-----------|---------------|--------|
| frontend-business | SvelteKit | `vite build` | `.svelte-kit/output` |
| frontend-driver | SvelteKit | `vite build` | `.svelte-kit/output` |
| frontend-tracking | Next.js | `next build` | `.next/standalone` |

**Variables d'environnement** (Repository secrets) :
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_BUSINESS`
- `VERCEL_PROJECT_ID_TRACKING`
- `VERCEL_PROJECT_ID_LANDING`

### Railway (Backend)

**Service** : .NET 8 Web API

**Variables d'environnement** :
- `DATABASE_URL` (PostgreSQL)
- `JWT_SECRET`
- `PORT` (8000 par défaut)
- `Cors__AllowedPatterns__0` = `https://*.vercel.app`

**Build** :
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0
COPY backend/ /app
WORKDIR /app
EXPOSE 8000
ENTRYPOINT ["dotnet", "Trackly.API.dll"]
```

---

## 🔒 CORS Configuration

Le backend accepte les origines suivantes :

```csharp
// Origines exactes (production)
https://trackly-frontend-business.vercel.app
https://trackly-frontend-tracking.vercel.app
https://trackly-frontend-driver.vercel.app

// Patterns (pour les previews)
https://*.vercel.app
```

**Configuration Railway** :
```
Cors__AllowedPatterns__0 = https://*.vercel.app
```

---

## 📊 Monitoring

### Health Checks

| Service | URL | Status |
|---------|-----|--------|
| Backend | `/health` | `{"status": "ok"}` |
| Frontend Business | `/` | Page d'accueil |

### Logs

- **Vercel** : Dashboard → Projet → Functions → Logs
- **Railway** : Dashboard → Projet → Deployments → Logs

---

## 🔄 Mise à jour d'URL Railway

Si l'URL Railway change (ex: `backend-production-050e` → `backend-production-xxxx`) :

1. **Identifier les fichiers à modifier** :
   ```bash
   grep -r "railway.app" --include="*.ts" --include="*.js"
   ```

2. **Mettre à jour** :
   - `.env.deployments`
   - `frontend-business/src/lib/api/client.ts`
   - `frontend-tracking/src/lib/config.ts`
   - `frontend-driver/src/lib/config.ts`
   - `.env.example` (x3)

3. **Redéployer** tous les frontends
