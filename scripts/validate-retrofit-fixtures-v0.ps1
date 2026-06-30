param(
    [string]$SchemaPath = "schemas/retrofit/change-record-v0.json",
    [string]$RecordsRoot = "examples/retrofit",
    [switch]$CheckExternalRepo
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$schemaFullPath = Join-Path $repoRoot $SchemaPath
$recordsFullPath = Join-Path $repoRoot $RecordsRoot
$validatorPath = Join-Path $PSScriptRoot "validate-retrofit-change-record-v0.ps1"
$powerShellExe = (Get-Process -Id $PID).Path

function Fail($Message) {
    Write-Error $Message
    exit 1
}

if (-not (Test-Path $schemaFullPath)) {
    Fail "Schema not found: $SchemaPath"
}

if (-not (Test-Path $recordsFullPath)) {
    Fail "Records root not found: $RecordsRoot"
}

$jsonFiles = @(
    Get-ChildItem -Path (Join-Path $repoRoot "schemas/retrofit"), $recordsFullPath -Recurse -Filter *.json
)

foreach ($file in $jsonFiles) {
    try {
        Get-Content -LiteralPath $file.FullName -Raw | ConvertFrom-Json | Out-Null
    }
    catch {
        Fail "Invalid JSON: $($file.FullName): $($_.Exception.Message)"
    }
}

$textFiles = @(
    Get-ChildItem -Path (Join-Path $repoRoot "schemas/retrofit"), $recordsFullPath -Recurse -File
)

foreach ($file in $textFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    if ($content -match "reports[/\\]") {
        Fail "Formal retrofit fixture must not depend on reports/: $($file.FullName)"
    }
}

$records = @(
    Get-ChildItem -Path $recordsFullPath -Recurse -Filter *.json |
        Where-Object { $_.FullName -match "[/\\]records[/\\]" }
)

if ($records.Count -eq 0) {
    Fail "No retrofit records found under $RecordsRoot"
}

$results = foreach ($record in $records) {
    $relativeRecord = $record.FullName.Substring($repoRoot.Length).TrimStart("\", "/")
    $args = @(
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        $validatorPath,
        "-SchemaPath",
        $SchemaPath,
        "-RecordPath",
        $relativeRecord
    )

    if ($CheckExternalRepo) {
        $args += "-CheckExternalRepo"
    }

    & $powerShellExe @args
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

[PSCustomObject]@{
    status = "retrofit-fixtures-pass"
    schema = $SchemaPath
    recordsRoot = $RecordsRoot
    recordCount = $records.Count
    jsonFileCount = $jsonFiles.Count
    reportsDependencyStatus = "absent"
    records = @($results)
}
