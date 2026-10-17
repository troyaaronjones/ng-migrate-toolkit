# ng-migrate-toolkit

Schematics, codemods, and CLI tooling for **systematic Angular version migrations** — built from experience migrating large Angular estates (1,500+ projects) where "just run `ng update`" isn't a plan.

The core idea: migrations are a **data problem** before they're a code problem. First you need a complete inventory of what will break, where, and how bad it is. Then you apply codemods in a controlled sequence, with CI gates proving each step. This toolkit gives you both halves.

## What's inside

| Piece | What it does |
|---|---|
| `ng-migrate scan` (CLI) | Walks a project, finds deprecated Angular APIs, prints a report. `--json` / `--sarif` for CI, `--fail-on` to gate builds |
| `detect-deprecated` (schematic) | Same detection as an Angular schematic — run it inside a workspace, writes `migration-report.json` |
| `example-migration` (schematic) | Working codemod schematic (`TestBed.get` → `TestBed.inject`) to run or copy when building migrations |
| Pattern registry (`src/lib/patterns.ts`) | Data-driven deprecated-API rules — add a rule, get detection everywhere |

## Quickstart

```bash
npm install
npm run build

# Scan a project (read-only)
node dist/cli.js scan /path/to/angular-app

# JSON / SARIF report + fail CI on errors
node dist/cli.js scan /path/to/angular-app --json report.json --sarif report.sarif --fail-on error

# List registered patterns
node dist/cli.js scan --list-patterns

# Run the schematic inside an Angular workspace
npx schematics ./dist/schematics/collection.json:detect-deprecated
npx schematics ./dist/schematics/collection.json:example-migration
```

Example output:

```
[WARN ] src/main.ts:3:1 — NgModule-based bootstrap via platformBrowserDynamic() — prefer standalone bootstrap
       > platformBrowserDynamic().bootstrapModule(AppModule)
       fix: Migrate to bootstrapApplication() with a standalone root component.
```

## How it works

1. **Patterns are data.** Each deprecated API is one entry in `src/lib/patterns.ts`: a regex, the version it was deprecated in, severity, and migration guidance. The scanner, CLI, and schematic all consume the same registry.
2. **Scan before you touch.** `scan` produces a full inventory with file/line locations — the migration plan writes itself from the report.
3. **Codemods are schematics.** Real migrations live in `src/schematics/<name>/` following the `example-migration` template: read the tree, transform, overwrite, log. Idempotent by contract.

See [docs/architecture.md](docs/architecture.md) for the design and [docs/adding-a-codemod.md](docs/adding-a-codemod.md) for the codemod playbook.

## Roadmap

- [x] Console, JSON, and SARIF reporters, `--fail-on` CI gate
- [x] Codemod schematic template & TestBed.get codemod
- [x] SARIF output for GitHub code scanning
- [ ] Real codemods for the v20 → v21 migration surface
- [ ] `ng update` integration (`ng-update/package.json` migrations)
- [ ] Sequencing: dependency-ordered migration plans for monorepos
- [ ] Docs site

See [docs/roadmap.md](docs/roadmap.md).

## Contributing

PRs welcome. Keep patterns data-driven, keep codemods idempotent, add a test in `src/lib/*.spec.ts` or beside your schematic.

## License

MIT — see [LICENSE](LICENSE).
