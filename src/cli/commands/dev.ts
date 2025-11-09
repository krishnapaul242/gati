/**
 * @module cli/commands/dev
 * @description Dev command for local development server (Issue #10)
 */

import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { loadDevEnv } from '../utils/env-loader';
import { createWatcher } from '../utils/watcher';
import type { FSWatcher } from 'chokidar';
import type { GatiApp } from '../../runtime/app-core';

interface DevOptions {
  port?: string;
  watch: boolean;
}

/**
 * Start development server
 */
async function startDevServer(cwd: string, options: DevOptions): Promise<void> {
  const spinner = ora('Starting development server...').start();
  let watcher: FSWatcher | null = null;
  let restartTimer: NodeJS.Timeout | null = null;

  try {
    // Load environment variables
    loadDevEnv(cwd, true);

    // Check if gati.config.ts exists
    const configPath = resolve(cwd, 'gati.config.ts');
    if (!existsSync(configPath)) {
      spinner.fail(chalk.red('✖ No gati.config.ts found in current directory'));
      // eslint-disable-next-line no-console
      console.log(chalk.yellow('\n💡 Run `gati create` to create a new project'));
      process.exit(1);
    }

    // Parse port option
    const port = options.port ? parseInt(options.port, 10) : undefined;
    if (options.port && isNaN(port as number)) {
      spinner.fail(chalk.red(`✖ Invalid port: ${options.port}`));
      process.exit(1);
    }

    // Dynamic import to allow reloading
    let app: GatiApp | null = null;
    const loadApp = async (): Promise<GatiApp> => {
      try {
        // Clear require cache for hot reload
        const modulePath = resolve(cwd, 'dist/index.js');
        if (require.cache[modulePath]) {
          delete require.cache[modulePath];
        }

        // Import the app
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const module = await import(modulePath);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return (module.app || module.default) as GatiApp;
      } catch (error) {
        throw new Error(`Failed to load app: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    // Function to start the server
    const startServer = async () => {
      try {
        spinner.text = 'Loading application...';
        app = await loadApp();

        if (!app || typeof app.listen !== 'function') {
          throw new Error('Exported app does not have a listen() method');
        }

        // Override port if specified
        if (port && app) {
          const config = app.getConfig();
          // Create new instance with custom port by importing GatiApp constructor
          const { GatiApp } = await import('../../runtime/app-core');
          app = new GatiApp({ ...config, port });
        }

        spinner.text = 'Starting HTTP server...';
        if (app) {
          await app.listen();
        }

        spinner.succeed(chalk.green('✔ Development server started'));
        
        if (app) {
          const config = app.getConfig();
          // eslint-disable-next-line no-console
          console.log(chalk.cyan(`\n🚀 Server running at http://${config.host}:${config.port}`));
          // eslint-disable-next-line no-console
          console.log(chalk.gray(`\n📝 Press Ctrl+C to stop\n`));
        }
      } catch (error) {
        spinner.fail(chalk.red('✖ Failed to start server'));
        // eslint-disable-next-line no-console
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        throw error;
      }
    };

    // Function to restart the server
    const restartServer = () => {
      if (restartTimer) {
        clearTimeout(restartTimer);
      }

      restartTimer = setTimeout(() => {
        void (async () => {
          try {
            // eslint-disable-next-line no-console
            console.log(chalk.yellow('\n🔄 Restarting server...'));

            // Stop existing server
            if (app && typeof app.close === 'function') {
              await app.close();
            }

            // Start new server
            await startServer();
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(chalk.red('✖ Restart failed:'), error instanceof Error ? error.message : 'Unknown error');
          }
        })();
      }, 500);
    };

    // Start initial server
    await startServer();

    // Set up file watching if enabled
    if (options.watch) {
      // eslint-disable-next-line no-console
      console.log(chalk.blue('👁 Watching for file changes...\n'));

      watcher = createWatcher(
        cwd,
        {
          paths: ['src/**/*.ts', 'src/**/*.js', 'gati.config.ts'],
          verbose: true,
        },
        (_path, event) => {
          if (event === 'change' || event === 'add' || event === 'unlink') {
            restartServer();
          }
        }
      );
    }

    // Handle graceful shutdown
    const shutdown = async () => {
      // eslint-disable-next-line no-console
      console.log(chalk.yellow('\n\n🛑 Shutting down...'));

      // Stop watcher
      if (watcher) {
        await watcher.close();
      }

      // Stop server
      if (app && typeof app.close === 'function') {
        await app.close();
      }

      process.exit(0);
    };

    process.on('SIGINT', () => void shutdown());
    process.on('SIGTERM', () => void shutdown());

  } catch (error) {
    spinner.fail(chalk.red('✖ Failed to start development server'));
    // eslint-disable-next-line no-console
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

export const devCommand = new Command('dev')
  .description('Start development server with hot reload')
  .option('-p, --port <port>', 'Port to run the server on')
  .option('--no-watch', 'Disable file watching')
  .action(async (options: DevOptions) => {
    const cwd = process.cwd();
    await startDevServer(cwd, options);
  });

