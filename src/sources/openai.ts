import { request } from 'undici';
import { ChangelogEntry } from '../types.js';
import { Source } from './types.js';

const GITHUB_API_BASE = 'https://api.github.com/repos/openai/openai-node';

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
}

export class OpenAISource implements Source {
  name = 'openai';
  type = 'changelog';

  async fetch(): Promise<ChangelogEntry[]> {
    const releases = await this.fetchGitHubReleases();
    return this.parseReleases(releases);
  }

  private async fetchGitHubReleases(): Promise<GitHubRelease[]> {
    const { statusCode, body } = await request(`${GITHUB_API_BASE}/releases?per_page=30`, {
      headers: {
        'User-Agent': 'changelog-impact/0.2.0',
        Accept: 'application/vnd.github+json',
      },
    });
    if (statusCode !== 200) {
      throw new Error(`OpenAI GitHub releases fetch failed: HTTP ${statusCode}`);
    }
    return await body.json() as GitHubRelease[];
  }

  private parseReleases(releases: GitHubRelease[]): ChangelogEntry[] {
    const entries: ChangelogEntry[] = [];

    for (const release of releases) {
      const title = release.name || release.tag_name;
      const date = release.published_at?.slice(0, 10) || '';
      const link = release.html_url;
      const bodyLines = (release.body || '').split('\n').filter((l: string) => l.trim());

      const features: string[] = [];
      const apiChanges: string[] = [];

      let currentSection = '';
      for (const line of bodyLines) {
        const trimmed = line.trim();
        if (/^#{1,3}\s+features/i.test(trimmed)) {
          currentSection = 'features';
          continue;
        }
        if (/^#{1,3}\s+(api|breaking|deprecat|bug|fix)/i.test(trimmed)) {
          currentSection = 'api';
          continue;
        }
        if (/^#{1,3}\s/.test(trimmed)) {
          currentSection = '';
          continue;
        }
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          if (currentSection === 'api') {
            apiChanges.push(trimmed.slice(2));
          } else {
            features.push(trimmed.slice(2));
          }
        }
      }

      const summaryParts = [...apiChanges, ...features].slice(0, 5);
      const summary = summaryParts.length > 0
        ? summaryParts.join('; ')
        : bodyLines.slice(0, 3).join(' ').slice(0, 300);

      entries.push({
        title,
        date,
        link,
        category: 'feature',
        summary,
        source: 'openai',
        sourceType: 'changelog',
      });
    }

    return entries;
  }
}
