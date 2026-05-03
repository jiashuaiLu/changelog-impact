import { ChangeCategory, ChangelogEntry } from './types.js';

const BREAKING_KEYWORDS = [
  'breaking change',
  'breaking',
  'removed',
  'removal',
  'no longer supported',
  'no longer available',
  'unsupported',
  'mandatory',
  'required migration',
  'must update',
  'incompatible',
];

const DEPRECATION_KEYWORDS = [
  'deprecat',
  'sunset',
  'end of life',
  'end-of-life',
  'eol',
  'will be removed',
  'will be deprecated',
  'no longer recommended',
  'planned removal',
];

const SECURITY_KEYWORDS = [
  'security',
  'vulnerability',
  'cve',
  'exploit',
  'patch',
  'advisory',
  'authentication bypass',
  'privilege escalation',
];

export function classifyEntry(title: string, summary: string): ChangeCategory {
  const text = `${title} ${summary}`.toLowerCase();

  for (const kw of DEPRECATION_KEYWORDS) {
    if (text.includes(kw)) return 'deprecation';
  }
  for (const kw of SECURITY_KEYWORDS) {
    if (text.includes(kw)) return 'security';
  }
  for (const kw of BREAKING_KEYWORDS) {
    if (text.includes(kw)) return 'breaking';
  }

  return 'feature';
}

export function classifyEntries(entries: ChangelogEntry[]): ChangelogEntry[] {
  return entries.map((entry) => ({
    ...entry,
    category: classifyEntry(entry.title, entry.summary),
  }));
}
