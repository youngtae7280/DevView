# Install DevView Locally

This guide gets a cloned DevView repository to a local build, validation, and CLI smoke check.

Command examples prefer Windows `npm.cmd` because PowerShell can block `npm.ps1` on some machines. On macOS/Linux or
non-PowerShell shells, use `npm` instead.

## Prerequisites

- Node.js 20 LTS is recommended.
- npm, included with Node.js.
- Git.
- Windows users can use PowerShell or CMD. If PowerShell blocks `npm`, use `npm.cmd`.

## Clone

```bash
git clone <devview-repository-url>
cd <devview-repository>
```

## Install Dependencies

Windows:

```bash
npm.cmd install
```

Non-Windows:

```bash
npm install
```

For clean installs, use `npm.cmd ci` or `npm ci`.

## Build CLI

```bash
npm.cmd run build:cli
```

## Run Checks

```bash
npm.cmd run format:check
npm.cmd run typecheck
npm.cmd test
npm.cmd run validate:devview
npm.cmd run devview:runtime:smoke
```

## Run CLI

```bash
devview --help
devview validate --json
```

If the binary is not linked locally, use Node directly after building:

```bash
node dist/cli/index.js --help
node dist/cli/index.js validate --json
```

## Recommended Local Verification

Run this before committing or pushing. Run commands sequentially because validation commands that rebuild the CLI may
touch `clean-dist` and `dist`.

```bash
npm.cmd run format:check
npm.cmd run typecheck
npm.cmd test
npm.cmd run validate:devview
npm.cmd run devview:runtime:smoke
node dist/cli/index.js --help
node dist/cli/index.js validate --json
```

See [Troubleshooting](troubleshooting.md) for common Windows, npm, formatting, validation, and Git issues.
