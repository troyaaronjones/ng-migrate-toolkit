/**
 * Copies collection.json + schema.json files from src/schematics into dist/
 * after tsc, so the published package has a working schematics collection.
 * (tsc only emits .js/.d.ts; JSON needs resolveJsonModule to be inlined,
 * but collection.json must remain a separate file for the schematics CLI.)
 */
import { cpSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src', 'schematics');
const dest = join(root, 'dist', 'schematics');

function copyJson(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      copyJson(full);
    } else if (entry.endsWith('.json')) {
      const rel = full.slice(src.length + 1);
      const target = join(dest, rel);
      mkdirSync(dirname(target), { recursive: true });
      cpSync(full, target);
      console.log(`copied schematics asset: ${rel}`);
    }
  }
}

mkdirSync(dest, { recursive: true });
copyJson(src);
