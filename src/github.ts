import fs from 'node:fs';
import { ReportData } from './types.js';
import { httpPost } from './http.js';

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

  const { statusCode, body } = await httpPost(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body: content, labels }),
    },
  );

  if (statusCode !== 201) {
    throw new Error(`GitHub API error: HTTP ${statusCode}`);
  }

  const result = JSON.parse(body) as { html_url: string };
  return result.html_url;
}
