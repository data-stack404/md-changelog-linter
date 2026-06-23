#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { parseChangelog } from './parser';
import { runRules } from './rules';
import { report, reportFixes } from './reporter';
import { applyFixes } from './fixer';

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
  --fix              Automatically fix unambiguous violations in place
  --fix-dry-run      Preview fixes without writing to disk (takes precedence over --fix)

Arguments:
  file               Path to the changelog file (default: CHANGELOG.md)

Exit codes:
  0  No errors found (or no errors remain after fixing)
  1  One or more errors found

Fixable violations:
  no-missing-title     Missing title → inserts "# Changelog" at top of file
  no-missing-title     Wrong title text → rewrites heading to "# Changelog"
  valid-change-type    Wrong casing on a valid type → corrects to canonical casing
  no-empty-change-type Empty "### Type" section → removes the heading

Examples:
  changelog-lint
  changelog-lint CHANGELOG.md
  changelog-lint --no-warnings path/to/CHANGELOG.md
  changelog-lint --fix
  changelog-lint --fix-dry-run CHANGELOG.md

Git hook usage (in .git/hooks/pre-commit):
  #!/bin/sh
  npx changelog-lint

CI pipeline usage:
  npx changelog-lint --no-warnings
`);
  process.exit(0);
}

const noWarnings = args.includes('--no-warnings');
const fix        = args.includes('--fix');
const fixDryRun  = args.includes('--fix-dry-run');
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
const diagnostics = runRules(parsed);

// ─── Fix mode ────────────────────────────────────────────────────────────────

if (fix || fixDryRun) {
  // --fix-dry-run takes precedence: preview only, never write
  const isDryRun = fixDryRun;

  const { lines, fixes } = applyFixes(parsed, diagnostics);
  const fixedContent = lines.join('\n');

  if (!isDryRun) {
    try {
      fs.writeFileSync(absolutePath, fixedContent, 'utf-8');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`changelog-lint: could not write file: ${message}`);
      process.exit(1);
    }
  }

  // Re-parse the (potentially rewritten) content to get accurate remaining diagnostics
  const reParsed = parseChangelog(fixedContent);
  let remainingDiagnostics = runRules(reParsed);

  if (noWarnings) {
    remainingDiagnostics = remainingDiagnostics.filter(d => d.severity === 'error');
  }

  const exitCode = reportFixes(fixes, remainingDiagnostics, filePath, isDryRun);
  process.exit(exitCode);
}

// ─── Lint-only mode ──────────────────────────────────────────────────────────

let lintDiagnostics = diagnostics;

if (noWarnings) {
  lintDiagnostics = lintDiagnostics.filter(d => d.severity === 'error');
}

const exitCode = report(lintDiagnostics, filePath);
process.exit(exitCode);
