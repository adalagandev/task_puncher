<#
.SYNOPSIS
    Runs the Task Puncher backend (FastAPI) and frontend (Vite) together.

.DESCRIPTION
    Starts the backend on http://localhost:8000 and the frontend on
    http://localhost:5173 (which proxies /api -> backend). Each runs in its own
    window. Press Ctrl+C in this window to stop both.

.EXAMPLE
    .\dev.ps1
#>

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

# --- sanity checks -----------------------------------------------------------
$venvPython = Join-Path $backend ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Error "Backend venv not found at $venvPython. Create it first: `n  cd backend; python -m venv .venv; .venv\Scripts\Activate.ps1; pip install -r requirements.txt"
}
if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Write-Error "Frontend deps not installed. Run: `n  cd frontend; npm install"
}

# Block until a TCP port accepts a connection, so we don't start the frontend
# before the backend is listening (which made the UI flash a proxy error).
function Wait-ForPort([int]$Port, [int]$TimeoutSec = 30) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        $client = New-Object System.Net.Sockets.TcpClient
        try {
            $client.Connect("localhost", $Port)
            return $true
        }
        catch { Start-Sleep -Milliseconds 400 }
        finally { $client.Dispose() }  # Connect leaves the socket open on success; dispose either way
    }
    return $false
}

# --- launch ------------------------------------------------------------------
Write-Host "Starting backend  -> http://localhost:8000  (docs at /docs)" -ForegroundColor Cyan
$backendProc = Start-Process -FilePath $venvPython `
    -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000" `
    -WorkingDirectory $backend -PassThru

Write-Host "Waiting for backend to listen on :8000..." -ForegroundColor Cyan
if ($backendProc.HasExited) {
    Write-Error "Backend exited during startup (check the backend window)."
}
if (-not (Wait-ForPort -Port 8000)) {
    Write-Warning "Backend didn't open :8000 within 30s; starting frontend anyway (the UI will show a Retry)."
}
else {
    Write-Host "Backend is up." -ForegroundColor Green
}

Write-Host "Starting frontend -> http://localhost:5173" -ForegroundColor Cyan
$frontendProc = Start-Process -FilePath "npm.cmd" `
    -ArgumentList "run", "dev" `
    -WorkingDirectory $frontend -PassThru

Write-Host "`nBoth servers running. Press Ctrl+C to stop both." -ForegroundColor Green

# --- cleanup: kill children when this script is interrupted/exits -------------
try {
    while ($true) {
        if ($backendProc.HasExited)  { Write-Host "Backend exited."  -ForegroundColor Yellow; break }
        if ($frontendProc.HasExited) { Write-Host "Frontend exited." -ForegroundColor Yellow; break }
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    foreach ($p in @($backendProc, $frontendProc)) {
        if ($p -and -not $p.HasExited) {
            # /T kills the whole process tree (uvicorn reloader, node children)
            taskkill /PID $p.Id /T /F 2>$null | Out-Null
        }
    }
}
