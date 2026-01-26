# Script pour liberer les ports du backend .NET
# Usage: .\scripts\kill-backend.ps1

$ErrorActionPreference = "Continue"

# Ports du backend
$ports = @(
    5257,  # HTTP
    7114   # HTTPS
)

Write-Host "Liberation des ports backend (5257, 7114)..." -ForegroundColor Cyan
Write-Host ""

$killedCount = 0

foreach ($port in $ports) {
    Write-Host "Port $port :" -ForegroundColor Yellow -NoNewline
    
    try {
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
Write-Host "Backend: $killedCount processus tue(s)" -ForegroundColor Green
Write-Host ""
