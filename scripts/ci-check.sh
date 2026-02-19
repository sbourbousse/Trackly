#!/bin/bash
# Script de vérification CI pour Trackly
# Usage: ./scripts/ci-check.sh <pr-number>
# Ce script vérifie les builds et tente des corrections auto

set -e

PR_NUMBER=$1
REPO="sbourbousse/Trackly"

echo "🔍 Vérification CI pour PR #$PR_NUMBER"
echo "========================================"

# Attendre que les builds démarrent
echo "⏳ Attente 3min pour le démarrage des builds..."
sleep 180

# Vérifier le statut des checks
echo "📊 Vérification des builds..."
gh pr checks $PR_NUMBER --repo $REPO | tee /tmp/pr_checks.txt

# Analyser les résultats
FAILED_SERVICES=$(grep "fail" /tmp/pr_checks.txt | awk '{print $1}' || true)

if [ -z "$FAILED_SERVICES" ]; then
    echo "✅ Tous les builds passent !"
    exit 0
fi

echo "❌ Builds en échec détectés :"
echo "$FAILED_SERVICES"

# Pour chaque service en échec, tenter une correction
for SERVICE in $FAILED_SERVICES; do
    echo "🔧 Analyse de l'échec pour $SERVICE..."
    
    # Récupérer l'ID du run failed
    RUN_ID=$(gh run list --repo $REPO --branch $(gh pr view $PR_NUMBER --json headRefName -q .headRefName) --json databaseId,conclusion --jq '.[] | select(.conclusion=="failure") | .databaseId' | head -1)
    
    if [ -n "$RUN_ID" ]; then
        echo "📜 Récupération des logs..."
        gh run view $RUN_ID --log --repo $REPO > /tmp/build_log.txt 2>&1 || true
        
        # Détecter les erreurs courantes et proposer des fixes
        if grep -q "standalone" /tmp/build_log.txt; then
            echo "⚠️  Erreur Docker 'standalone' détectée pour $SERVICE"
            echo "💡 Fix suggéré : Vérifier output: 'standalone' dans next.config.js"
            echo "   Fichier : frontend-tracking/next.config.js"
        fi
        
        if grep -q "error CS" /tmp/build_log.txt; then
            echo "⚠️  Erreur compilation C# détectée pour $SERVICE"
            echo "💡 Fix suggéré : Vérifier 'dotnet build' en local"
        fi
        
        if grep -q "Cannot find module" /tmp/build_log.txt; then
            echo "⚠️  Module npm manquant détecté pour $SERVICE"
            echo "💡 Fix suggéré : Vérifier package.json et npm install"
        fi
    fi
done

echo ""
echo "📋 Résumé des actions nécessaires :"
echo "1. Corriger les erreurs identifiées ci-dessus"
echo "2. Commiter les changements"
echo "3. Push sur la même branche"
echo "4. Le build se relancera automatiquement"
