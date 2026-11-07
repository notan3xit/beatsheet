import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHANGELOG } from './changelog';

describe('Spec app-header › Aktuelle Version', () => {
  it('Version des Pakets', () => {
    const { version } = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as { version: string };
    expect(CHANGELOG[0]!.version).toBe(version);
  });
});
