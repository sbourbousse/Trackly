# 🚀 Déploiement Railway Rapide - Trackly

Guide rapide pour déployer les 3 services Trackly sur Railway.

## 📋 Fichiers de Configuration

Les fichiers suivants ont été créés :

- `railway.toml` - Configuration principale (documentation)
- `backend/railway.json` - Configuration backend .NET
- `frontend-business/railway.json` - Configuration SvelteKit
- `frontend-driver/railway.json` - Configuration Vite SPA

## ⚡ Déploiement en 5 étapes

### 1. Préparer les dépendances

```bash
# Frontend Business - Installer adapter-node
cd frontend-business
npm install --save-dev @sveltejs/adapter-node

# Modifier svelte.config.js pour utiliser adapter-node
# Ajouter "start": "node build/index.js" dans package.json scripts
```

### 2. Créer le projet Railway

1. Allez sur [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Sélectionnez votre repository Trackly

### 3. Ajouter PostgreSQL

1. Dans le projet Railway : **New** → **Database** → **Add PostgreSQL**
2. La variable `DATABASE_URL` sera automatiquement disponible

### 4. Configurer les services

Railway devrait détecter automatiquement les 4 services grâce aux fichiers `railway.json`.

Si ce n'est pas le cas, créez manuellement 4 services avec ces configurations :

#### Backend
- Root: `backend`
- Build: `dotnet publish -c Release -o /app`
- Start: `dotnet Trackly.Backend.dll`

#### Frontend Business
- Root: `frontend-business`
- Build: `npm install && npm run build`
- Start: `node build/index.js`

#### Frontend Driver
- Root: `frontend-driver`
- Build: `npm install && npm run build`
- Start: `npx serve -s dist -l $PORT`

#### Frontend Tracking (Client)
- Root: `frontend-tracking`
- Build: `npm install && npm run build`
- Start: `node .next/standalone/server.js`

### Option GHCR (images pré-buildées)

Railway ne lit pas d'image GHCR depuis `railway.json`. Si vous préférez GHCR :

1. Activez le workflow `.github/workflows/ghcr.yml`.
2. Utilisez les images :
   - `ghcr.io/<owner>/trackly-backend:latest`
   - `ghcr.io/<owner>/trackly-frontend-business:latest`
   - `ghcr.io/<owner>/trackly-frontend-driver:latest`
   - `ghcr.io/<owner>/trackly-frontend-tracking:latest`
3. Créez des services **Docker Image** dans Railway et collez l'image GHCR.
4. Redeployez dans Railway après chaque push sur `main`.

### 5. Variables d'environnement

#### Backend
```env
# CORS - Autoriser les frontends
Cors__AllowedOrigins__0=https://trackly-frontend-business-production.up.railway.app
Cors__AllowedOrigins__1=https://trackly-frontend-driver-production.up.railway.app
Cors__AllowedOrigins__2=https://trackly-frontend-tracking-production.up.railway.app
# Ajoutez vos domaines personnalisés si vous en avez
# Cors__AllowedOrigins__3=https://trackly.app
# Cors__AllowedOrigins__4=https://app.trackly.app

ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:$PORT
```

> **📚 Documentation CORS** : Voir `docs/CORS-PRODUCTION.md` pour la configuration complète.

#### Frontend Business
```env
PUBLIC_API_BASE_URL=https://trackly-backend-production.up.railway.app
PUBLIC_SIGNALR_URL=https://trackly-backend-production.up.railway.app/hubs/tracking
NODE_ENV=production
PORT=$PORT
```

#### Frontend Driver
```env
VITE_API_BASE_URL=https://trackly-backend-production.up.railway.app
VITE_SIGNALR_URL=https://trackly-backend-production.up.railway.app/hubs/tracking
NODE_ENV=production
PORT=$PORT
```

#### Frontend Tracking (Client)
```env
NEXT_PUBLIC_API_URL=https://trackly-backend-production.up.railway.app
NODE_ENV=production
PORT=3004
```

**Important** : Remplacez les URLs par les URLs réelles après le premier déploiement.

**Note PORT** : Le frontend-tracking utilise le port 3004 en interne, mais Railway l'expose via `$PORT`.

**Note** : Les variables `VITE_*` sont injectées au runtime (au démarrage du container), pas au build time.

## ✅ Vérification

- Backend: `https://votre-backend.up.railway.app/health`
- Frontend Business: `https://votre-frontend-business.up.railway.app`
- Frontend Driver: `https://votre-frontend-driver.up.railway.app`

## 💰 Coûts

~20€/mois pour les 3 services + PostgreSQL

## 📚 Documentation Complète

Voir [RAILWAY-SETUP.md](RAILWAY-SETUP.md) pour plus de détails.
