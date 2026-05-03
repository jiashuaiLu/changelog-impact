import { request } from 'undici';
import { parse as parseHtml } from 'node-html-parser';
import { ChangelogEntry } from '../types.js';
import { Provider } from './types.js';

const STRIPE_CHANGELOG_URL = 'https://docs.stripe.com/changelog';

export class StripeProvider implements Provider {
  name = 'stripe';

  async fetch(): Promise<ChangelogEntry[]> {
    const html = await this.fetchPage(STRIPE_CHANGELOG_URL);
    return this.parseChangelog(html);
  }

  private async fetchPage(url: string): Promise<string> {
    const { statusCode, body } = await request(url, {
      headers: {
        'User-Agent': 'changelog-impact/0.1.0',
        Accept: 'text/html',
      },
    });
    if (statusCode !== 200) {
      throw new Error(`Stripe changelog fetch failed: HTTP ${statusCode}`);
    }
    return await body.text();
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
        const summary = article.textContent?.trim().slice(0, 500) || '';

        if (title) {
          entries.push({
            title,
            date,
            link: link.startsWith('http') ? link : `https://docs.stripe.com${link}`,
            category: 'feature',
            summary: summary.slice(0, 300),
            provider: 'stripe',
          });
        }
      }
    }

    if (entries.length === 0) {
      entries.push(...this.fallbackParse(root));
    }

    return entries;
  }

  private fallbackParse(root: ReturnType<typeof parseHtml>): ChangelogEntry[] {
    const entries: ChangelogEntry[] = [];
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
          provider: 'stripe',
        });
      }
    }

    return entries;
  }
}
