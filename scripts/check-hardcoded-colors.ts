/**
 * CI guard: fails when new hardcoded color literals appear outside allowlisted paths.
 * Run: npx tsx scripts/check-hardcoded-colors.ts
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');

const ALLOWLIST = [
  'design-system/tokens/',
  'theme/theme.ts',
  'theme/chartPalette.ts',
  'components/auth/authPalette.ts',
];

const HEX_PATTERN = /#[0-9a-fA-F]{3,8}\b/g;
const RGBA_PATTERN = /rgba?\([^)]+\)/g;

function walk(dir: string, files: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === 'node_modules') continue;
      walk(p, files);
    } else if (/\.(tsx?|jsx?)$/.test(name)) {
      files.push(p);
    }
  }
  return files;
}

function isAllowlisted(rel: string): boolean {
  return ALLOWLIST.some((a) => rel.includes(a));
}

let violations = 0;

for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  if (isAllowlisted(rel)) continue;
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.trim().startsWith('//') || line.includes('eslint-disable')) return;
    const hex = line.match(HEX_PATTERN);
    const rgba = line.match(RGBA_PATTERN);
    if (hex?.length || rgba?.length) {
      console.error(`${rel}:${i + 1}: hardcoded color — ${line.trim().slice(0, 80)}`);
      violations += 1;
    }
  });
}

if (violations > 0) {
  console.error(`\n${violations} hardcoded color violation(s). Use tokens.* instead.`);
  process.exit(1);
}

console.log('No hardcoded color violations outside allowlist.');
