import { resolveRepoPath, getDefaultProviders, ensureReportsDir } from '../config.js';
import { StripeProvider } from '../providers/stripe.js';
import { OpenAIProvider } from '../providers/openai.js';
import { classifyEntries } from '../classifier.js';
import { writeCache, readCache, diffEntries } from '../cache.js';
import { scanRepo } from '../scanner.js';
import { buildReportData, writeReport } from '../reporter.js';
import { Provider } from '../providers/types.js';

export async function runRun(
  cwd: string,
  options: { repo?: string; provider?: string; since?: string },
): Promise<void> {
  const repoPath = resolveRepoPath(options.repo, cwd);
  const since = options.since || '1970-01-01';
  const providerName = options.provider;

  const defaultProviders = getDefaultProviders().filter((p) => p.enabled);
  const providers: Provider[] = [];

  for (const p of defaultProviders) {
    if (providerName && p.name !== providerName) continue;
    switch (p.name) {
      case 'stripe': providers.push(new StripeProvider()); break;
      case 'openai': providers.push(new OpenAIProvider()); break;
    }
  }

  if (providers.length === 0) {
    console.error('No providers configured. Run "changelog-impact init" first.');
    process.exit(1);
  }

  for (const provider of providers) {
    console.log(`[${provider.name}] Fetching changelog...`);
    let entries;
    try {
      entries = await provider.fetch();
      entries = classifyEntries(entries);

      const previous = readCache(provider.name);
      const newEntries = previous ? diffEntries(previous.entries, entries) : entries;

      writeCache(provider.name, entries);
      console.log(`  Total: ${entries.length} entries, ${newEntries.length} new`);
    } catch (err) {
      console.error(`  Fetch error: ${err}`);
      const cached = readCache(provider.name);
      if (cached) {
        entries = cached.entries;
        console.log(`  Using cached data (${entries.length} entries)`);
      } else {
        console.error(`  No cached data available. Skipping ${provider.name}.`);
        continue;
      }
    }

    if (since !== '1970-01-01') {
      entries = entries.filter((e) => {
        if (!e.date) return true;
        return e.date >= since;
      });
    }

    console.log(`[${provider.name}] Scanning repo...`);
    const results = scanRepo(repoPath, entries, provider.name);

    const totalHits = results.reduce((sum, r) => sum + r.hits.length, 0);
    const impactedCount = results.filter((r) => r.hits.length > 0).length;
    console.log(`  ${totalHits} hits across ${impactedCount} impacted entries`);

    const reportData = buildReportData(provider.name, results, since);
    const reportsDir = ensureReportsDir(repoPath);
    const reportPath = writeReport(reportData, reportsDir);
    console.log(`  Report: ${reportPath}`);
    console.log('');
  }

  console.log('Done. Check the reports/ directory for details.');
}
