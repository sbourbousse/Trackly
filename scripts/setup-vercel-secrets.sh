#!/bin/bash
# Script de configuration des secrets Vercel pour GitHub Actions
# À exécuter sur ta machine locale (où tu as vercel CLI et gh CLI installés)

set -e

echo "🔧 Configuration des secrets Vercel pour GitHub Actions"
echo "======================================================="
echo ""

# Vérifier les dépendances
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI non trouvé. Installe-le avec : npm i -g vercel"
    exit 1
fi

if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI non trouvé. Installe-le avec :"
    echo "   - macOS: brew install gh"
    echo "   - Ubuntu: sudo apt install gh"
    exit 1
fi

# Vérifier l'authentification GitHub
if ! gh auth status &> /dev/null; then
    echo "❌ Tu n'es pas authentifié à GitHub CLI. Lance : gh auth login"
    exit 1
fi

# Vérifier l'authentification Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Tu n'es pas authentifié à Vercel. Lance : vercel login"
    exit 1
fi

# Récupérer le repo GitHub
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
if [ -z "$REPO" ]; then
    read -p "Nom du repo GitHub (format: owner/repo): " REPO
fi

echo "📁 Repo cible : $REPO"
echo ""

# 1. Créer ou récupérer le token Vercel
echo "🔑 Étape 1: Token Vercel"
echo "------------------------"
if vercel tokens list 2>/dev/null | grep -q "github-actions"; then
    echo "Un token 'github-actions' existe déjà."
    read -p "Créer un nouveau token ? (o/N): " NEW_TOKEN
    if [[ "$NEW_TOKEN" =~ ^[Oo]$ ]]; then
        VERCEL_TOKEN=$(vercel tokens create "github-actions-$(date +%Y%m%d)")
    else
        echo "Utilise le token existant ou va sur https://vercel.com/account/tokens"
        read -s -p "Colle ton VERCEL_TOKEN ici : " VERCEL_TOKEN
        echo ""
    fi
else
    echo "Création d'un nouveau token Vercel..."
    VERCEL_TOKEN=$(vercel tokens create "github-actions")
fi

if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ Impossible de récupérer le token"
    exit 1
fi

echo "✅ Token Vercel récupéré"
echo ""

# 2. Récupérer l'ORG_ID
echo "🔑 Étape 2: Organization ID"
echo "---------------------------"
# Essayer de récupérer depuis le projet
if [ -f ".vercel/project.json" ]; then
    VERCEL_ORG_ID=$(cat .vercel/project.json | grep -o '"orgId"[^,]*' | cut -d'"' -f4)
fi

if [ -z "$VERCEL_ORG_ID" ]; then
    echo "OrgId non trouvé localement."
    echo "Récupération via l'API Vercel..."
    # Alternative : utiliser vercel whoami avec debug
    VERCEL_ORG_ID=$(vercel whoami --debug 2>&1 | grep -o "team_[a-zA-Z0-9]*\|user_[a-zA-Z0-9]*" | head -1)
fi

if [ -z "$VERCEL_ORG_ID" ]; then
    read -p "Colle ton VERCEL_ORG_ID (team_xxx ou user_xxx) : " VERCEL_ORG_ID
fi

echo "✅ ORG_ID: $VERCEL_ORG_ID"
echo ""

# 3. Récupérer les Project IDs
echo "🔑 Étape 3: Project IDs"
echo "-----------------------"

FRONTENDS=("frontend-business" "frontend-tracking" "frontend-landing-page")
PROJECT_IDS=()

for FRONTEND in "${FRONTENDS[@]}"; do
    echo ""
    echo "📂 Traitement de : $FRONTEND"
    
    if [ -f "$FRONTEND/.vercel/project.json" ]; then
        PROJECT_ID=$(cat "$FRONTEND/.vercel/project.json" | grep -o '"projectId"[^,]*' | cut -d'"' -f4)
        echo "   ✅ Trouvé : $PROJECT_ID"
        PROJECT_IDS+=("$PROJECT_ID")
    else
        echo "   ⚠️  Projet Vercel non lié dans $FRONTEND/"
        echo "   Lien manuel nécessaire : cd $FRONTEND && vercel link"
        read -p "   Colle le PROJECT_ID manuellement (prj_xxx) : " PROJECT_ID
        PROJECT_IDS+=("$PROJECT_ID")
    fi
done

echo ""
echo "🔑 Étape 4: Configuration des secrets GitHub"
echo "---------------------------------------------"

# Mapping des noms de secrets
SECRET_NAMES=("VERCEL_TOKEN" "VERCEL_ORG_ID" "VERCEL_PROJECT_ID_BUSINESS" "VERCEL_PROJECT_ID_TRACKING" "VERCEL_PROJECT_ID_LANDING")
SECRET_VALUES=("$VERCEL_TOKEN" "$VERCEL_ORG_ID" "${PROJECT_IDS[0]}" "${PROJECT_IDS[1]}" "${PROJECT_IDS[2]}")

echo ""
echo "📋 Récapitulatif des secrets à créer :"
echo "--------------------------------------"
for i in "${!SECRET_NAMES[@]}"; do
    NAME="${SECRET_NAMES[$i]}"
    VALUE="${SECRET_VALUES[$i]}"
    if [ -n "$VALUE" ]; then
        echo "  ✅ $NAME : ${VALUE:0:10}..."
    else
        echo "  ❌ $NAME : MANQUANT"
    fi
done

echo ""
read -p "Créer ces secrets dans GitHub ? (O/n): " CONFIRM

if [[ "$CONFIRM" =~ ^[Nn]$ ]]; then
    echo "Annulé."
    exit 0
fi

# Créer les secrets
echo ""
echo "🚀 Création des secrets..."
for i in "${!SECRET_NAMES[@]}"; do
    NAME="${SECRET_NAMES[$i]}"
    VALUE="${SECRET_VALUES[$i]}"
    
    if [ -n "$VALUE" ]; then
        echo "  → $NAME"
        echo "$VALUE" | gh secret set "$NAME" -R "$REPO" 2>/dev/null || {
            echo "     ⚠️  Erreur lors de la création de $NAME"
        }
    else
        echo "  ⚠️  $NAME - valeur vide, ignoré"
    fi
done

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "Vérifie les secrets ici :"
echo "  https://github.com/$REPO/settings/secrets/actions"
echo ""
echo "Prochaine étape : relance le workflow sur ta PR pour tester le déploiement preview."