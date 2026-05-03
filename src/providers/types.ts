import { ChangelogEntry } from '../types.js';

export interface Provider {
  name: string;
  fetch(): Promise<ChangelogEntry[]>;
}
