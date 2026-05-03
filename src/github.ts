import { request } from 'undici';
import fs from 'node:fs';
import { ReportData } from './types.js';

export async function createGitHubIssue(
  owner: string,
  repo: string,
  token: string,
  reportPath: string,
  data: ReportData,
): Promise<string> {
  const content = fs.readFileSync(reportPath, 'utf-8');
  const title = `[changelog-impact] ${data.source} changes (${data.since} ~ ${data.until}) — ${data.breakingCount + data.deprecationCount} action items`;

  const labels = ['changelog-impact'];
  if (data.breakingCount > 0) labels.push('breaking-change');
  if (data.deprecationCount > 0) labels.push('deprecation');
  if (data.securityCount > 0) labels.push('security');

  const body = content;

  const { statusCode, body: respBody } = await request(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'changelog-impact/0.1.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body, labels }),
    },
  );

  if (statusCode !== 201) {
    const text = await respBody.text();
    throw new Error(`GitHub API error: HTTP ${statusCode} — ${text}`);
  }

  const result = await respBody.json() as { html_url: string };
  return result.html_url;
}
