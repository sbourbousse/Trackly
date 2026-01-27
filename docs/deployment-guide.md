# Guide de Déploiement Trackly

Ce guide explique comment déployer Trackly en production.

## Architecture de Déploiement

```
┌─────────────────┐
│  Frontend Biz   │  → Vercel
│  (SvelteKit)    │
└─────────────────┘

┌─────────────────┐
│  Frontend Driver│  → Vercel
│  (Svelte 5 PWA) │
└─────────────────┘

┌─────────────────┐
│  Backend .NET   │  → Railway (recommandé)
│  API + SignalR  │     ou Render/Fly.io
└─────────────────┘

┌─────────────────┐
│  PostgreSQL     │  → Railway (inclus)
│  Database       │     ou service externe
└─────────────────┘
```

## 1. Déploiement du Backend sur Railway

### Pourquoi Railway ?

- ✅ Support natif .NET 9
- ✅ PostgreSQL intégré
- ✅ WebSockets/SignalR supportés
- ✅ Déploiement automatique depuis Git
- ✅ Variables d'environnement faciles
- ✅ Prix abordable (~5-10€/mois)
- ✅ SSL/HTTPS automatique

### Étapes de déploiement

#### 1.1 Créer un compte Railway

1. Allez sur [railway.app](https://railway.app)
2. Créez un compte (GitHub/Google)
3. Créez un nouveau projet

#### 1.2 Ajouter PostgreSQL

1. Dans votre projet Railway, cliquez sur **"New"**
2. Sélectionnez **"Database"** → **"Add PostgreSQL"**
3. Railway créera automatiquement une base de données
4. Notez la variable d'environnement `DATABASE_URL` (sera utilisée plus tard)

#### 1.3 Déployer le Backend

1. Dans votre projet Railway, cliquez sur **"New"** → **"GitHub Repo"**
2. Sélectionnez votre repository Trackly
3. Railway détectera automatiquement le dossier `backend/`
4. Si ce n'est pas le cas, configurez :
   - **Root Directory**: `backend`
   - **Build Command**: `dotnet publish -c Release -o /app`
   - **Start Command**: `dotnet Trackly.Backend.dll`

#### Option GHCR (image pré-buildée)

Railway ne permet pas de déclarer une image GHCR dans `railway.json`. Pour utiliser GHCR :

1. Activez le workflow `.github/workflows/ghcr.yml`.
2. Créez un service **Docker Image** dans Railway.
3. Image backend : `ghcr.io/<owner>/trackly-backend:latest`.
4. Après chaque push sur `main`, utilisez **Redeploy** dans Railway.

#### Redeploy automatique Railway (GHCR)

Un workflow GitHub Actions est fourni : `.github/workflows/railway-redeploy.yml`.

Secrets GitHub requis :
- `RAILWAY_API_TOKEN`
- `RAILWAY_ENVIRONMENT_ID`
- `RAILWAY_SERVICE_ID_BACKEND`
- `RAILWAY_SERVICE_ID_FRONTEND_BUSINESS`
- `RAILWAY_SERVICE_ID_FRONTEND_DRIVER`

#### 1.4 Configurer les variables d'environnement

Dans les paramètres du service backend, ajoutez :

```env
# Base de données (généré automatiquement par Railway PostgreSQL)
DATABASE_URL=<valeur depuis le service PostgreSQL>

# Ou utilisez ConnectionStrings:TracklyDb (format .NET)
ConnectionStrings__TracklyDb=<valeur depuis le service PostgreSQL>

# CORS - URLs de vos frontends Vercel
Cors__AllowedOrigins__0=https://frontend-business-alpha.vercel.app
Cors__AllowedOrigins__1=https://frontend-driver.vercel.app

# Environnement
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:$PORT

# Auth (obligatoire en production)
JWT_SECRET=<32+ caracteres aleatoires>
```

**Note** : Railway expose le port via la variable `$PORT`, utilisez-la dans `ASPNETCORE_URLS`.

#### 1.5 Obtenir l'URL du backend

Une fois déployé, Railway vous donnera une URL comme :
```
https://trackly-backend-production.up.railway.app
```

**Notez cette URL** - vous en aurez besoin pour configurer les frontends.

#### 1.6 Migrations de base de données

Pour exécuter les migrations en production :

**Option 1 : Via Railway CLI**
```bash
railway run dotnet ef database update --project backend/Trackly.Backend.csproj
```

**Option 2 : Automatique au démarrage**
Modifiez `Program.cs` pour exécuter les migrations en production :
```csharp
if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<TracklyDbContext>();
    await dbContext.Database.MigrateAsync();
    
    if (app.Environment.IsDevelopment())
    {
        await SeedData.SeedAsync(scope.ServiceProvider);
    }
}
```

### Alternatives à Railway

#### Render
- Support .NET excellent
- Plan gratuit disponible
- [render.com](https://render.com)

#### Fly.io
- Excellent pour .NET
- Global edge network
- [fly.io](https://fly.io)

#### Azure App Service
- Support .NET natif
- Intégration Azure complète
- Peut être plus cher

## 2. Configuration des Frontends Vercel

### 2.1 Variables d'environnement dans Vercel

Pour chaque projet frontend sur Vercel :

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet (frontend-business ou frontend-driver)
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez les variables suivantes :

#### Pour frontend-business :

```env
PUBLIC_API_BASE_URL=https://votre-backend-railway.up.railway.app
PUBLIC_SIGNALR_URL=https://votre-backend-railway.up.railway.app/hubs/tracking
PUBLIC_DEFAULT_TENANT_ID=<optionnel - ID du tenant par défaut>
# PUBLIC_TENANT_BOOTSTRAP=true (optionnel)
```

#### Pour frontend-driver :

```env
VITE_API_BASE_URL=https://votre-backend-railway.up.railway.app
VITE_SIGNALR_URL=https://votre-backend-railway.up.railway.app/hubs/tracking
VITE_DEFAULT_TENANT_ID=<optionnel>
# VITE_TENANT_BOOTSTRAP=true (optionnel)
```

### 2.2 Redéployer les frontends

Après avoir ajouté les variables d'environnement :

1. Allez dans **Deployments**
2. Cliquez sur **"Redeploy"** sur le dernier déploiement
3. Ou poussez un nouveau commit pour déclencher un nouveau déploiement

## 3. Configuration CORS du Backend

Assurez-vous que le backend autorise les origines de vos frontends Vercel.

Dans `backend/appsettings.json` ou via les variables d'environnement Railway :

```json
{
  "Cors": {
    "AllowedOrigins": [
      "https://frontend-business-alpha.vercel.app",
      "https://frontend-driver.vercel.app",
      "https://frontend-business.vercel.app",
      "https://frontend-driver.vercel.app"
    ]
  }
}
```

Ou via variables d'environnement Railway :
```env
Cors__AllowedOrigins__0=https://frontend-business-alpha.vercel.app
Cors__AllowedOrigins__1=https://frontend-driver.vercel.app
```

## 4. Vérification du Déploiement

### Backend
- ✅ Health check : `https://votre-backend.up.railway.app/health`
- ✅ API root : `https://votre-backend.up.railway.app/`
- ✅ SignalR : `https://votre-backend.up.railway.app/hubs/tracking`

### Frontends
- ✅ Frontend Business : `https://frontend-business-alpha.vercel.app`
- ✅ Frontend Driver : `https://frontend-driver.vercel.app`

## 4.1 Initialisation du Tenant

Si aucun tenant n'existe, vous pouvez :

1. Utiliser l'écran de login du frontend business (creation automatique)
2. Ou appeler l'API :
   `POST /api/auth/register` avec `{ "companyName": "Mon entreprise", "name": "Jean Dupont", "email": "contact@exemple.fr", "password": "..." }`

Ensuite, recopiez l'ID du tenant dans `PUBLIC_DEFAULT_TENANT_ID` si besoin.

## 5. Coûts Estimés

### Railway
- **Hobby Plan** : ~5-10€/mois
  - Backend .NET
  - PostgreSQL (512MB)
  - 500 heures de build/mois

### Vercel
- **Hobby Plan** : Gratuit
  - Frontends statiques
  - Bandwidth généreux
  - Déploiements illimités

**Total estimé** : ~5-10€/mois pour une application complète en production.

## 6. Déploiement Automatique

### Railway
- Déploiement automatique depuis la branche `main`
- Configurez dans **Settings** → **Source**

### Vercel
- Déploiement automatique depuis Git
- Configuré automatiquement lors de la première connexion

## 7. Monitoring et Logs

### Railway
- Logs en temps réel dans le dashboard
- Métriques de performance
- Alertes configurables

### Vercel
- Analytics intégrés
- Logs de déploiement
- Performance monitoring

## 8. Troubleshooting

### Problème : CORS errors
- Vérifiez que les URLs frontend sont dans `Cors:AllowedOrigins`
- Vérifiez que les URLs utilisent HTTPS en production

### Problème : SignalR ne se connecte pas
- Vérifiez que l'URL SignalR utilise HTTPS
- Vérifiez que WebSockets sont supportés (Railway les supporte)

### Problème : Base de données non accessible
- Vérifiez la variable `DATABASE_URL` ou `ConnectionStrings:TracklyDb`
- Vérifiez que les migrations ont été exécutées

### Problème : Variables d'environnement non prises en compte
- Redéployez après avoir ajouté les variables
- Vérifiez que les variables commencent par `PUBLIC_` pour SvelteKit/Vite

## 9. Prochaines Étapes

- [ ] Configurer un domaine personnalisé pour le backend
- [ ] Configurer des domaines personnalisés pour les frontends
- [ ] Mettre en place un monitoring (Sentry, etc.)
- [ ] Configurer des backups automatiques de la base de données
- [ ] Mettre en place CI/CD complet
