# Architecture

## The problem

Framework migrations fail for organizational reasons, not technical ones:

1. Nobody knows the full inventory of what will break.
2. Codemods get applied in the wrong order across interdependent projects.
3. There's no gate proving each step is safe, so teams freeze.

This toolkit addresses (1) directly and is designed to grow into (2) and (3).

## Layers

```
┌─────────────────────────────────────────────┐
│  Interfaces                                  │
│  ┌──────────┐   ┌────────────────────────┐  │
│  │ CLI      │   │ Angular schematics      │  │
│  │ (bin)    │   │ (collection.json)      │  │
│  └────┬─────┘   └──────────┬─────────────┘  │
│       │                    │                 │
│       └────────┬───────────┘                 │
│                ▼                             │
│  ┌──────────────────────────────────────┐   │
│  │ Core (src/lib)                       │   │
│  │  patterns.ts  — rule registry (data) │   │
│  │  scanner.ts   — fs walk + matching   │   │
│  │  reporter.ts  — console / JSON output │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

- **Core is framework-agnostic.** `scanner.ts` walks any directory and matches regex rules. It doesn't know about Angular — the *patterns* do.
- **Interfaces are thin.** The CLI resolves paths and exit codes; the schematic adapts the registry to the virtual `Tree`. Neither contains detection logic.
- **Patterns are the product.** The value of this toolkit is the registry: a curated, versioned catalog of "this API → this replacement" with severity and guidance. Everything else is plumbing.

## Key decisions

- **Regex over AST for detection (v0).** AST matching (ts-morph) is more precise but slower and heavier to distribute. Regex gets 90% of deprecated-API detection with zero parse cost, and false positives are cheap here — a human reviews the report before any codemod runs. Codemods themselves (which *write* code) should use AST transforms; see `docs/adding-a-codemod.md`.
- **Idempotent codemods.** Every migration schematic must be safe to run twice. Check for the already-migrated shape first and skip.
- **Reports are the contract.** `migration-report.json` is the handoff between "scan" and "migrate" phases, and the input to future sequencing work.

## Future: sequencing

For monorepos with interdependent projects, the plan is a dependency-ordered migration queue: scan all projects → build a dependency graph → emit an ordered plan where shared libraries migrate before their consumers. The report format is designed to carry the per-project data this needs.
