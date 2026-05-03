export type ChangeCategory = 'breaking' | 'deprecation' | 'security' | 'feature';

export interface ChangelogEntry {
  title: string;
  date: string;
  link: string;
  category: ChangeCategory;
  summary: string;
  provider: string;
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
  provider: string;
  since: string;
  until: string;
  breakingCount: number;
  deprecationCount: number;
  securityCount: number;
  featureCount: number;
  results: ScanResult[];
}

export interface ProviderConfig {
  name: string;
  enabled: boolean;
}

export interface AppConfig {
  providers: ProviderConfig[];
  repo: string;
  scanPatterns?: Record<string, string[]>;
}

export interface CacheEntry {
  provider: string;
  fetchedAt: string;
  entries: ChangelogEntry[];
}
