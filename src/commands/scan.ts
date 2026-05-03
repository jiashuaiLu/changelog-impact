import { loadConfig, resolveRepoPath, getDefaultSources, ensureReportsDir } from '../config.js';
import { readCache } from '../cache.js';
import { scanRepo } from '../scanner.js';
import { buildReportData, writeReport } from '../reporter.js';
import { enrichScanResultsWithLLM, resolveLLMConfig } from '../llm.js';
import { ChangelogEntry } from '../types.js';

export async function runScan(
  cwd: string,
  options: { repo?: string; source?: string; since?: string },
): Promise<void> {
  const repoPath = resolveRepoPath(options.repo, cwd);
  const config = loadConfig(cwd);
  const enabledSources = (config?.sources || getDefaultSources())
    .filter((s) => s.enabled);

  const sourceName = options.source;
  if (sourceName) {
    const found = enabledSources.find((s) => s.name === sourceName);
    if (!found) {
      console.error(`Source "${sourceName}" is not enabled. Check your config.`);
      process.exit(1);
    }
  }

  const since = options.since || '1970-01-01';
  const sources = sourceName ? [sourceName] : enabledSources.map((s) => s.name);

  for (const source of sources) {
    const cached = readCache(source);
    if (!cached) {
      console.log(`No cached data for ${source}. Run "changelog-impact fetch" first.`);
      continue;
    }

    let entries = cached.entries;
    if (since !== '1970-01-01') {
      entries = entries.filter((e) => {
        if (!e.date) return true;
        return e.date >= since;
      });
    }

    const sourceConfig = enabledSources.find((s) => s.name === source);
    const sourceType = sourceConfig?.type || 'changelog';

    console.log(`Scanning repo for ${source} impact (${entries.length} entries)...`);
    let results = scanRepo(repoPath, entries, source);

    const llmConfig = resolveLLMConfig(config?.llm);
    if (llmConfig && results.some((r) => r.hits.length > 0)) {
      console.log(`  Enriching results with LLM...`);
      results = await enrichScanResultsWithLLM(results, llmConfig);
    }

    const totalHits = results.reduce((sum, r) => sum + r.hits.length, 0);
    const impactedCount = results.filter((r) => r.hits.length > 0).length;
    console.log(`  ${totalHits} hits across ${impactedCount} entries with impact`);

    const reportData = buildReportData(source, sourceType, results, since);
    const reportsDir = ensureReportsDir(repoPath);
    const reportPath = writeReport(reportData, reportsDir);
    console.log(`  Report saved: ${reportPath}`);
    console.log('');
  }
}
