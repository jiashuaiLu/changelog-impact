export type ChangeCategory = 'breaking' | 'deprecation' | 'security' | 'feature';

export type SourceType = 'changelog' | 'github-repo' | 'upstream';

export interface ChangelogEntry {
  title: string;
  date: string;
  link: string;
  category: ChangeCategory;
  summary: string;
  source: string;
  sourceType: SourceType;
  llmSummary?: string;
  llmImpactExplanation?: string;
  llmMigrationSuggestion?: string;
}

export interface ScanHit {
  file: string;
  line: number;
  snippet: string;
  matchedPattern: string;
}

export interface ScanResult {
  entry: ChangelogEntry;
  hits: ScanHit[];
}

export interface ReportData {
  source: string;
  sourceType: SourceType;
  since: string;
  until: string;
  breakingCount: number;
  deprecationCount: number;
  securityCount: number;
  featureCount: number;
  results: ScanResult[];
}

export interface SourceConfig {
  name: string;
  type: SourceType;
  enabled: boolean;
  repo?: string;
  branch?: string;
  packageMapping?: Record<string, string>;
  customFiles?: string[];
}

export interface LLMConfig {
  enabled: boolean;
  provider: 'openai' | 'anthropic' | 'ollama';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens: number;
}

export interface AppConfig {
  sources: SourceConfig[];
  repo: string;
  llm?: LLMConfig;
  scanPatterns?: Record<string, string[]>;
}

export interface CacheEntry {
  source: string;
  fetchedAt: string;
  entries: ChangelogEntry[];
}

export interface GitHubCommit {
  sha: string;
  message: string;
  date: string;
  url: string;
  author: string;
  files?: string[];
}
