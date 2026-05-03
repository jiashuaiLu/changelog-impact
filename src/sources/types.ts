import { ChangelogEntry } from '../types.js';

export interface Source {
  name: string;
  type: string;
  fetch(): Promise<ChangelogEntry[]>;
}
