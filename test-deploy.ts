/**
 * Test script for deploy command
 */

import { registerDeployCommand } from './src/cli/commands/deploy.js';
import { Command } from 'commander';

const program = new Command();

program
  .name('gati-deploy-test')
  .description('Test deploy command')
  .version('0.1.0');

registerDeployCommand(program);

program.parse(process.argv);
