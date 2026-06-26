import { ParsedChangelog, LintDiagnostic, AppliedFix } from './types';
export interface FixResult {
    lines: string[];
    fixes: AppliedFix[];
}
/**
 * Applies all unambiguous fixes to a copy of rawLines and returns the
 * rewritten lines plus a record of every fix that was applied.
 *
 * Fixable rules:
 *   - no-missing-title   : missing title  → insert "# Changelog" at top
 *   - no-missing-title   : wrong title    → rewrite the heading to "# Changelog"
 *   - valid-change-type  : wrong casing   → correct to canonical casing (only when
 *                           a case-insensitive match to a valid type exists)
 *   - no-empty-change-type: empty section → remove the "### Type" heading line
 */
export declare function applyFixes(changelog: ParsedChangelog, diagnostics: LintDiagnostic[]): FixResult;
//# sourceMappingURL=fixer.d.ts.map