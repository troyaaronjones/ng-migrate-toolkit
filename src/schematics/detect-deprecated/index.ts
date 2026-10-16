/**
 * detect-deprecated schematic — runs the pattern registry against the
 * schematics virtual Tree, logs findings, and writes migration-report.json
 * into the project.
 *
 * Run with: schematics ./dist/schematics/collection.json:detect-deprecated
 * (or wire it into ng update via ng-update migration.json — see docs/)
 */

import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { DEPRECATED_PATTERNS } from '../../lib/patterns';

interface SchemaOptions {
  /** Write migration-report.json into the tree (default true) */
  report?: boolean;
}

interface FileFinding {
  file: string;
  line: number;
  patternId: string;
  description: string;
  migration: string;
}

function lineOf(text: string, offset: number): number {
  return text.slice(0, offset).split('\n').length;
}

export function detectDeprecated(options: SchemaOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const findings: FileFinding[] = [];

    tree.visit((filePath) => {
      if (!filePath.endsWith('.ts')) return;
      if (filePath.includes('node_modules')) return;
      const buffer = tree.read(filePath);
      if (!buffer) return;
      const text = buffer.toString('utf8');

      for (const pattern of DEPRECATED_PATTERNS) {
        const regex = new RegExp(pattern.pattern, pattern.flags ?? 'g');
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
          if (match[0].length === 0) {
            regex.lastIndex++;
            continue;
          }
          findings.push({
            file: filePath,
            line: lineOf(text, match.index),
            patternId: pattern.id,
            description: pattern.description,
            migration: pattern.migration,
          });
          context.logger.warn(
            `[${pattern.severity}] ${filePath}:${lineOf(text, match.index)} — ${pattern.description}`,
          );
        }
      }
    });

    context.logger.info(`detect-deprecated: ${findings.length} finding(s).`);

    if (options.report !== false) {
      tree.create(
        'migration-report.json',
        JSON.stringify(
          { generatedAt: new Date().toISOString(), findings },
          null,
          2,
        ),
      );
      context.logger.info('Wrote migration-report.json');
    }

    return tree;
  };
}
