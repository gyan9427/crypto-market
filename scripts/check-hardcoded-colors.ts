/**
 * CI guard: fails when hardcoded color literals appear outside allowlisted paths.
 * With a git base ref (e.g. origin/main), only changed files under src/ are scanned.
 * Run: npx tsx scripts/check-hardcoded-colors.ts [baseRef]
 */
import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const baseRef = process.argv[2];

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

function filesToCheck(): string[] {
  if (baseRef) {
    try {
      const out = execSync(`git diff --name-only ${baseRef}...HEAD -- src/`, {
        cwd: ROOT,
        encoding: 'utf8',
      });
      const changed = out
        .trim()
        .split('\n')
        .filter((f) => f && /\.(tsx?|jsx?)$/.test(f))
        .map((f) => join(ROOT, f));
      if (changed.length > 0) {
        console.log(`Color lint: checking ${changed.length} file(s) changed vs ${baseRef}`);
        return changed;
      }
      console.log(`Color lint: no src changes vs ${baseRef}; skipping.`);
      return [];
    } catch (e) {
      console.warn(`Color lint: could not diff against ${baseRef}; scanning all src files.`);
    }
  }
  return walk(SRC);
}

let violations = 0;

for (const file of filesToCheck()) {
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
