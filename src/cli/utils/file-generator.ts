/**
 * @module cli/utils/file-generator
 * @description Project scaffolding and file generation utilities
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import ora from 'ora';
import chalk from 'chalk';

const execAsync = promisify(exec);

export interface ProjectOptions {
  projectPath: string;
  projectName: string;
  description: string;
  author: string;
  template: string;
  skipInstall: boolean;
}

/**
 * Generate a new Gati project
 */
export async function generateProject(
  options: ProjectOptions
): Promise<void> {
  const { projectPath, projectName, description, author, template, skipInstall } = options;

  // Create project directory
  await mkdir(projectPath, { recursive: true });

  // Create directory structure
  await createDirectoryStructure(projectPath);

  // Generate files based on template
  if (template === 'minimal') {
    await generateMinimalTemplate(projectPath, projectName, description, author);
  } else {
    await generateDefaultTemplate(projectPath, projectName, description, author);
  }

  // Install dependencies if not skipped
  if (!skipInstall) {
    const spinner = ora('Installing dependencies...').start();
    try {
      await execAsync('pnpm install', { cwd: projectPath });
      spinner.succeed(chalk.green('Dependencies installed'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to install dependencies'));
      throw error;
    }
  }
}

/**
 * Create the project directory structure
 */
async function createDirectoryStructure(projectPath: string): Promise<void> {
  const dirs = [
    'src',
    'src/handlers',
    'src/modules',
    'tests',
    'tests/unit',
    'tests/integration',
  ];

  for (const dir of dirs) {
    await mkdir(join(projectPath, dir), { recursive: true });
  }
}

/**
 * Generate default template with example handlers
 */
async function generateDefaultTemplate(
  projectPath: string,
  projectName: string,
  description: string,
  author: string
): Promise<void> {
  // package.json
  await writeFile(
    join(projectPath, 'package.json'),
    JSON.stringify(
      {
        name: projectName,
        version: '0.1.0',
        description,
        author,
        license: 'MIT',
        scripts: {
          dev: 'gati dev',
          build: 'gati build',
          start: 'node dist/index.js',
          test: 'vitest',
          typecheck: 'tsc --noEmit',
          lint: 'eslint . --ext .ts',
        },
        dependencies: {
          '@gati-framework/core': '^0.1.0',
        },
        devDependencies: {
          '@types/node': '^20.10.0',
          typescript: '^5.3.2',
          vitest: '^1.0.0',
          eslint: '^8.54.0',
        },
        engines: {
          node: '>=18.0.0',
        },
      },
      null,
      2
    )
  );

  // tsconfig.json
  await writeFile(
    join(projectPath, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: '@gati-framework/core/tsconfig.base.json',
        compilerOptions: {
          outDir: './dist',
          rootDir: './src',
          baseUrl: '.',
          paths: {
            '@/*': ['src/*'],
          },
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist', 'tests'],
      },
      null,
      2
    )
  );

  // gati.config.ts
  await writeFile(
    join(projectPath, 'gati.config.ts'),
    `/**
 * @file Gati configuration
 */

export default {
  port: 3000,
  handlers: './src/handlers',
  modules: './src/modules',
};
`
  );

  // README.md
  await writeFile(
    join(projectPath, 'README.md'),
    `# ${projectName}

${description}

## Getting Started

\`\`\`bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
\`\`\`

## Project Structure

\`\`\`
${projectName}/
├── src/
│   ├── handlers/     # HTTP request handlers
│   └── modules/      # Reusable modules
├── tests/
│   ├── unit/         # Unit tests
│   └── integration/  # Integration tests
├── gati.config.ts    # Gati configuration
└── package.json
\`\`\`

## Learn More

- [Gati Documentation](https://github.com/krishnapaul242/gati)
- [Handler Guide](https://github.com/krishnapaul242/gati/blob/main/docs/handlers.md)
- [Module Guide](https://github.com/krishnapaul242/gati/blob/main/docs/modules.md)

## License

MIT
`
  );

  // Example handler
  await writeFile(
    join(projectPath, 'src/handlers/hello.ts'),
    `/**
 * @handler GET /hello
 * @description Simple hello world handler
 */

import type { Handler } from '@gati-framework/core';

export const handler: Handler = (req, res) => {
  const name = req.query.name || 'World';
  
  res.json({
    message: \`Hello, \${name}!\`,
    timestamp: new Date().toISOString(),
  });
};
`
  );

  // .gitignore
  await writeFile(
    join(projectPath, '.gitignore'),
    `# Dependencies
node_modules/
.pnpm-store/

# Build output
dist/
build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*

# Testing
coverage/
.nyc_output/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
`
  );
}

/**
 * Generate minimal template
 */
async function generateMinimalTemplate(
  projectPath: string,
  projectName: string,
  description: string,
  author: string
): Promise<void> {
  // Similar to default but without example files
  await writeFile(
    join(projectPath, 'package.json'),
    JSON.stringify(
      {
        name: projectName,
        version: '0.1.0',
        description,
        author,
        license: 'MIT',
        scripts: {
          dev: 'gati dev',
          build: 'gati build',
          start: 'node dist/index.js',
          test: 'vitest',
          typecheck: 'tsc --noEmit',
        },
        dependencies: {
          '@gati-framework/core': '^0.1.0',
        },
        devDependencies: {
          '@types/node': '^20.10.0',
          typescript: '^5.3.2',
        },
        engines: {
          node: '>=18.0.0',
        },
      },
      null,
      2
    )
  );

  await writeFile(
    join(projectPath, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist'],
      },
      null,
      2
    )
  );

  await writeFile(
    join(projectPath, 'gati.config.ts'),
    `export default {
  port: 3000,
  handlers: './src/handlers',
};
`
  );

  await writeFile(
    join(projectPath, 'README.md'),
    `# ${projectName}

${description}

## Getting Started

\`\`\`bash
pnpm install
pnpm dev
\`\`\`
`
  );

  await writeFile(
    join(projectPath, '.gitignore'),
    `node_modules/
dist/
.env
*.log
`
  );
}
