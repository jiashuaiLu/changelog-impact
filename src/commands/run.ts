import { resolveRepoPath, getDefaultSources, ensureReportsDir, loadConfig, getDefaultSince } from '../config.js';
import { StripeSource } from '../sources/stripe.js';
import { OpenAISource } from '../sources/openai.js';
import { GitHubRepoSource } from '../sources/github-repo.js';
import { classifyEntriesWithLLM } from '../classifier.js';
import { writeCache, readCache, diffEntries } from '../cache.js';
import { scanRepo } from '../scanner.js';
import { buildReportData, writeReport } from '../reporter.js';
import { enrichScanResultsWithLLM, resolveLLMConfig } from '../llm.js';
import { Source } from '../sources/types.js';
import { ProgramError } from '../errors.js';

export async function runRun(
  cwd: string,
  options: { repo?: string; source?: string; since?: string },
): Promise<void> {
  const repoPath = resolveRepoPath(options.repo, cwd);
  const since = options.since || getDefaultSince();
  const sourceName = options.source;

  const config = loadConfig(cwd);
  const enabledSources = (config?.sources || getDefaultSources())
    .filter((s) => s.enabled);

  const sources: Source[] = [];
  for (const s of enabledSources) {
    if (sourceName && s.name !== sourceName) continue;

    switch (s.type) {
      case 'changelog':
        if (s.name === 'stripe') sources.push(new StripeSource());
        if (s.name === 'openai') sources.push(new OpenAISource());
        break;
      case 'github-repo':
        if (s.repo) sources.push(new GitHubRepoSource(s.name, s.repo, s.branch));
        break;
    }
  }

  if (sources.length === 0) {
    throw new ProgramError('No sources configured. Run "changelog-impact init" first.');
  }

  for (const source of sources) {
    const sourceConfig = enabledSources.find((s) => s.name === source.name);
    const sourceType = sourceConfig?.type || source.type;

    console.log(`[${source.name}] Fetching...`);
    let entries;
    try {
      entries = await source.fetch();
      entries = await classifyEntriesWithLLM(entries, config?.llm);

      const previous = readCache(source.name);
      const newEntries = previous ? diffEntries(previous.entries, entries) : entries;

      writeCache(source.name, entries);
      console.log(`  Total: ${entries.length} entries, ${newEntries.length} new`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  Fetch error: ${msg}`);
      const cached = readCache(source.name);
      if (cached) {
        entries = cached.entries;
        console.log(`  Using cached data (${entries.length} entries)`);
      } else {
        console.error(`  No cached data available. Skipping ${source.name}.`);
        continue;
      }
    }

    if (since !== '1970-01-01') {
      entries = entries.filter((e) => {
        if (!e.date) return true;
        return e.date >= since;
      });
    }

    console.log(`[${source.name}] Scanning repo (since ${since})...`);
    let results = scanRepo(repoPath, entries, source.name);

    const llmConfig = resolveLLMConfig(config?.llm);
    if (llmConfig && results.some((r) => r.hits.length > 0)) {
      console.log(`  Enriching results with LLM...`);
      results = await enrichScanResultsWithLLM(results, llmConfig);
    }

    const totalHits = results.reduce((sum, r) => sum + r.hits.length, 0);
    const impactedCount = results.filter((r) => r.hits.length > 0).length;
    console.log(`  ${totalHits} hits across ${impactedCount} impacted entries`);

    const reportData = buildReportData(source.name, sourceType, results, since);
    const reportsDir = ensureReportsDir(repoPath);
    const reportPath = writeReport(reportData, reportsDir);
    console.log(`  Report: ${reportPath}`);
    console.log('');
  }

  console.log('Done. Check the reports/ directory for details.');
}
