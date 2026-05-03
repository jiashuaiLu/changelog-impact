import { ChangelogEntry, GitHubCommit } from '../types.js';
import { Source } from './types.js';
import { httpGet, getGitHubAuthHeaders } from '../http.js';

export class GitHubRepoSource implements Source {
  name: string;
  type = 'github-repo';
  private owner: string;
  private repo: string;
  private branch: string;

  constructor(name: string, repo: string, branch: string = 'main') {
    this.name = name;
    const parts = repo.split('/');
    if (parts.length !== 2) {
      throw new Error(`Invalid repo format: ${repo}. Expected "owner/name".`);
    }
    this.owner = parts[0];
    this.repo = parts[1];
    this.branch = branch;
  }

  async fetch(): Promise<ChangelogEntry[]> {
    const releases = await this.fetchReleases();
    if (releases.length > 0) return releases;

    return await this.fetchCommits();
  }

  private async fetchReleases(): Promise<ChangelogEntry[]> {
    try {
      const { statusCode, body } = await httpGet(
        `https://api.github.com/repos/${this.owner}/${this.repo}/releases?per_page=30`,
        { headers: getGitHubAuthHeaders() },
      );
      if (statusCode !== 200) return [];

      const releases = JSON.parse(body) as Array<{
        tag_name: string;
        name: string;
        body: string;
        html_url: string;
        published_at: string;
      }>;

      return releases.map((r) => ({
        title: r.name || r.tag_name,
        date: r.published_at?.slice(0, 10) || '',
        link: r.html_url,
        category: 'feature' as const,
        summary: (r.body || '').slice(0, 300),
        source: this.name,
        sourceType: 'github-repo' as const,
      }));
    } catch {
      return [];
    }
  }

  private async fetchCommits(): Promise<ChangelogEntry[]> {
    const { statusCode, body } = await httpGet(
      `https://api.github.com/repos/${this.owner}/${this.repo}/commits?sha=${this.branch}&per_page=30`,
      { headers: getGitHubAuthHeaders() },
    );
    if (statusCode !== 200) {
      throw new Error(`GitHub commits fetch failed for ${this.owner}/${this.repo}: HTTP ${statusCode}`);
    }

    const commits = JSON.parse(body) as GitHubCommit[];

    return commits.map((c) => {
      const lines = c.message.split('\n');
      const title = lines[0];
      const bodyText = lines.slice(1).join('\n').trim();

      return {
        title,
        date: c.date?.slice(0, 10) || '',
        link: c.url,
        category: 'feature' as const,
        summary: bodyText.slice(0, 300) || title,
        source: this.name,
        sourceType: 'github-repo' as const,
      };
    });
  }
}
