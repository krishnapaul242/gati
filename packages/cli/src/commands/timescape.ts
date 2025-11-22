/**
 * @module cli/commands/timescape
 * @description Timescape Versioning System CLI commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { resolve } from 'path';
// @ts-expect-error - Imports are valid after build
import { SQLiteTimelineStore, JSONTimelineStore } from '@gati-framework/runtime/timescape/timeline-store';
// @ts-expect-error - Imports are valid after build
import type { ChangeLogItem } from '@gati-framework/runtime/timescape/types';
// @ts-expect-error - Imports are valid after build
import { VersionRegistry } from '@gati-framework/runtime/timescape/registry';
// @ts-expect-error - Imports are valid after build
import type { TSV, VersionStatus, VersionInfo } from '@gati-framework/runtime/timescape/types';

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
            const _items = await store.query({ limit });

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

// Helper function to load registry
function loadRegistry(): VersionRegistry {
    const registryPath = resolve(process.cwd(), '.gati/timescape/registry.json');
    
    if (!existsSync(registryPath)) {
        throw new Error('No Timescape registry found. Run your application first to create versions.');
    }
    
    const registry = new VersionRegistry();
    registry.deserialize(registryPath);
    return registry;
}

// Helper function to save registry
function saveRegistry(registry: VersionRegistry): void {
    const registryPath = resolve(process.cwd(), '.gati/timescape/registry.json');
    registry.serialize(registryPath);
}

// Helper function to format timestamp
function formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toISOString();
}

// Helper function to format status with color
function formatStatus(status: VersionStatus): string {
    switch (status) {
        case 'hot':
            return chalk.red.bold('HOT');
        case 'warm':
            return chalk.yellow.bold('WARM');
        case 'cold':
            return chalk.blue.bold('COLD');
        case 'deactivated':
            return chalk.gray('DEACTIVATED');
        default:
            return chalk.white(status);
    }
}

// List Command - List all versions
timescapeCommand
    .command('list')
    .description('List all versions')
    .option('-h, --handler <path>', 'Filter by handler path')
    .option('-s, --status <status>', 'Filter by status (hot/warm/cold/deactivated)')
    .option('--tags', 'Show tags for each version')
    .action(async (options) => {
        console.log(chalk.bold.cyan('\n📋 Timescape Versions\n'));
        
        try {
            const registry = loadRegistry();
            const handlers = options.handler 
                ? [options.handler] 
                : registry.getAllHandlers();
            
            if (handlers.length === 0) {
                console.log(chalk.yellow('No versions found.'));
                return;
            }
            
            for (const handlerPath of handlers) {
                const versions = registry.getVersions(handlerPath);
                
                if (!versions || versions.length === 0) {
                    continue;
                }
                
                console.log(chalk.bold.white(`\n${handlerPath}`));
                console.log(chalk.gray('─'.repeat(80)));
                
                for (const version of versions) {
                    // Filter by status if specified
                    if (options.status && version.status !== options.status) {
                        continue;
                    }
                    
                    const status = formatStatus(version.status);
                    const timestamp = formatTimestamp(version.timestamp);
                    const requests = version.requestCount.toString().padStart(6);
                    const lastAccessed = version.lastAccessed 
                        ? formatTimestamp(version.lastAccessed)
                        : 'Never';
                    
                    console.log(`${status} ${chalk.cyan(version.tsv)}`);
                    console.log(`     Created: ${chalk.gray(timestamp)}`);
                    console.log(`     Requests: ${chalk.white(requests)} | Last accessed: ${chalk.gray(lastAccessed)}`);
                    
                    if (version.dbSchemaVersion) {
                        console.log(`     DB Schema: ${chalk.magenta(version.dbSchemaVersion)}`);
                    }
                    
                    if (options.tags && version.tags.length > 0) {
                        console.log(`     Tags: ${version.tags.map((t: string) => chalk.green(t)).join(', ')}`);
                    }
                    
                    console.log('');
                }
            }
            
            // Summary
            const stats = registry.getUsageStatistics();
            console.log(chalk.gray('─'.repeat(80)));
            console.log(chalk.bold('Summary:'));
            console.log(`  Total versions: ${chalk.white(stats.totalVersions)}`);
            console.log(`  Hot: ${chalk.red(stats.hotVersions)} | Warm: ${chalk.yellow(stats.warmVersions)} | Cold: ${chalk.blue(stats.coldVersions)} | Deactivated: ${chalk.gray(stats.deactivatedVersions)}`);
            console.log('');
            
        } catch (error: any) {
            console.error(chalk.red('Failed to list versions:'), error.message);
            process.exit(1);
        }
    });

// Status Command - Show detailed status of a version
timescapeCommand
    .command('status')
    .description('Show detailed status of a version')
    .argument('<version>', 'Version identifier (TSV, tag, or timestamp)')
    .option('-h, --handler <path>', 'Handler path (required for tags/timestamps)')
    .action(async (versionId, options) => {
        console.log(chalk.bold.cyan(`\n📊 Version Status: ${versionId}\n`));
        
        try {
            const registry = loadRegistry();
            let tsv: TSV | undefined;
            let handlerPath: string | undefined;
            
            // Try to resolve version
            if (versionId.startsWith('tsv:')) {
                // Direct TSV
                tsv = versionId as TSV;
                // Find handler for this TSV
                for (const handler of registry.getAllHandlers()) {
                    const versions = registry.getVersions(handler);
                    if (versions.some((v: VersionInfo) => v.tsv === tsv)) {
                        handlerPath = handler;
                        break;
                    }
                }
            } else if (options.handler) {
                // Tag or timestamp with handler
                handlerPath = options.handler;
                
                // Try as tag first
                tsv = registry.getVersionByTag(handlerPath, versionId);
                
                // If not found, try as timestamp
                if (!tsv && versionId.includes('T')) {
                    const timestamp = Date.parse(versionId);
                    if (!isNaN(timestamp)) {
                        tsv = registry.getVersionAt(handlerPath, timestamp);
                    }
                }
            } else {
                console.error(chalk.red('Error: --handler is required for tags and timestamps'));
                process.exit(1);
            }
            
            if (!tsv || !handlerPath) {
                console.error(chalk.red(`Version not found: ${versionId}`));
                process.exit(1);
            }
            
            const info = registry.getVersionInfo(handlerPath, tsv);
            
            if (!info) {
                console.error(chalk.red(`Version info not found: ${tsv}`));
                process.exit(1);
            }
            
            // Display version info
            console.log(chalk.bold('Version:'), chalk.cyan(info.tsv));
            console.log(chalk.bold('Handler:'), chalk.white(handlerPath));
            console.log(chalk.bold('Status:'), formatStatus(info.status));
            console.log(chalk.bold('Created:'), chalk.gray(formatTimestamp(info.timestamp)));
            console.log(chalk.bold('Hash:'), chalk.gray(info.hash));
            console.log(chalk.bold('Requests:'), chalk.white(info.requestCount));
            
            if (info.lastAccessed) {
                console.log(chalk.bold('Last Accessed:'), chalk.gray(formatTimestamp(info.lastAccessed)));
            }
            
            if (info.dbSchemaVersion) {
                console.log(chalk.bold('DB Schema:'), chalk.magenta(info.dbSchemaVersion));
            }
            
            if (info.tags.length > 0) {
                console.log(chalk.bold('Tags:'), info.tags.map((t: string) => chalk.green(t)).join(', '));
            }
            
            console.log('');
            
        } catch (error: any) {
            console.error(chalk.red('Failed to get version status:'), error.message);
            process.exit(1);
        }
    });

// Deactivate Command - Manually deactivate a version
timescapeCommand
    .command('deactivate')
    .description('Manually deactivate a version')
    .argument('<version>', 'Version identifier (TSV, tag, or timestamp)')
    .option('-h, --handler <path>', 'Handler path (required for tags/timestamps)')
    .option('-f, --force', 'Force deactivation even if protected')
    .action(async (versionId, options) => {
        console.log(chalk.bold.cyan(`\n🔒 Deactivating Version: ${versionId}\n`));
        
        try {
            const registry = loadRegistry();
            let tsv: TSV | undefined;
            let handlerPath: string | undefined;
            
            // Resolve version (same logic as status command)
            if (versionId.startsWith('tsv:')) {
                tsv = versionId as TSV;
                for (const handler of registry.getAllHandlers()) {
                    const versions = registry.getVersions(handler);
                    if (versions.some((v: VersionInfo) => v.tsv === tsv)) {
                        handlerPath = handler;
                        break;
                    }
                }
            } else if (options.handler) {
                handlerPath = options.handler;
                tsv = registry.getVersionByTag(handlerPath, versionId);
                
                if (!tsv && versionId.includes('T')) {
                    const timestamp = Date.parse(versionId);
                    if (!isNaN(timestamp)) {
                        tsv = registry.getVersionAt(handlerPath, timestamp);
                    }
                }
            } else {
                console.error(chalk.red('Error: --handler is required for tags and timestamps'));
                process.exit(1);
            }
            
            if (!tsv || !handlerPath) {
                console.error(chalk.red(`Version not found: ${versionId}`));
                process.exit(1);
            }
            
            const info = registry.getVersionInfo(handlerPath, tsv);
            
            if (!info) {
                console.error(chalk.red(`Version info not found: ${tsv}`));
                process.exit(1);
            }
            
            // Check if already deactivated
            if (info.status === 'deactivated') {
                console.log(chalk.yellow(`Version ${tsv} is already deactivated.`));
                return;
            }
            
            // Check for protected tags
            if (!options.force && info.tags.some((tag: string) => ['stable', 'production', 'latest'].includes(tag))) {
                console.error(chalk.red(`Version ${tsv} has protected tags: ${info.tags.join(', ')}`));
                console.error(chalk.yellow('Use --force to deactivate anyway.'));
                process.exit(1);
            }
            
            // Deactivate
            registry.deactivateVersion(handlerPath, tsv);
            saveRegistry(registry);
            
            console.log(chalk.green(`✓ Version ${tsv} deactivated successfully.`));
            console.log('');
            
        } catch (error: any) {
            console.error(chalk.red('Failed to deactivate version:'), error.message);
            process.exit(1);
        }
    });

// Tag Command - Create a semantic version tag
timescapeCommand
    .command('tag')
    .description('Tag a version with a semantic label')
    .argument('<tsv>', 'Version identifier (TSV)')
    .argument('<label>', 'Tag label (e.g., v1.0.0, stable, production)')
    .option('-c, --created-by <name>', 'Creator name', 'cli-user')
    .action(async (tsv, label, options) => {
        console.log(chalk.bold.cyan(`\n🏷️  Tagging Version: ${tsv} → ${label}\n`));
        
        try {
            const registry = loadRegistry();
            
            // Validate TSV format
            if (!tsv.startsWith('tsv:')) {
                console.error(chalk.red(`Invalid TSV format: ${tsv}`));
                console.error(chalk.yellow('TSV must start with "tsv:"'));
                process.exit(1);
            }
            
            // Check if version exists
            let found = false;
            for (const handler of registry.getAllHandlers()) {
                const versions = registry.getVersions(handler);
                if (versions.some((v: VersionInfo) => v.tsv === tsv)) {
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                console.error(chalk.red(`Version not found: ${tsv}`));
                process.exit(1);
            }
            
            // Check if tag already exists
            const existingTag = registry.getAllTags().find((t: { label: string; tsv: TSV }) => t.label === label);
            if (existingTag) {
                console.error(chalk.red(`Tag "${label}" already exists and points to ${existingTag.tsv}`));
                console.error(chalk.yellow('Remove the existing tag first with: gati timescape untag ' + label));
                process.exit(1);
            }
            
            // Create tag
            registry.tagVersion(tsv as TSV, label, options.createdBy);
            saveRegistry(registry);
            
            console.log(chalk.green(`✓ Tag "${label}" created successfully.`));
            console.log(chalk.gray(`  ${tsv} → ${label}`));
            console.log('');
            
        } catch (error: any) {
            console.error(chalk.red('Failed to create tag:'), error.message);
            process.exit(1);
        }
    });

// Tags Command - List all tags or tags for a specific version
timescapeCommand
    .command('tags')
    .description('List all tags or tags for a specific version')
    .argument('[tsv]', 'Optional: Version identifier (TSV) to show tags for')
    .action(async (tsv) => {
        if (tsv) {
            console.log(chalk.bold.cyan(`\n🏷️  Tags for Version: ${tsv}\n`));
        } else {
            console.log(chalk.bold.cyan('\n🏷️  All Tags\n'));
        }
        
        try {
            const registry = loadRegistry();
            
            if (tsv) {
                // Show tags for specific version
                if (!tsv.startsWith('tsv:')) {
                    console.error(chalk.red(`Invalid TSV format: ${tsv}`));
                    process.exit(1);
                }
                
                const tags = registry.getTagsForVersion(tsv as TSV);
                
                if (tags.length === 0) {
                    console.log(chalk.yellow(`No tags found for version ${tsv}`));
                    return;
                }
                
                console.log(chalk.bold('Tags:'));
                for (const tag of tags) {
                    console.log(`  ${chalk.green(tag)}`);
                }
                console.log('');
                
            } else {
                // Show all tags
                const allTags = registry.getAllTags();
                
                if (allTags.length === 0) {
                    console.log(chalk.yellow('No tags found.'));
                    return;
                }
                
                console.log(chalk.bold('Tag → Version'));
                console.log(chalk.gray('─'.repeat(80)));
                
                for (const tag of allTags) {
                    const created = formatTimestamp(tag.createdAt);
                    console.log(`${chalk.green(tag.label.padEnd(20))} → ${chalk.cyan(tag.tsv)}`);
                    console.log(`${' '.repeat(20)}   Created: ${chalk.gray(created)} by ${chalk.gray(tag.createdBy)}`);
                }
                
                console.log('');
                console.log(chalk.bold('Total tags:'), chalk.white(allTags.length));
                console.log('');
            }
            
        } catch (error: any) {
            console.error(chalk.red('Failed to list tags:'), error.message);
            process.exit(1);
        }
    });

// Untag Command - Remove a tag
timescapeCommand
    .command('untag')
    .description('Remove a tag')
    .argument('<label>', 'Tag label to remove')
    .action(async (label) => {
        console.log(chalk.bold.cyan(`\n🗑️  Removing Tag: ${label}\n`));
        
        try {
            const registry = loadRegistry();
            
            // Check if tag exists
            const tag = registry.getAllTags().find((t: { label: string; tsv: TSV }) => t.label === label);
            if (!tag) {
                console.error(chalk.red(`Tag not found: ${label}`));
                process.exit(1);
            }
            
            // Remove tag
            const removed = registry.untagVersion(label);
            
            if (removed) {
                saveRegistry(registry);
                console.log(chalk.green(`✓ Tag "${label}" removed successfully.`));
                console.log(chalk.gray(`  Was pointing to: ${tag.tsv}`));
                console.log('');
            } else {
                console.error(chalk.red(`Failed to remove tag: ${label}`));
                process.exit(1);
            }
            
        } catch (error: any) {
            console.error(chalk.red('Failed to remove tag:'), error.message);
            process.exit(1);
        }
    });
