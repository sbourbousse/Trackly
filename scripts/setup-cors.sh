#!/bin/bash
# Script de configuration CORS pour Railway
# Usage: ./scripts/setup-cors.sh [RAILWAY_TOKEN]

set -e

RAILWAY_TOKEN=${1:-$RAILWAY_API_TOKEN}

if [ -z "$RAILWAY_TOKEN" ]; then
    echo "❌ Token Railway requis"
    echo "Usage: ./scripts/setup-cors.sh [token]"
    echo "Ou définir RAILWAY_API_TOKEN"
    exit 1
fi

echo "🚂 Configuration CORS pour Trackly Backend"
echo "=========================================="
echo ""

# URLs des frontends Vercel
BUSINESS_URL="https://trackly-frontend-business-kgj6q1smi-sbourbousses-projects.vercel.app"
DRIVER_URL="https://trackly-frontend-driver-k6ogv930f-sbourbousses-projects.vercel.app"
TRACKING_URL="https://trackly-frontend-tracking-iu5b5wyt5-sbourbousses-projects.vercel.app"
RAILWAY_BUSINESS_URL="https://frontend-business-production.up.railway.app"

echo "URLs à configurer:"
echo "  - $RAILWAY_BUSINESS_URL"
echo "  - $BUSINESS_URL"
echo "  - $DRIVER_URL"
echo "  - $TRACKING_URL"
echo ""

# Utilise la nouvelle variable CORS_ORIGINS (format comma-separated)
CORS_VALUE="$RAILWAY_BUSINESS_URL,$BUSINESS_URL,$DRIVER_URL,$TRACKING_URL"

echo "📤 Envoi vers Railway..."

# Login
echo "$RAILWAY_TOKEN" | railway login --token-stdin

# Set variable CORS_ORIGINS
railway variables set CORS_ORIGINS="$CORS_VALUE" --service backend

echo ""
echo "✅ CORS configuré !"
echo ""
echo "Redéploiement nécessaire:"
echo "  railway up --service backend"
echo ""
echo "Ou via l'interface Railway: Redeploy"
