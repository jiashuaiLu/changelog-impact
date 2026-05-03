import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import yaml from 'js-yaml';
import { AppConfig, ProviderConfig } from './types.js';

const CONFIG_FILENAME = 'changelog-impact.yaml';
const CACHE_DIR = path.join(os.homedir(), '.changelog-impact', 'cache');

const DEFAULT_PROVIDERS: ProviderConfig[] = [
  { name: 'stripe', enabled: true },
  { name: 'openai', enabled: true },
];

export function getDefaultProviders(): ProviderConfig[] {
  return DEFAULT_PROVIDERS;
}

export function loadConfig(cwd: string): AppConfig | null {
  const configPath = path.join(cwd, CONFIG_FILENAME);
  if (!fs.existsSync(configPath)) return null;
  const raw = fs.readFileSync(configPath, 'utf-8');
  return yaml.load(raw) as AppConfig;
}

export function saveConfig(cwd: string, config: AppConfig): void {
  const configPath = path.join(cwd, CONFIG_FILENAME);
  const content = yaml.dump(config, { lineWidth: 120 });
  fs.writeFileSync(configPath, content, 'utf-8');
}

export function resolveRepoPath(repoFlag: string | undefined, cwd: string): string {
  return repoFlag ? path.resolve(repoFlag) : cwd;
}

export function ensureCacheDir(): string {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  return CACHE_DIR;
}

export function getCacheDir(): string {
  return CACHE_DIR;
}

export function ensureReportsDir(repoPath: string): string {
  const reportsDir = path.join(repoPath, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  return reportsDir;
}
