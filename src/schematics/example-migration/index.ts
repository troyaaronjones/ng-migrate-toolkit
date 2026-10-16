/**
 * example-migration schematic — codemod demonstrating automated API migration.
 *
 * Replaces deprecated `TestBed.get(...)` calls with `TestBed.inject(...)`.
 *
 * Rules followed by this schematic:
 *   1. Reads source files from the virtual Tree
 *   2. Applies a transformation (replacing `TestBed.get` with `TestBed.inject`)
 *   3. Overwrites files and logs changed files
 *   4. Is idempotent — running it twice produces no further changes
 */

import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

/**
 * Options accepted by the example-migration schematic.
 */
export interface SchemaOptions {
  /**
   * If true, logs what would change without modifying files in the Tree.
   */
  dryRun?: boolean;
}

/**
 * Pure transformation function that replaces `TestBed.get` with `TestBed.inject`.
 *
 * @param content Source code string
 * @returns Transformed source code string
 */
export function migrateTestBedGet(content: string): string {
  // Replace TestBed.get( with TestBed.inject(
  return content.replace(/TestBed\.get\s*\(/g, 'TestBed.inject(');
}

/**
 * Entry point rule for the example-migration schematic.
 */
export function exampleMigration(options: SchemaOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    let changed = 0;

    tree.visit((filePath) => {
      if (!filePath.endsWith('.ts')) return;
      if (filePath.includes('node_modules')) return;

      const buffer = tree.read(filePath);
      if (!buffer) return;
      const original = buffer.toString('utf8');

      const updated = migrateTestBedGet(original);

      if (updated !== original) {
        changed++;
        if (!options.dryRun) {
          tree.overwrite(filePath, updated);
        }
        context.logger.info(`updated ${filePath}`);
      }
    });

    context.logger.info(
      `example-migration: ${changed} file(s) ${options.dryRun ? 'would change' : 'changed'}.`,
    );
    return tree;
  };
}
