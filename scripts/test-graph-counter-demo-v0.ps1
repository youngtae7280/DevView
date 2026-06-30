$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$target = Join-Path $repoRoot "work/native/graph-counter-demo/test-counter.ps1"

if (-not (Test-Path $target)) {
    Write-Error "Graph counter test not found: $target"
    exit 1
}

$powerShellExe = (Get-Process -Id $PID).Path
& $powerShellExe -NoProfile -ExecutionPolicy Bypass -File $target
if ($LASTEXITCODE -ne 0) {
    Write-Error "Graph counter runtime test failed"
    exit 1
}
