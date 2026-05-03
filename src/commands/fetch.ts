import { loadConfig, getDefaultSources } from '../config.js';
import { StripeSource } from '../sources/stripe.js';
import { OpenAISource } from '../sources/openai.js';
import { GitHubRepoSource } from '../sources/github-repo.js';
import { classifyEntriesWithLLM } from '../classifier.js';
import { writeCache, readCache, diffEntries } from '../cache.js';
import { Source } from '../sources/types.js';
import { ChangelogEntry } from '../types.js';
import { ProgramError } from '../errors.js';

export async function runFetch(cwd: string, options?: { source?: string }): Promise<void> {
  const config = loadConfig(cwd);
  const enabledSources = (config?.sources || getDefaultSources())
    .filter((s) => s.enabled);

  if (options?.source) {
    const filtered = enabledSources.filter((s) => s.name === options.source);
    if (filtered.length === 0) {
      const available = enabledSources.map((s) => s.name).join(', ');
      throw new ProgramError(`Source "${options.source}" is not enabled. Available sources: ${available}`);
    }
  }

  const sources: Source[] = [];
  for (const s of enabledSources) {
    if (options?.source && s.name !== options.source) continue;

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

  for (const source of sources) {
    console.log(`Fetching ${source.name} (${source.type})...`);
    try {
      let entries = await source.fetch();
      entries = await classifyEntriesWithLLM(entries, config?.llm);

      const previous = readCache(source.name);
      const newEntries = previous ? diffEntries(previous.entries, entries) : entries;

      writeCache(source.name, entries);

      console.log(`  Total entries: ${entries.length}`);
      console.log(`  New entries: ${newEntries.length}`);

      for (const entry of newEntries.slice(0, 20)) {
        const cat = categoryLabel(entry);
        console.log(`  ${cat} ${entry.title}`);
        if (entry.link) console.log(`    → ${entry.link}`);
      }
      if (newEntries.length > 20) {
        console.log(`  ... and ${newEntries.length - 20} more`);
      }
      console.log('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  Error fetching ${source.name}: ${msg}`);
    }
  }
}

function categoryLabel(entry: ChangelogEntry): string {
  switch (entry.category) {
    case 'breaking': return '🔴';
    case 'deprecation': return '🟡';
    case 'security': return '🔒';
    case 'feature': return '🟢';
    default: return '⚪';
  }
}
