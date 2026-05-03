import fs from 'node:fs';
import path from 'node:path';
import { ChangelogEntry, ScanHit, ScanResult } from './types.js';

const STRIPE_PATTERNS = [
  /\bstripe\b/i,
  /\bstripe\./i,
  /\bpaymentIntents?\b/i,
  /\bcharges?\b/i,
  /\bcustomers?\b/i,
  /\bwebhooks?\b/i,
  /\bcheckout\.sessions?\b/i,
  /\bsubscriptions?\b/i,
  /\binvoices?\b/i,
  /\brefunds?\b/i,
  /\bpayment_methods?\b/i,
  /\bsetupIntents?\b/i,
  /\bproducts?\b/i,
  /\bprices?\b/i,
  /\bdisputes?\b/i,
  /\bbalance\b/i,
  /\bpayouts?\b/i,
  /\bStripe\(/i,
  /\bStripe\s*\{/i,
  /api_version/i,
  /stripe\.apiVersion/i,
];

const OPENAI_PATTERNS = [
  /\bopenai\b/i,
  /\bchat\.completions?\b/i,
  /\bcompletions?\b/i,
  /\bembeddings?\b/i,
  /\bfine[- ]?tuning\b/i,
  /\bmoderations?\b/i,
  /\bimages?\.(generations?|edits?|variations?)\b/i,
  /\baudio\.(transcriptions?|translations?)\b/i,
  /\bmodels?\b/i,
  /\bgpt[- ]?4/i,
  /\bgpt[- ]?3\.5/i,
  /\bo1[- ]/i,
  /\btext[- ]?davinci/i,
  /\bada\b/i,
  /\bwhisper\b/i,
  /\bdall[- ]?e\b/i,
  /\bOpenAI\(/i,
  /\bnew\s+OpenAI/i,
  /openai\s*\.\s*\w+/i,
];

const FILE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
]);

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'coverage',
  '.cache', '.turbo', 'vendor', '__pycache__',
]);

function getPatternsForSource(source: string): RegExp[] {
  switch (source) {
    case 'stripe': return STRIPE_PATTERNS;
    case 'openai': return OPENAI_PATTERNS;
    default: return [];
  }
}

function shouldScanFile(filePath: string): boolean {
  const ext = path.extname(filePath);
  return FILE_EXTENSIONS.has(ext);
}

function scanFile(filePath: string, patterns: RegExp[], repoPath: string): ScanHit[] {
  const hits: ScanHit[] = [];
  let content: string;

  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return hits;
  }

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of patterns) {
      if (pattern.test(line)) {
        hits.push({
          file: path.relative(repoPath, filePath),
          line: i + 1,
          snippet: line.trim().slice(0, 200),
          matchedPattern: pattern.source,
        });
        break;
      }
    }
  }

  return hits;
}

function walkDir(dir: string, repoPath: string): string[] {
  const files: string[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        files.push(...walkDir(fullPath, repoPath));
      }
    } else if (entry.isFile() && shouldScanFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

export function scanRepo(
  repoPath: string,
  entries: ChangelogEntry[],
  sourceFilter?: string,
): ScanResult[] {
  const files = walkDir(repoPath, repoPath);
  const results: ScanResult[] = [];

  const sourceNames = new Set<string>();
  for (const entry of entries) {
    sourceNames.add(entry.source);
  }
  if (sourceFilter) {
    sourceNames.clear();
    sourceNames.add(sourceFilter);
  }

  for (const entry of entries) {
    if (!sourceNames.has(entry.source)) continue;

    const patterns = getPatternsForSource(entry.source);
    if (patterns.length === 0) continue;

    const hits: ScanHit[] = [];
    for (const file of files) {
      hits.push(...scanFile(file, patterns, repoPath));
    }

    results.push({ entry, hits });
  }

  return results;
}
