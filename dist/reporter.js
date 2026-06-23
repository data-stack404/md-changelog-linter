"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.report = void 0;
// ANSI escape codes — no external dependencies
const ESC = '\x1b[';
const RESET = `${ESC}0m`;
const BOLD = `${ESC}1m`;
const DIM = `${ESC}2m`;
const RED = `${ESC}31m`;
const YELLOW = `${ESC}33m`;
const GREEN = `${ESC}32m`;
const CYAN = `${ESC}36m`;
function useColor() {
    // Respect the NO_COLOR convention (https://no-color.org/) and non-TTY output
    return process.stdout.isTTY === true && process.env['NO_COLOR'] === undefined;
}
function c(text, code) {
    return useColor() ? `${code}${text}${RESET}` : text;
}
/**
 * Prints diagnostics to stdout and returns the appropriate exit code.
 * @returns 0 when there are no errors, 1 when at least one error is present.
 */
function report(diagnostics, filePath) {
    const errors = diagnostics.filter(d => d.severity === 'error');
    const warnings = diagnostics.filter(d => d.severity === 'warning');
    if (diagnostics.length === 0) {
        console.log(`${c(filePath, BOLD)}: ${c('✓ No issues found', GREEN)}`);
        return 0;
    }
    console.log(`\n${c(filePath, BOLD)}\n`);
    const sorted = [...diagnostics].sort((a, b) => a.line - b.line);
    for (const diag of sorted) {
        const lineCol = c(`line ${String(diag.line).padStart(4)}`, DIM);
        const severity = diag.severity === 'error'
            ? c('error  ', RED)
            : c('warning', YELLOW);
        const rule = c(`[${diag.rule}]`, CYAN);
        console.log(`  ${lineCol}  ${severity}  ${diag.message}  ${rule}`);
    }
    console.log();
    const parts = [];
    if (errors.length > 0) {
        parts.push(c(`${errors.length} error${errors.length !== 1 ? 's' : ''}`, RED));
    }
    if (warnings.length > 0) {
        parts.push(c(`${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`, YELLOW));
    }
    console.log(c(`  ${parts.join(', ')}`, BOLD));
    console.log();
    return errors.length > 0 ? 1 : 0;
}
exports.report = report;
//# sourceMappingURL=reporter.js.map