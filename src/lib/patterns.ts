/**
 * Registry of deprecated Angular API patterns.
 *
 * Each pattern is a data-driven rule: a regex applied to source text plus
 * human-readable migration guidance. Detection (`scanner.ts`) and reporting
 * (`reporter.ts`) are generic — adding a new migration rule means adding an
 * entry here, not writing new code.
 */

/**
 * Severity level for detected pattern findings.
 * - `warning`: Code functions but uses deprecated or sub-optimal patterns.
 * - `error`: Obsolete or removed API that will block build/upgrade.
 */
export type Severity = 'warning' | 'error';

/**
 * Interface representing a deprecated pattern rule.
 */
export interface DeprecatedPattern {
  /** Stable unique identifier, e.g., 'ngmodule-bootstrap' */
  id: string;
  /** What the pattern is, in plain human-readable language */
  description: string;
  /** Regex source pattern applied to source text */
  pattern: string;
  /** Regex flags, defaults to 'g' if unspecified */
  flags?: string;
  /** Angular version where the API was deprecated */
  introducedIn: string;
  /** Angular version where it is (or will be) removed, if known */
  removedIn?: string;
  /** Actionable migration guidance detailing what to replace it with */
  migration: string;
  /** Link to official Angular documentation or migration guides */
  docsUrl?: string;
  /** Finding severity level */
  severity: Severity;
}

/**
 * Default pattern registry containing standard Angular deprecation rules.
 */
export const DEPRECATED_PATTERNS: DeprecatedPattern[] = [
  {
    id: 'ngmodule-bootstrap',
    description:
      'NgModule-based bootstrap via platformBrowserDynamic() — prefer standalone bootstrap',
    pattern: 'platformBrowserDynamic\\s*\\(',
    introducedIn: '14',
    migration:
      'Migrate to bootstrapApplication() with a standalone root component.',
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
  {
    id: 'component-factory-resolver',
    description:
      'ComponentFactoryResolver — deprecated since Angular 13; dynamic components no longer require factories',
    pattern: 'ComponentFactoryResolver',
    introducedIn: '13',
    migration:
      'Pass component class directly to ViewContainerRef.createComponent() without resolving factory.',
    docsUrl: 'https://angular.dev/guide/components/dynamic-loading',
    severity: 'warning',
  },
  {
    id: 'reflective-injector',
    description:
      'ReflectiveInjector — deprecated in favor of Injector.create() or EnvironmentInjector',
    pattern: 'ReflectiveInjector',
    introducedIn: '5',
    removedIn: '16',
    migration:
      'Use Injector.create() or EnvironmentInjector for runtime dependency injection.',
    severity: 'error',
  },
  {
    id: 'router-initial-navigation-enabled',
    description:
      'initialNavigation: "enabled" or true is deprecated in favor of "enabledBlocking" or "enabledNonBlocking"',
    pattern: 'initialNavigation\\s*:\\s*(?:true|\'enabled\'|"enabled")',
    introducedIn: '11',
    migration:
      'Update initialNavigation to "enabledBlocking" or "enabledNonBlocking" in ExtraOptions or withEnabledBlocking().',
    severity: 'warning',
  },
];
