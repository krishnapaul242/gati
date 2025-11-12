/**
 * @module cli/commands/dev
 * @description Dev command for local development server (Issue #10)
 */

import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { loadDevEnv } from '../utils/env-loader.js';
import { createWatcher } from '../utils/watcher.js';
import type { FSWatcher } from 'chokidar';
import type { GatiApp } from '@gati-framework/core';

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

    // Check if gati.config.js exists (compiled from .ts)
    const configPath = resolve(cwd, 'gati.config.js');
    const configTsPath = resolve(cwd, 'gati.config.ts');
    
    if (!existsSync(configPath)) {
      if (existsSync(configTsPath)) {
        spinner.fail(chalk.red('✖ gati.config.ts found but not compiled'));
        // eslint-disable-next-line no-console
        console.log(chalk.yellow('\n💡 Run `npm run build` or `tsc` to compile your config'));
      } else {
        spinner.fail(chalk.red('✖ No gati.config.ts found in current directory'));
        // eslint-disable-next-line no-console
        console.log(chalk.yellow('\n💡 Run `gati create` to create a new project'));
      }
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
        // Import the config and create app
        const configPath = resolve(cwd, 'dist', 'gati.config.js');
        
        // Convert to file:// URL for Windows compatibility
        const configUrl = new URL(`file://${configPath.replace(/\\/g, '/')}`).href;
        
        // Use dynamic import with cache busting for hot reload
        const cacheBuster = `?t=${Date.now()}`;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const configModule = await import(configUrl + cacheBuster);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const config = configModule.default || configModule;
        
        // Create app from config
        const { createApp } = await import('@gati-framework/runtime');
        const gatiApp = createApp({
          port: config.server?.port || 3000,
          host: config.server?.host || 'localhost',
        });
        
        // Initialize modules if provided
        if (config.modules && typeof config.modules === 'function') {
          // Get global context and initialize modules
          const gctx = gatiApp.getGlobalContext();
          config.modules(gctx);
        }
        
        // Register routes
        if (config.routes && Array.isArray(config.routes)) {
          for (const route of config.routes) {
            const method = route.method?.toLowerCase();
            if (method && route.path && route.handler) {
              switch (method) {
                case 'get':
                  gatiApp.get(route.path, route.handler);
                  break;
                case 'post':
                  gatiApp.post(route.path, route.handler);
                  break;
                case 'put':
                  gatiApp.put(route.path, route.handler);
                  break;
                case 'patch':
                  gatiApp.patch(route.path, route.handler);
                  break;
                case 'delete':
                  gatiApp.delete(route.path, route.handler);
                  break;
              }
            }
          }
        }
        
        return gatiApp;
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
        // TODO: Port override not yet supported
        // Users should configure port in their project's main file
        if (port) {
          spinner.warn(chalk.yellow(`⚠ Port override not yet supported. Configure port in your project file.`));
        }

        spinner.text = 'Starting HTTP server...';
        if (app) {
          await app.listen();
        }

        spinner.succeed(chalk.green('✔ Development server started'));
        // eslint-disable-next-line no-console
        console.log(chalk.cyan('\n🚀 Server running'));
        // eslint-disable-next-line no-console
        console.log(chalk.gray('\n📝 Press Ctrl+C to stop\n'));
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

