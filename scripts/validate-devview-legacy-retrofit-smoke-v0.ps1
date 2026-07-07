param(
    [switch]$SkipExternalRepo,
    [string]$JsonOutputPath,
    [string]$MarkdownOutputPath
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$fixtureValidator = Join-Path $PSScriptRoot "validate-retrofit-fixtures-v0.ps1"
$recordValidator = Join-Path $PSScriptRoot "validate-retrofit-change-record-v0.ps1"
$graphSourceValidator = Join-Path $PSScriptRoot "validate-retrofit-graph-source-v0.ps1"
$instructionPackValidator = Join-Path $PSScriptRoot "validate-retrofit-instruction-pack-v0.ps1"

function Fail($Message) {
    Write-Error $Message
    exit 1
}

$fixtureResult = & $fixtureValidator
if ($fixtureResult.status -ne "retrofit-fixtures-pass") {
    Fail "formal retrofit fixture validation failed"
}

$graphSourceResult = & $graphSourceValidator
if ($graphSourceResult.status -ne "retrofit-graph-source-pass") {
    Fail "retrofit graph-source validation failed"
}

if ($SkipExternalRepo) {
    $smart51Result = & $recordValidator `
        -RecordPath "examples/internal-legacy/retrofit/cardprinterconfig/records/smart51-test-setting.validated-then-reverted.json"
}
else {
    $smart51Result = & $recordValidator `
        -RecordPath "examples/internal-legacy/retrofit/cardprinterconfig/records/smart51-test-setting.validated-then-reverted.json" `
        -CheckExternalRepo
}
if (-not $smart51Result.recordStatus) {
    Fail "SMART-51 reverted record validation failed"
}

$laminatorResult = & $recordValidator `
    -RecordPath "examples/internal-legacy/retrofit/cardprinterconfig/records/laminator-tag-layout.active.json"
if (-not $laminatorResult.recordStatus) {
    Fail "Laminator layout active record validation failed"
}

$instructionPacks = @(
    "outputs/retrofit/instruction-packs/laminator-tag-layout.instruction-pack.json",
    "outputs/retrofit/instruction-packs/smart51-test-setting.instruction-pack.json"
)

$instructionPackResults = @()
foreach ($instructionPack in $instructionPacks) {
    $instructionPackResult = & $instructionPackValidator -InstructionPackPath $instructionPack
    if ($instructionPackResult.status -ne "retrofit-instruction-pack-pass") {
        Fail "Instruction pack validation failed: $instructionPack"
    }
    $instructionPackResults += $instructionPackResult
}

$summary = [PSCustomObject]@{
    status = "devview-legacy-retrofit-smoke-pass"
    mode = if ($SkipExternalRepo) { "fixture-only" } else { "fixture-plus-external-repo-check" }
    repoRoot = $repoRoot
    fixtureValidation = $fixtureResult.status
    graphSourceValidation = $graphSourceResult.status
    graphSourceNodeCount = $graphSourceResult.nodeCount
    graphSourceEdgeCount = $graphSourceResult.edgeCount
    instructionPackValidation = "retrofit-instruction-packs-pass"
    instructionPackCount = @($instructionPackResults).Count
    smart51Record = $smart51Result.recordStatus
    smart51ExternalRepoStatus = $smart51Result.externalRepoStatus
    laminatorRecord = $laminatorResult.recordStatus
    reportsDependencyStatus = $fixtureResult.reportsDependencyStatus
    records = @(
        [PSCustomObject]@{
            id = "smart51-test-setting"
            status = $smart51Result.recordStatus
            activeCodeState = $smart51Result.activeCodeState
            externalRepoStatus = $smart51Result.externalRepoStatus
        },
        [PSCustomObject]@{
            id = "laminator-tag-layout"
            status = $laminatorResult.recordStatus
            activeCodeState = $laminatorResult.activeCodeState
            externalRepoStatus = $laminatorResult.externalRepoStatus
        }
    )
    boundaries = [PSCustomObject]@{
        modifiesExternalProject = $false
        enforcement = "non-enforcing-smoke"
        recordsOnly = $true
    }
}

if ($JsonOutputPath) {
    $jsonPath = if ([System.IO.Path]::IsPathRooted($JsonOutputPath)) {
        $JsonOutputPath
    }
    else {
        Join-Path $repoRoot $JsonOutputPath
    }

    $jsonDir = Split-Path -Parent $jsonPath
    if ($jsonDir -and -not (Test-Path $jsonDir)) {
        New-Item -ItemType Directory -Path $jsonDir | Out-Null
    }

    $summary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
}

if ($MarkdownOutputPath) {
    $markdownPath = if ([System.IO.Path]::IsPathRooted($MarkdownOutputPath)) {
        $MarkdownOutputPath
    }
    else {
        Join-Path $repoRoot $MarkdownOutputPath
    }

    $markdownDir = Split-Path -Parent $markdownPath
    if ($markdownDir -and -not (Test-Path $markdownDir)) {
        New-Item -ItemType Directory -Path $markdownDir | Out-Null
    }

    $lines = @(
        "# DevView Retrofit Smoke Report",
        "",
        "Status: $($summary.status)",
        "",
        "Mode: $($summary.mode)",
        "",
        "## Checks",
        "",
        "- Fixture validation: $($summary.fixtureValidation)",
        "- Graph-source validation: $($summary.graphSourceValidation)",
        "- Graph-source nodes/edges: $($summary.graphSourceNodeCount) / $($summary.graphSourceEdgeCount)",
        "- Instruction packs: $($summary.instructionPackValidation) ($($summary.instructionPackCount))",
        "- Reports dependency status: $($summary.reportsDependencyStatus)",
        "- SMART-51 record: $($summary.smart51Record)",
        "- SMART-51 external repo status: $($summary.smart51ExternalRepoStatus)",
        "- Laminator record: $($summary.laminatorRecord)",
        "",
        "## Records",
        "",
        "| Record | Status | Active code state | External repo status |",
        "| --- | --- | --- | --- |"
    )

    foreach ($record in $summary.records) {
        $lines += "| $($record.id) | $($record.status) | $($record.activeCodeState) | $($record.externalRepoStatus) |"
    }

    $lines += @(
        "",
        "## Boundaries",
        "",
        "- External project modification: $($summary.boundaries.modifiesExternalProject)",
        "- Enforcement: $($summary.boundaries.enforcement)",
        "- Scope: records and fixtures only"
    )

    $lines | Set-Content -LiteralPath $markdownPath -Encoding UTF8
}

$summary
