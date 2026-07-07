param()

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$schemaRoot = Join-Path $repoRoot "schemas/devview"

function Fail($Message) {
    Write-Error $Message
    exit 1
}

$required = @(
    "graph-source-v0.json",
    "instruction-pack-v0.json",
    "graph-delta-v0.json",
    "graph-update-proposal-v0.json"
)

$schemas = @()
foreach ($file in $required) {
    $path = Join-Path $schemaRoot $file
    if (-not (Test-Path $path)) {
        Fail "Missing DevView schema: $file"
    }

    $schema = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
    if ($schema.status -ne "draft-active") {
        Fail "Unexpected schema status in ${file}: $($schema.status)"
    }
    if (-not $schema.requiredTopLevelFields -or @($schema.requiredTopLevelFields).Count -eq 0) {
        Fail "Schema missing requiredTopLevelFields: $file"
    }
    $schemas += $schema
}

[PSCustomObject]@{
    status = "devview-legacy-core-schemas-pass"
    schemaCount = @($schemas).Count
    schemas = $required
}
