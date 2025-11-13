/**
 * @module cli/commands/playground
 * @description Start Gati application with playground enabled
 */

import { Command } from 'commander';
import { spawn } from 'child_process';
import { resolve } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';

export const playgroundCommand = new Command('playground')
  .description('Start Gati app with playground UI enabled')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('--playground-port <port>', 'Playground UI port', '3001')
  .option('--ws-port <port>', 'WebSocket port', '8080')
  .option('--debug', 'Enable debug mode with breakpoints')
  .action(async (options) => {
    const spinner = ora('Starting Gati with Playground...').start();

    try {
      // Find the app entry point
      const cwd = process.cwd();
      const possibleEntries = [
        'src/index.ts',
        'src/main.ts',
        'src/app.ts',
        'index.ts',
        'main.ts',
        'app.ts',
      ];

      let entryPoint = null;
      for (const entry of possibleEntries) {
        const fullPath = resolve(cwd, entry);
        if (existsSync(fullPath)) {
          entryPoint = fullPath;
          break;
        }
      }

      if (!entryPoint) {
        spinner.fail('Could not find app entry point');
        console.log(chalk.yellow('\nSearched for:'));
        possibleEntries.forEach((entry) => console.log(chalk.gray(`  - ${entry}`)));
        console.log(chalk.yellow('\nPlease specify the entry point or use one of the above.'));
        process.exit(1);
      }

      spinner.text = `Starting app from ${chalk.cyan(entryPoint)}`;

      // Set environment variables for playground
      const env = {
        ...process.env,
        PORT: options.port,
        GATI_PLAYGROUND: 'true',
        GATI_PLAYGROUND_PORT: options.playgroundPort,
        GATI_PLAYGROUND_WS_PORT: options.wsPort,
        GATI_PLAYGROUND_DEBUG: options.debug ? 'true' : 'false',
        NODE_ENV: process.env['NODE_ENV'] || 'development',
      };

      // Start the app with tsx (TypeScript execution)
      const appProcess = spawn('npx', ['tsx', entryPoint], {
        cwd,
        env,
        stdio: 'inherit',
        shell: true,
      });

      spinner.succeed('Gati Playground started!');
      console.log();
      console.log(chalk.green('✓') + ' Server running on:     ' + chalk.cyan(`http://localhost:${options.port}`));
      console.log(chalk.green('✓') + ' Playground UI on:      ' + chalk.cyan(`http://localhost:${options.port}/playground`));
      console.log(chalk.green('✓') + ' WebSocket server on:   ' + chalk.cyan(`ws://localhost:${options.wsPort}`));
      if (options.debug) {
        console.log(chalk.green('✓') + ' Debug mode:            ' + chalk.cyan('ENABLED'));
      }
      console.log();
      console.log(chalk.gray('Press Ctrl+C to stop'));
      console.log();

      // Handle graceful shutdown
      const cleanup = () => {
        console.log(chalk.yellow('\n\nShutting down...'));
        appProcess.kill('SIGTERM');
        process.exit(0);
      };

      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);

      appProcess.on('error', (error) => {
        console.error(chalk.red('Failed to start app:'), error);
        process.exit(1);
      });

      appProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.error(chalk.red(`App exited with code ${code}`));
          process.exit(code);
        }
      });
    } catch (error) {
      spinner.fail('Failed to start playground');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });
