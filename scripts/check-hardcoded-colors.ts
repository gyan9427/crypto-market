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
  'share/shareCardTheme.ts',
  'utils/browser.ts',
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

function resolveGitRef(ref: string): string | null {
  const candidates = [
    ref,
    ref.startsWith('origin/') ? ref.slice('origin/'.length) : `origin/${ref}`,
  ];
  for (const candidate of candidates) {
    try {
      execSync(`git rev-parse --verify ${candidate}`, { cwd: ROOT, stdio: 'pipe' });
      return candidate;
    } catch {
      // try next candidate
    }
  }
  return null;
}

function parseChangedLineNumbers(diff: string): Map<string, Set<number>> {
  const changed = new Map<string, Set<number>>();
  let currentFile: string | null = null;

  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ b/')) {
      currentFile = line.slice('+++ b/'.length);
      continue;
    }
    if (!currentFile || !line.startsWith('@@')) continue;

    const match = line.match(/\+(\d+)(?:,(\d+))?/);
    if (!match) continue;

    const start = Number(match[1]);
    const count = match[2] ? Number(match[2]) : 1;
    if (count === 0) continue;

    const lines = changed.get(currentFile) ?? new Set<number>();
    for (let i = 0; i < count; i += 1) {
      lines.add(start + i);
    }
    changed.set(currentFile, lines);
  }

  return changed;
}

function changedLinesByFile(resolved: string): Map<string, Set<number>> | null {
  try {
    const diff = execSync(`git diff -U0 ${resolved}...HEAD -- src/`, {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return parseChangedLineNumbers(diff);
  } catch {
    console.error(`Color lint: could not diff against ${resolved}.`);
    process.exit(1);
  }
}

function filesToCheck(): string[] {
  if (!baseRef) return walk(SRC);

  const resolved = resolveGitRef(baseRef);
  if (!resolved) {
    console.error(
      `Color lint: base ref "${baseRef}" not found. In CI, fetch it first (e.g. git fetch origin <base>).`
    );
    process.exit(1);
  }

  const changed = changedLinesByFile(resolved);
  if (!changed || changed.size === 0) {
    console.log(`Color lint: no src changes vs ${resolved}; skipping.`);
    return [];
  }

  console.log(`Color lint: checking ${changed.size} file(s) changed vs ${resolved}`);
  return [...changed.keys()]
    .filter((f) => /\.(tsx?|jsx?)$/.test(f))
    .map((f) => join(ROOT, f));
}

let violations = 0;
const files = filesToCheck();
const lineFilter =
  baseRef && resolveGitRef(baseRef) ? changedLinesByFile(resolveGitRef(baseRef)!) : null;

for (const file of files) {
  const rel = relative(ROOT, file);
  if (isAllowlisted(rel)) continue;
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const changedLines = lineFilter?.get(rel);
  lines.forEach((line, i) => {
    const lineNo = i + 1;
    if (changedLines && !changedLines.has(lineNo)) return;
    if (line.trim().startsWith('//') || line.includes('eslint-disable')) return;
    const hex = line.match(HEX_PATTERN);
    const rgba = line.match(RGBA_PATTERN);
    if (hex?.length || rgba?.length) {
      console.error(`${rel}:${lineNo}: hardcoded color — ${line.trim().slice(0, 80)}`);
      violations += 1;
    }
  });
}

if (violations > 0) {
  console.error(`\n${violations} hardcoded color violation(s). Use tokens.* instead.`);
  process.exit(1);
}

console.log('No hardcoded color violations outside allowlist.');
