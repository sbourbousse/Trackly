# Script pour verifier quels ports sont utilises par Trackly
# Usage: .\scripts\check-ports.ps1

$ErrorActionPreference = "Continue"

# Ports utilises par le projet Trackly
$ports = @(
    @{Port = 5257; Service = "Backend HTTP"},
    @{Port = 7114; Service = "Backend HTTPS"},
    @{Port = 5173; Service = "Frontend Vite"},
    @{Port = 5432; Service = "PostgreSQL"}
)

Write-Host "Verification des ports Trackly..." -ForegroundColor Cyan
Write-Host ""
Write-Host ("{0,-15} {1,-10} {2,-20} {3}" -f "Service", "Port", "Statut", "Processus") -ForegroundColor Yellow
Write-Host ("-" * 70) -ForegroundColor Gray

foreach ($item in $ports) {
    $port = $item.Port
    $service = $item.Service
    
    try {
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        
        if ($connection) {
            $processId = $connection.OwningProcess | Select-Object -First 1 -Unique
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            
            if ($process) {
                $processName = $process.ProcessName
                $status = "Occupe"
                $color = "Red"
            } else {
                $processName = "Inconnu"
                $status = "Occupe"
                $color = "Yellow"
            }
        } else {
            $processName = "-"
            $status = "Libre"
            $color = "Green"
        }
        
        Write-Host ("{0,-15} {1,-10} " -f $service, $port) -NoNewline
        Write-Host ("{0,-20} " -f $status) -ForegroundColor $color -NoNewline
        Write-Host $processName
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Host ($service + " " + $port + " Erreur: " + $errorMsg) -ForegroundColor Red
    }
}

Write-Host ""
