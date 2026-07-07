$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Reset-Directory($Path) {
    if (Test-Path $Path) {
        Remove-Item -LiteralPath $Path -Recurse -Force
    }
    New-Item -ItemType Directory -Path $Path | Out-Null
}

function Init-Repo($Path, $Message) {
    git -C $Path init | Out-Null
    git -C $Path config user.email "codex@example.local"
    git -C $Path config user.name "Codex"
    git -C $Path add .
    git -C $Path commit -m $Message | Out-Null
}

$notesPath = Join-Path $repoRoot "work/native/graph-notes-demo"
Reset-Directory $notesPath
@'
# Graph Notes Demo

This tiny native DevView demo stores maintenance notes as graph-shaped records.

The project is intentionally small so DevView can demonstrate the same operation
chain used for larger projects:

```text
graph-source -> instruction pack -> local change -> graph delta
```
'@ | Set-Content -LiteralPath (Join-Path $notesPath "README.md") -Encoding UTF8
@'
{
  "schemaVersion": 1,
  "notes": [
    {
      "id": "note.demo-purpose",
      "status": "active",
      "intent": "Keep a tiny native example that can prove DevView graph operations without legacy retrofit uncertainty."
    }
  ]
}
'@ | Set-Content -LiteralPath (Join-Path $notesPath "notes.json") -Encoding UTF8
Init-Repo $notesPath "Initial graph notes demo"
@'

## Maintenance Boundary

When a note changes, keep its intent and status visible in the graph source or
note record. Do not update the text alone if the meaning, lifecycle state, or
safety boundary also changed.
'@ | Add-Content -LiteralPath (Join-Path $notesPath "README.md") -Encoding UTF8

$counterPath = Join-Path $repoRoot "work/native/graph-counter-demo"
Reset-Directory $counterPath
@'
# Graph Counter Demo

This tiny native DevView demo exposes one counter function and one local test.

The first behavior dogfood changes the counter step from `+1` to `+2` through
the graph operation chain.
'@ | Set-Content -LiteralPath (Join-Path $counterPath "README.md") -Encoding UTF8
@'
function Get-GraphCounterNextValue {
    param(
        [int]$Value
    )

    return $Value + 1
}
'@ | Set-Content -LiteralPath (Join-Path $counterPath "counter.ps1") -Encoding UTF8
@'
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "counter.ps1")

$actual = Get-GraphCounterNextValue -Value 3
if ($actual -ne 4) {
    throw "Expected 4, got $actual"
}

Write-Output "graph-counter-demo-pass"
'@ | Set-Content -LiteralPath (Join-Path $counterPath "test-counter.ps1") -Encoding UTF8
Init-Repo $counterPath "Initial graph counter demo"
(Get-Content -LiteralPath (Join-Path $counterPath "counter.ps1") -Raw).Replace("return `$Value + 1", "return `$Value + 2") |
    Set-Content -LiteralPath (Join-Path $counterPath "counter.ps1") -Encoding UTF8
(Get-Content -LiteralPath (Join-Path $counterPath "test-counter.ps1") -Raw).Replace("if (`$actual -ne 4) {", "if (`$actual -ne 5) {").Replace("Expected 4", "Expected 5") |
    Set-Content -LiteralPath (Join-Path $counterPath "test-counter.ps1") -Encoding UTF8

$cjsonPath = Join-Path $repoRoot "work/open-source/cJSON"
Reset-Directory $cjsonPath
@'
# cJSON

Ultralightweight JSON parser in ANSI C.

## Building

On Windows CMake is usually used to create a Visual Studio solution file by running it inside the Developer Command Prompt for Visual Studio, for exact steps follow the official documentation from CMake and Microsoft and use the online search engine of your choice. The descriptions of the the options above still generally apply, although not all of them work on Windows.

#### Makefile

**NOTE:** This Method is deprecated. Use CMake if at all possible. Makefile support is limited to fixing bugs.
'@ | Set-Content -LiteralPath (Join-Path $cjsonPath "README.md") -Encoding UTF8
Init-Repo $cjsonPath "Initial cJSON README dogfood fixture"
$cjsonReadme = Get-Content -LiteralPath (Join-Path $cjsonPath "README.md") -Raw
$insert = @'
On Windows CMake is usually used to create a Visual Studio solution file by running it inside the Developer Command Prompt for Visual Studio, for exact steps follow the official documentation from CMake and Microsoft and use the online search engine of your choice. The descriptions of the the options above still generally apply, although not all of them work on Windows.

When changing parser, printer, or public API behavior, prefer the CMake test
suite with `-DENABLE_CJSON_TEST=On` so the full unit test surface is built and
run. The Makefile test path below is useful for simple checks, but it does not
replace the full CMake-based test suite.
'@
$cjsonReadme.Replace("On Windows CMake is usually used to create a Visual Studio solution file by running it inside the Developer Command Prompt for Visual Studio, for exact steps follow the official documentation from CMake and Microsoft and use the online search engine of your choice. The descriptions of the the options above still generally apply, although not all of them work on Windows.", $insert) |
    Set-Content -LiteralPath (Join-Path $cjsonPath "README.md") -Encoding UTF8

[PSCustomObject]@{
    status = "devview-legacy-operation-chain-targets-ready"
    targets = @(
        "work/native/graph-notes-demo",
        "work/native/graph-counter-demo",
        "work/open-source/cJSON"
    )
}
