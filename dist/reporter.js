"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.report = report;
exports.reportFixes = reportFixes;
// ANSI escape codes — no external dependencies
const ESC = '\x1b[';
const RESET = `${ESC}0m`;
const BOLD = `${ESC}1m`;
const DIM = `${ESC}2m`;
const RED = `${ESC}31m`;
const YELLOW = `${ESC}33m`;
const GREEN = `${ESC}32m`;
const CYAN = `${ESC}36m`;
function sanitizeForTerminal(input) {
    return input
        // Normalize whitespace to prevent multiline/log-forgery style output shaping
        .replace(/[\r\n\t]+/g, ' ')
        // Strip ANSI/VT100 escape sequences (OSC, CSI, and short ESC forms)
        .replace(/\u001B\][^\u0007]*(?:\u0007|\u001B\\)/g, '')
        .replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
        .replace(/\u001B[@-_]/g, '')
        // Remove remaining control characters (including DEL/C1 controls)
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
}
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
    const safeFilePath = sanitizeForTerminal(filePath);
    const errors = diagnostics.filter(d => d.severity === 'error');
    const warnings = diagnostics.filter(d => d.severity === 'warning');
    if (diagnostics.length === 0) {
        console.log(`${c(safeFilePath, BOLD)}: ${c('✓ No issues found', GREEN)}`);
        return 0;
    }
    console.log(`\n${c(safeFilePath, BOLD)}\n`);
    const sorted = [...diagnostics].sort((a, b) => a.line - b.line);
    for (const diag of sorted) {
        const lineCol = c(`line ${String(diag.line).padStart(4)}`, DIM);
        const severity = diag.severity === 'error'
            ? c('error  ', RED)
            : c('warning', YELLOW);
        const rule = c(`[${sanitizeForTerminal(diag.rule)}]`, CYAN);
        const message = sanitizeForTerminal(diag.message);
        console.log(`  ${lineCol}  ${severity}  ${message}  ${rule}`);
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
/**
 * Prints applied (or would-be) fixes followed by any remaining diagnostics,
 * then returns the appropriate exit code.
 *
 * @param dryRun - When true, labels fixes as "would fix" and skips file writing.
 */
function reportFixes(fixes, remainingDiagnostics, filePath, dryRun) {
    const safeFilePath = sanitizeForTerminal(filePath);
    const errors = remainingDiagnostics.filter(d => d.severity === 'error');
    const warnings = remainingDiagnostics.filter(d => d.severity === 'warning');
    if (fixes.length === 0 && remainingDiagnostics.length === 0) {
        console.log(`${c(safeFilePath, BOLD)}: ${c('✓ No issues found', GREEN)}`);
        return 0;
    }
    console.log(`\n${c(safeFilePath, BOLD)}\n`);
    const verb = dryRun ? 'would fix' : 'fixed    ';
    for (const fix of fixes) {
        const lineCol = c(`line ${String(fix.line).padStart(4)}`, DIM);
        const action = c(verb, GREEN);
        const rule = c(`[${sanitizeForTerminal(fix.rule)}]`, CYAN);
        const message = sanitizeForTerminal(fix.message);
        console.log(`  ${lineCol}  ${action}  ${message}  ${rule}`);
    }
    if (fixes.length > 0 && remainingDiagnostics.length > 0) {
        console.log();
    }
    const sorted = [...remainingDiagnostics].sort((a, b) => a.line - b.line);
    for (const diag of sorted) {
        const lineCol = c(`line ${String(diag.line).padStart(4)}`, DIM);
        const severity = diag.severity === 'error'
            ? c('error  ', RED)
            : c('warning', YELLOW);
        const rule = c(`[${sanitizeForTerminal(diag.rule)}]`, CYAN);
        const message = sanitizeForTerminal(diag.message);
        console.log(`  ${lineCol}  ${severity}  ${message}  ${rule}`);
    }
    console.log();
    const parts = [];
    if (fixes.length > 0) {
        const fixVerb = dryRun ? 'would fix' : 'fixed';
        parts.push(c(`${fixes.length} ${fixVerb}`, GREEN));
    }
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
//# sourceMappingURL=reporter.js.map