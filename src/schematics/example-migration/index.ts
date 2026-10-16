/**
 * example-migration — TEMPLATE. Copy this directory to start a real codemod.
 *
 * A migration schematic typically:
 *   1. Reads source files from the Tree
 *   2. Applies a transformation (string edit for simple cases; an AST
 *      transform via ts-morph/recast for anything structural)
 *   3. Overwrites the files and logs what changed
 *   4. Is idempotent — running it twice changes nothing the second time
 *
 * See docs/adding-a-codemod.md for the full playbook.
 */

import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

interface SchemaOptions {
  /** Dry-run pattern used by real migrations: add --dry-run support via the schema */
  dryRun?: boolean;
}

export function exampleMigration(options: SchemaOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    let changed = 0;

    tree.visit((filePath) => {
      if (!filePath.endsWith('.ts')) return;
      const buffer = tree.read(filePath);
      if (!buffer) return;
      const original = buffer.toString('utf8');

      // TODO: replace with your transformation. Example shape:
      //   const updated = transform(original);
      //   if (updated !== original && !options.dryRun) tree.overwrite(filePath, updated);
      const updated = original; // <-- your codemod goes here

      if (updated !== original) {
        changed++;
        if (!options.dryRun) tree.overwrite(filePath, updated);
        context.logger.info(`updated ${filePath}`);
      }
    });

    context.logger.info(
      `example-migration: ${changed} file(s) ${options.dryRun ? 'would change' : 'changed'}.`,
    );
    return tree;
  };
}
