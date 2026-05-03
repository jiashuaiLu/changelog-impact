import { describe, it, expect } from 'vitest';
import { scanRepo } from '../src/scanner.js';
import { ChangelogEntry } from '../src/types.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function createTempRepo(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'changelog-impact-test-'));
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(dir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  return dir;
}

describe('scanner', () => {
  it('detects Stripe patterns in TS files', () => {
    const repoDir = createTempRepo({
      'src/payment.ts': `
        import Stripe from 'stripe';
        const stripe = new Stripe('sk_test');
        const paymentIntent = await stripe.paymentIntents.create({ amount: 1000 });
      `,
    });

    const entries: ChangelogEntry[] = [
      { title: 'Stripe API update', date: '2026-01-01', link: 'https://example.com', category: 'breaking', summary: 'paymentIntents changed', source: 'stripe', sourceType: 'changelog' },
    ];

    const results = scanRepo(repoDir, entries, 'stripe');
    expect(results.length).toBe(1);
    expect(results[0].hits.length).toBeGreaterThan(0);
    expect(results[0].hits.some((h) => h.snippet.includes('stripe'))).toBe(true);

    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  it('detects OpenAI patterns in TS files', () => {
    const repoDir = createTempRepo({
      'src/ai.ts': `
        import OpenAI from 'openai';
        const openai = new OpenAI();
        const completion = await openai.chat.completions.create({ model: 'gpt-4' });
      `,
    });

    const entries: ChangelogEntry[] = [
      { title: 'OpenAI model update', date: '2026-01-01', link: 'https://example.com', category: 'deprecation', summary: 'gpt-4 deprecated', source: 'openai', sourceType: 'changelog' },
    ];

    const results = scanRepo(repoDir, entries, 'openai');
    expect(results.length).toBe(1);
    expect(results[0].hits.length).toBeGreaterThan(0);

    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  it('ignores node_modules and other directories', () => {
    const repoDir = createTempRepo({
      'node_modules/stripe/index.js': 'const stripe = require("stripe");',
      'dist/bundle.js': 'const stripe = new Stripe();',
      'src/app.ts': 'const stripe = new Stripe();',
    });

    const entries: ChangelogEntry[] = [
      { title: 'Stripe update', date: '2026-01-01', link: '', category: 'feature', summary: '', source: 'stripe', sourceType: 'changelog' },
    ];

    const results = scanRepo(repoDir, entries, 'stripe');
    const files = results[0].hits.map((h) => h.file);
    expect(files.some((f) => f.includes('node_modules'))).toBe(false);
    expect(files.some((f) => f.includes('dist'))).toBe(false);
    expect(files.some((f) => f.includes('src'))).toBe(true);

    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  it('returns empty hits when no patterns match', () => {
    const repoDir = createTempRepo({
      'src/utils.ts': 'export function add(a: number, b: number) { return a + b; }',
    });

    const entries: ChangelogEntry[] = [
      { title: 'Stripe update', date: '2026-01-01', link: '', category: 'feature', summary: '', source: 'stripe', sourceType: 'changelog' },
    ];

    const results = scanRepo(repoDir, entries, 'stripe');
    expect(results.length).toBe(1);
    expect(results[0].hits.length).toBe(0);

    fs.rmSync(repoDir, { recursive: true, force: true });
  });
});
