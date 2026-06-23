# md-changelog-linter

A command-line linter for Markdown changelogs that follow the Keep a Changelog 2.0.0 format.

It validates structure, versioning, section order, change types, and reference links. It can also apply a small set of safe, unambiguous auto-fixes.

Specification reference: https://keepachangelog.com/en/2.0.0/

## Features

- Validates Keep a Changelog core structure.
- Checks Semantic Versioning format for release headings.
- Ensures `## [Unreleased]` exists and is the first version section.
- Validates allowed change types:
  - `Added`
  - `Changed`
  - `Deprecated`
  - `Removed`
  - `Fixed`
  - `Security`
- Detects duplicate versions and out-of-order releases.
- Warns about empty change-type sections.
- Warns about link labels that do not map to any version section.
- Supports `--fix` and `--fix-dry-run` for selected fixable issues.

## Install

From this repository:

```bash
npm install
npm run build
```

Optional: link the CLI globally for local development:

```bash
npm link
```

Then run:

```bash
changelog-lint
```

## Usage

```text
changelog-lint [options] [file]
```

Arguments:

- `file` Path to changelog file (default: `CHANGELOG.md`)

Options:

- `-h, --help` Show help and exit
- `--no-warnings` Suppress warnings (report errors only)
- `--fix` Apply automatic fixes in-place
- `--fix-dry-run` Preview fixes without writing changes (takes precedence over `--fix`)

Examples:

```bash
# lint default CHANGELOG.md
changelog-lint

# lint a specific file
changelog-lint docs/CHANGELOG.md

# errors only
changelog-lint --no-warnings

# apply safe fixes
changelog-lint --fix

# preview safe fixes without writing
changelog-lint --fix-dry-run CHANGELOG.md
```

## Exit Codes

- `0` No errors found (or no errors remain after fixing)
- `1` One or more errors found

## Rules

Implemented rule IDs:

- `no-missing-title`
- `no-missing-unreleased`
- `valid-version-format`
- `valid-date`
- `no-duplicate-versions`
- `version-order`
- `valid-change-type`
- `no-empty-change-type`
- `valid-links`

## Auto-fixes

Current fixable cases:

- `no-missing-title`
  - Inserts missing `# Changelog` title at the top.
  - Rewrites an incorrect title to `# Changelog`.
- `valid-change-type`
  - Corrects change-type casing when it is a case-only mismatch.
- `no-empty-change-type`
  - Removes empty `### Type` headings.

## Security

Terminal output is sanitized to reduce log/terminal escape-sequence injection risks.

## Development

Build:

```bash
npm run build
```

Test:

```bash
npm test
```

## License

MIT. See [LICENSE](LICENSE).