import { loadConfig, resolveRepoPath, getDefaultProviders } from '../config.js';
import { StripeProvider } from '../providers/stripe.js';
import { OpenAIProvider } from '../providers/openai.js';
import { classifyEntries } from '../classifier.js';
import { writeCache, readCache, diffEntries } from '../cache.js';
import { Provider } from '../providers/types.js';
import { ChangelogEntry } from '../types.js';

export async function runFetch(cwd: string, options?: { provider?: string }): Promise<void> {
  const config = loadConfig(cwd);
  const enabledProviders = (config?.providers || getDefaultProviders())
    .filter((p) => p.enabled);

  if (options?.provider) {
    const filtered = enabledProviders.filter((p) => p.name === options.provider);
    if (filtered.length === 0) {
      console.error(`Provider "${options.provider}" is not enabled. Check your config.`);
      process.exit(1);
    }
  }

  const providers: Provider[] = [];
  for (const p of enabledProviders) {
    if (options?.provider && p.name !== options.provider) continue;
    switch (p.name) {
      case 'stripe': providers.push(new StripeProvider()); break;
      case 'openai': providers.push(new OpenAIProvider()); break;
    }
  }

  for (const provider of providers) {
    console.log(`Fetching ${provider.name} changelog...`);
    try {
      const entries = await provider.fetch();
      const classified = classifyEntries(entries);

      const previous = readCache(provider.name);
      const newEntries = previous ? diffEntries(previous.entries, classified) : classified;

      writeCache(provider.name, classified);

      console.log(`  Total entries: ${classified.length}`);
      console.log(`  New entries: ${newEntries.length}`);

      for (const entry of newEntries) {
        const cat = categoryLabel(entry);
        console.log(`  ${cat} ${entry.title}`);
        if (entry.link) console.log(`    → ${entry.link}`);
      }
      console.log('');
    } catch (err) {
      console.error(`  Error fetching ${provider.name}: ${err}`);
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
