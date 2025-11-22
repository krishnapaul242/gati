# Gati Registry Placement Decision

## Decision: `apps/gati-registry/`

The Gati Registry will be placed in a new `apps/` directory at the root of the monorepo.

## Rationale

### Why `apps/` Directory?

1. **Clear Separation of Concerns**
   - `packages/` = Framework libraries and tools
   - `apps/` = Production applications built with Gati
   - `examples/` = Educational demos and tutorials
   - `docs/` = Documentation

2. **Production Application**
   - Registry is a real production service, not a library
   - Has its own deployment pipeline and infrastructure
   - Requires production-grade configuration and monitoring
   - Different lifecycle than framework packages

3. **Monorepo Best Practices**
   - Standard pattern in modern monorepos (Nx, Turborepo, etc.)
   - Clear distinction between libraries and applications
   - Easier to manage dependencies and builds
   - Better for CI/CD optimization

4. **Scalability**
   - Room for future Gati applications (Dev Cloud, Playground, etc.)
   - Each app can have independent deployment
   - Shared framework packages via workspace

5. **Reference Implementation**
   - Shows how to structure production Gati apps
   - Demonstrates best practices
   - Validates framework at scale
   - Living documentation

### Why Not Other Options?

**Not `packages/registry/`:**
- Packages are libraries, not applications
- Would mix framework code with application code
- Confusing for developers looking for framework packages
- Different build and deployment needs

**Not `examples/gati-registry/`:**
- Examples are educational demos, not production services
- Registry is too complex for an example
- Would confuse the purpose of examples
- Examples are typically simpler and focused

**Not separate repository:**
- Loses monorepo benefits
- Harder to keep in sync with framework
- More complex dependency management
- Misses dogfooding opportunities

## Directory Structure

```
gati/
├── apps/
│   └── gati-registry/              # Registry application
│       ├── src/
│       │   ├── modules/            # Gati modules
│       │   │   ├── artifacts/
│       │   │   ├── metadata/
│       │   │   ├── search/
│       │   │   ├── auth/
│       │   │   ├── signing/
│       │   │   ├── scanning/
│       │   │   ├── billing/
│       │   │   ├── timescape/
│       │   │   ├── notifications/
│       │   │   └── analytics/
│       │   ├── shared/             # Shared types and utils
│       │   │   ├── types/
│       │   │   └── utils/
│       │   └── app.ts              # Application entry
│       ├── tests/                  # Tests
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       ├── docs/                   # App-specific docs
│       ├── .env.example            # Environment template
│       ├── gati.config.ts          # Gati configuration
│       ├── package.json            # Dependencies
│       ├── tsconfig.json           # TypeScript config
│       ├── Dockerfile              # Container image
│       ├── k8s/                    # Kubernetes manifests
│       └── README.md               # Documentation
├── packages/                       # Framework packages
├── examples/                       # Educational examples
└── docs/                           # Framework documentation
```

## Workspace Configuration

Updated `pnpm-workspace.yaml` to include:

```yaml
packages:
  - 'packages/*'      # Framework
  - 'apps/*'          # Applications
  - 'examples/*'      # Examples
```

## Benefits

1. **Dogfooding**: Registry uses Gati, validates framework
2. **Reference**: Shows how to build production apps
3. **Modularity**: Clear separation, independent deployment
4. **Scalability**: Room for more apps (Dev Cloud, etc.)
5. **Maintainability**: Clear structure, easy to navigate
6. **CI/CD**: Optimized builds, independent pipelines
7. **Documentation**: Living example of Gati patterns

## Next Steps

1. ✅ Create `apps/` directory structure
2. ✅ Update workspace configuration
3. ✅ Create initial Registry scaffolding
4. ⏳ Implement core modules (artifacts, metadata, search)
5. ⏳ Add authentication and authorization
6. ⏳ Implement signing and scanning
7. ⏳ Add billing and marketplace
8. ⏳ Integrate with Timescape
9. ⏳ Set up deployment pipeline
10. ⏳ Launch beta version

## Related Documents

- [Requirements](.kiro/specs/gati-registry/requirements.md)
- [Design](.kiro/specs/gati-registry/design.md)
- [Tasks](.kiro/specs/gati-registry/tasks.md) (to be created)
- [Apps README](apps/README.md)
- [Registry README](apps/gati-registry/README.md)
