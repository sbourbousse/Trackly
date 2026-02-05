# 🚀 Configuration Railway - Frontend Tracking

Guide rapide pour déployer le frontend-tracking sur Railway.

## ✅ Fichiers créés

Tous les fichiers nécessaires ont été créés :

- ✅ `Dockerfile` - Build Next.js optimisé (standalone)
- ✅ `railway.json` - Configuration Railway
- ✅ `.dockerignore` - Exclusions build
- ✅ `DEPLOYMENT.md` - Documentation complète

## 📦 Déploiement sur Railway

### Option 1 : Déploiement direct depuis le repo

Railway détectera automatiquement le service grâce à `railway.json`.

1. **Créer un nouveau service** dans Railway
2. **Sélectionner** le repo GitHub
3. **Root Directory** : `frontend-tracking`
4. Railway détectera le Dockerfile automatiquement
5. **Configurer** les variables d'environnement (voir ci-dessous)
6. **Déployer** !

### Option 2 : Via GitHub Actions (Recommandé)

Le workflow est déjà configuré pour build et déployer automatiquement.

1. **Configurer les secrets GitHub** (voir ci-dessous)
2. **Push sur main** → Build automatique + Deploy
3. Les 4 services sont déployés en parallèle

## 🔐 Variables d'environnement Railway

Dans le service `frontend-tracking` sur Railway, configurer :

```bash
# URL du backend (OBLIGATOIRE)
NEXT_PUBLIC_API_URL=https://trackly-backend-production.up.railway.app

# Environment (OBLIGATOIRE)
NODE_ENV=production

# Port interne (OPTIONNEL - Railway override avec $PORT)
PORT=3004
```

> **Important** : Remplacer `https://trackly-backend-production.up.railway.app` par l'URL réelle du backend.

## 🔑 Secrets GitHub (pour auto-deploy)

Dans **Settings > Secrets > Actions** du repo GitHub :

| Secret | Valeur | Où le trouver |
|--------|--------|---------------|
| `RAILWAY_API_TOKEN` | Token API | Railway > Account > Tokens |
| `RAILWAY_ENVIRONMENT_ID` | ID environnement | Railway > Project Settings > Environment ID |
| `RAILWAY_SERVICE_ID_FRONTEND_TRACKING` | ID service | Railway > Service Settings > Service ID |

### Comment obtenir le Service ID

1. Ouvrir le service **frontend-tracking** dans Railway
2. Aller dans **Settings**
3. Section **Service ID**
4. Copier l'ID (format UUID)
5. L'ajouter dans GitHub Secrets

## 🌐 CORS Backend

**IMPORTANT** : Le backend doit autoriser le domaine du frontend-tracking.

Dans Railway, service **backend**, ajouter :

```bash
# Domaine Railway par défaut
Cors__AllowedOrigins__2=https://trackly-frontend-tracking-production.up.railway.app

# Ou domaine personnalisé (recommandé)
Cors__AllowedOrigins__2=https://trackly.app
```

## 🎯 Domaine personnalisé (Recommandé)

### Suggestion

Utiliser le domaine racine pour l'application cliente :

```
trackly.app → Frontend Tracking (clients)
app.trackly.app → Frontend Business (commerçants)
driver.trackly.app → Frontend Driver (livreurs)
api.trackly.app → Backend API
```

### Configuration

1. **Railway** : Service frontend-tracking > Settings > Networking > Add Custom Domain
2. **Entrer** : `trackly.app`
3. **DNS** : Configurer chez votre registrar
   ```
   Type: CNAME
   Name: @
   Value: <service-url>.up.railway.app
   ```
4. **Attendre** la propagation DNS (quelques minutes)

### Mettre à jour les variables

Une fois le domaine configuré, mettre à jour :

**Backend CORS** :
```bash
Cors__AllowedOrigins__2=https://trackly.app
```

**Frontend Business / Driver** :
Aucun changement nécessaire (ils appellent l'API via `NEXT_PUBLIC_API_URL`).

## 🔄 Workflow CI/CD

```
1. Developer → Push sur main
   ↓
2. GitHub Actions → Build image Docker
   ├─ Test compilation
   ├─ Build Next.js standalone
   └─ Push sur GHCR
   ↓
3. GitHub Actions → Redeploy Railway
   └─ Appel API Railway avec Service ID
   ↓
4. Railway → Pull image + Restart
   ↓
5. App en ligne sur trackly.app ✅
```

## ✅ Vérification post-déploiement

### 1. Sanity check

```bash
# Page d'accueil
curl https://trackly.app

# Page de tracking (remplacer {id})
curl https://trackly.app/track/{delivery-id}
```

### 2. Checklist manuelle

- [ ] Page d'accueil charge
- [ ] Page de tracking affiche les infos
- [ ] Carte Leaflet s'affiche
- [ ] Couleurs (badges teal, green, red)
- [ ] Boutons "Appeler" et "Contacter"
- [ ] Rafraîchissement auto (30s)
- [ ] Pas d'erreur CORS dans la console

### 3. Performance

Tester avec Lighthouse :
- Performance : > 90
- TTI : < 3s
- FCP : < 1.5s

## 🐛 Troubleshooting

### Erreur CORS

```
Access-Control-Allow-Origin header is missing
```

**Solution** : Vérifier les variables CORS du backend Railway.

### API URL incorrecte

```
Failed to fetch
```

**Solution** : Vérifier `NEXT_PUBLIC_API_URL` dans Railway et redéployer.

### Build échoue

```
Docker build failed
```

**Solution** :
1. Tester localement : `docker build -t test .`
2. Vérifier `package.json` et `package-lock.json`
3. Voir les logs GitHub Actions

### Service crashe au démarrage

**Solution** :
1. Vérifier les logs Railway : `railway logs`
2. Vérifier les variables d'environnement
3. Rollback au déploiement précédent si nécessaire

## 📊 Monitoring

### Logs en temps réel

```bash
# CLI Railway (si installé)
railway logs --service frontend-tracking

# Ou dans Railway UI
Service > Logs
```

### Métriques

Railway fournit :
- CPU usage
- Memory usage
- Request count
- Response time

Voir dans : Service > Metrics

### Alertes

Configurer dans : Service > Settings > Notifications

## 📚 Documentation

- **Architecture** : `docs/ARCHITECTURE.md`
- **Intégration** : `docs/INTEGRATION.md`
- **Déploiement complet** : `DEPLOYMENT.md`
- **Workflows GitHub** : `.github/workflows/README.md`
- **CORS Production** : `docs/CORS-PRODUCTION.md`
- **Quick Start Railway** : `../RAILWAY-QUICK-START.md`

## 🎉 Prêt pour la production

Une fois tout configuré, chaque push sur `main` déploiera automatiquement les changements ! 🚀

---

**Besoin d'aide ?**
- Documentation Railway : https://docs.railway.app
- Issues GitHub : https://github.com/trackly/trackly/issues
