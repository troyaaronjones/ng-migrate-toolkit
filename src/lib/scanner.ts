/**
 * Project scanner: walks a directory, applies DeprecatedPatterns to source
 * files, and returns structured findings with file/line/column locations.
 *
 * Operates on the real file system (used by the CLI). The schematics adapter
 * in src/schematics/detect-deprecated reuses the pattern registry against
 * the virtual Tree.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { DeprecatedPattern, Severity } from './patterns';

export interface Finding {
  patternId: string;
  description: string;
  file: string;
  line: number;
  column: number;
  snippet: string;
  severity: Severity;
  migration: string;
}

export interface ScanOptions {
  /** Directory to scan (recursively) */
  rootDir: string;
  /** Patterns to apply */
  patterns: DeprecatedPattern[];
  /** File filter, defaults to /\.ts$/ excluding spec files optionally */
  include?: RegExp;
  /** Directory names to skip */
  excludeDirs?: string[];
}

const DEFAULT_EXCLUDE = ['node_modules', 'dist', 'coverage', '.git', '.angular'];

interface LineIndex {
  /** Start offset of each line (0-based) */
  starts: number[];
}

function buildLineIndex(text: string): LineIndex {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return { starts };
}

function offsetToLineCol(index: LineIndex, offset: number): { line: number; column: number } {
  // Binary search for the last line start <= offset
  let lo = 0;
  let hi = index.starts.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (index.starts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return { line: lo + 1, column: offset - index.starts[lo] + 1 };
}

function* walkFiles(dir: string, excludeDirs: Set<string>): Generator<string> {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!excludeDirs.has(entry.name)) yield* walkFiles(full, excludeDirs);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

export function scanProject(options: ScanOptions): Finding[] {
  const {
    rootDir,
    patterns,
    include = /\.ts$/,
    excludeDirs = DEFAULT_EXCLUDE,
  } = options;
  const excluded = new Set(excludeDirs);
  const findings: Finding[] = [];

  const compiled = patterns.map((p) => ({
    pattern: p,
    regex: new RegExp(p.pattern, p.flags ?? 'g'),
  }));

  for (const file of walkFiles(rootDir, excluded)) {
    if (!include.test(file)) continue;
    let text: string;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const index = buildLineIndex(text);
    const lines = text.split('\n');

    for (const { pattern, regex } of compiled) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        // Guard against zero-length matches looping forever
        if (match[0].length === 0) {
          regex.lastIndex++;
          continue;
        }
        const { line, column } = offsetToLineCol(index, match.index);
        findings.push({
          patternId: pattern.id,
          description: pattern.description,
          file: path.relative(rootDir, file),
          line,
          column,
          snippet: (lines[line - 1] ?? '').trim().slice(0, 160),
          severity: pattern.severity,
          migration: pattern.migration,
        });
      }
    }
  }

  findings.sort((a, b) =>
    a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column,
  );
  return findings;
}
