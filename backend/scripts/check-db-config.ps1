# Script de diagnostic : qui prend le dessus sur la chaîne de connexion ?
# Exécuter depuis le dossier backend : .\Scripts\check-db-config.ps1

$ErrorActionPreference = "Stop"

Write-Host "`n=== Diagnostic chaîne de connexion (backend Trackly) ===" -ForegroundColor Cyan
Write-Host ""

# 1. Variables d'environnement qui écrasent la config
Write-Host "1. Variables d'environnement (priorité max)" -ForegroundColor Yellow
$envVars = @(
    "DATABASE_URL",
    "ConnectionStrings__TracklyDb",
    "ConnectionStrings__TracklyDb__ConnectionString",
    "ASPNETCORE_ENVIRONMENT"
)
foreach ($name in $envVars) {
    $val = [Environment]::GetEnvironmentVariable($name, "Process")
    if (-not $val) { $val = [Environment]::GetEnvironmentVariable($name, "User") }
    if (-not $val) { $val = [Environment]::GetEnvironmentVariable($name, "Machine") }
    if ($val) {
        # Ne pas afficher le mot de passe en clair
        $display = $val
        if ($name -like "*Connection*" -or $name -eq "DATABASE_URL") {
            if ($val -match "Host=([^;]+)") { $hostPart = "Host=" + $Matches[1] + "..." }
            elseif ($val -match "postgres(?:ql)?://[^@]+@([^/]+)") { $hostPart = "host: " + $Matches[1] + "..." }
            else { $hostPart = $val.Substring(0, [Math]::Min(60, $val.Length)) + "..." }
            $display = $hostPart
        }
        Write-Host "   $name = $display" -ForegroundColor Green
        Write-Host "      (source: Process/User/Machine - première trouvée)"
    } else {
        Write-Host "   $name = (non définie)" -ForegroundColor DarkGray
    }
}

# 2. Contenu des appsettings (sans mot de passe)
Write-Host "`n2. Fichiers appsettings (dossier projet)" -ForegroundColor Yellow
$backendDir = $PSScriptRoot + "\.."
$projectDir = Resolve-Path $backendDir -ErrorAction SilentlyContinue
if ($projectDir) {
    $files = @("appsettings.json", "appsettings.Development.json", "appsettings.Production.json")
    foreach ($f in $files) {
        $path = Join-Path $projectDir $f
        if (Test-Path $path) {
            try {
                $json = Get-Content $path -Raw | ConvertFrom-Json
                $cs = $json.ConnectionStrings.TracklyDb
                if ($cs) {
                    if ($cs -match "Host=([^;]+);Port=(\d+)") {
                        Write-Host "   $f : Host=$($Matches[1]), Port=$($Matches[2])" -ForegroundColor Green
                    } elseif ($cs -match "postgres") {
                        Write-Host "   $f : (format postgres://...)" -ForegroundColor Green
                    } else {
                        Write-Host "   $f : (présent)" -ForegroundColor Green
                    }
                } else {
                    Write-Host "   $f : pas de ConnectionStrings:TracklyDb" -ForegroundColor DarkGray
                }
            } catch {
                Write-Host "   $f : erreur lecture - $_" -ForegroundColor Red
            }
        } else {
            Write-Host "   $f : (fichier absent)" -ForegroundColor DarkGray
        }
    }
    Write-Host "   Dossier : $projectDir"
} else {
    Write-Host "   Impossible de résoudre le dossier backend." -ForegroundColor Red
}

# 3. Règle de priorité utilisée par Program.cs et la factory
Write-Host "`n3. Priorité utilisée par l'app / EF" -ForegroundColor Yellow
Write-Host "   Program.cs (au run) : 1) DATABASE_URL  2) ConnectionStrings:TracklyDb (config avec AddEnvironmentVariables)"
Write-Host "   Factory EF (dotnet ef) : 1) DATABASE_URL  2) appsettings (fichiers uniquement, dossier projet)"
Write-Host ""

# 4. Qui gagne ?
Write-Host "4. Qui gagne actuellement ?" -ForegroundColor Yellow
$dbUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL", "Process")
if (-not $dbUrl) { $dbUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL", "User") }
if (-not $dbUrl) { $dbUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL", "Machine") }
$connStr = [Environment]::GetEnvironmentVariable("ConnectionStrings__TracklyDb", "Process")
if (-not $connStr) { $connStr = [Environment]::GetEnvironmentVariable("ConnectionStrings__TracklyDb", "User") }
if (-not $connStr) { $connStr = [Environment]::GetEnvironmentVariable("ConnectionStrings__TracklyDb", "Machine") }

if ($dbUrl) {
    Write-Host "   -> DATABASE_URL est définie : c'est ELLE qui est utilisée (app + EF si factory lit env)." -ForegroundColor Magenta
    if ($dbUrl -match "([^/@]+\.(?:proxy\.)?rlwy\.net)") { Write-Host "   -> Host vu : $($Matches[1])" -ForegroundColor Magenta }
} elseif ($connStr) {
    Write-Host "   -> ConnectionStrings__TracklyDb (variable d'env) est définie : utilisée par Program.cs au run." -ForegroundColor Magenta
    if ($connStr -match "Host=([^;]+)") { Write-Host "   -> Host vu : $($Matches[1])" -ForegroundColor Magenta }
} else {
    Write-Host "   -> Aucune variable d'env sur la connexion : les appsettings (fichiers) sont utilisés." -ForegroundColor Green
}

Write-Host "`nPour forcer les appsettings (fichiers) :" -ForegroundColor Cyan
Write-Host "   Dans ce terminal : " -NoNewline
Write-Host '$env:DATABASE_URL = $null' -ForegroundColor White
Write-Host "   Puis : " -NoNewline
Write-Host "Remove-Item Env:ConnectionStrings__TracklyDb -ErrorAction SilentlyContinue" -ForegroundColor White
Write-Host "   Ensuite : " -NoNewline
Write-Host "dotnet ef database update" -ForegroundColor White
Write-Host ""
