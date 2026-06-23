const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

function fail(message) {
  console.error(message);
  process.exit(1);
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'changelog-lint-test-'));
const changelogPath = path.join(tmpRoot, 'CHANGELOG.md');

// Include CSI and OSC payloads that could manipulate terminal state if unsanitized.
const csiPayload = '\u001b[31mPWNED\u001b[0m\u001b[2J';
const oscPayload = '\u001b]0;spoofed-title\u0007';
const payload = `${csiPayload}${oscPayload}`;

const content = [
  `# ${payload}`,
  '',
  '## [Unreleased]',
  '',
  '### Added',
  '- Added regression test fixture',
].join('\n');

fs.writeFileSync(changelogPath, content, 'utf8');

const cliPath = path.resolve(__dirname, '..', 'dist', 'cli.js');
const run = spawnSync(process.execPath, [cliPath, changelogPath], {
  encoding: 'utf8',
  env: {
    ...process.env,
    // Disable reporter's own colors so escape checks only reflect untrusted data.
    NO_COLOR: '1',
  },
});

// Wrong title emits a warning, so command should still succeed (exit 0).
if (run.status !== 0) {
  fail(`Expected exit code 0, got ${run.status}. stderr: ${run.stderr || '<empty>'}`);
}

const combined = `${run.stdout || ''}\n${run.stderr || ''}`;

// Assert that no raw ESC control character is present in output.
if (combined.includes('\u001b')) {
  fail('Terminal escape injection regression: found raw ESC sequence in CLI output.');
}

// Ensure diagnostic still includes readable payload text after sanitization.
if (!combined.includes('PWNED')) {
  fail('Expected sanitized diagnostic output to preserve readable payload text.');
}

// Ensure OSC content is neutralized and not preserved verbatim.
if (combined.includes('spoofed-title')) {
  fail('Terminal escape injection regression: OSC content leaked into CLI output.');
}

console.log('PASS terminal-escape-injection regression');
