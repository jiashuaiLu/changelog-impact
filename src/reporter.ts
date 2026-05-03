import fs from 'node:fs';
import path from 'node:path';
import { ReportData, ScanResult } from './types.js';

export function generateReport(data: ReportData): string {
  const lines: string[] = [];

  lines.push(`# Changelog Impact Report`);
  lines.push('');
  lines.push(`**Source**: ${data.source} (${data.sourceType})`);
  lines.push(`**Period**: ${data.since} ~ ${data.until}`);
  lines.push('');
  lines.push('## Overview');
  lines.push('');
  lines.push(`| Category | Count |`);
  lines.push(`|----------|-------|`);
  lines.push(`| Breaking | ${data.breakingCount} |`);
  lines.push(`| Deprecation | ${data.deprecationCount} |`);
  lines.push(`| Security | ${data.securityCount} |`);
  lines.push(`| Feature | ${data.featureCount} |`);
  lines.push('');

  if (data.results.length === 0) {
    lines.push('No changes found matching the criteria.');
    return lines.join('\n');
  }

  lines.push('## Changes & Impact');
  lines.push('');

  for (const result of data.results) {
    const { entry, hits } = result;
    const categoryLabel = categoryEmoji(entry.category);

    lines.push(`### ${categoryLabel} ${entry.title}`);
    lines.push('');
    lines.push(`- **Date**: ${entry.date || 'N/A'}`);
    lines.push(`- **Category**: ${entry.category}`);
    lines.push(`- **Link**: ${entry.link}`);
    lines.push('');

    const displaySummary = entry.llmSummary || entry.summary;
    if (displaySummary) {
      lines.push(`> ${displaySummary}`);
      lines.push('');
    }

    if (entry.llmImpactExplanation) {
      lines.push(`**Why this affects your code**:`);
      lines.push('');
      lines.push(entry.llmImpactExplanation);
      lines.push('');
    }

    if (hits.length > 0) {
      lines.push(`**Impacted files (${hits.length} hits)**:`);
      lines.push('');
      for (const hit of hits) {
        lines.push(`- \`${hit.file}:${hit.line}\``);
        lines.push(`  \`${hit.snippet}\``);
      }
      lines.push('');

      if (entry.llmMigrationSuggestion) {
        lines.push(`**Migration steps**:`);
        lines.push('');
        lines.push(entry.llmMigrationSuggestion);
        lines.push('');
      } else {
        lines.push('**Suggested actions**:');
        lines.push('');
        lines.push(`1. Review the change: ${entry.link}`);
        lines.push('2. Check each impacted file listed above');
        if (entry.category === 'breaking') {
          lines.push('3. Update the affected API calls to match the new interface');
          lines.push('4. Run your test suite to verify nothing is broken');
        } else if (entry.category === 'deprecation') {
          lines.push('3. Plan migration away from the deprecated feature');
          lines.push('4. Set a deadline before the feature is removed');
        } else if (entry.category === 'security') {
          lines.push('3. Apply the security patch immediately');
          lines.push('4. Audit for potential vulnerabilities in your usage');
        } else {
          lines.push('3. Evaluate if the new feature is relevant to your use case');
        }
        lines.push('');
      }
    } else {
      lines.push('**No direct impact detected in your codebase.**');
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

export function writeReport(data: ReportData, reportsDir: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const filename = `${date}-${data.source}.md`;
  const filepath = path.join(reportsDir, filename);
  const content = generateReport(data);
  fs.writeFileSync(filepath, content, 'utf-8');
  return filepath;
}

export function buildReportData(
  source: string,
  sourceType: string,
  results: ScanResult[],
  since: string,
): ReportData {
  const now = new Date().toISOString().slice(0, 10);
  let breakingCount = 0;
  let deprecationCount = 0;
  let securityCount = 0;
  let featureCount = 0;

  for (const r of results) {
    switch (r.entry.category) {
      case 'breaking': breakingCount++; break;
      case 'deprecation': deprecationCount++; break;
      case 'security': securityCount++; break;
      case 'feature': featureCount++; break;
    }
  }

  return {
    source,
    sourceType: sourceType as ReportData['sourceType'],
    since,
    until: now,
    breakingCount,
    deprecationCount,
    securityCount,
    featureCount,
    results,
  };
}

function categoryEmoji(category: string): string {
  switch (category) {
    case 'breaking': return '🔴';
    case 'deprecation': return '🟡';
    case 'security': return '🔒';
    case 'feature': return '🟢';
    default: return '⚪';
  }
}
