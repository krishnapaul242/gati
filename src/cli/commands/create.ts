/**
 * @module cli/commands/create
 * @description Create command for scaffolding new Gati projects
 */

import { Command } from 'commander';
import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { generateProject } from '../utils/file-generator';

interface CreateOptions {
  template: string;
  skipPrompts?: boolean;
  skipInstall?: boolean;
}

export const createCommand = new Command('create')
  .description('Create a new Gati project')
  .argument('[project-name]', 'Name of the project')
  .option('-t, --template <template>', 'Project template', 'default')
  .option('--skip-prompts', 'Skip interactive prompts')
  .option('--skip-install', 'Skip dependency installation')
  .action(async (projectName: string | undefined, options: CreateOptions) => {
    // eslint-disable-next-line no-console
    console.log(chalk.bold.cyan('\n🚀 Gati Project Creator\n'));

    let name = projectName;
    let template = options.template;
    let description = '';
    let author = '';

    // Interactive prompts if not skipped
    if (!options.skipPrompts) {
      const answers = await prompts(
        [
          {
            type: name ? null : 'text',
            name: 'projectName',
            message: 'Project name:',
            initial: 'my-gati-app',
            validate: (value: string) =>
              value.length > 0 ? true : 'Project name is required',
          },
          {
            type: 'text',
            name: 'description',
            message: 'Project description:',
            initial: 'A Gati application',
          },
          {
            type: 'text',
            name: 'author',
            message: 'Author:',
            initial: '',
          },
          {
            type: 'select',
            name: 'template',
            message: 'Select a template:',
            choices: [
              { title: 'Default', value: 'default', description: 'Basic Gati app with example handlers' },
              { title: 'Minimal', value: 'minimal', description: 'Minimal setup with no examples' },
            ],
            initial: 0,
          },
        ],
        {
          onCancel: () => {
            // eslint-disable-next-line no-console
            console.log(chalk.red('\n✖ Operation cancelled'));
            process.exit(0);
          },
        }
      );

      if (!name) name = answers.projectName as string;
      description = answers.description as string;
      author = answers.author as string;
      template = answers.template as string;
    }

    if (!name) {
      console.error(chalk.red('✖ Project name is required'));
      process.exit(1);
    }

    const projectPath = resolve(process.cwd(), name);

    // Check if directory already exists
    if (existsSync(projectPath)) {
      console.error(
        chalk.red(`✖ Directory "${name}" already exists`)
      );
      process.exit(1);
    }

    const spinner = ora('Creating project...').start();

    try {
      // Generate project structure
      await generateProject({
        projectPath,
        projectName: name,
        description,
        author,
        template,
        skipInstall: options.skipInstall as boolean,
      });

      spinner.succeed(chalk.green('Project created successfully!'));

      // Print next steps
      /* eslint-disable no-console */
      console.log(chalk.bold('\n📦 Next steps:\n'));
      console.log(chalk.cyan(`  cd ${name}`));
      if (options.skipInstall) {
        console.log(chalk.cyan('  pnpm install'));
      }
      console.log(chalk.cyan('  pnpm dev'));
      console.log(chalk.dim('\n  Happy coding! 🎉\n'));
      /* eslint-enable no-console */
    } catch (error) {
      spinner.fail(chalk.red('Failed to create project'));
      console.error(error);
      process.exit(1);
    }
  });
