# Roadmap

Ordered by value, not by ease. Checked items are done.

- [x] Pattern registry + project scanner (CLI + schematic)
- [x] Console and JSON reporters, `--fail-on` CI gate
- [x] Codemod schematic template & TestBed.get codemod
- [x] SARIF output for GitHub code scanning / PR annotations
- [ ] Real codemods for the v20 → v21 migration surface (the reason this exists)
- [ ] `ng update` integration via `ng-update/package.json` so migrations run in the standard flow
- [ ] Monorepo sequencing: dependency-ordered migration plans for multi-project workspaces
- [ ] Baseline mode: `scan --baseline` to only report *new* findings vs. a stored report (for incremental adoption in big repos)
- [ ] Docs site (Docusaurus or VitePress)

## Non-goals

- Replacing `ng update` — this toolkit handles the *project-specific* migration surface that `ng update` can't know about.
- AST-perfect detection in v0 — regex first, AST where precision matters (codemods that write code).
