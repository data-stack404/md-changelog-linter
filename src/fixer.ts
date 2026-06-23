import { ParsedChangelog, LintDiagnostic, AppliedFix } from './types';

// Mirrors the set in rules.ts — kept local to avoid coupling
const VALID_CHANGE_TYPES = new Set([
  'Added',
  'Changed',
  'Deprecated',
  'Removed',
  'Fixed',
  'Security',
]);

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
export function applyFixes(
  changelog: ParsedChangelog,
  diagnostics: LintDiagnostic[],
): FixResult {
  const lines = [...changelog.rawLines];
  const fixes: AppliedFix[] = [];

  // Separate diagnostics by the kind of mutation they need so we can apply
  // them in an order that keeps line indices stable.
  const rewrites: LintDiagnostic[] = [];
  const removals: LintDiagnostic[] = [];
  let needsTitleInsertion = false;

  for (const diag of diagnostics) {
    if (diag.rule === 'no-missing-title') {
      if (!changelog.title) {
        // Title is completely absent — insert at top later
        needsTitleInsertion = true;
      } else {
        // Title exists but has wrong text — rewrite it
        rewrites.push(diag);
      }
    } else if (diag.rule === 'valid-change-type') {
      // Only fixable when it is a casing issue (case-insensitive match exists)
      const lineIdx = diag.line - 1;
      const rawLine = lines[lineIdx] ?? '';
      const match = /^(###\s+)(.+)$/.exec(rawLine);
      if (match) {
        const typeName = match[2].trim();
        const corrected = [...VALID_CHANGE_TYPES].find(
          t => t.toLowerCase() === typeName.toLowerCase(),
        );
        if (corrected && corrected !== typeName) {
          rewrites.push(diag);
        }
        // Otherwise the type is truly unknown — not fixable
      }
    } else if (diag.rule === 'no-empty-change-type') {
      removals.push(diag);
    }
  }

  // ── 1. Rewrites (no line shifting) ───────────────────────────────────────
  for (const diag of rewrites) {
    const lineIdx = diag.line - 1;

    if (diag.rule === 'no-missing-title') {
      lines[lineIdx] = '# Changelog';
      fixes.push({
        line: diag.line,
        rule: diag.rule,
        message: 'Rewrote title to "# Changelog"',
      });
    } else if (diag.rule === 'valid-change-type') {
      const rawLine = lines[lineIdx] ?? '';
      const match = /^(###\s+)(.+)$/.exec(rawLine);
      if (match) {
        const typeName = match[2].trim();
        const corrected = [...VALID_CHANGE_TYPES].find(
          t => t.toLowerCase() === typeName.toLowerCase(),
        )!;
        lines[lineIdx] = `${match[1]}${corrected}`;
        fixes.push({
          line: diag.line,
          rule: diag.rule,
          message: `Corrected change type "${typeName}" to "${corrected}"`,
        });
      }
    }
  }

  // ── 2. Removals — process bottom-to-top so earlier indices stay valid ────
  removals.sort((a, b) => b.line - a.line);
  for (const diag of removals) {
    const lineIdx = diag.line - 1;
    const removed = lines.splice(lineIdx, 1)[0] ?? '';
    const h3Match = /^###\s+(.+)$/.exec(removed);
    const typeName = h3Match ? h3Match[1].trim() : removed.trim();
    fixes.push({
      line: diag.line,
      rule: diag.rule,
      message: `Removed empty change type "### ${typeName}"`,
    });
  }

  // ── 3. Insertion — title at top (done last; shifts all other line numbers) ─
  if (needsTitleInsertion) {
    lines.unshift('# Changelog');
    fixes.push({
      line: 1,
      rule: 'no-missing-title',
      message: 'Inserted "# Changelog" title at top of file',
    });
  }

  return { lines, fixes };
}
