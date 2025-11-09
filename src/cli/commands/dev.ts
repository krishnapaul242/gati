/**
 * @module cli/commands/dev
 * @description Dev command for local development server (Issue #10)
 */

import { Command } from 'commander';

export const devCommand = new Command('dev')
  .description('Start development server with hot reload')
  .option('-p, --port <port>', 'Port to run the server on', '3000')
  .option('--no-watch', 'Disable file watching')
  .action(() => {
    // Implementation in Issue #10
    // eslint-disable-next-line no-console
    console.log('Dev command not yet implemented - see Issue #10');
  });
