# DevView Troubleshooting

This page covers common local setup, validation, formatting, and Git issues while working on DevView.

## PowerShell Blocks npm

On Windows, PowerShell may block `npm.ps1`. Use CMD or invoke `npm.cmd`:

```bash
npm.cmd run build:cli
npm.cmd run validate:devview
```

## CLI Is Missing

Build the CLI before invoking `devview` or `node dist/cli/index.js`:

```bash
npm run build:cli
```

If the package binary is not linked in your shell, run the built entry point directly:

```bash
node dist/cli/index.js --help
```

## Validation Fails After Concurrent Commands

Run build and validation commands sequentially. Several commands clean and rebuild `dist`, so parallel local validation
can cause transient file races.

Recommended order:

```bash
npm run build:cli
npm run validate:devview
npm run devview:runtime:smoke
npm run format:check
```

## Git Safe Directory Warning

If Git reports dubious ownership for a local checkout, either use your normal trusted checkout or pass a one-off
`safe.directory` value for validation:

```bash
git -c safe.directory=<absolute-repo-path> status --short
```

## Public Docs Still Show Legacy Names

Run the non-mutating audit:

```bash
devview report-legacy-artifacts --json
```

The report classifies remaining references as public rename work, migration fixture material, internal hidden
compatibility, or historical delete candidates. It does not delete or mutate files.
