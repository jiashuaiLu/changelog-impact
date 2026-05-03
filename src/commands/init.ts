import fs from 'node:fs';
import path from 'node:path';
import { saveConfig, getDefaultSources, getDefaultLLM } from '../config.js';
import { AppConfig } from '../types.js';

export function runInit(cwd: string): void {
  const configPath = path.join(cwd, 'changelog-impact.yaml');

  if (fs.existsSync(configPath)) {
    console.log(`Config file already exists: ${configPath}`);
    return;
  }

  const config: AppConfig = {
    sources: getDefaultSources(),
    repo: '.',
    llm: getDefaultLLM(),
  };

  saveConfig(cwd, config);
  console.log(`Created config file: ${configPath}`);
  console.log('');
  console.log('To enable LLM features, set llm.enabled to true and add your OPENAI_API_KEY.');
  console.log('To add custom GitHub repos, add sources with type "github-repo".');
}
