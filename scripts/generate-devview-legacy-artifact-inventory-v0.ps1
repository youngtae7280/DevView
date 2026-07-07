param(
    [string]$JsonOutputPath = "outputs/devview-legacy-operation-chain/artifact-inventory.json",
    [string]$MarkdownOutputPath = "outputs/devview-legacy-operation-chain/artifact-inventory.md"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Resolve-RepoPath($Path) {
    if ([System.IO.Path]::IsPathRooted($Path)) { return $Path }
    return Join-Path $repoRoot $Path
}

$isGitRepo = $false
$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
$gitProbe = & git -C $repoRoot rev-parse --is-inside-work-tree 2>$null
$gitExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousErrorActionPreference
if ($gitExitCode -eq 0 -and $gitProbe -eq "true") {
    $isGitRepo = $true
}

$artifactRoots = @("schemas", "examples", "scripts", "outputs")
$artifacts = @(
    foreach ($root in $artifactRoots) {
        $path = Join-Path $repoRoot $root
        if (Test-Path $path) {
            Get-ChildItem -LiteralPath $path -Recurse -File | ForEach-Object {
                [PSCustomObject]@{
                    path = $_.FullName.Substring($repoRoot.Length + 1) -replace "\\", "/"
                    bytes = $_.Length
                }
            }
        }
    }
)

$summary = [PSCustomObject]@{
    status = "devview-legacy-artifact-inventory-pass"
    repoRoot = $repoRoot
    workspaceGitRepo = $isGitRepo
    artifactCount = @($artifacts).Count
    artifactRoots = $artifactRoots
    commitPolicy = if ($isGitRepo) {
        "Commit from this workspace after review."
    }
    else {
        "This workspace is not a git repo; copy or promote artifacts into the target DevView repo before commit."
    }
    artifacts = $artifacts
}

$jsonPath = Resolve-RepoPath $JsonOutputPath
$jsonDir = Split-Path -Parent $jsonPath
if ($jsonDir -and -not (Test-Path $jsonDir)) { New-Item -ItemType Directory -Path $jsonDir | Out-Null }
$summary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

$markdownPath = Resolve-RepoPath $MarkdownOutputPath
$markdownDir = Split-Path -Parent $markdownPath
if ($markdownDir -and -not (Test-Path $markdownDir)) { New-Item -ItemType Directory -Path $markdownDir | Out-Null }
$lines = @(
    "# DevView Legacy Artifact Inventory",
    "",
    "Status: $($summary.status)",
    "",
    "- Workspace is git repo: $($summary.workspaceGitRepo)",
    "- Artifact count: $($summary.artifactCount)",
    "- Commit policy: $($summary.commitPolicy)",
    "",
    "## Roots",
    ""
)
foreach ($root in $artifactRoots) {
    $lines += ("- ``{0}``" -f $root)
}
$lines += @("", "## Key Artifacts", "")
foreach ($artifact in $artifacts | Select-Object -First 40) {
    $lines += ("- ``{0}`` ({1} bytes)" -f $artifact.path, $artifact.bytes)
}
if (@($artifacts).Count -gt 40) {
    $lines += "- ... $(@($artifacts).Count - 40) more"
}
$lines | Set-Content -LiteralPath $markdownPath -Encoding UTF8

$summary
