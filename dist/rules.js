"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRules = void 0;
// The six allowed change types per keepachangelog.com/en/2.0.0/
const VALID_CHANGE_TYPES = new Set([
    'Added',
    'Changed',
    'Deprecated',
    'Removed',
    'Fixed',
    'Security',
]);
// Semantic Versioning per semver.org — MAJOR.MINOR.PATCH with optional pre-release / build metadata
const SEMVER_RE = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+(\.[-a-zA-Z0-9]+)*)?(\+[a-zA-Z0-9]+(\.[-a-zA-Z0-9]+)*)?$/;
const DATE_FORMAT_RE = /^\d{4}-\d{2}-\d{2}$/;
// ─── helpers ─────────────────────────────────────────────────────────────────
function isValidDate(dateStr) {
    if (!DATE_FORMAT_RE.test(dateStr))
        return false;
    // Use UTC to avoid timezone-shifted day shifts
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    return (d.getUTCFullYear() === year &&
        d.getUTCMonth() + 1 === month &&
        d.getUTCDate() === day);
}
/**
 * Returns a positive number if a > b, negative if a < b, 0 if equal.
 * Pre-release versions are considered lower than the release (1.0.0-alpha < 1.0.0).
 */
function compareSemver(a, b) {
    const coreA = a.split(/[-+]/)[0].split('.').map(Number);
    const coreB = b.split(/[-+]/)[0].split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        const diff = (coreA[i] ?? 0) - (coreB[i] ?? 0);
        if (diff !== 0)
            return diff;
    }
    // Same core — a pre-release version is lower than the full release
    const aHasPre = /^[^+]+-/.test(a);
    const bHasPre = /^[^+]+-/.test(b);
    if (aHasPre && !bHasPre)
        return -1;
    if (!aHasPre && bHasPre)
        return 1;
    return 0;
}
// ─── rules ───────────────────────────────────────────────────────────────────
function runRules(changelog) {
    const diagnostics = [];
    // ── no-missing-title ──────────────────────────────────────────────────────
    // The file must begin with an H1 heading whose text is "Changelog".
    if (!changelog.title) {
        diagnostics.push({
            line: 1,
            severity: 'error',
            rule: 'no-missing-title',
            message: 'Changelog must have a "# Changelog" title as the first heading',
        });
    }
    else if (!/^changelog$/i.test(changelog.title.text)) {
        diagnostics.push({
            line: changelog.title.line,
            severity: 'warning',
            rule: 'no-missing-title',
            message: `Title should be "Changelog", found "${changelog.title.text}"`,
        });
    }
    // ── no-missing-unreleased ─────────────────────────────────────────────────
    // There must be an [Unreleased] section and it must be the first version entry.
    const unreleased = changelog.versions.find(v => v.label.toLowerCase() === 'unreleased');
    if (!unreleased) {
        diagnostics.push({
            line: 1,
            severity: 'error',
            rule: 'no-missing-unreleased',
            message: 'Changelog must contain an "## [Unreleased]" section',
        });
    }
    else if (changelog.versions.length > 0 &&
        changelog.versions[0].label.toLowerCase() !== 'unreleased') {
        diagnostics.push({
            line: unreleased.line,
            severity: 'error',
            rule: 'no-missing-unreleased',
            message: '"## [Unreleased]" must be the first version section in the file',
        });
    }
    // ── Collect release versions (everything except [Unreleased]) ─────────────
    const releases = changelog.versions.filter(v => v.label.toLowerCase() !== 'unreleased');
    // ── valid-version-format & valid-date ─────────────────────────────────────
    // Each release heading must be "## [MAJOR.MINOR.PATCH] - YYYY-MM-DD".
    for (const v of releases) {
        if (!SEMVER_RE.test(v.label)) {
            diagnostics.push({
                line: v.line,
                severity: 'error',
                rule: 'valid-version-format',
                message: `"${v.label}" is not a valid semantic version (expected MAJOR.MINOR.PATCH)`,
            });
        }
        if (!v.date) {
            diagnostics.push({
                line: v.line,
                severity: 'error',
                rule: 'valid-version-format',
                message: `Version "[${v.label}]" is missing its release date — expected "## [${v.label}] - YYYY-MM-DD"`,
            });
        }
        else if (!isValidDate(v.date)) {
            diagnostics.push({
                line: v.line,
                severity: 'error',
                rule: 'valid-date',
                message: `Version "[${v.label}]" has an invalid date "${v.date}" — expected a real calendar date in YYYY-MM-DD format`,
            });
        }
    }
    // ── no-duplicate-versions ─────────────────────────────────────────────────
    const seen = new Map();
    for (const v of changelog.versions) {
        const key = v.label.toLowerCase();
        if (seen.has(key)) {
            diagnostics.push({
                line: v.line,
                severity: 'error',
                rule: 'no-duplicate-versions',
                message: `Duplicate version "[${v.label}]" — first occurrence at line ${seen.get(key)}`,
            });
        }
        else {
            seen.set(key, v.line);
        }
    }
    // ── version-order ─────────────────────────────────────────────────────────
    // Versions must appear in descending order (newest first).
    const validReleases = releases.filter(v => SEMVER_RE.test(v.label));
    for (let i = 0; i < validReleases.length - 1; i++) {
        const curr = validReleases[i];
        const next = validReleases[i + 1];
        if (compareSemver(curr.label, next.label) < 0) {
            diagnostics.push({
                line: curr.line,
                severity: 'error',
                rule: 'version-order',
                message: `"[${curr.label}]" (line ${curr.line}) should come after "[${next.label}]" — versions must be in descending order (newest first)`,
            });
        }
    }
    // ── valid-change-type & no-empty-change-type ──────────────────────────────
    for (const v of changelog.versions) {
        for (const ct of v.changeTypes) {
            if (!VALID_CHANGE_TYPES.has(ct.type)) {
                diagnostics.push({
                    line: ct.line,
                    severity: 'error',
                    rule: 'valid-change-type',
                    message: `Unknown change type "### ${ct.type}". Allowed types: ${[...VALID_CHANGE_TYPES].join(', ')}`,
                });
            }
            if (ct.items.length === 0) {
                diagnostics.push({
                    line: ct.line,
                    severity: 'warning',
                    rule: 'no-empty-change-type',
                    message: `"### ${ct.type}" under "[${v.label}]" contains no list items`,
                });
            }
        }
    }
    // ── valid-links ───────────────────────────────────────────────────────────
    // Reference link labels at the bottom should correspond to an actual version entry.
    const versionLabels = new Set(changelog.versions.map(v => v.label.toLowerCase()));
    for (const link of changelog.links) {
        if (!versionLabels.has(link.label.toLowerCase())) {
            diagnostics.push({
                line: link.line,
                severity: 'warning',
                rule: 'valid-links',
                message: `Link label "[${link.label}]" does not correspond to any version entry`,
            });
        }
    }
    return diagnostics;
}
exports.runRules = runRules;
//# sourceMappingURL=rules.js.map