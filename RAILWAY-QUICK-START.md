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

Railway devrait détecter automatiquement les 3 services grâce aux fichiers `railway.json`.

Si ce n'est pas le cas, créez manuellement 3 services avec ces configurations :

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

### 5. Variables d'environnement

#### Backend
```env
Cors__AllowedOrigins__0=https://trackly-frontend-business-production.up.railway.app
Cors__AllowedOrigins__1=https://trackly-frontend-driver-production.up.railway.app
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:$PORT
```

#### Frontend Business
```env
PUBLIC_API_BASE_URL=https://trackly-backend-production.up.railway.app
PUBLIC_SIGNALR_URL=https://trackly-backend-production.up.railway.app/hubs/tracking
NODE_ENV=production
PORT=$PORT
```

#### Frontend Driver
```env
PUBLIC_API_BASE_URL=https://trackly-backend-production.up.railway.app
PUBLIC_SIGNALR_URL=https://trackly-backend-production.up.railway.app/hubs/tracking
NODE_ENV=production
PORT=$PORT
```

**Important** : Remplacez les URLs par les URLs réelles après le premier déploiement.

## ✅ Vérification

- Backend: `https://votre-backend.up.railway.app/health`
- Frontend Business: `https://votre-frontend-business.up.railway.app`
- Frontend Driver: `https://votre-frontend-driver.up.railway.app`

## 💰 Coûts

~20€/mois pour les 3 services + PostgreSQL

## 📚 Documentation Complète

Voir [RAILWAY-SETUP.md](RAILWAY-SETUP.md) pour plus de détails.
