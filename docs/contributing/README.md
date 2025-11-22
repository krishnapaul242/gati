# Contributing to Gati

Thank you for your interest in contributing to Gati! 🎉

This guide will help you get started with contributing to the project.

## Code of Conduct

Be respectful, inclusive, and constructive. We're building a welcoming community.

## How Can I Contribute?

### 🐛 Reporting Bugs

Found a bug? Please [create an issue](https://github.com/krishnapaul242/gati/issues/new) with:

- **Clear title** describing the bug
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Environment details** (Node version, OS, Gati version)
- **Code samples** if possible

### 💡 Suggesting Features

Have an idea? We'd love to hear it!

1. Check [existing issues](https://github.com/krishnapaul242/gati/issues) to avoid duplicates
2. Create a new issue with the `enhancement` label
3. Describe:
   - The problem you're trying to solve
   - Your proposed solution
   - Alternative solutions you've considered
   - Any implementation details

### 📖 Improving Documentation

Documentation improvements are always welcome!

- Fix typos or clarify confusing sections
- Add examples or tutorials
- Translate docs to other languages
- Improve API references

### 💻 Contributing Code

## CI/CD Status

Gati has a fully automated CI/CD pipeline:

- ✅ **Continuous Integration** - Automated testing on every push
- ✅ **Automated Publishing** - npm releases via changesets
- ✅ **Documentation Deployment** - Auto-deploy to GitHub Pages

See [CI/CD Guide](./ci-cd.md) for details.

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/gati.git
cd gati
```

### Install Dependencies

```bash
pnpm install
```

### Project Structure

```
gati/
├── packages/
│   ├── runtime/       # Core runtime engine
│   ├── cli/          # CLI tool
│   └── core/         # Type definitions
├── src/              # Legacy source (being migrated)
├── docs/             # Documentation (VitePress)
├── examples/         # Example applications
└── tests/            # Test suites
```

### Build Packages

```bash
# Build all packages
pnpm build

# Build specific package
cd packages/runtime
pnpm build
```

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
cd packages/runtime
pnpm test

# Run tests with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

### Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes** following our [coding standards](#coding-standards)

3. **Write tests** for your changes

4. **Run tests and linting**:
   ```bash
   pnpm test
   pnpm lint
   pnpm typecheck
   ```

5. **Commit your changes** using [conventional commits](#commit-guidelines)

6. **Push to your fork**:
   ```bash
   git push origin feat/your-feature-name
   ```

7. **Create a Pull Request** on GitHub

## Coding Standards

We follow strict coding conventions to maintain code quality:

### TypeScript Standards

- **Use strict types** - No `any` unless absolutely necessary
- **Functional patterns preferred** - Pure functions, composition
- **Avoid classes** unless truly needed (e.g., errors, complex state)

```typescript
// ✅ Good
const processData = (input: string): Result => {
  return transform(input);
};

// ❌ Bad
const processData = (input: any) => {
  return input.map(x => x + 1);
};
```

### Naming Conventions

```typescript
// Interfaces: PascalCase
interface HandlerContext { }

// Functions: camelCase, verb-first
function executeHandler() { }

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Files: kebab-case
// handler-engine.ts, module-loader.ts
```

### Import Order

1. Node.js built-ins
2. External dependencies
3. Internal modules (absolute imports via tsconfig paths)
4. Relative imports

```typescript
// 1. Node.js
import { createServer } from 'http';

// 2. External
import express from 'express';

// 3. Internal (absolute)
import { Handler } from '@/runtime/types/handler';

// 4. Relative
import { parseRoute } from './parser';
```

### Documentation

All public APIs must have JSDoc comments:

```typescript
/**
 * Executes a handler function with the provided context.
 *
 * @param handler - The handler function to execute
 * @param req - HTTP request object
 * @param res - HTTP response object
 * @returns Promise that resolves when handler completes
 *
 * @throws {HandlerError} If handler validation fails
 *
 * @example
 * ```typescript
 * const handler: Handler = (req, res) => res.json({ ok: true });
 * await executeHandler(handler, req, res);
 * ```
 */
export async function executeHandler(/* ... */) {
  // Implementation
}
```

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance (dependencies, build, etc.)

### Examples

```bash
feat(runtime): implement handler execution pipeline

- Add Request and Response type definitions
- Create context manager for gctx and lctx
- Implement handler execution flow with error handling

Closes #42
```

```bash
fix(cli): handle path params with special characters

Path params containing dots were not being parsed correctly.
Updated regex to support alphanumeric + dots + dashes.

Fixes #123
```

## Testing Requirements

### Coverage

- **Minimum:** 80% line coverage
- **Target:** 90% line coverage

### Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('HandlerEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute handler with correct parameters', async () => {
    // Arrange
    const req = createMockRequest();
    const res = createMockResponse();

    // Act
    await executeHandler(handler, req, res);

    // Assert
    expect(handler).toHaveBeenCalledWith(req, res);
  });
});
```

### Writing Good Tests

- **Test behavior, not implementation**
- **Use descriptive test names**
- **Follow Arrange-Act-Assert pattern**
- **Mock external dependencies**
- **Test edge cases and errors**

## Pull Request Process

1. **Update documentation** if you changed APIs
2. **Add tests** for new functionality
3. **Ensure all tests pass** (`pnpm test`)
4. **Lint your code** (`pnpm lint`)
5. **Update CHANGELOG.md** if needed
6. **Reference related issues** in PR description

### PR Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
- [ ] All tests pass
- [ ] Added new tests
- [ ] Updated documentation

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
```

## Getting Help

- 💬 [GitHub Discussions](https://github.com/krishnapaul242/gati/discussions) - Ask questions
- 🐛 [Issue Tracker](https://github.com/krishnapaul242/gati/issues) - Report bugs
- 📖 [Documentation](https://krishnapaul242.github.io/gati/) - Read the docs

## Recognition

Contributors are recognized in:

- `CONTRIBUTORS.md` file
- Release notes for their contributions
- GitHub contributors page

## Questions?

Don't hesitate to ask! Create a discussion thread or comment on an issue.

---

**Thank you for contributing to Gati!** 🙏

Every contribution, no matter how small, helps make Gati better for everyone.
