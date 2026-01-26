# Script pour liberer le port du frontend Vite
# Usage: .\scripts\kill-frontend.ps1

$ErrorActionPreference = "Continue"

$port = 5173  # Port par defaut de Vite

Write-Host "Liberation du port frontend (5173)..." -ForegroundColor Cyan
Write-Host ""

try {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    
    if ($connection) {
        $processId = $connection.OwningProcess | Select-Object -First 1 -Unique
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        
        if ($process) {
            $processName = $process.ProcessName
            Write-Host "Port $port : Tue: $processName (PID: $processId)" -ForegroundColor Red
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-Host "Frontend: processus tue" -ForegroundColor Green
        } else {
            Write-Host "Port $port : Libre" -ForegroundColor Green
        }
    } else {
        Write-Host "Port $port : Libre" -ForegroundColor Green
    }
} catch {
    $errorMsg = $_.Exception.Message
    Write-Host "Erreur: $errorMsg" -ForegroundColor Red
}

Write-Host ""
