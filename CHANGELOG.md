# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of `md-changelog-linter`

## [1.0.0] - 2026-06-23

### Added

- CLI entry point (`changelog-lint`)
- Changelog parser for the Keep a Changelog 2.0.0 format
- Rules: `no-missing-title`, `no-missing-unreleased`, `valid-version-format`,
  `valid-date`, `no-duplicate-versions`, `version-order`, `valid-change-type`,
  `no-empty-change-type`, `valid-links`
- Colored terminal output with `NO_COLOR` support
- `--no-warnings` flag to suppress warnings in CI pipelines

[unreleased]: https://github.com/example/md-changelog-linter/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/example/md-changelog-linter/releases/tag/v1.0.0
