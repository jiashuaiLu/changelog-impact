import { parse as parseHtml } from 'node-html-parser';
import { ChangelogEntry } from '../types.js';
import { Source } from './types.js';
import { httpGet, getGitHubAuthHeaders } from '../http.js';

const STRIPE_GITHUB_API = 'https://api.github.com/repos/stripe/stripe-node';

export class StripeSource implements Source {
  name = 'stripe';
  type = 'changelog';

  async fetch(): Promise<ChangelogEntry[]> {
    const releases = await this.fetchGitHubReleases();
    if (releases.length > 0) return releases;

    return await this.fetchChangelogPage();
  }

  private async fetchGitHubReleases(): Promise<ChangelogEntry[]> {
    try {
      const { statusCode, body } = await httpGet(
        `${STRIPE_GITHUB_API}/releases?per_page=30`,
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
        source: 'stripe',
        sourceType: 'changelog' as const,
      }));
    } catch {
      return [];
    }
  }

  private async fetchChangelogPage(): Promise<ChangelogEntry[]> {
    const { statusCode, body } = await httpGet('https://docs.stripe.com/changelog', {
      headers: { Accept: 'text/html' },
    });
    if (statusCode !== 200) {
      throw new Error(`Stripe changelog fetch failed: HTTP ${statusCode}`);
    }
    return this.parseChangelog(body);
  }

  private parseChangelog(html: string): ChangelogEntry[] {
    const root = parseHtml(html);
    const entries: ChangelogEntry[] = [];

    const articles = root.querySelectorAll('article, .changelog-entry, .ListObject, [class*="changelog"]');
    if (articles.length > 0) {
      for (const article of articles) {
        const titleEl = article.querySelector('h2, h3, h4, a[href]');
        const dateEl = article.querySelector('time, [datetime], .date, [class*="date"]');
        const linkEl = article.querySelector('a[href]');

        const title = titleEl?.textContent?.trim() || '';
        const date = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || '';
        const link = linkEl?.getAttribute('href') || '';
        const summary = article.textContent?.trim().slice(0, 300) || '';

        if (title) {
          entries.push({
            title,
            date,
            link: link.startsWith('http') ? link : `https://docs.stripe.com${link}`,
            category: 'feature',
            summary,
            source: 'stripe',
            sourceType: 'changelog',
          });
        }
      }
    }

    if (entries.length === 0) {
      const links = root.querySelectorAll('a[href*="/changelog/"], a[href*="/updates/"]');
      for (const link of links) {
        const title = link.textContent?.trim() || '';
        const href = link.getAttribute('href') || '';
        if (title && href) {
          entries.push({
            title,
            date: '',
            link: href.startsWith('http') ? href : `https://docs.stripe.com${href}`,
            category: 'feature',
            summary: '',
            source: 'stripe',
            sourceType: 'changelog',
          });
        }
      }
    }

    return entries;
  }
}
