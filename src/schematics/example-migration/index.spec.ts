import { HostTree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'node:path';
import { exampleMigration, migrateTestBedGet } from './index';

const collectionPath = path.join(__dirname, '../collection.json');

describe('example-migration schematic', () => {
  describe('migrateTestBedGet', () => {
    it('replaces TestBed.get with TestBed.inject', () => {
      const code = `const service = TestBed.get(MyService);`;
      expect(migrateTestBedGet(code)).toBe(`const service = TestBed.inject(MyService);`);
    });

    it('is idempotent when TestBed.inject is already present', () => {
      const code = `const service = TestBed.inject(MyService);`;
      expect(migrateTestBedGet(code)).toBe(`const service = TestBed.inject(MyService);`);
    });
  });

  describe('schematic execution', () => {
    let runner: SchematicTestRunner;
    let appTree: UnitTestTree;

    beforeEach(() => {
      runner = new SchematicTestRunner('schematics', collectionPath);
      appTree = new UnitTestTree(new HostTree());
    });

    it('migrates files in the tree and preserves clean files', async () => {
      appTree.create(
        '/src/app.spec.ts',
        `import { TestBed } from '@angular/core/testing';\nconst s = TestBed.get(DataService);\n`,
      );
      appTree.create('/src/clean.ts', `export const x = 1;\n`);

      const tree = await runner.runSchematic('example-migration', {}, appTree);

      expect(tree.readContent('/src/app.spec.ts')).toContain('TestBed.inject(DataService)');
      expect(tree.readContent('/src/clean.ts')).toBe(`export const x = 1;\n`);
    });

    it('honors dryRun option without modifying files in tree', async () => {
      const original = `const s = TestBed.get(DataService);`;
      appTree.create('/src/app.spec.ts', original);

      const tree = await runner.runSchematic('example-migration', { dryRun: true }, appTree);

      expect(tree.readContent('/src/app.spec.ts')).toBe(original);
    });
  });
});
