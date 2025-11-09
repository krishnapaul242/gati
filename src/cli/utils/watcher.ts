/**
 * @module cli/utils/watcher
 * @description File watching utility for hot reload in development
 */

import chokidar, { type FSWatcher } from 'chokidar';
import { resolve } from 'path';
import chalk from 'chalk';

/**
 * File watcher options
 */
export interface WatcherOptions {
  /**
   * Paths to watch (glob patterns)
   */
  paths: string[];

  /**
   * Paths to ignore (glob patterns)
   * @default ['node_modules/**', 'dist/**', '.git/**']
   */
  ignored?: string[];

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;

  /**
   * Debounce delay in milliseconds
   * @default 300
   */
  debounce?: number;
}

/**
 * Callback type for file changes
 */
export type WatchCallback = (path: string, event: 'add' | 'change' | 'unlink') => void | Promise<void>;

/**
 * Create a file watcher for development hot reload
 */
export function createWatcher(
  cwd: string,
  options: WatcherOptions,
  onChange: WatchCallback
): FSWatcher {
  const {
    paths,
    ignored = ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/coverage/**'],
    verbose = false,
    debounce = 300,
  } = options;

  if (verbose) {
    // eslint-disable-next-line no-console
    console.log(chalk.blue(`👁 Watching for file changes in:`));
    paths.forEach((p) => {
      // eslint-disable-next-line no-console
      console.log(chalk.gray(`   - ${resolve(cwd, p)}`));
    });
  }

  // Create watcher - use cwd and relative paths
  const watcher = chokidar.watch(paths, {
    cwd, // Set base directory
    ignored,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: debounce,
      pollInterval: 100,
    },
  });

  // Debounce helper
  let debounceTimer: NodeJS.Timeout | null = null;
  const debouncedOnChange = (path: string, event: 'add' | 'change' | 'unlink') => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      void (async () => {
        try {
          await onChange(path, event);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(chalk.red(`✖ Error handling file change: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      })();
    }, debounce);
  };

  // Register event handlers
  watcher
    .on('add', (path) => {
      if (verbose) {
        // eslint-disable-next-line no-console
        console.log(chalk.green(`➕ File added: ${path}`));
      }
      debouncedOnChange(path, 'add');
    })
    .on('change', (path) => {
      if (verbose) {
        // eslint-disable-next-line no-console
        console.log(chalk.yellow(`📝 File changed: ${path}`));
      }
      debouncedOnChange(path, 'change');
    })
    .on('unlink', (path) => {
      if (verbose) {
        // eslint-disable-next-line no-console
        console.log(chalk.red(`🗑 File removed: ${path}`));
      }
      debouncedOnChange(path, 'unlink');
    })
    .on('error', (error: unknown) => {
      // eslint-disable-next-line no-console
      console.error(chalk.red(`✖ Watcher error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    });

  return watcher;
}

/**
 * Stop a file watcher
 */
export async function stopWatcher(watcher: FSWatcher): Promise<void> {
  await watcher.close();
}
