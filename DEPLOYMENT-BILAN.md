# Bilan des Déploiements Trackly

## 📅 Date: 2026-02-13

---

## 🌐 VERCEL

### Projets déployés

| Projet | URL | Statut |
|--------|-----|--------|
| frontend-business | https://trackly-business.vercel.app | ✅ Actif |
| frontend-driver | https://trackly-driver.vercel.app | ✅ Actif |
| frontend-tracking | https://trackly-tracking.vercel.app | ✅ Actif |

### Configuration

- **Turborepo** : Configuré avec `turbo.json`
- **Vercel CLI** : Installé localement (`npx vercel`)
- **GitHub Integration** : Workflow `ci.yml` avec déploiements preview et production

### Secrets requis (GitHub)

| Secret | Statut |
|--------|--------|
| `VERCEL_TOKEN` | ⏳ À configurer |
| `VERCEL_ORG_ID` | ⏳ À configurer |
| `VERCEL_PROJECT_ID_BUSINESS` | ⏳ À configurer |
| `VERCEL_PROJECT_ID_TRACKING` | ⏳ À configurer |
| `VERCEL_PROJECT_ID_LANDING` | ⏳ À configurer |

### Commandes Vercel utiles

```bash
# Lier un projet (à faire une fois par frontend)
cd frontend-business && npx vercel link

# Déployer en preview
cd frontend-business && npx vercel

# Déployer en production
cd frontend-business && npx vercel --prod

# Voir les logs
cd frontend-business && npx vercel logs

# Lister les déploiements
npx vercel ls
```

---

## 🚂 RAILWAY

### Services configurés

| Service | Type | Statut |
|---------|------|--------|
| backend | .NET / Docker | ✅ Configuré |
| frontend-business | Static | ✅ Configuré |
| frontend-driver | Static | ✅ Configuré |

### Configuration

- **railway.toml** : Config à la racine
- **railway.json** : Dans chaque dossier service
- **GitHub Integration** : Workflow `railway-redeploy.yml`

### Secrets (Environnement "main")

| Secret | Valeur | Dernière mise à jour |
|--------|--------|---------------------|
| `RAILWAY_API_TOKEN` | ca700b57-b373-44a3-b44e-be221597ef4f | 2 semaines |
| `RAILWAY_ENVIRONMENT_ID` | ccef76ec-5b25-4997-bdcb-33a67662dec6 | 2 semaines |
| `RAILWAY_SERVICE_ID_BACKEND` | d76367f4-d80d-481c-9187-787e61591470 | 2 semaines |
| `RAILWAY_SERVICE_ID_FRONTEND_BUSINESS` | 0c09a87a-94c1-4f99-94be-35cd335627a9 | 2 semaines |
| `RAILWAY_SERVICE_ID_FRONTEND_DRIVER` | 7604fb57-2351-463f-8def-edc563ec0fa3 | 2 semaines |

### Protection de l'environnement "main"

- ✅ **Deployment protection rules** activées
- ✅ **Required reviewers** peut être configuré
- ✅ **Wait timer** disponible

---

## 🔄 CI/CD WORKFLOWS

### ci.yml

| Trigger | Jobs |
|---------|------|
| `push: main` | Build + Tests + Deploy Vercel Prod + Redeploy Railway |
| `pull_request` | Build + Tests (continue-on-error) + Deploy Vercel Preview |
| `workflow_dispatch` | Build + Option skip tests |

### railway-redeploy.yml

| Trigger | Action |
|---------|--------|
| `workflow_dispatch` | Redeploy manuel |
| `workflow_run: ghcr` | Redeploy auto après build |

---

## ✅ TODO / Actions requises

### Immédiat

- [ ] Configurer `VERCEL_TOKEN` dans GitHub Secrets
- [ ] Configurer `VERCEL_ORG_ID` dans GitHub Secrets  
- [ ] Configurer `VERCEL_PROJECT_ID_*` pour chaque frontend
- [ ] Lier les projets frontend à Vercel (`vercel link`)

### Optionnel

- [ ] Configurer required reviewers sur l'environnement "main"
- [ ] Ajouter `RAILWAY_SERVICE_ID_FRONTEND_TRACKING` si besoin
- [ ] Tester un déploiement preview sur une PR
- [ ] Tester un déploiement production sur main

---

## 🔧 Commandes de vérification

```bash
# Vérifier l'état des déploiements
./scripts/check-deployments.sh $VERCEL_TOKEN $RAILWAY_TOKEN

# Voir les logs Vercel
cd frontend-business && npx vercel logs

# Voir le statut Railway
railway status
```

---

## 📚 Documentation

- [CI-SETUP.md](./CI-SETUP.md) - Configuration des secrets
- [MCP-VERCEL.md](./docs/MCP-VERCEL.md) - MCP pour Vercel
- [TURBOREPO.md](./TURBOREPO.md) - Configuration Turborepo
