export type Severity = 'error' | 'warning';
export interface LintDiagnostic {
    line: number;
    severity: Severity;
    rule: string;
    message: string;
}
export interface ParsedItem {
    text: string;
    line: number;
}
export interface ParsedChangeType {
    type: string;
    line: number;
    items: ParsedItem[];
}
export interface ParsedVersion {
    raw: string;
    label: string;
    date?: string;
    yanked: boolean;
    line: number;
    changeTypes: ParsedChangeType[];
}
export interface ParsedLink {
    label: string;
    url: string;
    line: number;
}
export interface ParsedChangelog {
    title?: {
        text: string;
        line: number;
    };
    versions: ParsedVersion[];
    links: ParsedLink[];
    rawLines: string[];
}
//# sourceMappingURL=types.d.ts.map