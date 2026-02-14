# 🧪 Environnement de Testing

Guide pour configurer et utiliser l'environnement de testing isolé.

---

## 🎯 Objectif

Avoir un backend **instable** déployé automatiquement depuis la branche `testing` pour valider les features avant de merger dans `develop`.

```
Feature Branch ──merge──► testing ──auto deploy──► Backend Testing
                                    (instable)
                                    
Backend Testing : backend-testing-b8d5.up.railway.app
Base de données : PostgreSQL isolée (testing)
Image Docker    : ghcr.io/.../trackly-backend:testing
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ENVIRONNEMENTS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🧪 TESTING          │  🔵 DEVELOP        │  🟢 PRODUCTION  │
│  ────────────────────│────────────────────│────────────────│
│                     │                    │                 │
│  Branch: testing    │  Branch: develop   │  Branch: main   │
│  Auto-deploy: Oui   │  Auto-deploy: Oui  │  Auto-deploy: Oui│
│  DB: Isolée         │  DB: Develop       │  DB: Production │
│  URL: *-testing     │  URL: *-develop    │  URL: *-prod    │
│  Stability: ⚠️      │  Stability: ✅     │  Stability: ✅  │
│                     │                    │                 │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuration Railway

### 1. Créer l'environnement Testing

Dans Railway Dashboard :
1. **New Project** → **Deploy from GitHub repo**
2. Sélectionner `Trackly`
3. **Create Environment** → Nommer `testing`
4. Ajouter le service **PostgreSQL** (nouvelle base isolée)
5. Ajouter le service **Backend** (Dockerfile)

### 2. Variables d'environnement Testing

| Variable | Valeur | Description |
|----------|--------|-------------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Connexion auto à la DB testing |
| `JWT_SECRET` | `[générer nouveau]` | Différent de prod pour sécurité |
| `Cors__AllowedPatterns__0` | `https://*.vercel.app` | Autorise toutes les previews |
| `Cors__AllowedOrigins__0` | `http://localhost:5173` | Dev local |

### 3. Configurer le déploiement

Service Backend → Settings :
- **Source**: GitHub repo `sbourbousse/Trackly`
- **Branch**: `testing`
- **Root Directory**: `backend`
- **Build Command**: Docker (auto)

---

## 🔐 Secrets GitHub (Environment: testing)

Dans GitHub → Settings → Environments → New environment `testing` :

| Secret | Valeur | Où trouver |
|--------|--------|------------|
| `RAILWAY_API_TOKEN` | Token API Railway | Railway → Account → Tokens |
| `RAILWAY_TESTING_ENVIRONMENT_ID` | ID env testing | Railway → URL du projet |
| `RAILWAY_SERVICE_ID_BACKEND` | ID service backend | Railway → Service settings |
| `RAILWAY_TESTING_URL` | https://backend-testing-xxx.up.railway.app | Railway → Deployments |

---

## 🔄 Workflow de Test

### Scénario : Tester une nouvelle feature

```bash
# 1. La feature est prête sur feature/map-filters
git checkout feature/map-filters
git pull origin feature/map-filters

# 2. Merger dans testing (pas develop !)
git checkout testing
git pull origin testing
git merge feature/map-filters --no-edit
git push origin testing

# 3. Attendre le déploiement (2-3 min)
# GitHub Actions → workflow "Build & Deploy Testing"

# 4. Tester avec le backend testing
# URL: https://backend-testing-xxx.up.railway.app
```

### 5. Tester les frontends

**Option A : Preview Vercel avec backend testing**

Modifier temporairement dans la preview :
```bash
# Dans la console du navigateur sur la preview Vercel:
localStorage.setItem('PUBLIC_API_BASE_URL', 'https://backend-testing-xxx.up.railway.app')
location.reload()
```

**Option B : Local avec backend testing**

```bash
# frontend-business/.env
PUBLIC_API_BASE_URL=https://backend-testing-xxx.up.railway.app

npm run dev
```

---

## ✅ Checklist avant merge dans develop

- [ ] Feature testée avec backend testing
- [ ] API calls fonctionnent correctement
- [ ] Pas d'erreurs CORS
- [ ] Base de données testing stable
- [ ] PR créée vers develop

---

## 🧹 Nettoyer testing

Après validation, reset testing :

```bash
git checkout testing
git reset --hard origin/develop  # Remettre au même niveau que develop
git push --force origin testing
```

---

## 🚨 Points d'attention

| ⚠️ Attention | Solution |
|-------------|----------|
| DB testing ≠ DB prod | Données différentes, reset possible |
| JWT différent | Tokens prod invalides sur testing |
| URL changeable | Railway peut changer l'URL |
| Pas de données sensibles | Utiliser des données de test |

---

## 🔗 URLs de l'environnement

| Service | URL Pattern | Exemple |
|---------|-------------|---------|
| Backend | `backend-testing-*.up.railway.app` | `backend-testing-b8d5.up.railway.app` |
| Health | `/health` | `.../health` |
| API | `/api/*` | `.../api/orders` |

---

*Dernière mise à jour : {{ site.time | date: "%d %B %Y" }}*
