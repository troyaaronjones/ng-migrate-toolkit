import { Finding } from './scanner';
import { formatConsole, formatJson, formatSarif, summarize } from './reporter';

describe('reporter', () => {
  const sampleFindings: Finding[] = [
    {
      patternId: 'ngmodule-bootstrap',
      description: 'NgModule-based bootstrap',
      file: 'src/main.ts',
      line: 3,
      column: 1,
      snippet: 'platformBrowserDynamic().bootstrapModule(AppModule)',
      severity: 'warning',
      migration: 'Migrate to bootstrapApplication()',
    },
    {
      patternId: 'entry-components',
      description: 'entryComponents array obsolete',
      file: 'src/app.module.ts',
      line: 5,
      column: 3,
      snippet: 'entryComponents: [FooComponent]',
      severity: 'error',
      migration: 'Delete entryComponents array',
    },
  ];

  describe('summarize', () => {
    it('calculates correct summary counts and pattern breakdown', () => {
      const summary = summarize(sampleFindings);
      expect(summary.total).toBe(2);
      expect(summary.errors).toBe(1);
      expect(summary.warnings).toBe(1);
      expect(summary.filesAffected).toBe(2);
      expect(summary.byPattern).toEqual({
        'ngmodule-bootstrap': 1,
        'entry-components': 1,
      });
    });

    it('handles empty findings array', () => {
      const summary = summarize([]);
      expect(summary.total).toBe(0);
      expect(summary.errors).toBe(0);
      expect(summary.warnings).toBe(0);
      expect(summary.filesAffected).toBe(0);
      expect(summary.byPattern).toEqual({});
    });
  });

  describe('formatConsole', () => {
    it('formats findings nicely for terminal output', () => {
      const formatted = formatConsole(sampleFindings);
      expect(formatted).toContain('Angular migration scan');
      expect(formatted).toContain('2 finding(s) in 2 file(s)');
      expect(formatted).toContain('[WARN ] src/main.ts:3:1 — NgModule-based bootstrap');
      expect(formatted).toContain('[ERROR] src/app.module.ts:5:3 — entryComponents array obsolete');
      expect(formatted).toContain('fix: Migrate to bootstrapApplication()');
      expect(formatted).toContain('By pattern:');
    });

    it('returns clean message when no findings', () => {
      const formatted = formatConsole([]);
      expect(formatted).toContain('No deprecated patterns found. Clean.');
    });
  });

  describe('formatJson', () => {
    it('produces valid JSON containing findings and summary', () => {
      const jsonStr = formatJson(sampleFindings);
      const parsed = JSON.parse(jsonStr);
      expect(parsed).toHaveProperty('generatedAt');
      expect(parsed.summary.total).toBe(2);
      expect(parsed.findings).toHaveLength(2);
      expect(parsed.findings[0].patternId).toBe('ngmodule-bootstrap');
    });
  });

  describe('formatSarif', () => {
    it('produces valid SARIF v2.1.0 output', () => {
      const sarifStr = formatSarif(sampleFindings);
      const sarif = JSON.parse(sarifStr);
      expect(sarif.version).toBe('2.1.0');
      expect(sarif.runs).toHaveLength(1);

      const run = sarif.runs[0];
      expect(run.tool.driver.name).toBe('ng-migrate-toolkit');
      expect(run.tool.driver.rules).toHaveLength(2);
      expect(run.results).toHaveLength(2);

      const result = run.results[0];
      expect(result.ruleId).toBe('ngmodule-bootstrap');
      expect(result.level).toBe('warning');
      expect(result.locations[0].physicalLocation.artifactLocation.uri).toBe('src/main.ts');
      expect(result.locations[0].physicalLocation.region.startLine).toBe(3);
    });
  });
});
