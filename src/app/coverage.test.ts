import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pages } from './pages';
import { operations } from '../services/catalog';
describe('Angular migration coverage', () => {
  it('preserves every concrete Angular route exactly once', () => {
    const source = readFileSync(resolve(process.cwd(), '../src/app/app.routes.ts'), 'utf8');
    const expected = [...source.matchAll(/\{\s*path:\s*'([^']+)'[^\n]*?component\s*:/g)]
      .map((match) => match[1])
      .filter((path) => path !== 'Dashboard' && path !== '**');
    expect(
      pages
        .filter((page) => page.group !== 'Notifications')
        .map((page) => page.path.split('/').at(-1))
        .sort(),
    ).toEqual([...new Set(expected)].sort());
    expect(new Set(pages.map((page) => page.path)).size).toBe(pages.length);
  });
  it('resolves every service operation referenced by migrated routes', () => {
    for (const page of pages)
      for (const id of page.operations) expect(operations[id], page.path + ': ' + id).toBeDefined();
  });
});
