import { createGitHubIssue } from '../github.js';
import fs from 'node:fs';
import { ReportData } from '../types.js';

export async function runGithubIssue(
  options: { repo: string; token: string; report: string },
): Promise<void> {
  const { repo: repoFlag, token, report: reportPath } = options;

  const [owner, repo] = repoFlag.split('/');
  if (!owner || !repo) {
    console.error('Invalid repo format. Use "owner/name".');
    process.exit(1);
  }

  if (!fs.existsSync(reportPath)) {
    console.error(`Report file not found: ${reportPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(reportPath, 'utf-8');
  const sourceMatch = content.match(/\*\*Source\*:\s*(\S+)/);
  const sourceTypeMatch = content.match(/\*\*Source\*:\s*\S+\s+\((\S+)\)/);
  const sinceMatch = content.match(/\*\*Period\*:\s*(\S+)\s*~/);
  const untilMatch = content.match(/~\s*(\S+)/);

  const source = sourceMatch?.[1] || 'unknown';
  const sourceType = sourceTypeMatch?.[1] || 'changelog';
  const since = sinceMatch?.[1] || 'unknown';
  const until = untilMatch?.[1] || 'unknown';

  const breakingMatch = content.match(/\|\s*Breaking\s*\|\s*(\d+)\s*\|/);
  const deprecationMatch = content.match(/\|\s*Deprecation\s*\|\s*(\d+)\s*\|/);
  const securityMatch = content.match(/\|\s*Security\s*\|\s*(\d+)\s*\|/);
  const featureMatch = content.match(/\|\s*Feature\s*\|\s*(\d+)\s*\|/);

  const data: ReportData = {
    source,
    sourceType: sourceType as ReportData['sourceType'],
    since,
    until,
    breakingCount: parseInt(breakingMatch?.[1] || '0'),
    deprecationCount: parseInt(deprecationMatch?.[1] || '0'),
    securityCount: parseInt(securityMatch?.[1] || '0'),
    featureCount: parseInt(featureMatch?.[1] || '0'),
    results: [],
  };

  console.log(`Creating GitHub issue in ${owner}/${repo}...`);
  try {
    const url = await createGitHubIssue(owner, repo, token, reportPath, data);
    console.log(`Issue created: ${url}`);
  } catch (err) {
    console.error(`Failed to create issue: ${err}`);
    process.exit(1);
  }
}
