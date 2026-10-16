# Adding a codemod

A codemod here is an Angular schematic: it reads the workspace `Tree`, transforms files, and logs what changed. Copy `src/schematics/example-migration/` and follow this playbook.

## 1. Start from a finding

Every codemod should correspond to one entry in `src/lib/patterns.ts`. If the scanner can't detect it, the codemod can't be sequenced or gated. Add the pattern first, verify `ng-migrate scan` finds it, then write the transform.

## 2. Choose your transform strategy

| Case | Strategy |
|---|---|
| Simple, uniform syntax (renames, import moves) | String/regex replace on file text |
| Structural (decorator args, class members, template bindings) | AST transform — parse with the TypeScript compiler API or ts-morph, edit, print |

Rule of thumb: if you're counting braces, you need the AST.

## 3. Keep it idempotent

Running the schematic twice must change nothing the second time. Before transforming a file, check for the already-migrated shape and skip:

```ts
if (alreadyMigrated(text)) {
  context.logger.debug(`skip ${filePath}: already migrated`);
  return;
}
```

## 4. Register it

Add an entry to `src/schematics/collection.json`:

```json
"my-migration": {
  "description": "What it migrates, and from which version.",
  "factory": "./my-migration/index#myMigration",
  "schema": "./my-migration/schema.json"
}
```

The build copies `collection.json` and `schema.json` into `dist/` automatically (`scripts/copy-schematic-assets.mjs`).

## 5. Test it

- Unit-test the transform function in isolation (input string → expected output string).
- Schematic-level test: build a `UnitTestTree` with representative files, run the rule, assert the tree contents. Keep fixtures small but adversarial — nested modules, already-migrated files, files that shouldn't match.

## 6. Document the rollout

Every codemod gets a section in the docs: what it changes, what it deliberately *doesn't* change (and why a human should review those), and the rollback story. Codemods that can't be rolled back don't ship.
