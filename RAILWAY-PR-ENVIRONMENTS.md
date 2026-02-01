# 🚂 Environnements PR automatiques Railway - Trackly

Ce guide explique comment utiliser la fonctionnalité "Automatic PR Environments" de Railway avec Trackly.

## Qu'est-ce que les environnements PR automatiques ?

Les environnements PR automatiques de Railway créent automatiquement un environnement éphémère pour chaque Pull Request. Cet environnement :
- Est créé automatiquement quand une PR est ouverte
- Est mis à jour automatiquement à chaque nouveau commit sur la PR
- Est supprimé automatiquement quand la PR est fermée ou fusionnée
- A des URLs uniques pour chaque service
- Permet de tester les changements avant de les fusionner

## Configuration Railway

### Étape 1 : Activer les environnements PR

1. Allez dans les paramètres de votre projet Railway
2. Cliquez sur l'onglet **"Environments"**
3. Activez **"Automatic PR Environments"**
4. Railway créera automatiquement des environnements pour chaque PR

### Étape 2 : Configurer le repository GitHub

Railway doit être connecté à votre repository GitHub :
1. Dans Railway, allez dans **Settings → GitHub**
2. Assurez-vous que le repository est bien connecté
3. Railway détectera automatiquement les PRs

## Modes de déploiement

Il existe deux modes de déploiement avec Railway :

### Mode 1 : Build natif Railway (Recommandé pour PR)

Railway construit les images à partir du code source en utilisant les Dockerfiles.

**Avantages :**
- ✅ Totalement automatique
- ✅ Pas de configuration supplémentaire nécessaire
- ✅ Railway détecte et déploie automatiquement les changements
- ✅ Fonctionne parfaitement avec les PR environments

**Configuration :**
- Les fichiers `railway.json` dans chaque dossier sont déjà configurés pour utiliser les Dockerfiles
- Aucune modification nécessaire

**Workflow GitHub Actions :**
- Aucun workflow spécifique n'est nécessaire pour les PR
- Railway surveille directement le repository GitHub

### Mode 2 : Images GHCR pré-buildées

Les images Docker sont construites par GitHub Actions et publiées sur GitHub Container Registry (GHCR).

**Avantages :**
- ✅ Images construites en amont
- ✅ Build en parallèle avec GitHub Actions
- ✅ Utilise le cache de build GitHub

**Inconvénients :**
- ⚠️ Configuration plus complexe pour les PR
- ⚠️ Railway doit être configuré manuellement pour utiliser les images PR

**Configuration :**

1. **GitHub Actions** : Le workflow `.github/workflows/ghcr.yml` construit automatiquement les images pour les PRs avec les tags suivants :
   - `ghcr.io/<owner>/trackly-backend:pr-<number>`
   - `ghcr.io/<owner>/trackly-frontend-business:pr-<number>`
   - `ghcr.io/<owner>/trackly-frontend-driver:pr-<number>`

2. **Railway** : Pour utiliser les images GHCR dans les environnements PR, vous devez :
   - Configurer chaque service en mode "Docker Image"
   - Utiliser une variable pour le tag : `ghcr.io/<owner>/trackly-backend:pr-{{PR_NUMBER}}`
   - Ajouter des credentials GHCR si les images sont privées

**Note** : L'utilisation de GHCR avec PR environments est plus complexe. Il est recommandé d'utiliser le mode build natif Railway pour les environnements PR.

## Workflows GitHub Actions

### Workflow GHCR (`ghcr.yml`)

Ce workflow construit et publie les images Docker sur GHCR.

**Déclenchement :**
- ✅ Push sur `main` : Crée les images `latest` et `<sha>`
- ✅ Pull Request : Crée les images `pr-<number>` et `<sha>`
- ✅ Manuel : Via `workflow_dispatch`

**Images créées pour une PR #123 :**
```
ghcr.io/<owner>/trackly-backend:pr-123
ghcr.io/<owner>/trackly-backend:<sha>
ghcr.io/<owner>/trackly-frontend-business:pr-123
ghcr.io/<owner>/trackly-frontend-business:<sha>
ghcr.io/<owner>/trackly-frontend-driver:pr-123
ghcr.io/<owner>/trackly-frontend-driver:<sha>
```

### Workflow Railway Redeploy (`railway-redeploy.yml`)

Ce workflow redéploie les services Railway en production après la construction des images.

**Déclenchement :**
- ✅ Après succès de `ghcr.yml` sur la branche `main`
- ✅ Manuel : Via `workflow_dispatch`
- ❌ **Ne se déclenche PAS pour les PRs** (Railway gère automatiquement les environnements PR)

**Raison :**
Railway crée et gère automatiquement les environnements PR. Le workflow de redéploiement manuel n'est nécessaire que pour la production (environnement principal).

## Utilisation

### Pour tester une PR avec un environnement PR Railway

1. **Créez une Pull Request** sur GitHub
2. **Railway détecte automatiquement la PR** et crée un environnement
3. **Railway déploie automatiquement** les 3 services :
   - Backend
   - Frontend Business  
   - Frontend Driver
4. **Railway fournit des URLs uniques** pour l'environnement PR
5. **Testez vos changements** sur les URLs fournies

### URLs d'environnement PR

Railway génère des URLs uniques pour chaque service dans l'environnement PR :
```
https://trackly-backend-pr-123.up.railway.app
https://trackly-frontend-business-pr-123.up.railway.app
https://trackly-frontend-driver-pr-123.up.railway.app
```

Ces URLs sont affichées dans :
- Le dashboard Railway (onglet Deployments)
- Les logs de déploiement
- Potentiellement dans un commentaire GitHub (si configuré)

## Variables d'environnement pour PR

Railway peut partager les variables d'environnement de l'environnement production avec les environnements PR, ou vous pouvez définir des variables spécifiques.

**Recommandation :**
- Utilisez les variables de référence Railway pour les URLs de services :
  ```
  PUBLIC_API_BASE_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}
  ```
- Cela garantit que chaque environnement PR utilise les bonnes URLs automatiquement

## Vérification

### Comment vérifier qu'un environnement PR fonctionne ?

1. **Railway Dashboard** : Vérifiez que l'environnement PR apparaît dans la liste
2. **Logs de build** : Vérifiez que les builds se sont terminés avec succès
3. **URLs des services** : Testez les URLs fournies par Railway
4. **Health check backend** : `https://trackly-backend-pr-<number>.up.railway.app/health`

## Troubleshooting

### L'environnement PR n'est pas créé automatiquement

**Vérifiez :**
- ✅ "Automatic PR Environments" est activé dans Railway
- ✅ Le repository GitHub est bien connecté à Railway
- ✅ La PR est ouverte depuis une branche du même repository (pas un fork externe)
- ✅ Les fichiers `railway.json` sont présents dans les dossiers de services

### Les images GHCR ne sont pas utilisées dans l'environnement PR

**Solution :**
- Pour les environnements PR, utilisez plutôt le mode build natif Railway (Dockerfiles)
- Si vous devez absolument utiliser GHCR, configurez manuellement chaque service pour utiliser le tag `pr-<number>`

### Les variables d'environnement ne sont pas correctes

**Solution :**
- Utilisez les variables de référence Railway : `${{service.RAILWAY_PUBLIC_DOMAIN}}`
- Vérifiez que les variables sont définies dans l'environnement PR (ou héritées de production)

### Le workflow `ghcr.yml` échoue sur les PRs

**Vérifiez :**
- ✅ Le workflow a les permissions nécessaires : `packages: write`
- ✅ Les chemins modifiés déclenchent bien le workflow
- ✅ Les Dockerfiles sont valides

## Coûts

Les environnements PR Railway sont facturés selon le temps d'utilisation :
- Chaque environnement PR consomme des ressources comme un environnement normal
- Les environnements PR sont automatiquement supprimés quand la PR est fermée
- **Astuce** : Fermez les PRs qui ne sont plus en développement pour économiser

## Résumé

### ✅ Recommandation

Pour une utilisation optimale avec Railway PR Environments :

1. **Activez** "Automatic PR Environments" dans Railway
2. **Laissez** Railway construire à partir des Dockerfiles (mode natif)
3. **Utilisez** le workflow GHCR uniquement pour la production (branche `main`)
4. **Railway gère automatiquement** la création, mise à jour et suppression des environnements PR

### Configuration minimale

Aucune modification supplémentaire n'est nécessaire ! Les workflows GitHub Actions ont été mis à jour pour :
- ✅ Construire les images GHCR pour les PRs (si vous utilisez GHCR)
- ✅ Ne pas interférer avec les déploiements automatiques Railway des PRs
- ✅ Continuer à redéployer automatiquement la production après les merges sur `main`

## Ressources

- [Documentation Railway PR Environments](https://docs.railway.app/deploy/preview-environments)
- [Railway GraphQL API](https://docs.railway.app/reference/public-api)
- [GitHub Actions avec Railway](https://docs.railway.app/deploy/integrations#github-actions)
