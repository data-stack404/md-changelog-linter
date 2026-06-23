import { LintDiagnostic } from './types';
/**
 * Prints diagnostics to stdout and returns the appropriate exit code.
 * @returns 0 when there are no errors, 1 when at least one error is present.
 */
export declare function report(diagnostics: LintDiagnostic[], filePath: string): number;
//# sourceMappingURL=reporter.d.ts.map