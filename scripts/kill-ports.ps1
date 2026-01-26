# Script pour liberer tous les ports utilises par Trackly
# Usage: .\scripts\kill-ports.ps1

param(
    [switch]$Force
)

$ErrorActionPreference = "Continue"

# Ports utilises par le projet Trackly
$ports = @(
    5257,  # Backend HTTP
    7114,  # Backend HTTPS
    5173   # Frontend Vite (SvelteKit)
)

Write-Host "Recherche des processus utilisant les ports Trackly..." -ForegroundColor Cyan
Write-Host ""

$killedCount = 0

foreach ($port in $ports) {
    Write-Host "Port $port :" -ForegroundColor Yellow -NoNewline
    
    try {
        # Trouver le processus utilisant le port
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        
        if ($connection) {
            $processId = $connection.OwningProcess | Select-Object -First 1 -Unique
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            
            if ($process) {
                $processName = $process.ProcessName
                $processPath = $process.Path
                
                Write-Host " Processus trouve: $processName (PID: $processId)" -ForegroundColor Red
                Write-Host "   Chemin: $processPath" -ForegroundColor Gray
                
                if ($Force -or (Read-Host "   Tuer ce processus? (O/N)") -eq "O") {
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    Write-Host "   Processus tue" -ForegroundColor Green
                    $killedCount++
                } else {
                    Write-Host "   Ignore" -ForegroundColor Yellow
                }
            } else {
                Write-Host " Aucun processus trouve" -ForegroundColor Green
            }
        } else {
            Write-Host " Port libre" -ForegroundColor Green
        }
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Host " Erreur: $errorMsg" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host ("-" * 50) -ForegroundColor Cyan
Write-Host "Termine: $killedCount processus tue(s)" -ForegroundColor Green
Write-Host ""
