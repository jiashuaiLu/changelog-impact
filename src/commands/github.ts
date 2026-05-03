import { createGitHubIssue } from '../github.js';
import { ProgramError } from '../errors.js';
import fs from 'node:fs';
import { ReportData } from '../types.js';

export async function runGithubIssue(
  options: { repo: string; token?: string; report: string },
): Promise<void> {
  const token = options.token || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new ProgramError('GitHub token required. Set GITHUB_TOKEN env var or use --token flag.');
  }

  const [owner, repo] = options.repo.split('/');
  if (!owner || !repo) {
    throw new ProgramError('Invalid repo format. Use "owner/name".');
  }

  if (!fs.existsSync(options.report)) {
    throw new ProgramError(`Report file not found: ${options.report}`);
  }

  const content = fs.readFileSync(options.report, 'utf-8');
  const sourceMatch = content.match(/\*\*Source\*:\s*(\S+)/);
  const sourceTypeMatch = content.match(/\((\S+)\)/);
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
    const url = await createGitHubIssue(owner, repo, token, options.report, data);
    console.log(`Issue created: ${url}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ProgramError(`Failed to create issue: ${msg}`);
  }
}
