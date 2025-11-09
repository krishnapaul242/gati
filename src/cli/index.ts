#!/usr/bin/env node
/**
 * @module cli/index
 * @description Main CLI entry point for Gati framework
 */

import { Command } from 'commander';
import { createCommand } from './commands/create';
import { devCommand } from './commands/dev';
import { buildCommand } from './commands/build';

const program = new Command();

program
  .name('gati')
  .description('Gati - Motion in Code: Build cloud-native, versioned APIs')
  .version('0.1.0');

// Register commands
program.addCommand(createCommand);
program.addCommand(devCommand);
program.addCommand(buildCommand);

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

