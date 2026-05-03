#!/usr/bin/env node

import { Command } from 'commander';
import { runInit } from './commands/init.js';
import { runFetch } from './commands/fetch.js';
import { runScan } from './commands/scan.js';
import { runRun } from './commands/run.js';
import { runGithubIssue } from './commands/github.js';
import { ProgramError, formatError } from './errors.js';

function wrapAction<T>(fn: (opts: T) => Promise<void>) {
  return async (opts: T) => {
    try {
      await fn(opts);
    } catch (err) {
      if (err instanceof ProgramError) {
        console.error(`\nError: ${err.message}`);
        process.exit(err.exitCode);
      }
      console.error(`\nUnexpected error: ${formatError(err)}`);
      process.exit(1);
    }
  };
}

const program = new Command();

program
  .name('changelog-impact')
  .description('Track upstream changes. Find impacted code. Generate upgrade issues. LLM-powered impact analysis.')
  .version('0.2.0');

program
  .command('init')
  .description('Create a changelog-impact.yaml config file')
  .action(wrapAction(() => {
    runInit(process.cwd());
    return Promise.resolve();
  }));

program
  .command('fetch')
  .description('Fetch changelog entries from configured sources')
  .option('-s, --source <name>', 'Only fetch a specific source')
  .action(wrapAction(async (opts: { source?: string }) => {
    await runFetch(process.cwd(), { source: opts.source });
  }));

program
  .command('scan')
  .description('Scan repo for impacted code using cached changelog data')
  .option('-r, --repo <path>', 'Path to the repo to scan', '.')
  .option('-s, --source <name>', 'Only scan for a specific source')
  .option('--since <date>', 'Only consider changes since this date (YYYY-MM-DD). Default: 30 days ago')
  .action(wrapAction(async (opts: { repo?: string; source?: string; since?: string }) => {
    await runScan(process.cwd(), {
      repo: opts.repo,
      source: opts.source,
      since: opts.since,
    });
  }));

program
  .command('run')
  .description('Fetch changelog + scan repo + generate report (all-in-one)')
  .option('-r, --repo <path>', 'Path to the repo to scan', '.')
  .option('-s, --source <name>', 'Only process a specific source')
  .option('--since <date>', 'Only consider changes since this date (YYYY-MM-DD). Default: 30 days ago')
  .action(wrapAction(async (opts: { repo?: string; source?: string; since?: string }) => {
    await runRun(process.cwd(), {
      repo: opts.repo,
      source: opts.source,
      since: opts.since,
    });
  }));

program
  .command('github')
  .description('GitHub integration commands')
  .addCommand(
    new Command('issue')
      .description('Create a GitHub issue from a report file')
      .requiredOption('--repo <owner/name>', 'GitHub repo in owner/name format')
      .option('--token <token>', 'GitHub token (or set GITHUB_TOKEN env var)')
      .requiredOption('--report <path>', 'Path to the report markdown file')
      .action(wrapAction(async (opts: { repo: string; token?: string; report: string }) => {
        await runGithubIssue({
          repo: opts.repo,
          token: opts.token,
          report: opts.report,
        });
      })),
  );

program.exitOverride();
program.parse();
