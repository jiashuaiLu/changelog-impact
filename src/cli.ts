#!/usr/bin/env node

import { Command } from 'commander';
import { runInit } from './commands/init.js';
import { runFetch } from './commands/fetch.js';
import { runScan } from './commands/scan.js';
import { runRun } from './commands/run.js';
import { runGithubIssue } from './commands/github.js';

const program = new Command();

program
  .name('changelog-impact')
  .description('Track upstream changes. Find impacted code. Generate upgrade issues. LLM-powered impact analysis.')
  .version('0.2.0');

program
  .command('init')
  .description('Create a changelog-impact.yaml config file')
  .action(() => {
    runInit(process.cwd());
  });

program
  .command('fetch')
  .description('Fetch changelog entries from configured sources')
  .option('-s, --source <name>', 'Only fetch a specific source')
  .action(async (opts) => {
    await runFetch(process.cwd(), { source: opts.source });
  });

program
  .command('scan')
  .description('Scan repo for impacted code using cached changelog data')
  .option('-r, --repo <path>', 'Path to the repo to scan', '.')
  .option('-s, --source <name>', 'Only scan for a specific source')
  .option('--since <date>', 'Only consider changes since this date (YYYY-MM-DD)')
  .action(async (opts) => {
    await runScan(process.cwd(), {
      repo: opts.repo,
      source: opts.source,
      since: opts.since,
    });
  });

program
  .command('run')
  .description('Fetch changelog + scan repo + generate report (all-in-one)')
  .option('-r, --repo <path>', 'Path to the repo to scan', '.')
  .option('-s, --source <name>', 'Only process a specific source')
  .option('--since <date>', 'Only consider changes since this date (YYYY-MM-DD)')
  .action(async (opts) => {
    await runRun(process.cwd(), {
      repo: opts.repo,
      source: opts.source,
      since: opts.since,
    });
  });

program
  .command('github')
  .description('GitHub integration commands')
  .addCommand(
    new Command('issue')
      .description('Create a GitHub issue from a report file')
      .requiredOption('--repo <owner/name>', 'GitHub repo in owner/name format')
      .requiredOption('--token <token>', 'GitHub personal access token')
      .requiredOption('--report <path>', 'Path to the report markdown file')
      .action(async (opts) => {
        await runGithubIssue({
          repo: opts.repo,
          token: opts.token,
          report: opts.report,
        });
      }),
  );

program.parse();
