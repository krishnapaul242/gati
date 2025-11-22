/**
 * @module cli/commands/dev
 * @description Dev command for local development server (Issue #10)
 */

import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { loadDevEnv } from '../utils/env-loader.js';
import { createWatcher } from '../utils/watcher.js';
import type { FSWatcher } from 'chokidar';
import type { GatiApp } from '@gati-framework/runtime';

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

    // Auto-generate types if schema exists
    const { generateTypes } = await import('@gati-framework/runtime');
    const schemaPath = resolve(cwd, 'gati.types.json');
    if (existsSync(schemaPath)) {
      try {
        const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
        const declarations = generateTypes(schema);
        const typesDir = resolve(cwd, '.gati');
        const typesPath = resolve(typesDir, 'types.d.ts');
        
        if (!existsSync(typesDir)) {
          mkdirSync(typesDir, { recursive: true });
        }
        writeFileSync(typesPath, declarations);
        console.log(chalk.gray('🔧 Auto-generated types from gati.types.json'));
      } catch (error) {
        console.log(chalk.yellow('⚠ Failed to auto-generate types'));
      }
    }

    // Auto-generate manifests from handlers
    const srcDir = resolve(cwd, 'src');
    const manifestsDir = resolve(cwd, '.gati', 'manifests');
    if (existsSync(srcDir)) {
      try {
        const { analyzeFile } = await import('../analyzer/simple-analyzer.js');
        const { glob } = await import('glob');
        
        if (!existsSync(manifestsDir)) {
          mkdirSync(manifestsDir, { recursive: true });
        }
        
        const handlers: any[] = [];
        const modules: any[] = [];
        
        // Find all TypeScript/JavaScript files
        const files = await glob('src/**/*.{ts,js}', { cwd, absolute: true });
        
        for (const filePath of files) {
          const result = analyzeFile(filePath, srcDir);
          
          if (result) {
            // Add to collections
            if ((result as any).route) {
              handlers.push(result);
            } else {
              modules.push(result);
            }
          }
        }
        
        // Write app manifest
        const appManifest = { handlers, modules, timestamp: Date.now() };
        const appManifestPath = resolve(manifestsDir, '_app.json');
        writeFileSync(appManifestPath, JSON.stringify(appManifest, null, 2));
        
        console.log(chalk.gray(`🔧 Auto-generated manifests (${handlers.length} handlers, ${modules.length} modules)`));
      } catch (error) {
        console.log(chalk.yellow('⚠ Failed to auto-generate manifests'));
      }
    }

    // Check if gati.config exists (.js or .ts in root)
    const configJsPath = resolve(cwd, 'gati.config.js');
    const configTsPath = resolve(cwd, 'gati.config.ts');
    
    if (!existsSync(configJsPath) && !existsSync(configTsPath)) {
      spinner.fail(chalk.red('✖ No gati.config.js or gati.config.ts found in current directory'));
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
        // Import the config from root directory
        const configJsPath = resolve(cwd, 'gati.config.js');
        const configPath = existsSync(configJsPath) 
          ? configJsPath 
          : resolve(cwd, 'gati.config.ts');
        
        // Convert to file:// URL for Windows compatibility
        const configUrl = new URL(`file://${configPath.replace(/\\/g, '/')}`).href;
        
        // Use dynamic import with cache busting for hot reload
        const cacheBuster = `?t=${Date.now()}`;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const configModule = await import(configUrl + cacheBuster);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const config = configModule.default || configModule;
        
        // Find available port
        const { findAvailablePort } = await import('../utils/port-finder.js');
        const availablePort = await findAvailablePort(config.server?.port || 3000);
        
        if (availablePort !== (config.server?.port || 3000)) {
          console.log(chalk.yellow(`Port ${config.server?.port || 3000} in use, using port ${availablePort}`));
        }
        
        // Create app from config
        const { createApp } = await import('@gati-framework/runtime');
        const gatiApp = createApp({
          port: availablePort,
          host: config.server?.host || 'localhost',
        });
        
        // Load handlers from manifests
        const manifestsDir = resolve(cwd, '.gati', 'manifests');
        if (existsSync(manifestsDir)) {
          const appManifestPath = resolve(manifestsDir, '_app.json');
          if (existsSync(appManifestPath)) {
            try {
              const appManifest = JSON.parse(readFileSync(appManifestPath, 'utf-8'));
              for (const handler of appManifest.handlers || []) {
                // In dev mode, load TypeScript files directly using tsx
                const handlerFilePath = handler.filePath;
                
                try {
                  // Use tsx's tsImport to load TypeScript files
                  // Convert Windows paths to file:// URLs properly
                  const { tsImport } = await import('tsx/esm/api');
                  const fileUrl = `file:///${handlerFilePath.replace(/\\/g, '/')}`;
                  const handlerModule = await tsImport(fileUrl, import.meta.url);
                  const handlerFn = handlerModule[handler.exportName];
                  if (handlerFn) {
                    gatiApp.registerRoute(handler.method || 'GET', handler.route, handlerFn);
                    console.log(`✅ Loaded ${handler.method} ${handler.route}`);
                  }
                } catch (error) {
                  console.warn(`Failed to load handler ${handlerFilePath}:`, error);
                }
              }
            } catch (error) {
              console.warn('Failed to load app manifest:', error);
            }
          }
        }
        
        // Initialize modules if provided
        if (config.modules && typeof config.modules === 'function') {
          // Get global context and initialize modules
          const gctx = gatiApp.getGlobalContext();
          config.modules(gctx);
        }
        
        // Register custom routes from config (overrides auto-discovered)
        if (config.routes && Array.isArray(config.routes)) {
          for (const route of config.routes) {
            const method = route.method?.toLowerCase();
            if (method && route.path && route.handler) {
              gatiApp.registerRoute(method.toUpperCase(), route.path, route.handler);
            }
          }
        }
        
        // Initialize file watcher for hot reloading (only if watch enabled)
        if (options.watch) {
          const { FileWatcher } = await import('../analyzer/file-watcher.js');
          
          // Check if Timescape is enabled in config
          const timescapeEnabled = config.timescape?.enabled !== false;
          
          new FileWatcher(
            cwd, 
            async (manifest) => {
              // Clear existing routes and reload all
              gatiApp.getRouteManager().clear();
              
              // Update routes when manifest changes
              for (const handler of manifest.handlers) {
                try {
                  const jsPath = handler.filePath
                    .replace(/\.ts$/, '.js')
                    .replace(/[\\/]src[\\/]/, '/dist/src/')
                    .replace(/\\/g, '/');
                  
                  const handlerModule = await import(`file://${jsPath}?t=${Date.now()}`);
                  const handlerFn = handlerModule[handler.exportName];
                  if (handlerFn) {
                    gatiApp.registerRoute(handler.method || 'GET', handler.route, handlerFn);
                    console.log(`🔄 Reloaded ${handler.method} ${handler.route}`);
                }
              } catch (error) {
                console.warn(`Failed to reload handler ${handler.route}:`, error);
              }
            }
          },
          {
            enableVersioning: timescapeEnabled,
            onVersionChange: (change) => {
              // Version change notification is already handled in FileWatcher
              // Here we could trigger additional actions like:
              // - Generate transformer stubs
              // - Send notifications
              // - Update documentation
              
              if (change.breaking && timescapeEnabled) {
                console.log(chalk.yellow('\n💡 Tip: Implement the transformer to maintain backward compatibility'));
                console.log(chalk.gray('   Run: gati timescape generate-transformer ' + change.newVersion));
              }
            }
          }
        ).start();
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
          // Execute startup hooks before listening
          const gctx = app.getGlobalContext();
          console.log(chalk.blue('\n🚀 Executing startup hooks...'));
          await gctx.lifecycle.executeStartup();
          
          await app.listen();
          
          // Show success message
          spinner.succeed(chalk.green('✔ Development server started'));
          console.log(chalk.cyan(`\n🚀 Server running on http://localhost:${app.getConfig().port}`));
          console.log(chalk.gray('\n📝 Press Ctrl+C to stop\n'));
          return; // Exit function to prevent duplicate messages
        }

        // Success message moved above
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

      // Stop server with lifecycle hooks
      if (app && typeof app.close === 'function') {
        const gctx = app.getGlobalContext();
        console.log(chalk.blue('\n🛑 Executing shutdown hooks...'));
        await gctx.lifecycle.executeShutdown();
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

