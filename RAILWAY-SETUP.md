# 🚂 Configuration Railway - Trackly

Ce guide explique comment configurer Railway pour déployer les 3 services de Trackly.

## Structure des Services

Railway déploiera 3 services depuis ce repository :

1. **Backend** (.NET 9) - API + SignalR
2. **Frontend Business** (SvelteKit) - Dashboard
3. **Frontend Driver** (Vite SPA) - PWA Chauffeur

## Prérequis

### 1. Installer l'adapter Node pour SvelteKit

Le frontend-business utilise actuellement `@sveltejs/adapter-vercel`. Pour Railway, il faut utiliser `@sveltejs/adapter-node` :

```bash
cd frontend-business
npm install --save-dev @sveltejs/adapter-node
```

Puis modifier `frontend-business/svelte.config.js` :
```javascript
import adapter from '@sveltejs/adapter-node';

const config = {
	kit: {
		adapter: adapter()
	}
};
```

Et ajouter le script de démarrage dans `frontend-business/package.json` :
```json
{
  "scripts": {
    "start": "node build/index.js"
  }
}
```

**Note** : `serve` est déjà ajouté au `package.json` du frontend-driver.

## Déploiement sur Railway

### Étape 1 : Créer le projet Railway

1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur **"New Project"**
3. Sélectionnez **"Deploy from GitHub repo"**
4. Choisissez votre repository Trackly

### Étape 2 : Ajouter PostgreSQL

1. Dans votre projet Railway, cliquez sur **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway créera automatiquement une base de données
3. La variable `DATABASE_URL` sera automatiquement disponible

### Étape 3 : Configurer les services

Railway devrait détecter automatiquement les 3 services grâce au fichier `railway.toml`.

Si ce n'est pas le cas, créez manuellement 3 services :

#### Service Backend
- **Root Directory**: `backend`
- **Build Command**: `dotnet publish -c Release -o /app`
- **Start Command**: `dotnet Trackly.Backend.dll`

#### Service Frontend Business
- **Root Directory**: `frontend-business`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node build/index.js`

#### Service Frontend Driver
- **Root Directory**: `frontend-driver`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npx serve -s dist -l $PORT`

### Option : Déploiement via GHCR (images pré-buildées)

Railway ne permet pas de déclarer une image GHCR dans `railway.json`/`railway.toml`. Pour utiliser GHCR :

1. Activez le workflow GitHub Actions `Build & push GHCR images` (fichier `.github/workflows/ghcr.yml`).
2. Attendez la création des images `ghcr.io/<owner>/trackly-backend:latest`, `ghcr.io/<owner>/trackly-frontend-business:latest` et `ghcr.io/<owner>/trackly-frontend-driver:latest`.
3. Dans Railway, créez un service **Docker Image** pour chaque image.
4. Renseignez l'image GHCR dans **Settings → Deploy**.
5. Si les images sont privées, ajoutez des credentials GHCR (PAT avec `read:packages`) dans Railway.
6. Pour déployer une nouvelle version : poussez un commit (les images sont mises à jour) puis **Redeploy** dans Railway.

### Étape 4 : Variables d'environnement

#### Backend

Dans les variables du service backend, ajoutez :

```env
# Base de données (automatique depuis PostgreSQL Railway)
DATABASE_URL=<automatique>

# CORS - URLs des frontends Railway (à remplacer par les URLs réelles)
Cors__AllowedOrigins__0=https://trackly-frontend-business-production.up.railway.app
Cors__AllowedOrigins__1=https://trackly-frontend-driver-production.up.railway.app

# Environnement
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:$PORT
```

**Option recommandé Railway** : utilisez une variable de référence vers le service Postgres :  
`DATABASE_URL=${{Postgres.DATABASE_URL}}`  
Le backend convertit automatiquement un `DATABASE_URL` au format `postgres://` si nécessaire.

#### Frontend Business

```env
# URL du backend Railway (à remplacer par l'URL réelle)
PUBLIC_API_BASE_URL=https://trackly-backend-production.up.railway.app
PUBLIC_SIGNALR_URL=https://trackly-backend-production.up.railway.app/hubs/tracking

# Environnement
NODE_ENV=production
PORT=$PORT
```

**Option recommandé Railway** : si votre service backend s'appelle `backend`, utilisez :  
`PUBLIC_API_BASE_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}`  
`PUBLIC_SIGNALR_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}/hubs/tracking`

#### Frontend Driver

```env
# URL du backend Railway (à remplacer par l'URL réelle)
PUBLIC_API_BASE_URL=https://trackly-backend-production.up.railway.app
PUBLIC_SIGNALR_URL=https://trackly-backend-production.up.railway.app/hubs/tracking

# Environnement
NODE_ENV=production
PORT=$PORT
```

**Option recommandé Railway** : si votre service backend s'appelle `backend`, utilisez :  
`PUBLIC_API_BASE_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}`  
`PUBLIC_SIGNALR_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}/hubs/tracking`

### Étape 5 : Obtenir les URLs

Une fois déployés, Railway vous donnera des URLs pour chaque service :

- Backend : `https://trackly-backend-production.up.railway.app`
- Frontend Business : `https://trackly-frontend-business-production.up.railway.app`
- Frontend Driver : `https://trackly-frontend-driver-production.up.railway.app`

**Important** : Mettez à jour les variables d'environnement avec les URLs réelles après le premier déploiement.

## Configuration CORS

Assurez-vous que le backend autorise les origines des frontends Railway. Mettez à jour les variables CORS du backend avec les URLs réelles de vos frontends.

## Vérification

- ✅ Backend : `https://votre-backend.up.railway.app/health`
- ✅ Frontend Business : `https://votre-frontend-business.up.railway.app`
- ✅ Frontend Driver : `https://votre-frontend-driver.up.railway.app`

## Coûts

Railway facture par service actif :
- **Backend** : ~5€/mois
- **Frontend Business** : ~5€/mois
- **Frontend Driver** : ~5€/mois
- **PostgreSQL** : ~5€/mois

**Total estimé** : ~20€/mois pour les 3 services + base de données

## Alternative : Déploiement Mixte

Pour réduire les coûts, vous pouvez :
- **Backend** : Railway (~5€/mois)
- **Frontends** : Vercel (gratuit)

Dans ce cas, configurez les variables CORS du backend pour autoriser les URLs Vercel.

## Troubleshooting

### Le frontend-business ne démarre pas
- Vérifiez que `@sveltejs/adapter-node` est installé
- Vérifiez que le script `start` existe dans `package.json`
- Vérifiez les logs Railway pour les erreurs de build

### Le frontend-driver ne se charge pas
- Vérifiez que `serve` est installé
- Vérifiez que le dossier `dist` est généré après le build
- Vérifiez que le port est correctement configuré

### Erreurs CORS
- Vérifiez que les URLs frontend sont dans `Cors__AllowedOrigins__*`
- Vérifiez que les URLs utilisent HTTPS
- Redéployez le backend après avoir modifié les variables CORS
