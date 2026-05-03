import { describe, it, expect } from 'vitest';
import { writeCache, readCache, diffEntries } from '../src/cache.js';
import { ChangelogEntry } from '../src/types.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('cache', () => {
  describe('diffEntries', () => {
    it('finds new entries by link', () => {
      const previous: ChangelogEntry[] = [
        { title: 'Old entry', date: '2026-01-01', link: 'https://example.com/1', category: 'feature', summary: '', source: 'stripe', sourceType: 'changelog' },
      ];
      const current: ChangelogEntry[] = [
        { title: 'Old entry', date: '2026-01-01', link: 'https://example.com/1', category: 'feature', summary: '', source: 'stripe', sourceType: 'changelog' },
        { title: 'New entry', date: '2026-02-01', link: 'https://example.com/2', category: 'feature', summary: '', source: 'stripe', sourceType: 'changelog' },
      ];

      const diff = diffEntries(previous, current);
      expect(diff.length).toBe(1);
      expect(diff[0].title).toBe('New entry');
    });

    it('returns all entries when previous is empty', () => {
      const current: ChangelogEntry[] = [
        { title: 'Entry 1', date: '2026-01-01', link: 'https://example.com/1', category: 'feature', summary: '', source: 'stripe', sourceType: 'changelog' },
        { title: 'Entry 2', date: '2026-02-01', link: 'https://example.com/2', category: 'feature', summary: '', source: 'stripe', sourceType: 'changelog' },
      ];

      const diff = diffEntries([], current);
      expect(diff.length).toBe(2);
    });

    it('returns empty when no new entries', () => {
      const previous: ChangelogEntry[] = [
        { title: 'Entry 1', date: '2026-01-01', link: 'https://example.com/1', category: 'feature', summary: '', source: 'stripe', sourceType: 'changelog' },
      ];
      const current: ChangelogEntry[] = [
        { title: 'Entry 1', date: '2026-01-01', link: 'https://example.com/1', category: 'feature', summary: '', source: 'stripe', sourceType: 'changelog' },
      ];

      const diff = diffEntries(previous, current);
      expect(diff.length).toBe(0);
    });
  });

  describe('writeCache / readCache', () => {
    it('round-trips cache entries', () => {
      const entries: ChangelogEntry[] = [
        { title: 'Test entry', date: '2026-01-01', link: 'https://example.com/1', category: 'breaking', summary: 'test', source: 'test-source', sourceType: 'changelog' },
      ];

      writeCache('test-source-v2', entries);
      const cached = readCache('test-source-v2');

      expect(cached).not.toBeNull();
      expect(cached!.source).toBe('test-source-v2');
      expect(cached!.entries.length).toBe(1);
      expect(cached!.entries[0].title).toBe('Test entry');

      const cacheDir = path.join(os.homedir(), '.changelog-impact', 'cache');
      fs.rmSync(path.join(cacheDir, 'test-source-v2.json'), { force: true });
    });
  });
});
