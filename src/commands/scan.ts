import { loadConfig, resolveRepoPath, getDefaultProviders, ensureReportsDir } from '../config.js';
import { readCache } from '../cache.js';
import { scanRepo } from '../scanner.js';
import { buildReportData, writeReport } from '../reporter.js';
import { ChangelogEntry } from '../types.js';

export function runScan(
  cwd: string,
  options: { repo?: string; provider?: string; since?: string },
): void {
  const repoPath = resolveRepoPath(options.repo, cwd);
  const config = loadConfig(cwd);
  const enabledProviders = (config?.providers || getDefaultProviders())
    .filter((p) => p.enabled);

  const providerName = options.provider;
  if (providerName) {
    const found = enabledProviders.find((p) => p.name === providerName);
    if (!found) {
      console.error(`Provider "${providerName}" is not enabled. Check your config.`);
      process.exit(1);
    }
  }

  const since = options.since || '1970-01-01';
  const providers = providerName ? [providerName] : enabledProviders.map((p) => p.name);

  for (const provider of providers) {
    const cached = readCache(provider);
    if (!cached) {
      console.log(`No cached data for ${provider}. Run "changelog-impact fetch" first.`);
      continue;
    }

    let entries = cached.entries;
    if (since !== '1970-01-01') {
      entries = entries.filter((e) => {
        if (!e.date) return true;
        return e.date >= since;
      });
    }

    console.log(`Scanning repo for ${provider} impact (${entries.length} entries)...`);
    const results = scanRepo(repoPath, entries, provider);

    const totalHits = results.reduce((sum, r) => sum + r.hits.length, 0);
    const impactedCount = results.filter((r) => r.hits.length > 0).length;
    console.log(`  ${totalHits} hits across ${impactedCount} entries with impact`);

    const reportData = buildReportData(provider, results, since);
    const reportsDir = ensureReportsDir(repoPath);
    const reportPath = writeReport(reportData, reportsDir);
    console.log(`  Report saved: ${reportPath}`);
    console.log('');
  }
}
