/**
 * Reporters: turn Findings into human-readable console output or machine-
 * readable JSON (for CI gates and dashboards).
 */

import { Finding } from './scanner';

export interface ReportSummary {
  total: number;
  errors: number;
  warnings: number;
  filesAffected: number;
  byPattern: Record<string, number>;
}

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

export function formatJson(findings: Finding[]): string {
  return JSON.stringify({ generatedAt: new Date().toISOString(), summary: summarize(findings), findings }, null, 2);
}
