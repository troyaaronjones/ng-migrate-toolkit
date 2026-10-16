/**
 * Registry of deprecated Angular API patterns.
 *
 * Each pattern is a data-driven rule: a regex applied to source text plus
 * human-readable migration guidance. Detection (`scanner.ts`) and reporting
 * (`reporter.ts`) are generic — adding a new migration rule means adding an
 * entry here, not writing new code.
 *
 * NOTE: these are EXAMPLE patterns illustrating the mechanism. Replace and
 * extend them with the real patterns from your own migrations.
 */

export type Severity = 'warning' | 'error';

export interface DeprecatedPattern {
  /** Stable id, e.g. 'ngmodule-bootstrap' */
  id: string;
  /** What the pattern is, in plain language */
  description: string;
  /** Regex source applied to file text (multiline). Keep it tight. */
  pattern: string;
  /** Regex flags, default 'g' */
  flags?: string;
  /** Angular version where the API was deprecated */
  introducedIn: string;
  /** Angular version where it is (or will be) removed, if known */
  removedIn?: string;
  /** What to do instead — the actionable guidance */
  migration: string;
  /** Link to official docs, if any */
  docsUrl?: string;
  severity: Severity;
}

export const DEPRECATED_PATTERNS: DeprecatedPattern[] = [
  {
    id: 'ngmodule-bootstrap',
    description:
      'NgModule-based bootstrap via platformBrowserDynamic() — prefer standalone bootstrap',
    pattern: 'platformBrowserDynamic\\s*\\(',
    introducedIn: '14',
    migration:
      'Migrate to bootstrapApplication() with a standalone root component. ' +
      'See the standalone migration schematic in src/schematics/example-migration.',
    docsUrl: 'https://angular.dev/guide/upgrade-to-standalone',
    severity: 'warning',
  },
  {
    id: 'ngmodule-decorator',
    description:
      '@NgModule decorator still present — candidate for standalone migration',
    pattern: '@NgModule\\s*\\(',
    introducedIn: '14',
    migration:
      'Convert the module to standalone components/directives/pipes, or keep ' +
      'the NgModule only where it genuinely groups providers.',
    docsUrl: 'https://angular.dev/guide/upgrade-to-standalone',
    severity: 'warning',
  },
  {
    id: 'entry-components',
    description:
      'entryComponents array — obsolete since Ivy; components no longer need registration',
    pattern: 'entryComponents\\s*:',
    introducedIn: '9',
    removedIn: '13',
    migration: 'Delete the entryComponents array. Ivy resolves components automatically.',
    severity: 'error',
  },
  {
    id: 'viewengine-testbed',
    description:
      'TestBed.get() — deprecated in favor of TestBed.inject()',
    pattern: 'TestBed\\.get\\s*\\(',
    introducedIn: '9',
    migration: 'Replace TestBed.get(X) with TestBed.inject(X). The signatures are compatible.',
    severity: 'warning',
  },
];
