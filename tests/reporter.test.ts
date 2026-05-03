import { describe, it, expect } from 'vitest';
import { generateReport, buildReportData } from '../src/reporter.js';
import { ChangelogEntry, ScanResult } from '../src/types.js';

describe('reporter', () => {
  it('generates a markdown report with overview table', () => {
    const data = {
      source: 'stripe',
      sourceType: 'changelog' as const,
      since: '2026-01-01',
      until: '2026-05-01',
      breakingCount: 2,
      deprecationCount: 1,
      securityCount: 0,
      featureCount: 3,
      results: [] as ScanResult[],
    };

    const report = generateReport(data);
    expect(report).toContain('# Changelog Impact Report');
    expect(report).toContain('**Source**: stripe (changelog)');
    expect(report).toContain('| Breaking | 2 |');
    expect(report).toContain('| Deprecation | 1 |');
    expect(report).toContain('| Feature | 3 |');
  });

  it('includes change details with hits', () => {
    const data = {
      source: 'openai',
      sourceType: 'changelog' as const,
      since: '2026-01-01',
      until: '2026-05-01',
      breakingCount: 1,
      deprecationCount: 0,
      securityCount: 0,
      featureCount: 0,
      results: [
        {
          entry: {
            title: 'Breaking: gpt-4 removed',
            date: '2026-03-15',
            link: 'https://platform.openai.com/docs/changelog',
            category: 'breaking' as const,
            summary: 'gpt-4 is no longer available',
            source: 'openai',
            sourceType: 'changelog' as const,
          },
          hits: [
            { file: 'src/ai.ts', line: 5, snippet: "const model = 'gpt-4'", matchedPattern: 'gpt[- ]?4' },
          ],
        },
      ] as ScanResult[],
    };

    const report = generateReport(data);
    expect(report).toContain('Breaking: gpt-4 removed');
    expect(report).toContain('src/ai.ts:5');
    expect(report).toContain("const model = 'gpt-4'");
    expect(report).toContain('Suggested actions');
  });

  it('handles empty results', () => {
    const data = {
      source: 'stripe',
      sourceType: 'changelog' as const,
      since: '2026-01-01',
      until: '2026-05-01',
      breakingCount: 0,
      deprecationCount: 0,
      securityCount: 0,
      featureCount: 0,
      results: [] as ScanResult[],
    };

    const report = generateReport(data);
    expect(report).toContain('No changes found matching the criteria');
  });
});
