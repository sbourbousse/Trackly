# Déploiement Frontend Tracking

## 📦 Configuration Railway

Le frontend-tracking est maintenant intégré dans la configuration Railway et GitHub Actions.

### Fichiers créés

- ✅ `Dockerfile` - Build optimisé Next.js (standalone)
- ✅ `railway.json` - Configuration Railway
- ✅ `.dockerignore` - Fichiers exclus du build

### Variables d'environnement Railway

Dans le service frontend-tracking sur Railway, configurez :

```bash
NEXT_PUBLIC_API_URL=https://api.trackly.app
NODE_ENV=production
PORT=3004
```

> **Note** : Remplacez `https://api.trackly.app` par l'URL réelle de votre backend Railway.

## 🚀 Déploiement automatique

### 1. GitHub Actions - Build GHCR

Le workflow `.github/workflows/ghcr.yml` build automatiquement l'image Docker :

```yaml
- service: frontend-tracking
  context: ./frontend-tracking
  dockerfile: ./frontend-tracking/Dockerfile
  image: trackly-frontend-tracking
```

**Déclencheurs** :
- Push sur `main` avec changements dans `frontend-tracking/**`
- Pull request modifiant `frontend-tracking/**`
- Déclenchement manuel

**Image générée** :
```
ghcr.io/<owner>/trackly-frontend-tracking:latest
ghcr.io/<owner>/trackly-frontend-tracking:<sha>
```

### 2. Redéploiement Railway

Le workflow `.github/workflows/railway-redeploy.yml` redéploie automatiquement après un build réussi.

**Secret requis** : `RAILWAY_SERVICE_ID_FRONTEND_TRACKING`

Pour l'obtenir :
1. Aller dans le service frontend-tracking sur Railway
2. Settings > Service ID
3. Copier l'ID
4. L'ajouter dans GitHub : Repo > Settings > Secrets > Actions

## 🏗️ Build Docker local

Pour tester le build localement :

```bash
cd frontend-tracking

# Build
docker build -t trackly-frontend-tracking .

# Run
docker run -p 3004:3004 \
  -e NEXT_PUBLIC_API_URL=http://localhost:5000 \
  trackly-frontend-tracking
```

## 🌐 Domaine personnalisé

### Recommandation

Utilisez le domaine racine pour l'application cliente :
- `trackly.app` → Frontend Tracking (clients finaux)
- `app.trackly.app` → Frontend Business (commerçants)
- `driver.trackly.app` → Frontend Driver (livreurs)
- `api.trackly.app` → Backend API

### Configuration Railway

1. Service frontend-tracking > Settings > Networking
2. Add Custom Domain : `trackly.app`
3. Configurer DNS :
   ```
   Type: CNAME
   Name: @
   Value: <railway-url>.up.railway.app
   ```

## 🔧 Configuration CORS Backend

N'oubliez pas d'ajouter le domaine de production dans les variables CORS du backend :

```bash
Cors__AllowedOrigins__0=https://trackly.app
Cors__AllowedOrigins__1=https://app.trackly.app
Cors__AllowedOrigins__2=https://driver.trackly.app
```

## ✅ Vérification post-déploiement

### 1. Sanity check

```bash
# Vérifier que l'app répond
curl https://trackly.app

# Tester l'endpoint de tracking (remplacer {id})
curl https://trackly.app/track/{delivery-id}
```

### 2. Test des fonctionnalités

- [ ] Page d'accueil charge correctement
- [ ] Page de tracking affiche les informations
- [ ] Carte Leaflet s'affiche
- [ ] Couleurs Tailwind s'affichent (badges de statut)
- [ ] Boutons d'action fonctionnent
- [ ] Rafraîchissement automatique (30s)

### 3. Performance

Vérifier avec Lighthouse ou PageSpeed Insights :
- Time to Interactive < 3s
- First Contentful Paint < 1.5s
- Performance Score > 90

## 🐛 Troubleshooting

### Erreur CORS

**Symptôme** : `Access-Control-Allow-Origin` error

**Solution** : Vérifier les variables CORS du backend Railway incluent l'URL de tracking.

### Variables d'environnement

**Symptôme** : API URL incorrecte

**Solution** : Vérifier `NEXT_PUBLIC_API_URL` dans Railway et redéployer.

### Build échoue

**Symptôme** : Docker build fail

**Solution** : Vérifier les dépendances dans `package.json` et `package-lock.json`.

### Carte ne s'affiche pas

**Symptôme** : Erreur Leaflet

**Solution** : Vérifier que Leaflet CSS est bien chargé et que le composant est lazy-loaded.

## 📊 Monitoring

### Logs Railway

```bash
railway logs --service frontend-tracking
```

### Métriques

Ajouter Google Analytics ou Plausible pour suivre :
- Pages vues
- Temps de chargement
- Taux de rebond
- Devices (mobile vs desktop)

## 🔄 Workflow complet

```
1. Developer push sur main
   ↓
2. GitHub Actions : Build GHCR image
   ↓
3. GitHub Actions : Redeploy Railway
   ↓
4. Railway : Pull image et redémarrer
   ↓
5. Application en ligne sur trackly.app
```

## 📚 Documentation

- **Architecture** : `docs/ARCHITECTURE.md`
- **Intégration** : `docs/INTEGRATION.md`
- **CORS Production** : `docs/CORS-PRODUCTION.md`
- **Railway Quick Start** : `RAILWAY-QUICK-START.md`
