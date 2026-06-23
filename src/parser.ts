import { ParsedChangelog, ParsedVersion, ParsedChangeType, ParsedItem, ParsedLink } from './types';

// ## [Unreleased] or ## [1.2.3] - 2024-01-01 or ## [1.2.3] - 2024-01-01 [YANKED]
const H2_VERSION_RE = /^##\s+\[([^\]]+)\](?:\s+-\s+(\d{4}-\d{2}-\d{2}))?(\s+\[YANKED\])?\s*$/i;
const H1_RE = /^#\s+(.+)$/;
const H3_RE = /^###\s+(.+)$/;
const LIST_ITEM_RE = /^[-*+]\s+(.+)$/;
// Reference-style links: [label]: url
const LINK_DEF_RE = /^\[([^\]]+)\]:\s+(\S+)\s*$/;

export function parseChangelog(content: string): ParsedChangelog {
  // Normalize line endings and strip UTF-8 BOM
  const normalized = content
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const rawLines = normalized.split('\n');

  const result: ParsedChangelog = {
    versions: [],
    links: [],
    rawLines,
  };

  let currentVersion: ParsedVersion | null = null;
  let currentChangeType: ParsedChangeType | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const lineNumber = i + 1; // 1-based

    // H1 heading — only capture the first one as the title
    const h1Match = H1_RE.exec(line);
    if (h1Match) {
      if (!result.title) {
        result.title = { text: h1Match[1].trim(), line: lineNumber };
      }
      // An H1 resets version context
      currentVersion = null;
      currentChangeType = null;
      continue;
    }

    // H2 version heading
    const h2Match = H2_VERSION_RE.exec(line);
    if (h2Match) {
      currentChangeType = null;
      currentVersion = {
        raw: line,
        label: h2Match[1],
        date: h2Match[2],
        yanked: Boolean(h2Match[3]),
        line: lineNumber,
        changeTypes: [],
      };
      result.versions.push(currentVersion);
      continue;
    }

    // H3 change-type heading — only meaningful inside a version section
    const h3Match = H3_RE.exec(line);
    if (h3Match) {
      if (currentVersion) {
        currentChangeType = {
          type: h3Match[1].trim(),
          line: lineNumber,
          items: [],
        };
        currentVersion.changeTypes.push(currentChangeType);
      }
      continue;
    }

    // Top-level list item — only meaningful inside a change-type section
    const listMatch = LIST_ITEM_RE.exec(line);
    if (listMatch && currentChangeType) {
      currentChangeType.items.push({
        text: listMatch[1].trim(),
        line: lineNumber,
      });
      continue;
    }

    // Reference-style link definition (usually at the bottom of the file)
    const linkMatch = LINK_DEF_RE.exec(line);
    if (linkMatch) {
      result.links.push({
        label: linkMatch[1],
        url: linkMatch[2].trim(),
        line: lineNumber,
      });
    }
  }

  return result;
}
