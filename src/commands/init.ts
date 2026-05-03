import fs from 'node:fs';
import path from 'node:path';
import { saveConfig, getDefaultProviders } from '../config.js';
import { AppConfig } from '../types.js';

export function runInit(cwd: string): void {
  const configPath = path.join(cwd, 'changelog-impact.yaml');

  if (fs.existsSync(configPath)) {
    console.log(`Config file already exists: ${configPath}`);
    return;
  }

  const config: AppConfig = {
    providers: getDefaultProviders(),
    repo: '.',
  };

  saveConfig(cwd, config);
  console.log(`Created config file: ${configPath}`);
  console.log('');
  console.log('Edit it to customize providers and scan patterns.');
}
