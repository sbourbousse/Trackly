# Script pour générer la documentation MkDocs
# Usage: .\scripts\build-docs.ps1 [serve|build]

param(
    [Parameter(Position=0)]
    [ValidateSet("serve", "build", "deploy")]
    [string]$Action = "serve"
)

$ErrorActionPreference = "Stop"

Write-Host "📚 Trackly Documentation Builder" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Python est installé
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python trouvé: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "  Installez Python depuis https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Vérifier si pip est disponible
try {
    pip --version | Out-Null
    Write-Host "✓ pip trouvé" -ForegroundColor Green
} catch {
    Write-Host "✗ pip n'est pas disponible" -ForegroundColor Red
    exit 1
}

# Installer les dépendances si nécessaire
if (-not (Test-Path "venv")) {
    Write-Host "📦 Création de l'environnement virtuel..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "📦 Activation de l'environnement virtuel..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
pip install -q --upgrade pip
pip install -q -r requirements-docs.txt

Write-Host ""

# Exécuter l'action demandée
switch ($Action) {
    "serve" {
        Write-Host "🚀 Démarrage du serveur de documentation..." -ForegroundColor Cyan
        Write-Host "   Ouvrez http://127.0.0.1:8000 dans votre navigateur" -ForegroundColor Yellow
        Write-Host ""
        mkdocs serve
    }
    "build" {
        Write-Host "🔨 Construction de la documentation..." -ForegroundColor Cyan
        mkdocs build
        Write-Host ""
        Write-Host "✓ Documentation générée dans le dossier 'site/'" -ForegroundColor Green
    }
    "deploy" {
        Write-Host "🚀 Déploiement de la documentation..." -ForegroundColor Cyan
        Write-Host "   (Assurez-vous d'avoir configuré mkdocs.yml avec votre repo)" -ForegroundColor Yellow
        mkdocs gh-deploy
        Write-Host ""
        Write-Host "✓ Documentation déployée sur GitHub Pages" -ForegroundColor Green
    }
}
