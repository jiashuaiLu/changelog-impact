import { request } from 'undici';
import { LLMConfig, ChangeCategory, ChangelogEntry, ScanHit } from './types.js';

const DEFAULT_CONFIG: LLMConfig = {
  enabled: false,
  provider: 'openai',
  model: 'gpt-4o-mini',
  maxTokens: 1024,
};

export function resolveLLMConfig(config?: LLMConfig): LLMConfig | null {
  if (!config || !config.enabled) return null;
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const baseUrl = config.baseUrl || process.env.OPENAI_BASE_URL;
  return { ...DEFAULT_CONFIG, ...config, apiKey, baseUrl };
}

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  content: string;
}

async function callOpenAI(
  messages: LLMMessage[],
  config: LLMConfig,
): Promise<string> {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  const { statusCode, body } = await request(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens,
      temperature: 0.1,
    }),
  });

  if (statusCode !== 200) {
    const text = await body.text();
    throw new Error(`LLM API error: HTTP ${statusCode} — ${text}`);
  }

  const result = await body.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  return result.choices[0]?.message?.content || '';
}

async function callOllama(
  messages: LLMMessage[],
  config: LLMConfig,
): Promise<string> {
  const baseUrl = config.baseUrl || 'http://localhost:11434';
  const { statusCode, body } = await request(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: false,
    }),
  });

  if (statusCode !== 200) {
    const text = await body.text();
    throw new Error(`Ollama API error: HTTP ${statusCode} — ${text}`);
  }

  const result = await body.json() as { message: { content: string } };
  return result.message?.content || '';
}

async function callLLM(
  messages: LLMMessage[],
  config: LLMConfig,
): Promise<string> {
  switch (config.provider) {
    case 'ollama':
      return callOllama(messages, config);
    case 'openai':
    case 'anthropic':
    default:
      return callOpenAI(messages, config);
  }
}

export async function classifyWithLLM(
  title: string,
  summary: string,
  config: LLMConfig,
): Promise<ChangeCategory> {
  const prompt = `Classify this software changelog entry into exactly one category.

Title: ${title}
Summary: ${summary}

Categories:
- breaking: Breaking changes that require code modifications
- deprecation: Features being deprecated or scheduled for removal
- security: Security fixes or vulnerability patches
- feature: New features, improvements, or non-breaking changes

Respond with ONLY one word: breaking, deprecation, security, or feature`;

  try {
    const result = await callLLM(
      [{ role: 'user', content: prompt }],
      config,
    );
    const cleaned = result.trim().toLowerCase();
    if (['breaking', 'deprecation', 'security', 'feature'].includes(cleaned)) {
      return cleaned as ChangeCategory;
    }
    return 'feature';
  } catch {
    return 'feature';
  }
}

export async function summarizeWithLLM(
  title: string,
  summary: string,
  config: LLMConfig,
): Promise<string> {
  const prompt = `Summarize this changelog entry in 1-2 concise sentences, focusing on what changed and what developers need to know.

Title: ${title}
Summary: ${summary}

Respond with only the summary, no labels or prefixes.`;

  try {
    const result = await callLLM(
      [{ role: 'user', content: prompt }],
      config,
    );
    return result.trim();
  } catch {
    return '';
  }
}

export async function explainImpactWithLLM(
  entry: ChangelogEntry,
  hits: ScanHit[],
  config: LLMConfig,
): Promise<string> {
  const hitSummary = hits
    .slice(0, 10)
    .map((h) => `- ${h.file}:${h.line}: ${h.snippet}`)
    .join('\n');

  const prompt = `A changelog entry was detected, and the following code locations in the user's repo were matched.

Changelog entry:
Title: ${entry.title}
Category: ${entry.category}
Summary: ${entry.summary}

Matched code locations:
${hitSummary}

Explain in 2-3 sentences:
1. Why this change affects the user's code
2. What specific risk or issue it causes
3. What the developer should check first

Respond with only the explanation, no labels or prefixes.`;

  try {
    const result = await callLLM(
      [{ role: 'user', content: prompt }],
      config,
    );
    return result.trim();
  } catch {
    return '';
  }
}

export async function suggestMigrationWithLLM(
  entry: ChangelogEntry,
  hits: ScanHit[],
  config: LLMConfig,
): Promise<string> {
  const hitSummary = hits
    .slice(0, 10)
    .map((h) => `- ${h.file}:${h.line}: ${h.snippet}`)
    .join('\n');

  const prompt = `Given this changelog entry and the affected code, provide 3-5 specific migration steps.

Changelog entry:
Title: ${entry.title}
Category: ${entry.category}
Summary: ${entry.summary}
Link: ${entry.link}

Affected code:
${hitSummary}

Provide numbered, actionable steps. Be specific about what to change in the code.
Respond with only the steps, one per line, numbered.`;

  try {
    const result = await callLLM(
      [{ role: 'user', content: prompt }],
      config,
    );
    return result.trim();
  } catch {
    return '';
  }
}

export async function enrichEntriesWithLLM(
  entries: ChangelogEntry[],
  config: LLMConfig,
): Promise<ChangelogEntry[]> {
  const results: ChangelogEntry[] = [];

  for (const entry of entries) {
    const [category, summary] = await Promise.all([
      classifyWithLLM(entry.title, entry.summary, config),
      summarizeWithLLM(entry.title, entry.summary, config),
    ]);

    results.push({
      ...entry,
      category,
      llmSummary: summary || undefined,
    });
  }

  return results;
}

export async function enrichScanResultsWithLLM(
  results: Array<{ entry: ChangelogEntry; hits: ScanHit[] }>,
  config: LLMConfig,
): Promise<Array<{ entry: ChangelogEntry; hits: ScanHit[] }>> {
  const enriched: Array<{ entry: ChangelogEntry; hits: ScanHit[] }> = [];

  for (const result of results) {
    if (result.hits.length === 0) {
      enriched.push(result);
      continue;
    }

    const [impactExplanation, migrationSuggestion] = await Promise.all([
      explainImpactWithLLM(result.entry, result.hits, config),
      suggestMigrationWithLLM(result.entry, result.hits, config),
    ]);

    enriched.push({
      entry: {
        ...result.entry,
        llmImpactExplanation: impactExplanation || undefined,
        llmMigrationSuggestion: migrationSuggestion || undefined,
      },
      hits: result.hits,
    });
  }

  return enriched;
}
