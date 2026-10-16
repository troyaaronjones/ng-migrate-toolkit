import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { DEPRECATED_PATTERNS } from './patterns';
import { scanProject } from './scanner';

function makeFixture(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ngmt-scan-'));
  fs.writeFileSync(
    path.join(dir, 'app.module.ts'),
    `import { NgModule } from '@angular/core';\n@NgModule({ entryComponents: [FooComponent] })\nexport class AppModule {}\n`,
  );
  fs.writeFileSync(
    path.join(dir, 'clean.ts'),
    `export const answer = 42;\n`,
  );
  fs.mkdirSync(path.join(dir, 'node_modules'));
  fs.writeFileSync(
    path.join(dir, 'node_modules', 'skipped.ts'),
    `TestBed.get(X);\n`,
  );
  return dir;
}

describe('scanProject', () => {
  it('finds deprecated patterns with locations and skips excluded dirs', () => {
    const dir = makeFixture();
    const findings = scanProject({ rootDir: dir, patterns: DEPRECATED_PATTERNS });

    const ids = findings.map((f) => f.patternId);
    expect(ids).toContain('ngmodule-decorator');
    expect(ids).toContain('entry-components');
    expect(ids).not.toContain('viewengine-testbed'); // lives under node_modules

    const entry = findings.find((f) => f.patternId === 'entry-components')!;
    expect(entry.file).toBe('app.module.ts');
    expect(entry.line).toBe(2);
    expect(entry.severity).toBe('error');
    expect(entry.snippet).toContain('entryComponents');

    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns an empty array for a clean tree', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ngmt-clean-'));
    fs.writeFileSync(path.join(dir, 'a.ts'), `export const x = 1;\n`);
    expect(scanProject({ rootDir: dir, patterns: DEPRECATED_PATTERNS })).toEqual([]);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
