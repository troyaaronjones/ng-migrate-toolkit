#!/usr/bin/env node
/**
 * ng-migrate CLI — run migration scans outside of `ng update`.
 *
 * Usage:
 *   ng-migrate scan [dir] [--json report.json] [--sarif report.sarif] [--fail-on error|warning]
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Command } from 'commander';
import { DEPRECATED_PATTERNS } from './lib/patterns';
import { scanProject } from './lib/scanner';
import { formatConsole, formatJson, formatSarif } from './lib/reporter';

const program = new Command();

program
  .name('ng-migrate')
  .description('Scan Angular projects for deprecated APIs and migration blockers')
  .version('0.1.0');

program
  .command('scan')
  .description('Scan a directory for deprecated Angular patterns')
  .argument('[dir]', 'directory to scan', process.cwd())
  .option('--json <file>', 'write a JSON report to <file>')
  .option('--sarif <file>', 'write a SARIF v2.1.0 report to <file>')
  .option('--fail-on <level>', 'exit non-zero if findings at/above level exist', 'error')
  .option('--list-patterns', 'print the registered pattern ids and exit')
  .action((dir: string, opts: { json?: string; sarif?: string; failOn: string; listPatterns?: boolean }) => {
    if (opts.listPatterns) {
      for (const p of DEPRECATED_PATTERNS) {
        console.log(`${p.id} [${p.severity}] (deprecated in v${p.introducedIn}) — ${p.description}`);
      }
      return;
    }

    const rootDir = path.resolve(dir);
    if (!fs.existsSync(rootDir) || !fs.statSync(rootDir).isDirectory()) {
      console.error(`error: not a directory: ${rootDir}`);
      process.exit(2);
    }

    const findings = scanProject({ rootDir, patterns: DEPRECATED_PATTERNS });
    console.log(formatConsole(findings));

    if (opts.json) {
      fs.writeFileSync(path.resolve(opts.json), formatJson(findings));
      console.log(`\nJSON report written to ${opts.json}`);
    }

    if (opts.sarif) {
      fs.writeFileSync(path.resolve(opts.sarif), formatSarif(findings));
      console.log(`\nSARIF report written to ${opts.sarif}`);
    }

    const failOn = opts.failOn === 'warning' ? 'warning' : 'error';
    const bad = findings.filter((f) =>
      failOn === 'warning' ? true : f.severity === 'error',
    );
    if (bad.length > 0) {
      console.error(`\nFailing: ${bad.length} finding(s) at/above "${failOn}".`);
      process.exit(1);
    }
  });

program.parse(process.argv);
