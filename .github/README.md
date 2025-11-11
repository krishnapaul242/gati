# 🚀 Contributing to Gati

Welcome to the Gati development community! This guide will help you get set up and start contributing to the framework.

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Quick Setup](#-quick-setup)
- [Project Structure](#-project-structure)
- [Development Workflow](#-development-workflow)
- [Running Tests](#-running-tests)
- [Submitting Changes](#-submitting-changes)
- [Code Standards](#-code-standards)
- [Getting Help](#-getting-help)

---

## � Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0 (recommended package manager)
- **Docker Desktop** (for local Kubernetes testing)
- **kind** (Kubernetes in Docker) - optional for K8s deployment testing
- **Git** for version control

### Install pnpm

```bash
npm install -g pnpm
```

### Install kind (optional)

```bash
# macOS
brew install kind

# Windows
choco install kind

# Linux
curl -Lo ./kind https://kind.sigs.k8s.io/dl/latest/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

---

## � Quick Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/gati.git
cd gati

# Add upstream remote
git remote add upstream https://github.com/krishnapaul242/gati.git
```

### 2. Install Dependencies

```bash
# Install all dependencies for the monorepo
pnpm install
```

### 3. Build All Packages

```bash
# Build all packages in the monorepo
pnpm build
```

### 4. Run Tests

```bash
# Run all tests to ensure everything works
pnpm test
```

### 5. Start Development

```bash
# Start development mode with hot reload
pnpm dev
```

**✅ You're ready to contribute!**

---

## � Project Structure

```
gati/
├── .github/              # GitHub configurations and workflows
├── docs/                 # Documentation (VitePress)
├── examples/             # Example applications
│   └── hello-world/      # Basic example project
├── packages/             # Published npm packages
│   ├── cli/              # @gati-framework/cli
│   ├── core/             # @gati-framework/core
│   ├── gatic/            # gatic (scaffolding tool)
│   └── runtime/          # @gati-framework/runtime
├── src/                  # Shared source code
│   ├── cli/              # CLI implementation
│   └── runtime/          # Runtime engine implementation
├── tests/                # Test suites
│   ├── e2e/              # End-to-end tests
│   └── unit/             # Unit tests
├── scripts/              # Build and utility scripts
├── pnpm-workspace.yaml   # pnpm workspace configuration
└── package.json          # Root package.json
```

### Key Directories

- **`packages/runtime/`** - Core runtime engine (handler execution, routing, context)
- **`packages/cli/`** - Development and deployment CLI
- **`packages/core/`** - Shared types and utilities
- **`packages/gatic/`** - Project scaffolding tool
- **`docs/`** - VitePress documentation site
- **`examples/`** - Example applications for testing

---

## � Development Workflow

### 1. Create a Branch

```bash
# Always create a new branch for your work
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### 2. Make Changes

```bash
# Work on your changes in the appropriate package
cd packages/runtime  # or cli, core, etc.

# Make your changes...
```

### 3. Build and Test

```bash
# Build your changes
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint
```

### 4. Test Your Changes Locally

```bash
# Test the CLI locally
cd examples/hello-world
pnpm dev

# Or test deployment
gati deploy dev --local
```

### 5. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with a descriptive message (see commit conventions below)
git commit -m "feat(runtime): add support for middleware chaining"
```

---

## 🧪 Running Tests

### Run All Tests

```bash
pnpm test
```

### Run Tests for Specific Package

```bash
cd packages/runtime
pnpm test
```

### Run E2E Tests

```bash
pnpm test:e2e
```

### Run Tests with Coverage

```bash
pnpm test:coverage
```

### Run Tests in Watch Mode

```bash
pnpm test:watch
```

---

## 📤 Submitting Changes

### 1. Push Your Branch

```bash
git push origin feature/your-feature-name
```

### 2. Create a Pull Request

1. Go to your fork on GitHub
2. Click "Pull Request" → "New Pull Request"
3. Select your branch
4. Fill in the PR template with:
   - **Description**: What does this PR do?
   - **Related Issue**: Link to any related issues
   - **Testing**: How did you test this?
   - **Screenshots**: If applicable

### 3. Wait for Review

- Maintainers will review your PR
- Address any feedback or requested changes
- Once approved, your PR will be merged!

---

## � Code Standards

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(runtime): add middleware support
fix(cli): resolve deployment timeout issue
docs(guides): update handler documentation
test(runtime): add context manager tests
```

### TypeScript Standards

- Use **strict TypeScript** mode
- Avoid `any` types - use proper typing
- Follow functional programming patterns when possible
- Document complex functions with JSDoc
- Use descriptive variable names

### Code Style

- Use **Prettier** for formatting (runs automatically)
- Use **ESLint** for linting
- Run `pnpm lint` before committing
- Keep functions small and focused
- Write self-documenting code

### Testing Requirements

- Write tests for all new features
- Maintain test coverage above 80%
- Include edge cases and error scenarios
- Use descriptive test names

---

## 🆘 Getting Help

### Documentation

- 📖 [Full Documentation](https://krishnapaul242.github.io/gati/)
- 📘 [Contributing Guide](../docs/contributing/README.md)
- 🏗️ [Architecture Overview](../docs/architecture/overview.md)
- 📋 [Milestones](../docs/architecture/milestones.md)

### Community

- � [GitHub Discussions](https://github.com/krishnapaul242/gati/discussions) - Ask questions, share ideas
- 🐛 [GitHub Issues](https://github.com/krishnapaul242/gati/issues) - Report bugs, request features
- 📧 Contact: Krishna Paul ([@krishnapaul242](https://github.com/krishnapaul242))

### Common Issues

**Build Failures:**
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

**Test Failures:**
```bash
# Update snapshots if needed
pnpm test -- -u

# Run in verbose mode
pnpm test -- --verbose
```

**Docker/Kubernetes Issues:**
```bash
# Reset kind cluster
kind delete cluster --name gati-local
kind create cluster --name gati-local
```

---

## 🎯 What to Work On

### Good First Issues

Look for issues labeled [`good first issue`](https://github.com/krishnapaul242/gati/labels/good%20first%20issue) - these are perfect for new contributors!

### Areas Needing Help

- 📝 **Documentation**: Improve guides, fix typos, add examples
- 🧪 **Testing**: Increase test coverage, add E2E tests
- 🐛 **Bug Fixes**: Check the [issues](https://github.com/krishnapaul242/gati/issues) page
- ✨ **Features**: See the [roadmap](../docs/architecture/roadmap.md) for planned features

---

## 📊 Development Scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm build` | Build all packages |
| `pnpm dev` | Start development mode |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm lint` | Lint all code |
| `pnpm format` | Format code with Prettier |
| `pnpm clean` | Clean build artifacts |

---

## 🙏 Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- ✅ Be respectful and constructive
- ✅ Welcome newcomers and help them learn
- ✅ Focus on what is best for the community
- ❌ Don't engage in harassment or discrimination
- ❌ Don't spam or self-promote excessively

---

## 📄 License

By contributing to Gati, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Gati!** 🎉

Your contributions help make cloud-native development faster and more accessible for everyone.

---

**Questions?** Open a [discussion](https://github.com/krishnapaul242/gati/discussions) or reach out to the maintainers!
