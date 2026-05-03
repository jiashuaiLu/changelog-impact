import fs from 'node:fs';
import path from 'node:path';
import { CacheEntry, ChangelogEntry } from './types.js';
import { ensureCacheDir } from './config.js';

export function writeCache(provider: string, entries: ChangelogEntry[]): void {
  const cacheDir = ensureCacheDir();
  const cachePath = path.join(cacheDir, `${provider}.json`);
  const entry: CacheEntry = {
    provider,
    fetchedAt: new Date().toISOString(),
    entries,
  };
  fs.writeFileSync(cachePath, JSON.stringify(entry, null, 2), 'utf-8');
}

export function readCache(provider: string): CacheEntry | null {
  const cacheDir = ensureCacheDir();
  const cachePath = path.join(cacheDir, `${provider}.json`);
  if (!fs.existsSync(cachePath)) return null;
  const raw = fs.readFileSync(cachePath, 'utf-8');
  try {
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

export function diffEntries(previous: ChangelogEntry[], current: ChangelogEntry[]): ChangelogEntry[] {
  const prevLinks = new Set(previous.map((e) => e.link));
  return current.filter((e) => !prevLinks.has(e.link));
}
