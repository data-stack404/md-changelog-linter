#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { parseChangelog } from './parser';
import { runRules } from './rules';
import { report } from './reporter';

// ─── CLI argument parsing ─────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('-h') || args.includes('--help')) {
  console.log(`
Usage: changelog-lint [options] [file]

Lints a changelog file against the Keep a Changelog 2.0.0 specification.
See: https://keepachangelog.com/en/2.0.0/

Options:
  -h, --help         Show this help message and exit
  --no-warnings      Suppress warnings; only report errors

Arguments:
  file               Path to the changelog file (default: CHANGELOG.md)

Exit codes:
  0  No errors found
  1  One or more errors found

Examples:
  changelog-lint
  changelog-lint CHANGELOG.md
  changelog-lint --no-warnings path/to/CHANGELOG.md

Git hook usage (in .git/hooks/pre-commit):
  #!/bin/sh
  npx changelog-lint

CI pipeline usage:
  npx changelog-lint --no-warnings
`);
  process.exit(0);
}

const noWarnings = args.includes('--no-warnings');
const positional  = args.filter(a => !a.startsWith('-'));
const filePath    = positional[0] ?? 'CHANGELOG.md';
const absolutePath = path.resolve(filePath);

// ─── File reading ─────────────────────────────────────────────────────────────

if (!fs.existsSync(absolutePath)) {
  console.error(`changelog-lint: file not found: ${filePath}`);
  process.exit(1);
}

let content: string;
try {
  content = fs.readFileSync(absolutePath, 'utf-8');
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`changelog-lint: could not read file: ${message}`);
  process.exit(1);
}

// ─── Lint & report ────────────────────────────────────────────────────────────

const parsed = parseChangelog(content);
let diagnostics = runRules(parsed);

if (noWarnings) {
  diagnostics = diagnostics.filter(d => d.severity === 'error');
}

const exitCode = report(diagnostics, filePath);
process.exit(exitCode);
