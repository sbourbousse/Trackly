# GitHub Actions Workflows

## Vue d'ensemble

Ce dossier contient les workflows GitHub Actions pour le CI/CD de Trackly.

## Workflows disponibles

### 1. `ghcr.yml` - Build & Push GHCR Images

**Objectif** : Builder et publier les images Docker des 4 services sur GitHub Container Registry.

**Déclencheurs** :
- Push sur `main` avec changements dans les services
- Pull request avec changements dans les services
- Déclenchement manuel (workflow_dispatch)

**Services buildés** :
1. `trackly-backend` (backend/.NET 9)
2. `trackly-frontend-business` (frontend-business/SvelteKit)
3. `trackly-frontend-driver` (frontend-driver/Vite PWA)
4. `trackly-frontend-tracking` (frontend-tracking/Next.js)

**Images générées** :
```
ghcr.io/<owner>/trackly-backend:latest
ghcr.io/<owner>/trackly-backend:<sha>
ghcr.io/<owner>/trackly-frontend-business:latest
ghcr.io/<owner>/trackly-frontend-business:<sha>
ghcr.io/<owner>/trackly-frontend-driver:latest
ghcr.io/<owner>/trackly-frontend-driver:<sha>
ghcr.io/<owner>/trackly-frontend-tracking:latest
ghcr.io/<owner>/trackly-frontend-tracking:<sha>
```

**Optimisations** :
- Cache GitHub Actions (type=gha)
- Build parallèle (matrix strategy)
- Fail-fast désactivé (permet de voir tous les échecs)

### 2. `railway-redeploy.yml` - Redeploy Railway Services

**Objectif** : Redéployer automatiquement les 4 services sur Railway après un build GHCR réussi.

**Déclencheurs** :
- Automatique après completion du workflow `ghcr.yml` (si succès)
- Déclenchement manuel (workflow_dispatch)

**Services redéployés** :
1. Backend
2. Frontend Business
3. Frontend Driver
4. Frontend Tracking

**Secrets requis** :

| Secret | Description | Comment l'obtenir |
|--------|-------------|-------------------|
| `RAILWAY_API_TOKEN` | Token API Railway (personnel/team) | Account > Tokens (créer) |
| `RAILWAY_ENVIRONMENT_ID` | ID environnement (production) | Settings > Environment ID |
| `RAILWAY_SERVICE_ID_BACKEND` | ID service backend | Service backend > Settings > Service ID |
| `RAILWAY_SERVICE_ID_FRONTEND_BUSINESS` | ID service business | Service business > Settings > Service ID |
| `RAILWAY_SERVICE_ID_FRONTEND_DRIVER` | ID service driver | Service driver > Settings > Service ID |
| `RAILWAY_SERVICE_ID_FRONTEND_TRACKING` | ID service tracking | Service tracking > Settings > Service ID |

**API Railway** :
Le workflow utilise l'API GraphQL de Railway :
```graphql
mutation serviceInstanceRedeploy($environmentId: String!, $serviceId: String!) {
  serviceInstanceRedeploy(environmentId: $environmentId, serviceId: $serviceId)
}
```

## Configuration des Secrets

### Dans GitHub

1. Aller dans le repo : **Settings > Secrets and variables > Actions**
2. Cliquer sur **New repository secret**
3. Ajouter chaque secret avec son nom exact et sa valeur

### Dans Railway

Pour obtenir les IDs :

1. **Environment ID** :
   - Aller dans Project Settings
   - Onglet "Environments"
   - Copier l'ID de l'environnement de production

2. **Service IDs** :
   - Ouvrir chaque service
   - Onglet "Settings"
   - Section "Service ID"
   - Copier l'ID

3. **API Token** :
   - Account Settings > Tokens
   - "Create New Token"
   - Donner un nom (ex: "GitHub Actions")
   - Copier le token (ne sera plus visible après)

## Workflow complet

```
1. Developer push code sur main
   ↓
2. ghcr.yml : Build 4 images Docker
   ├─ trackly-backend
   ├─ trackly-frontend-business
   ├─ trackly-frontend-driver
   └─ trackly-frontend-tracking
   ↓
3. Push images sur GHCR
   ↓
4. railway-redeploy.yml : Déclenché automatiquement
   ├─ Redeploy backend
   ├─ Redeploy frontend-business
   ├─ Redeploy frontend-driver
   └─ Redeploy frontend-tracking
   ↓
5. Railway pull les nouvelles images et redémarre
   ↓
6. Applications mises à jour en production
```

## Déclenchement manuel

### Build GHCR

```bash
# Via GitHub UI
Actions > Build & push GHCR images > Run workflow

# Via GitHub CLI
gh workflow run ghcr.yml
```

### Redeploy Railway

```bash
# Via GitHub UI
Actions > Redeploy Railway services > Run workflow

# Via GitHub CLI
gh workflow run railway-redeploy.yml
```

## Monitoring

### Logs GitHub Actions

1. Aller dans **Actions**
2. Cliquer sur le workflow
3. Cliquer sur le run spécifique
4. Voir les logs de chaque step

### Logs Railway

```bash
# CLI Railway (si installé)
railway logs --service backend
railway logs --service frontend-business
railway logs --service frontend-driver
railway logs --service frontend-tracking
```

## Troubleshooting

### Build GHCR échoue

**Symptômes** :
- Erreur de build Docker
- Tests échouent
- Dépendances manquantes

**Solutions** :
1. Vérifier les logs du build dans GitHub Actions
2. Tester le build localement : `docker build -t test .`
3. Vérifier les Dockerfile et .dockerignore
4. S'assurer que les dépendances sont à jour

### Redeploy Railway échoue

**Symptômes** :
- HTTP 401/403 : Token invalide
- HTTP 404 : Service ID incorrect
- Timeout : Railway inaccessible

**Solutions** :
1. **Token invalide** : Régénérer le token Railway et mettre à jour le secret GitHub
2. **Service ID incorrect** : Vérifier les IDs dans Railway et mettre à jour les secrets
3. **Timeout** : Réessayer ou vérifier le statut de Railway

### Service ne démarre pas après redeploy

**Symptômes** :
- Service en erreur dans Railway
- Logs montrent des erreurs au démarrage

**Solutions** :
1. Vérifier les variables d'environnement du service
2. Vérifier les logs Railway : `railway logs`
3. Vérifier que l'image Docker est valide
4. Rollback si nécessaire dans Railway UI

## Bonnes pratiques

### 1. Tester localement avant de push

```bash
# Backend
cd backend
dotnet test
docker build -t trackly-backend .

# Frontend Business
cd frontend-business
npm test
docker build -t trackly-frontend-business .

# Frontend Driver
cd frontend-driver
npm test
docker build -t trackly-frontend-driver .

# Frontend Tracking
cd frontend-tracking
npm test
docker build -t trackly-frontend-tracking .
```

### 2. Utiliser des branches de feature

```bash
git checkout -b feature/nouvelle-fonctionnalite
# Développement
git push origin feature/nouvelle-fonctionnalite
# Créer une Pull Request
# Les workflows s'exécutent sur la PR (mais sans redeploy)
# Merger dans main → Redeploy automatique
```

### 3. Rollback si nécessaire

Si un déploiement pose problème :
1. Aller dans Railway UI
2. Sélectionner le service problématique
3. Onglet "Deployments"
4. Cliquer sur "Rollback" sur le déploiement précédent stable

### 4. Monitorer les déploiements

- Configurer des alertes Railway (Settings > Notifications)
- Vérifier les logs après chaque déploiement
- Tester les fonctionnalités critiques après déploiement

## Améliorations futures

- [ ] Tests automatisés avant build
- [ ] Déploiement sur environnement de staging
- [ ] Notifications Slack/Discord après déploiement
- [ ] Health checks automatiques post-déploiement
- [ ] Versioning sémantique des images
- [ ] Blue-green deployment pour zero-downtime

## Support

Pour toute question :
- Documentation Railway : https://docs.railway.app
- Documentation GitHub Actions : https://docs.github.com/actions
- Issues GitHub du projet
