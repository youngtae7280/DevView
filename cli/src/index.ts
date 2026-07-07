#!/usr/bin/env node
import process from 'node:process'
import { runDevViewCli } from './app.js'

const result = await runDevViewCli(process.argv.slice(2), { cwd: process.cwd() })
if (result.stdout) {
  process.stdout.write(result.stdout)
}
if (result.stderr) {
  process.stderr.write(result.stderr)
}
process.exit(result.exitCode)
