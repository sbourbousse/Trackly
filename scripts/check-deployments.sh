#!/bin/bash
# Script de vérification des déploiements Vercel et Railway

set -e

VERCEL_TOKEN=$1
RAILWAY_TOKEN=$2

echo "=========================================="
echo "  BILAN DES DÉPLOIEMENTS TRACKLY"
echo "=========================================="
echo ""

# Vérifier Vercel
if [ -n "$VERCEL_TOKEN" ]; then
    echo "🌐 VERCEL PROJECTS"
    echo "-------------------"
    
    PROJECTS=$(curl -s "https://api.vercel.com/v9/projects" \
        -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
    
    if echo "$PROJECTS" | jq -e '.projects' > /dev/null 2>&1; then
        echo "$PROJECTS" | jq -r '.projects[] | "  ✅ \(.name)\n     ID: \(.id)\n     Framework: \(.framework // "N/A")\n"'
    else
        echo "  ❌ Erreur: Token invalide ou pas de projets"
    fi
    
    echo ""
    echo "📊 Derniers déploiements Vercel"
    echo "--------------------------------"
    DEPLOYS=$(curl -s "https://api.vercel.com/v6/deployments?limit=5" \
        -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
    
    if echo "$DEPLOYS" | jq -e '.deployments' > /dev/null 2>&1; then
        echo "$DEPLOYS" | jq -r '.deployments[] | "  \(.name): \(.state) → https://\(.url)"'
    fi
else
    echo "⚠️  Token Vercel non fourni"
fi

echo ""
echo ""

# Vérifier Railway
if [ -n "$RAILWAY_TOKEN" ]; then
    echo "🚂 RAILWAY SERVICES"
    echo "-------------------"
    
    PROJECTS=$(curl -s -X POST "https://backboard.railway.com/graphql/v2" \
        -H "Authorization: Bearer $RAILWAY_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"query": "query { projects { edges { node { id name description } } } }"}' 2>/dev/null)
    
    if echo "$PROJECTS" | jq -e '.data.projects.edges' > /dev/null 2>&1; then
        echo "$PROJECTS" | jq -r '.data.projects.edges[].node | "  ✅ \(.name) (ID: \(.id))"'
    else
        echo "  ❌ Erreur: Token invalide ou pas de projets"
        echo "  Réponse: $PROJECTS"
    fi
else
    echo "⚠️  Token Railway non fourni"
fi

echo ""
echo "=========================================="
echo "  CONFIGURATION GITHUB ACTIONS"
echo "=========================================="
echo ""

# Vérifier les fichiers de config
if [ -f ".github/workflows/ci.yml" ]; then
    echo "✅ CI workflow présent"
    grep -q "environment: main" .github/workflows/ci.yml && echo "  ✅ Environment 'main' configuré pour Railway" || echo "  ⚠️  Environment 'main' non trouvé"
    grep -q "VERCEL_TOKEN" .github/workflows/ci.yml && echo "  ✅ Déploiement Vercel configuré" || echo "  ⚠️  Vercel non configuré"
else
    echo "❌ CI workflow manquant"
fi

if [ -f ".github/workflows/railway-redeploy.yml" ]; then
    echo "✅ Railway redeploy workflow présent"
else
    echo "⚠️  Railway redeploy workflow manquant"
fi

echo ""
echo "=========================================="
echo "  PROJETS FRONTEND CONFIGURÉS"
echo "=========================================="
echo ""

for dir in frontend-business frontend-tracking frontend-landing-page frontend-driver; do
    if [ -d "$dir" ]; then
        echo "📁 $dir/"
        if [ -f "$dir/vercel.json" ]; then
            echo "  ✅ vercel.json présent"
        else
            echo "  ⚠️  vercel.json manquant"
        fi
        if [ -f "$dir/.vercel/project.json" ]; then
            echo "  ✅ Lié à Vercel"
        else
            echo "  ⚠️  Non lié à Vercel (run: cd $dir && vercel link)"
        fi
    fi
done

echo ""
echo "=========================================="
echo "  SECRETS REQUIS (GitHub)"
echo "=========================================="
echo ""
echo "Globaux:"
echo "  - VERCEL_TOKEN"
echo "  - VERCEL_ORG_ID"
echo "  - VERCEL_PROJECT_ID_BUSINESS"
echo "  - VERCEL_PROJECT_ID_TRACKING"
echo "  - VERCEL_PROJECT_ID_LANDING"
echo ""
echo "Environnement 'main':"
echo "  - RAILWAY_API_TOKEN"
echo "  - RAILWAY_ENVIRONMENT_ID"
echo "  - RAILWAY_SERVICE_ID_BACKEND"
echo "  - RAILWAY_SERVICE_ID_FRONTEND_BUSINESS"
echo "  - RAILWAY_SERVICE_ID_FRONTEND_DRIVER"
echo ""
