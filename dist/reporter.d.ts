import { LintDiagnostic, AppliedFix } from './types';
/**
 * Prints diagnostics to stdout and returns the appropriate exit code.
 * @returns 0 when there are no errors, 1 when at least one error is present.
 */
export declare function report(diagnostics: LintDiagnostic[], filePath: string): number;
/**
 * Prints applied (or would-be) fixes followed by any remaining diagnostics,
 * then returns the appropriate exit code.
 *
 * @param dryRun - When true, labels fixes as "would fix" and skips file writing.
 */
export declare function reportFixes(fixes: AppliedFix[], remainingDiagnostics: LintDiagnostic[], filePath: string, dryRun: boolean): number;
//# sourceMappingURL=reporter.d.ts.map