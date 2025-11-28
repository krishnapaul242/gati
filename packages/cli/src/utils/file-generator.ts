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
    'deploy',
    'deploy/kubernetes',
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
        type: 'module',
        description,
        author,
        license: 'MIT',
        scripts: {
          dev: 'gati dev',
          build: 'gati build',
          start: 'node dist/index.js',
          'generate:manifests': 'gati generate:manifests',
          'generate:types': 'gati generate:types',
          test: 'vitest',
          typecheck: 'tsc --noEmit',
          lint: 'eslint . --ext .ts',
        },
        dependencies: {
          '@gati-framework/core': '^0.4.5',
          '@gati-framework/runtime': '^2.0.7',
        },
        devDependencies: {
          '@gati-framework/cli': '^1.0.14',
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
│   │   ├── hello.ts  # Example handler
│   │   └── health.ts # Health check endpoint
│   ├── modules/      # Reusable modules
│   └── index.ts      # Application entry point
├── deploy/
│   └── kubernetes/   # Kubernetes manifests
│       ├── deployment.yaml
│       └── service.yaml
├── tests/
│   ├── unit/         # Unit tests
│   └── integration/  # Integration tests
├── Dockerfile        # Production Docker image
├── docker-compose.yml # Local Docker setup
├── gati.config.ts    # Gati configuration
└── package.json
\`\`\`

## Development

### Local Development

\`\`\`bash
# Run with hot reload
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint
\`\`\`

### Environment Variables

Copy \`.env.example\` to \`.env\` and configure:

\`\`\`bash
cp .env.example .env
\`\`\`

## Deployment

### Docker

\`\`\`bash
# Build Docker image
docker build -t ${projectName}:latest .

# Run container
docker run -p 3000:3000 ${projectName}:latest

# Or use docker-compose
docker-compose up
\`\`\`

### Kubernetes

\`\`\`bash
# Apply manifests
kubectl apply -f deploy/kubernetes/

# Check deployment
kubectl get pods
kubectl get services

# View logs
kubectl logs -f deployment/${projectName}
\`\`\`

### Production Build

\`\`\`bash
# Build TypeScript
pnpm build

# Run production server
pnpm start
\`\`\`

## API Endpoints

- \`GET /health\` - Health check endpoint
- \`GET /api/hello?name=<name>\` - Example hello endpoint

## Learn More

- [Gati Documentation](https://github.com/krishnapaul242/gati)
- [Handler Guide](https://github.com/krishnapaul242/gati/blob/main/docs/handlers.md)
- [Module Guide](https://github.com/krishnapaul242/gati/blob/main/docs/modules.md)

## License

MIT
`
  );

  // Example handler and entrypoint
  await writeFile(
    join(projectPath, 'src/handlers/hello.ts'),
    `/**
 * @handler GET /hello
 * @description Simple hello world handler
 */

import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = (req, res) => {
  const name = req.query.name || 'World';
  
  res.json({
    message: \`Hello, \${name}!\`,
    timestamp: new Date().toISOString(),
  });
};
`
  );

  await writeFile(
    join(projectPath, 'src/index.ts'),
    `import { createApp, loadHandlers } from '@gati-framework/runtime';

async function main() {
  const app = createApp({ 
    port: Number(process.env['PORT']) || 3000, 
    host: process.env['HOST'] || '0.0.0.0' 
  });
  
  await loadHandlers(app, './src/handlers', { basePath: '/api', verbose: true });
  await app.listen();
  
  console.log(\`Server running on \${app.getConfig().host}:\${app.getConfig().port}\`);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(\`\${signal} received, shutting down gracefully...\`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Failed to start app', err);
  process.exit(1);
});
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

  // .dockerignore
  await writeFile(
    join(projectPath, '.dockerignore'),
    `node_modules/
.pnpm-store/
dist/
build/
.env
.env.*
*.log
coverage/
.git/
.github/
tests/
*.md
.vscode/
.idea/
.DS_Store
Thumbs.db
`
  );

  // .env.example
  await writeFile(
    join(projectPath, '.env.example'),
    `# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Application Configuration
APP_NAME=${projectName}
APP_VERSION=0.1.0

# Logging
LOG_LEVEL=info
LOG_PRETTY=true
`
  );

  // .npmrc - Disable workspace features for standalone project
  await writeFile(
    join(projectPath, '.npmrc'),
    `# Standalone project - not part of a workspace
workspace-root=false
shamefully-hoist=false
`
  );

  // Dockerfile
  await writeFile(
    join(projectPath, 'Dockerfile'),
    `# Multi-stage Dockerfile for ${projectName}
# Built with Gati framework

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN npm install -g pnpm@8

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install tini for proper signal handling
RUN apk add --no-cache tini

# Create non-root user
RUN addgroup -g 1001 -S gati && \\
    adduser -S gati -u 1001

# Install pnpm
RUN npm install -g pnpm@8

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Set ownership
RUN chown -R gati:gati /app

# Switch to non-root user
USER gati

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["node", "dist/index.js"]
`
  );

  // docker-compose.yml
  await writeFile(
    join(projectPath, 'docker-compose.yml'),
    `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "\${PORT:-3000}:3000"
    environment:
      - NODE_ENV=\${NODE_ENV:-development}
      - PORT=3000
      - HOST=0.0.0.0
    volumes:
      # Mount source code for development (comment out for production)
      - ./src:/app/src
      - ./package.json:/app/package.json
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

networks:
  default:
    name: ${projectName}-network
`
  );

  // Kubernetes deployment
  await writeFile(
    join(projectPath, 'deploy/kubernetes/deployment.yaml'),
    `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${projectName}
  labels:
    app: ${projectName}
    version: v1
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${projectName}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: ${projectName}
        version: v1
    spec:
      containers:
      - name: ${projectName}
        image: ${projectName}:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: HOST
          value: "0.0.0.0"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
            scheme: HTTP
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          successThreshold: 1
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
            scheme: HTTP
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          successThreshold: 1
          failureThreshold: 3
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
          requests:
            cpu: 250m
            memory: 256Mi
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          capabilities:
            drop:
            - ALL
          readOnlyRootFilesystem: false
      restartPolicy: Always
      securityContext:
        fsGroup: 1001
        runAsUser: 1001
        runAsNonRoot: true
`
  );

  // Kubernetes service
  await writeFile(
    join(projectPath, 'deploy/kubernetes/service.yaml'),
    `apiVersion: v1
kind: Service
metadata:
  name: ${projectName}
  labels:
    app: ${projectName}
spec:
  type: ClusterIP
  selector:
    app: ${projectName}
  ports:
  - name: http
    port: 80
    targetPort: 3000
    protocol: TCP
  sessionAffinity: None
`
  );

  // Add health handler
  await writeFile(
    join(projectPath, 'src/handlers/health.ts'),
    `/**
 * @handler GET /health
 * @description Health check endpoint for monitoring and orchestration
 */

import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};
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
        type: 'module',
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
          '@gati-framework/core': '^0.4.5',
          '@gati-framework/runtime': '^2.0.7',
        },
        devDependencies: {
          '@gati-framework/cli': '^1.0.14',
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
          baseUrl: '.',
          paths: { '@/*': ['src/*'] },
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

## Runtime Entry

This template expects a runtime entry at \`src/index.ts\`:

\`\`\`ts
import { createApp, loadHandlers } from '@gati-framework/runtime';

async function main() {
  const app = createApp({ port: 3000 });
  await loadHandlers(app, './src/handlers');
  await app.listen();
}

main();
\`\`\`
`
  );

  await writeFile(
    join(projectPath, 'src/index.ts'),
    `import { createApp, loadHandlers } from '@gati-framework/runtime';

async function main() {
  const app = createApp({ 
    port: Number(process.env['PORT']) || 3000,
    host: process.env['HOST'] || '0.0.0.0'
  });
  await loadHandlers(app, './src/handlers');
  await app.listen();
  
  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(\`\${signal} received, shutting down...\`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
`
  );

  await writeFile(
    join(projectPath, '.gitignore'),
    `node_modules/
dist/
.env
*.log
coverage/
.DS_Store
`
  );

  // Add basic deployment files for minimal template too
  await writeFile(
    join(projectPath, '.env.example'),
    `PORT=3000
NODE_ENV=development
`
  );

  // .npmrc - Disable workspace features for standalone project
  await writeFile(
    join(projectPath, '.npmrc'),
    `# Standalone project - not part of a workspace
workspace-root=false
shamefully-hoist=false
`
  );

  await writeFile(
    join(projectPath, 'Dockerfile'),
    `# Minimal Dockerfile for ${projectName}
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm@8

COPY package*.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache tini && \\
    npm install -g pnpm@8 && \\
    addgroup -g 1001 -S gati && \\
    adduser -S gati -u 1001

COPY package*.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist
RUN chown -R gati:gati /app

USER gati
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
`
  );

  // Add health handler for minimal template
  await writeFile(
    join(projectPath, 'src/handlers/health.ts'),
    `import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
};
`
  );
}

