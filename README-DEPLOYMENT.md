# 🚀 Guide de Déploiement Rapide - Trackly

## Résumé

- **Frontends** : Déployés sur Vercel ✅
- **Backend** : À déployer sur Railway (recommandé) ou Render/Fly.io
- **Base de données** : PostgreSQL (inclus avec Railway)

## Déploiement Backend sur Railway (5 minutes)

### 1. Créer le projet Railway

1. Allez sur [railway.app](https://railway.app) et connectez-vous
2. Cliquez sur **"New Project"**
3. Sélectionnez **"Deploy from GitHub repo"**
4. Choisissez votre repository Trackly

### 2. Ajouter PostgreSQL

1. Dans votre projet Railway, cliquez sur **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway créera automatiquement une base de données
3. La variable `DATABASE_URL` sera automatiquement disponible

### 3. Configurer le service Backend

1. Railway devrait détecter automatiquement le dossier `backend/`
2. Si ce n'est pas le cas :
   - Cliquez sur le service
   - **Settings** → **Root Directory** : `backend`
   - **Settings** → **Start Command** : `dotnet Trackly.Backend.dll`

### 4. Variables d'environnement

Dans **Settings** → **Variables**, ajoutez :

```env
# CORS - Remplacez par vos URLs Vercel réelles
Cors__AllowedOrigins__0=https://frontend-business-alpha.vercel.app
Cors__AllowedOrigins__1=https://frontend-driver.vercel.app

# Environnement
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:$PORT
```

**Note** : `DATABASE_URL` est automatiquement fourni par Railway.

### 5. Obtenir l'URL du backend

Une fois déployé, Railway vous donnera une URL comme :
```
https://trackly-backend-production.up.railway.app
```

**📝 Notez cette URL** - vous en aurez besoin pour les frontends.

## Configuration des Frontends Vercel

### Variables d'environnement à ajouter

Pour **chaque** projet frontend sur Vercel :

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet
3. **Settings** → **Environment Variables**
4. Ajoutez :

#### frontend-business :
```env
PUBLIC_API_BASE_URL=https://votre-backend-railway.up.railway.app
PUBLIC_SIGNALR_URL=https://votre-backend-railway.up.railway.app/hubs/tracking
```

#### frontend-driver :
```env
PUBLIC_API_BASE_URL=https://votre-backend-railway.up.railway.app
PUBLIC_SIGNALR_URL=https://votre-backend-railway.up.railway.app/hubs/tracking
```

### Redéployer

Après avoir ajouté les variables :
- **Deployments** → Cliquez sur **"Redeploy"** sur le dernier déploiement

## Vérification

- ✅ Backend : `https://votre-backend.up.railway.app/health`
- ✅ Frontend Business : `https://frontend-business-alpha.vercel.app`
- ✅ Frontend Driver : `https://frontend-driver.vercel.app`

## Coûts

- **Railway** : ~5-10€/mois (Hobby Plan)
- **Vercel** : Gratuit (Hobby Plan)

**Total** : ~5-10€/mois

## Documentation Complète

Pour plus de détails, consultez [docs/deployment-guide.md](docs/deployment-guide.md)
