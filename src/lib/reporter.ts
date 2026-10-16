/**
 * Reporters: turn Findings into human-readable console output, machine-
 * readable JSON, or SARIF v2.1.0 (for GitHub code scanning / PR annotations).
 */

import { Finding } from './scanner';

/**
 * Summary metrics aggregated across all findings in a scan.
 */
export interface ReportSummary {
  /** Total number of findings detected */
  total: number;
  /** Number of findings with 'error' severity */
  errors: number;
  /** Number of findings with 'warning' severity */
  warnings: number;
  /** Count of distinct files containing findings */
  filesAffected: number;
  /** Map of pattern ID to count of occurrences */
  byPattern: Record<string, number>;
}

/**
 * Summarizes findings array into counts and pattern distribution metrics.
 */
export function summarize(findings: Finding[]): ReportSummary {
  const byPattern: Record<string, number> = {};
  const files = new Set<string>();
  let errors = 0;
  let warnings = 0;
  for (const f of findings) {
    byPattern[f.patternId] = (byPattern[f.patternId] ?? 0) + 1;
    files.add(f.file);
    if (f.severity === 'error') errors++;
    else warnings++;
  }
  return { total: findings.length, errors, warnings, filesAffected: files.size, byPattern };
}

/**
 * Formats findings as human-readable terminal/console output with summary.
 */
export function formatConsole(findings: Finding[]): string {
  const summary = summarize(findings);
  const out: string[] = [];
  out.push('');
  out.push('Angular migration scan');
  out.push('======================');
  out.push(
    `${summary.total} finding(s) in ${summary.filesAffected} file(s) ` +
    `(${summary.errors} error, ${summary.warnings} warning)`,
  );
  out.push('');
  for (const f of findings) {
    const tag = f.severity === 'error' ? 'ERROR' : 'WARN ';
    out.push(`[${tag}] ${f.file}:${f.line}:${f.column} — ${f.description}`);
    if (f.snippet) out.push(`       > ${f.snippet}`);
    out.push(`       fix: ${f.migration}`);
    out.push('');
  }
  if (findings.length > 0) {
    out.push('By pattern:');
    for (const [id, count] of Object.entries(summary.byPattern)) {
      out.push(`  ${id}: ${count}`);
    }
  } else {
    out.push('No deprecated patterns found. Clean.');
  }
  return out.join('\n');
}

/**
 * Formats findings as structured JSON string.
 */
export function formatJson(findings: Finding[]): string {
  return JSON.stringify({ generatedAt: new Date().toISOString(), summary: summarize(findings), findings }, null, 2);
}

/**
 * Formats findings as standard SARIF v2.1.0 for GitHub Code Scanning integration.
 */
export function formatSarif(findings: Finding[]): string {
  const rulesMap = new Map<string, { id: string; shortDescription: { text: string }; help: { text: string } }>();

  for (const f of findings) {
    if (!rulesMap.has(f.patternId)) {
      rulesMap.set(f.patternId, {
        id: f.patternId,
        shortDescription: { text: f.description },
        help: { text: `Migration guidance: ${f.migration}` },
      });
    }
  }

  const sarifLog = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'ng-migrate-toolkit',
            version: '0.1.0',
            informationUri: 'https://github.com/troyaaronjones/ng-migrate-toolkit',
            rules: Array.from(rulesMap.values()),
          },
        },
        results: findings.map((f) => ({
          ruleId: f.patternId,
          level: f.severity === 'error' ? 'error' : 'warning',
          message: {
            text: `${f.description}. Fix: ${f.migration}`,
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: f.file.replace(/\\/g, '/'),
                },
                region: {
                  startLine: f.line,
                  startColumn: f.column,
                },
              },
            },
          ],
        })),
      },
    ],
  };

  return JSON.stringify(sarifLog, null, 2);
}
