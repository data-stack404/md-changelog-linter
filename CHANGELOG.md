# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.1] - 2026-06-26

### Added
- Added `md-changelog-lint` as a second CLI binary alias, so the tool can now be invoked as either `changelog-lint` or `md-changelog-lint`.

### Fixed
- Restricted npm package contents to the `bin/` and `dist/` directories, preventing unintended source files from being included in published releases.

## [1.1.0] - 2026-06-26

### Added

- Added `--fix` and `--fix-dry-run` options to let you apply safe changelog fixes in place or preview them before writing.
- Added project documentation and usage guidance in `README.md`, plus an MIT license file.

### Security

- Sanitized file paths and diagnostic messages in terminal output to strip control and escape sequences and reduce terminal-injection risk.

## [1.0.0] - 2026-06-23

### Added

- CLI entry point (`changelog-lint`)
- Rules: `no-missing-title`, `no-missing-unreleased`, `valid-version-format`,
  `valid-date`, `no-duplicate-versions`, `version-order`, `valid-change-type`,
  `no-empty-change-type`, `valid-links`
- Colored terminal output with `NO_COLOR` support
- `--no-warnings` flag to suppress warnings in CI pipelines

[Unreleased]: https://github.com/data-stack404/md-changelog-linter/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/data-stack404/md-changelog-linter/releases/tag/v1.1.1
[1.1.0]: https://github.com/data-stack404/md-changelog-linter/releases/tag/v1.1.0
[1.0.0]: https://github.com/data-stack404/md-changelog-linter/releases/tag/v1.0.0
