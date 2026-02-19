#!/bin/bash
# Script d'initialisation de la base testing
# À exécuter manuellement UNE FOIS après création de l'environnement

echo "🗄️  Initialisation de la base testing Trackly"
echo "=============================================="

# Vérifier que DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERREUR: DATABASE_URL non défini"
    echo "Assurez-vous d'être dans l'environnement Railway testing"
    exit 1
fi

echo "📋 État actuel de la base:"
echo "URL: ${DATABASE_URL//:*@/:***@}"

# Se connecter et voir les migrations existantes
echo ""
echo "🔍 Tables existantes:"
psql "$DATABASE_URL" -c "\dt" 2>/dev/null || echo "Aucune table trouvée"

echo ""
echo "🔍 Migrations EF Core existantes:"
psql "$DATABASE_URL" -c "SELECT * FROM \"__EFMigrationsHistory\" ORDER BY \"MigrationId\";" 2>/dev/null || echo "Pas de table __EFMigrationsHistory"

echo ""
echo "⚠️  IMPORTANT:"
echo "Si les migrations sont bloquées, vous avez 2 options:"
echo ""
echo "1. OPTION RECOMMANDÉE - Nettoyer et recréer:"
echo "   DROP SCHEMA public CASCADE;"
echo "   CREATE SCHEMA public;"
echo "   GRANT ALL ON SCHEMA public TO railway;"
echo ""
echo "2. OPTION AVANCÉE - Forcer les migrations:"
echo "   dotnet ef database update --connection \"\$DATABASE_URL\""
echo ""
echo "Puis redéployer le backend sur Railway."
