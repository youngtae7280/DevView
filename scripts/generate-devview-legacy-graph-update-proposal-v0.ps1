param(
    [string]$GraphDeltaPath,
    [string]$JsonOutputPath,
    [string]$MarkdownOutputPath
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Resolve-RepoPath($Path) {
    if ([System.IO.Path]::IsPathRooted($Path)) {
        return $Path
    }

    return Join-Path $repoRoot $Path
}

function Fail($Message) {
    Write-Error $Message
    exit 1
}

if (-not $GraphDeltaPath) {
    Fail "GraphDeltaPath is required"
}

$deltaPath = Resolve-RepoPath $GraphDeltaPath
if (-not (Test-Path $deltaPath)) {
    Fail "Graph delta not found: $GraphDeltaPath"
}

$delta = Get-Content -LiteralPath $deltaPath -Raw | ConvertFrom-Json

$proposal = [PSCustomObject]@{
    schemaVersion = 1
    artifactRole = "devview-graph-update-proposal-v0"
    status = "generated-from-graph-delta"
    graphDeltaPath = $GraphDeltaPath
    sourceRecordId = $delta.sourceRecordId
    proposedRecordState = $delta.graphUpdate.finalState
    proposedNodeUpdates = @(
        $delta.graphUpdate.relatedNodes | ForEach-Object {
            [PSCustomObject]@{
                id = $_.id
                currentState = $_.state
                proposedState = if ($_.id -eq $delta.sourceRecordId -and $delta.graphUpdate.finalState.status) {
                    $delta.graphUpdate.finalState.status
                }
                else {
                    $_.state
                }
                intentClaim = $_.intentClaim
            }
        }
    )
    changedFiles = @($delta.changedFiles)
    edgeIntentSummary = @($delta.graphUpdate.relatedEdgeIntents)
    boundaries = [PSCustomObject]@{
        mutatesGraphSource = $false
        appliesPatch = $false
        requiresReviewBeforeApply = $true
        maintainerIntentClaimed = $delta.boundaries.maintainerIntentClaimed
    }
}

if ($JsonOutputPath) {
    $jsonPath = Resolve-RepoPath $JsonOutputPath
    $jsonDir = Split-Path -Parent $jsonPath
    if ($jsonDir -and -not (Test-Path $jsonDir)) {
        New-Item -ItemType Directory -Path $jsonDir | Out-Null
    }
    $proposal | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
}

if ($MarkdownOutputPath) {
    $markdownPath = Resolve-RepoPath $MarkdownOutputPath
    $markdownDir = Split-Path -Parent $markdownPath
    if ($markdownDir -and -not (Test-Path $markdownDir)) {
        New-Item -ItemType Directory -Path $markdownDir | Out-Null
    }

    $lines = @(
        "# DevView Graph Update Proposal",
        "",
        "Status: $($proposal.status)",
        "",
        "Record: $($proposal.sourceRecordId)",
        "",
        "## Changed Files",
        "",
        "| File | Additions | Deletions |",
        "| --- | ---: | ---: |"
    )

    foreach ($file in $proposal.changedFiles) {
        $lines += "| $($file.path) | $($file.additions) | $($file.deletions) |"
    }

    $lines += @(
        "",
        "## Proposed Node Updates",
        "",
        "| Node | Current | Proposed |",
        "| --- | --- | --- |"
    )

    foreach ($node in $proposal.proposedNodeUpdates) {
        $lines += "| $($node.id) | $($node.currentState) | $($node.proposedState) |"
    }

    $lines += @(
        "",
        "## Edge Intent",
        ""
    )

    foreach ($edge in $proposal.edgeIntentSummary) {
        $classes = @($edge.classifications) -join ", "
        $lines += ("- ``{0}`` [{1}]: {2}" -f $edge.id, $classes, $edge.claim)
    }

    $lines += @(
        "",
        "## Boundaries",
        "",
        "- Mutates graph-source: $($proposal.boundaries.mutatesGraphSource)",
        "- Applies patch: $($proposal.boundaries.appliesPatch)",
        "- Requires review before apply: $($proposal.boundaries.requiresReviewBeforeApply)",
        "- Maintainer intent claimed: $($proposal.boundaries.maintainerIntentClaimed)"
    )

    $lines | Set-Content -LiteralPath $markdownPath -Encoding UTF8
}

$proposal
