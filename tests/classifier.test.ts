import { describe, it, expect } from 'vitest';
import { classifyEntry, classifyEntries } from '../src/classifier.js';
import { ChangelogEntry } from '../src/types.js';

describe('classifier', () => {
  describe('classifyEntry', () => {
    it('classifies breaking changes', () => {
      expect(classifyEntry('Breaking change: API v2 removed', '')).toBe('breaking');
      expect(classifyEntry('Removed legacy endpoint', '')).toBe('breaking');
      expect(classifyEntry('This feature is no longer supported', '')).toBe('breaking');
    });

    it('classifies deprecations', () => {
      expect(classifyEntry('Deprecated: old model will be sunset', '')).toBe('deprecation');
      expect(classifyEntry('API end of life notice', '')).toBe('deprecation');
      expect(classifyEntry('This method will be removed in v3', '')).toBe('deprecation');
    });

    it('classifies security issues', () => {
      expect(classifyEntry('Security patch for authentication', '')).toBe('security');
      expect(classifyEntry('CVE-2024-1234 vulnerability fix', '')).toBe('security');
    });

    it('classifies features by default', () => {
      expect(classifyEntry('New feature: batch processing', '')).toBe('feature');
      expect(classifyEntry('Added support for webhooks', '')).toBe('feature');
    });

    it('checks both title and summary', () => {
      expect(classifyEntry('Update', 'This is a breaking change in the API')).toBe('breaking');
      expect(classifyEntry('Update', 'Deprecated method replaced by new one')).toBe('deprecation');
    });

    it('is case insensitive', () => {
      expect(classifyEntry('BREAKING CHANGE: major update', '')).toBe('breaking');
      expect(classifyEntry('DEPRECATED: old endpoint', '')).toBe('deprecation');
    });
  });

  describe('classifyEntries', () => {
    it('classifies an array of entries', () => {
      const entries: ChangelogEntry[] = [
        { title: 'Breaking: removed v1', date: '2026-01-01', link: '', category: 'feature', summary: '', provider: 'stripe' },
        { title: 'New feature added', date: '2026-01-02', link: '', category: 'feature', summary: '', provider: 'stripe' },
      ];

      const result = classifyEntries(entries);
      expect(result[0].category).toBe('breaking');
      expect(result[1].category).toBe('feature');
    });
  });
});
