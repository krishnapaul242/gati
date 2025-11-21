/**
 * @module cli/commands/timescape
 * @description Timescape Versioning System CLI commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { resolve } from 'path';
// @ts-ignore - Imports are valid after build
import { SQLiteTimelineStore, JSONTimelineStore } from '@gati-framework/runtime/timescape/timeline-store';
// @ts-ignore
import type { ChangeLogItem } from '@gati-framework/runtime/timescape/types';

export const timescapeCommand = new Command('ts')
    .description('Manage Timescape Versioning System')
    .alias('timescape');

// Log Command
timescapeCommand
    .command('log')
    .description('View change history')
    .option('-n, --limit <number>', 'Limit number of entries', '10')
    .action(async (options) => {
        console.log('DEBUG: Executing log command');
        console.log(chalk.bold.cyan('\n🕰️  Timescape History\n'));

        const dbPath = resolve(process.cwd(), '.gati/timeline.db');
        const jsonPath = resolve(process.cwd(), '.gati/timeline.json');
        let store;

        try {
            if (existsSync(dbPath)) {
                store = new SQLiteTimelineStore(dbPath);
            } else if (existsSync(jsonPath)) {
                store = new JSONTimelineStore(jsonPath);
            } else {
                console.log(chalk.yellow('No Timescape history found.'));
                return;
            }

            const limit = parseInt(options.limit, 10);
            // We need to implement a query method with limit in TimelineStore, 
            // but for now we can use query() which returns recent items.
            // Assuming query() returns items in reverse chronological order (newest first)
            const items = await store.query({ limit });

        } catch (error) {
            console.error(chalk.red('Failed to read history:'), error);
        }
    });

// Diff Command
timescapeCommand
    .command('diff')
    .description('Show details of a specific change')
    .argument('<id>', 'Change ID')
    .action(async (id) => {
        console.log(chalk.bold.cyan(`\n🔍 Timescape Diff: ${id}\n`));

        const dbPath = resolve(process.cwd(), '.gati/timeline.db');
        const jsonPath = resolve(process.cwd(), '.gati/timeline.json');
        let store;

        try {
            if (existsSync(dbPath)) {
                store = new SQLiteTimelineStore(dbPath);
            } else if (existsSync(jsonPath)) {
                store = new JSONTimelineStore(jsonPath);
            } else {
                console.log(chalk.yellow('No Timescape history found.'));
                return;
            }

            // We need a way to get a single item. 
            // Since TimelineStore interface doesn't have getById, we might need to query.
            // For now, let's fetch recent items and find it, or implement getById in store.
            // Optimization: In a real app, we'd add getById to the store.
            // For this demo, we'll just scan recent items.
            const items = await store.query({ limit: 100 });
            const item = items.find((i: ChangeLogItem) => i.id === id);

            if (!item) {
                console.error(chalk.red(`Change ${id} not found (checked last 100 items).`));
                return;
            }

            console.log(chalk.bold(`Artifact: ${item.artifactId} (${item.type})`));
            console.log(chalk.gray(`Version:  ${item.version}`));

            if (item.changes && item.changes.length > 0) {
                console.log(chalk.bold('\nChanges:'));
                item.changes.forEach((change: any) => {
                    const opColor = change.op === 'add' ? chalk.green : change.op === 'remove' ? chalk.red : chalk.yellow;
                    console.log(opColor(`  ${change.op.toUpperCase()} ${change.path}`));
                    if (change.value !== undefined) {
                        console.log(chalk.gray(`    Value: ${JSON.stringify(change.value)}`));
                    }
                    if (change.oldValue !== undefined) {
                        console.log(chalk.gray(`    Old:   ${JSON.stringify(change.oldValue)}`));
                    }
                });
            } else {
                console.log(chalk.gray('No structural changes recorded.'));
            }

        } catch (error) {
            console.error(chalk.red('Failed to read diff:'), error);
        }
    });
