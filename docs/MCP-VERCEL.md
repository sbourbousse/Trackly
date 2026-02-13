# MCP Vercel pour OpenClaw

Ce MCP permet de gérer les déploiements Vercel directement depuis OpenClaw.

## Configuration

### 1. Obtenir un token Vercel

Allez sur https://vercel.com/account/tokens et créez un token.

### 2. Configurer le token

```bash
# Définir le token comme variable d'environnement
export VERCEL_TOKEN=votre_token_ici

# Ou l'ajouter à l'environnement OpenClaw
openclaw env set VERCEL_TOKEN votre_token_ici
```

## Utilisation

### Lister les projets
```bash
vercel projects ls
```

### Lister les déploiements
```bash
vercel ls
```

### Déployer
```bash
vercel --yes
```

### Déployer en production
```bash
vercel --prod --yes
```

## Scripts utilitaires

### check-vercel.sh - Vérifier l'état des déploiements
```bash
#!/bin/bash
TOKEN=$1

echo "=== Projets Vercel ==="
curl -s "https://api.vercel.com/v9/projects" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.projects[] | "\(.name): \(.id)"'

echo ""
echo "=== Derniers déploiements ==="
curl -s "https://api.vercel.com/v6/deployments?limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.deployments[] | "\(.name) - \(.state) - \(.url)"'
```

## API Endpoints utiles

| Endpoint | Description |
|----------|-------------|
| `GET /v9/projects` | Liste des projets |
| `GET /v6/deployments` | Liste des déploiements |
| `POST /v13/deployments` | Créer un déploiement |
| `GET /v13/deployments/{id}` | Status d'un déploiement |

## Intégration CI/CD

Voir `.github/workflows/ci.yml` pour l'intégration GitHub Actions.
