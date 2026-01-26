# Script pour liberer TOUS les ports utilises par Trackly (sans confirmation)
# Usage: .\scripts\kill-ports-all.ps1

$ErrorActionPreference = "Continue"

# Ports utilises par le projet Trackly
$ports = @(
    5257,  # Backend HTTP
    7114,  # Backend HTTPS
    5173   # Frontend Vite (SvelteKit)
)

Write-Host "Liberation de tous les ports Trackly..." -ForegroundColor Cyan
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
                Write-Host " Tue: $processName (PID: $processId)" -ForegroundColor Red
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                $killedCount++
            } else {
                Write-Host " Libre" -ForegroundColor Green
            }
        } else {
            Write-Host " Libre" -ForegroundColor Green
        }
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Host " Erreur: $errorMsg" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host ("-" * 50) -ForegroundColor Cyan
Write-Host "Termine: $killedCount processus tue(s)" -ForegroundColor Green
Write-Host ""
