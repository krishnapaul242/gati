# Design Document

## Overview

The Gati Module System provides a comprehensive framework for organizing application logic into self-contained, reusable modules with strict isolation boundaries, automatic dependency resolution, and runtime integration. The system builds upon Gati's existing module loader and registry infrastructure while adding discovery, validation, configuration management, type generation, and lifecycle orchestration capabilities.

The module system serves as the foundation for Gati's plugin ecosystem, enabling developers to create, share, and compose functionality through a standardized interface. It integrates deeply with Gati's runtime, providing automatic handler registration, event routing, effect scheduling, and service dependency injection.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Module Discovery Layer                   │
│  (Scans src/modules, node_modules/gati-*, core modules)    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Module Validation Layer                     │
│     (Validates manifests, checks dependencies, schemas)     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                Dependency Resolution Layer                   │
│   (Topological sort, circular dependency detection)         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Configuration Resolution Layer                  │
│  (Merges configs from multiple sources, validates schemas)  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Type Generation Layer                       │
│    (Generates TypeScript types from validators/schemas)     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Service Registration Layer                   │
│         (Registers services in DI container)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Component Registration Layer                      │
│    (Registers handlers, events, effects with runtime)       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Lifecycle Execution Layer                  │
│         (Executes setup functions in dependency order)       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      Runtime Integration                     │
│  (HTTP server, event bus, effect scheduler, WebSocket)      │
└─────────────────────────────────────────────────────────────┘
```

### Module Structure

Each module follows a standardized directory structure:

```
/modules
  /<moduleName>
    /apis              # Public API definitions
    /definitions       # Domain models, validators, schemas
    /handlers          # HTTP request handlers
    /events
      /definitions     # Event type definitions
      /handlers        # Event handlers
    /effects           # Long-running processes, scheduled jobs
    /services          # Internal business logic services
    /config            # Configuration schemas and defaults
    /tests             # Module tests
    module.ts          # Module manifest
```

### Integration with Existing Gati Infrastructure

The module system integrates with:

1. **Existing Module Loader** (`packages/runtime/src/module-loader.ts`): Extended to support the new module manifest format and lifecycle
2. **Module Registry** (`packages/runtime/src/module-registry.ts`): Used for tracking module state and metadata
3. **Handler Analyzer** (`packages/cli/src/analyzer/handler-analyzer.ts`): Extended to discover and analyze module handlers
4. **App Core** (`packages/runtime/src/app-core.ts`): Integrates module handlers into the HTTP server
5. **Context System**: Modules access global and local context for services and state

## Components and Interfaces

### Module Manifest Interface

```typescript
interface ModuleManifest<TConfig = unknown, TExports = unknown> {
  // Required metadata
  name: string;
  version: string;
  namespace: string;
  
  // Optional metadata
  description?: string;
  author?: string;
  license?: string;
  
  // Dependencies
  dependencies?: string[];
  optionalDependencies?: string[];
  
  // Exports declaration
  exports: {
    services?: string[];
    validators?: string[];
    events?: string[];
    types?: string[];
    handlers?: string[];
    effects?: string[];
  };
  
  // Configuration
  configSchema?: GatiTypeSchema<TConfig>;
  defaultConfig?: Partial<TConfig>;
  
  // Capabilities
  capabilities?: {
    requiresDB?: boolean;
    requiresCache?: boolean;
    usesBackgroundWorkers?: boolean;
    requiresWebSocket?: boolean;
  };
  
  // Lifecycle hooks
  setup?: (ctx: ModuleSetupContext<TConfig>) => Promise<void> | void;
  shutdown?: () => Promise<void> | void;
  healthCheck?: () => Promise<boolean> | boolean;
  
  // Module exports (actual functionality)
  provide?: () => TExports | Promise<TExports>;
}

interface ModuleSetupContext<TConfig = unknown> {
  config: TConfig;
  container: ServiceContainer;
  logger: Logger;
  eventBus: EventBus;
  db?: DatabaseConnection;
  cache?: CacheConnection;
  capabilities: ResolvedCapabilities;
  pluginMetadata?: PluginMetadata;
}
```

### Module Discovery Service

```typescript
interface ModuleDiscoveryService {
  /**
   * Discover all modules in the project
   */
  discoverModules(options: DiscoveryOptions): Promise<DiscoveredModule[]>;
  
  /**
   * Scan a specific directory for modules
   */
  scanDirectory(dir: string): Promise<DiscoveredModule[]>;
  
  /**
   * Discover plugin modules from node_modules
   */
  discoverPlugins(): Promise<DiscoveredModule[]>;
}

interface DiscoveryOptions {
  projectRoot: string;
  includeCore?: boolean;
  includePlugins?: boolean;
  includeLocal?: boolean;
}

interface DiscoveredModule {
  name: string;
  path: string;
  type: 'core' | 'plugin' | 'local';
  manifestPath: string;
}
```

### Module Validator

```typescript
interface ModuleValidator {
  /**
   * Validate a module manifest
   */
  validateManifest(manifest: ModuleManifest): ValidationResult;
  
  /**
   * Validate module directory structure
   */
  validateStructure(modulePath: string): ValidationResult;
  
  /**
   * Validate module exports exist
   */
  validateExports(manifest: ModuleManifest, modulePath: string): ValidationResult;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning';
}
```

### Dependency Resolver

```typescript
interface DependencyResolver {
  /**
   * Resolve module dependencies and determine load order
   */
  resolve(modules: ModuleManifest[]): DependencyResolution;
  
  /**
   * Detect circular dependencies
   */
  detectCycles(modules: ModuleManifest[]): CircularDependency[];
  
  /**
   * Build dependency graph
   */
  buildGraph(modules: ModuleManifest[]): DependencyGraph;
}

interface DependencyResolution {
  loadOrder: string[];
  dependencyMap: Map<string, string[]>;
  cycles: CircularDependency[];
}

interface CircularDependency {
  cycle: string[];
  severity: 'error' | 'warning';
}

interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: DependencyEdge[];
}

interface DependencyNode {
  name: string;
  dependencies: string[];
  dependents: string[];
}

interface DependencyEdge {
  from: string;
  to: string;
  optional: boolean;
}
```

### Configuration Manager

```typescript
interface ConfigurationManager {
  /**
   * Merge configurations from multiple sources
   */
  mergeConfigs<T>(
    sources: ConfigSource[],
    schema: GatiTypeSchema<T>
  ): MergedConfig<T>;
  
  /**
   * Validate configuration against schema
   */
  validateConfig<T>(
    config: unknown,
    schema: GatiTypeSchema<T>
  ): ValidationResult;
  
  /**
   * Resolve environment variable overrides
   */
  resolveEnvOverrides(
    config: Record<string, unknown>,
    prefix: string
  ): Record<string, unknown>;
}

interface ConfigSource {
  name: string;
  priority: number;
  data: Record<string, unknown>;
}

interface MergedConfig<T> {
  config: T;
  sources: ConfigSource[];
  overrides: ConfigOverride[];
}

interface ConfigOverride {
  field: string;
  source: string;
  oldValue: unknown;
  newValue: unknown;
}
```

### Type Generator

```typescript
interface TypeGenerator {
  /**
   * Generate TypeScript types for a module
   */
  generateModuleTypes(
    manifest: ModuleManifest,
    modulePath: string
  ): GeneratedTypes;
  
  /**
   * Generate types from Gati validators
   */
  generateFromSchema(schema: GatiTypeSchema): string;
  
  /**
   * Write generated types to file
   */
  writeTypes(types: GeneratedTypes, outputPath: string): Promise<void>;
}

interface GeneratedTypes {
  moduleName: string;
  types: {
    config?: string;
    handlers?: Record<string, HandlerTypes>;
    events?: Record<string, string>;
    effects?: Record<string, string>;
    models?: Record<string, string>;
  };
  imports: string[];
  exports: string[];
}

interface HandlerTypes {
  input: string;
  output: string;
  params?: string;
}
```

### Service Container

```typescript
interface ServiceContainer {
  /**
   * Register a service
   */
  register<T>(
    key: string,
    factory: ServiceFactory<T>,
    options?: ServiceOptions
  ): void;
  
  /**
   * Resolve a service
   */
  resolve<T>(key: string): Promise<T>;
  
  /**
   * Resolve a service synchronously (only for singletons)
   */
  resolveSync<T>(key: string): T;
  
  /**
   * Check if a service is registered
   */
  has(key: string): boolean;
  
  /**
   * Get all registered service keys
   */
  keys(): string[];
}

type ServiceFactory<T> = (container: ServiceContainer) => T | Promise<T>;

interface ServiceOptions {
  singleton?: boolean;
  lazy?: boolean;
  dependencies?: string[];
}
```

### Handler Registry

```typescript
interface HandlerRegistry {
  /**
   * Register a handler from a module
   */
  registerHandler(
    moduleName: string,
    handler: HandlerDefinition
  ): void;
  
  /**
   * Get all handlers for a module
   */
  getModuleHandlers(moduleName: string): HandlerDefinition[];
  
  /**
   * Build handler tree for routing
   */
  buildHandlerTree(): HandlerTree;
}

interface HandlerDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  handler: Handler;
  inputSchema?: GatiTypeSchema;
  outputSchema?: GatiTypeSchema;
  middleware?: Middleware[];
  rateLimit?: RateLimitConfig;
  security?: SecurityPolicy;
}

interface HandlerTree {
  routes: Map<string, RouteNode>;
  conflicts: RouteConflict[];
}

interface RouteNode {
  path: string;
  handlers: Map<string, HandlerDefinition>;
  children: Map<string, RouteNode>;
}

interface RouteConflict {
  path: string;
  method: string;
  modules: string[];
}
```

### Event System

```typescript
interface EventRegistry {
  /**
   * Register an event definition
   */
  registerEvent(
    moduleName: string,
    event: EventDefinition
  ): void;
  
  /**
   * Register an event handler
   */
  registerEventHandler(
    moduleName: string,
    handler: EventHandlerDefinition
  ): void;
  
  /**
   * Build event graph
   */
  buildEventGraph(): EventGraph;
}

interface EventDefinition {
  name: string;
  scope: 'local' | 'global' | 'external';
  payloadSchema: GatiTypeSchema;
}

interface EventHandlerDefinition {
  eventName: string;
  handler: EventHandler;
  priority?: number;
  async?: boolean;
}

type EventHandler = (
  ctx: EventContext,
  payload: unknown
) => void | Promise<void>;

interface EventContext {
  eventName: string;
  moduleName: string;
  timestamp: number;
  traceId: string;
}

interface EventGraph {
  events: Map<string, EventNode>;
  handlers: Map<string, EventHandlerNode[]>;
}

interface EventNode {
  name: string;
  scope: 'local' | 'global' | 'external';
  emitters: string[];
}

interface EventHandlerNode {
  moduleName: string;
  handler: EventHandler;
  priority: number;
}
```

### Effect Scheduler

```typescript
interface EffectScheduler {
  /**
   * Register an effect
   */
  registerEffect(
    moduleName: string,
    effect: EffectDefinition
  ): void;
  
  /**
   * Start all registered effects
   */
  start(): Promise<void>;
  
  /**
   * Stop all effects
   */
  stop(): Promise<void>;
  
  /**
   * Get effect status
   */
  getStatus(effectName: string): EffectStatus;
}

interface EffectDefinition {
  name: string;
  type: 'cron' | 'workflow' | 'subscriber' | 'durable';
  schedule?: string; // Cron expression
  handler: EffectHandler;
  timeout?: number;
  retries?: number;
}

type EffectHandler = (ctx: EffectContext) => void | Promise<void>;

interface EffectContext {
  effectName: string;
  moduleName: string;
  logger: Logger;
  services: ServiceContainer;
  eventBus: EventBus;
}

interface EffectStatus {
  name: string;
  state: 'idle' | 'running' | 'error' | 'stopped';
  lastRun?: Date;
  nextRun?: Date;
  error?: Error;
}
```

### Module Loader (Extended)

```typescript
interface ExtendedModuleLoader {
  /**
   * Load all discovered modules
   */
  loadModules(
    discovered: DiscoveredModule[],
    options: LoadOptions
  ): Promise<LoadedModule[]>;
  
  /**
   * Initialize modules in dependency order
   */
  initializeModules(
    modules: LoadedModule[],
    gctx: GlobalContext
  ): Promise<void>;
  
  /**
   * Shutdown all modules
   */
  shutdownModules(): Promise<void>;
  
  /**
   * Hot reload a module
   */
  reloadModule(moduleName: string): Promise<void>;
}

interface LoadOptions {
  validateStructure?: boolean;
  generateTypes?: boolean;
  strictDependencies?: boolean;
}

interface LoadedModule {
  manifest: ModuleManifest;
  path: string;
  config: unknown;
  exports: unknown;
  state: ModuleState;
}
```

## Data Models

### Module Manifest File Format

```typescript
// Example: modules/users/module.ts
import { defineModule, GatiTypes } from '@gati-framework/core';

export default defineModule({
  name: 'users',
  version: '1.0.0',
  namespace: 'gati.users',
  description: 'User management module',
  
  dependencies: ['auth', 'database'],
  
  exports: {
    services: ['UserService', 'UserRepository'],
    events: ['UserCreated', 'UserUpdated', 'UserDeleted'],
    handlers: ['getUser', 'createUser', 'updateUser', 'deleteUser'],
  },
  
  configSchema: GatiTypes.object({
    defaultRole: GatiTypes.string().default('member'),
    enableEmailVerification: GatiTypes.boolean().default(true),
    maxLoginAttempts: GatiTypes.number().min(1).default(5),
  }),
  
  capabilities: {
    requiresDB: true,
    requiresCache: true,
    usesBackgroundWorkers: false,
  },
  
  setup: async (ctx) => {
    ctx.logger.info('Initializing users module');
    
    // Register services
    ctx.container.register('users.UserService', () => new UserService(ctx));
    ctx.container.register('users.UserRepository', () => new UserRepository(ctx));
    
    // Subscribe to events
    ctx.eventBus.on('auth.LoginFailed', async (payload) => {
      await handleLoginFailure(payload);
    });
  },
  
  healthCheck: async () => {
    // Check database connection
    return true;
  },
});
```

### Handler Definition Format

```typescript
// Example: modules/users/handlers/get-user.ts
import { defineHandler, GatiTypes } from '@gati-framework/core';

export const getUser = defineHandler({
  method: 'GET',
  path: '/users/:id',
  
  input: GatiTypes.object({
    params: GatiTypes.object({
      id: GatiTypes.string().uuid(),
    }),
  }),
  
  output: GatiTypes.object({
    user: GatiTypes.object({
      id: GatiTypes.string(),
      email: GatiTypes.string(),
      name: GatiTypes.string(),
      role: GatiTypes.string(),
    }),
  }),
  
  handler: async (req, res, gctx, lctx) => {
    const userService = await gctx.modules['users.UserService'];
    const user = await userService.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  },
});
```

### Event Definition Format

```typescript
// Example: modules/users/events/definitions/user-created.ts
import { defineEvent, GatiTypes } from '@gati-framework/core';

export const UserCreated = defineEvent('UserCreated', {
  scope: 'global',
  payload: GatiTypes.object({
    id: GatiTypes.string().uuid(),
    email: GatiTypes.string().email(),
    name: GatiTypes.string(),
    createdAt: GatiTypes.number(),
  }),
});
```

### Event Handler Format

```typescript
// Example: modules/notifications/events/handlers/send-welcome-email.ts
import { defineEventHandler } from '@gati-framework/core';

export const SendWelcomeEmail = defineEventHandler({
  event: 'UserCreated',
  priority: 100,
  
  handler: async (ctx, payload) => {
    const emailService = await ctx.services.resolve('notifications.EmailService');
    await emailService.sendWelcomeEmail(payload.email, payload.name);
    
    ctx.logger.info({ userId: payload.id }, 'Welcome email sent');
  },
});
```

### Effect Definition Format

```typescript
// Example: modules/analytics/effects/sync-metrics.ts
import { defineEffect } from '@gati-framework/core';

export const SyncMetrics = defineEffect({
  name: 'SyncMetrics',
  type: 'cron',
  schedule: '0 * * * *', // Every hour
  
  handler: async (ctx) => {
    ctx.logger.info('Starting metrics sync');
    
    const analyticsService = await ctx.services.resolve('analytics.AnalyticsService');
    await analyticsService.syncMetrics();
    
    ctx.eventBus.emit('analytics.MetricsSynced', {
      timestamp: Date.now(),
    });
  },
});
```

### Generated Type Output

```typescript
// Example: .gati/types/users.d.ts
declare module '@gati/modules/users' {
  export interface UsersModuleConfig {
    defaultRole: string;
    enableEmailVerification: boolean;
    maxLoginAttempts: number;
  }
  
  export interface GetUserInput {
    params: {
      id: string;
    };
  }
  
  export interface GetUserOutput {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
  
  export interface UserCreatedPayload {
    id: string;
    email: string;
    name: string;
    createdAt: number;
  }
  
  export interface UserService {
    findById(id: string): Promise<User | null>;
    create(data: CreateUserData): Promise<User>;
    update(id: string, data: UpdateUserData): Promise<User>;
    delete(id: string): Promise<void>;
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing all testable properties from the prework, several opportunities for consolidation emerge:

**Consolidation Opportunities:**

1. **Module Structure Validation (1.1, 1.2, 1.4)**: These can be combined into a single comprehensive property about module structure validation
2. **Manifest Validation (2.1, 2.2, 2.3)**: These can be combined into a single property about manifest completeness and validity
3. **Dependency Resolution Output (3.1, 3.4)**: These overlap - both verify the dependency resolver produces correct output structure
4. **Configuration Merging (4.1, 4.4)**: These can be combined - both verify config merging produces correct output
5. **Type Generation Completeness (5.1, 5.2, 5.3)**: These can be combined into a single property about complete type generation
6. **Handler Registration (7.1, 7.2, 7.3, 7.5)**: These can be combined into a comprehensive handler registration property
7. **Event Registration (8.1, 8.2, 8.5)**: These can be combined into a comprehensive event registration property
8. **Effect Registration (9.1, 9.5)**: These can be combined into a comprehensive effect registration property
9. **Artifact Generation (15.1, 15.2, 15.3, 15.4, 15.5)**: These can be combined into a single property about complete artifact generation

**Redundancy Elimination:**

- Property 3.1 (graph construction) is subsumed by Property 3.4 (complete resolution output)
- Property 5.2 (file location) is subsumed by Property 5.1 (type generation)
- Property 7.1 (handler discovery) is subsumed by Property 7.5 (handler tree compilation)
- Property 8.1 (event discovery) is subsumed by Property 8.5 (event graph compilation)
- Property 9.1 (effect discovery) is subsumed by Property 9.5 (effect scheduler compilation)

After consolidation, we have a more focused set of properties that provide comprehensive validation without redundancy.

### Correctness Properties

Property 1: Module structure validation
*For any* module directory, validation should correctly identify whether it conforms to the standard structure (required folders and manifest file), and either create missing folders or report specific errors
**Validates: Requirements 1.1, 1.2, 1.4**

Property 2: Module discovery completeness
*For any* project directory structure, the discovery process should find all modules in src/modules, node_modules/gati-*, and bundled core locations
**Validates: Requirements 1.3**

Property 3: Module isolation enforcement
*For any* pair of modules, the system should prevent direct access to internal implementations and enforce interaction only through declared exports
**Validates: Requirements 1.5**

Property 4: Manifest validation completeness
*For any* module manifest, validation should verify all required fields (name, version, namespace) are present, all declared dependencies exist, and all declared exports are present in the module
**Validates: Requirements 2.1, 2.2, 2.3**

Property 5: Async setup support
*For any* module with an async setup function, the system should correctly await its completion before proceeding
**Validates: Requirements 2.5**

Property 6: Dependency resolution correctness
*For any* set of modules with dependencies, the resolver should produce a load order where no module appears before its dependencies, detect all circular dependencies, and produce a complete dependency map
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

Property 7: Missing dependency detection
*For any* module with non-existent dependencies, the system should report all missing dependencies and prevent loading
**Validates: Requirements 3.5**

Property 8: Configuration merge precedence
*For any* set of configuration sources with conflicting values, the merged configuration should contain values from the highest-precedence source (runtime > plugin > environment > app > defaults)
**Validates: Requirements 4.1**

Property 9: Configuration validation
*For any* configuration and schema, validation should correctly identify invalid configurations and report specific errors with field names and expected types
**Validates: Requirements 4.2, 4.3**

Property 10: Configuration completeness
*For any* set of modules, configuration resolution should produce exactly one config entry per module
**Validates: Requirements 4.4**

Property 11: Environment variable override support
*For any* environment variables with nested paths (dot notation or underscores), they should correctly override the corresponding nested configuration properties
**Validates: Requirements 4.5**

Property 12: Type generation completeness
*For any* module with validators and schemas, the type generator should produce TypeScript definitions in .gati/types/<module>.d.ts containing all required type categories (ModuleConfig, HandlerInput/Output, Event Payloads, Effect contexts, models)
**Validates: Requirements 5.1, 5.2, 5.3**

Property 13: Type regeneration on change
*For any* module whose definitions change, the type generator should regenerate types that reflect the changes
**Validates: Requirements 5.4**

Property 14: Service registration naming
*For any* module with services, each service should be registered in the DI container with the key pattern `<moduleName>.<ServiceName>`
**Validates: Requirements 6.1**

Property 15: Service singleton behavior
*For any* service registered as a singleton, resolving it multiple times should return the same instance
**Validates: Requirements 6.2**

Property 16: Service dependency injection
*For any* service with dependencies, the container should instantiate it with all dependencies resolved
**Validates: Requirements 6.5**

Property 17: Handler registration completeness
*For any* module with handlers, the system should discover all handler files, extract all handler metadata (method, path, schemas, middleware), and compile them into a HandlerTree structure organized by module and path
**Validates: Requirements 7.1, 7.2, 7.3, 7.5**

Property 18: Handler runtime availability
*For any* registered handler, it should be callable via HTTP at its registered route and method
**Validates: Requirements 7.4**

Property 19: Event registration completeness
*For any* module with events, the system should discover all event definitions and handlers, validate payload schemas, and compile them into an EventGraph showing definitions and handlers
**Validates: Requirements 8.1, 8.2, 8.3, 8.5**

Property 20: Event scope support
*For any* event with a declared scope (local, global, external), the system should enforce the scope correctly (local events only visible to module, global events visible to all modules, external events emitted to external systems)
**Validates: Requirements 8.4**

Property 21: Effect registration completeness
*For any* module with effects, the system should discover all effect definitions, parse cron schedules, support all effect types (cron, workflow, subscriber, durable), and produce an EffectScheduler that manages execution
**Validates: Requirements 9.1, 9.2, 9.3, 9.5**

Property 22: Effect runtime scheduling
*For any* registered effect with a schedule, the runtime should register it as a cron job or background worker
**Validates: Requirements 9.4**

Property 23: Setup execution completeness
*For any* set of loaded modules, the system should call all setup functions in dependency-sorted order, awaiting async functions before proceeding
**Validates: Requirements 10.1, 10.2, 10.3**

Property 24: Setup context completeness
*For any* module setup function, the provided context should contain all required properties (config, service container, logger, event bus, db connections, capabilities, plugin metadata)
**Validates: Requirements 10.4**

Property 25: Setup failure handling
*For any* module with a failing setup function, the system should report the error and prevent application startup
**Validates: Requirements 10.5**

Property 26: Capability declaration support
*For any* module declaring capabilities (requiresDB, requiresCache, usesBackgroundWorkers), the system should recognize and validate them
**Validates: Requirements 11.1, 11.2**

Property 27: Capability satisfaction validation
*For any* module with unsatisfiable capabilities, the system should report the missing capability and prevent module loading
**Validates: Requirements 11.4**

Property 28: Capability resource provisioning
*For any* module with satisfied capabilities, the setup context should provide access to the provisioned resources
**Validates: Requirements 11.5**

Property 29: Plugin security consistency
*For any* plugin module, the system should apply the same security boundaries and restrictions as core modules
**Validates: Requirements 12.4**

Property 30: Plugin discovery
*For any* npm package matching the pattern gati-* in node_modules, the system should discover it as a plugin module
**Validates: Requirements 13.1**

Property 31: Plugin loading consistency
*For any* plugin module, it should be loaded, validated, and initialized using the same pipeline as core modules
**Validates: Requirements 13.2, 13.5**

Property 32: Plugin capability support
*For any* plugin module, it should be able to add handlers, events, effects, override configs, provide validators, and extend existing modules
**Validates: Requirements 13.3**

Property 33: Plugin dependency resolution
*For any* plugin module with dependencies on core modules, the dependency resolver should include them in the unified dependency graph
**Validates: Requirements 13.4**

Property 34: Test discovery
*For any* module with test files in /tests/*, the system should discover all test files
**Validates: Requirements 14.1**

Property 35: Test result reporting
*For any* completed test run, the system should report results with pass/fail status and coverage metrics
**Validates: Requirements 14.5**

Property 36: Artifact generation completeness
*For any* loaded modules with handlers, events, and configuration, the system should generate all required artifacts (.gati/types/*.d.ts, .gati/module-graph.json, .gati/openapi.json, .gati/event-graph.json, .gati/runtime-config.json)
**Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5**

## Error Handling

### Error Categories

1. **Discovery Errors**
   - Module directory not found
   - Invalid module structure
   - Missing manifest file
   - Malformed manifest

2. **Validation Errors**
   - Missing required manifest fields
   - Invalid dependency references
   - Missing declared exports
   - Invalid configuration schema
   - Schema validation failures

3. **Dependency Errors**
   - Circular dependencies
   - Missing dependencies
   - Incompatible versions
   - Dependency resolution timeout

4. **Configuration Errors**
   - Invalid configuration values
   - Type mismatches
   - Missing required configuration
   - Environment variable parsing errors

5. **Registration Errors**
   - Duplicate service names
   - Route conflicts
   - Event name conflicts
   - Invalid handler definitions

6. **Lifecycle Errors**
   - Setup function failures
   - Initialization timeouts
   - Shutdown failures
   - Health check failures

7. **Capability Errors**
   - Unsatisfied capabilities
   - Resource provisioning failures
   - Permission errors

8. **Security Errors**
   - Unauthorized cross-module access
   - Invalid export access
   - Security boundary violations

### Error Handling Strategy

**Fail Fast**: The module system should fail fast during initialization if critical errors are detected (missing dependencies, circular dependencies, validation failures). This prevents the application from starting in an invalid state.

**Detailed Error Messages**: All errors should include:
- Error code for programmatic handling
- Human-readable message
- Context (module name, field name, etc.)
- Suggestions for resolution when possible

**Error Recovery**: For non-critical errors (warnings), the system should:
- Log the warning
- Continue with safe defaults
- Track warnings for later review

**Error Aggregation**: During validation, collect all errors before reporting to provide complete feedback rather than failing on the first error.

### Error Response Format

```typescript
interface ModuleSystemError extends Error {
  code: string;
  moduleName?: string;
  field?: string;
  context?: Record<string, unknown>;
  suggestions?: string[];
  severity: 'error' | 'warning';
}
```

### Example Error Messages

```typescript
// Missing dependency
{
  code: 'MODULE_DEPENDENCY_NOT_FOUND',
  message: 'Module "users" depends on "auth" which is not registered',
  moduleName: 'users',
  field: 'dependencies',
  suggestions: [
    'Install the auth module',
    'Remove the dependency from the manifest',
    'Check for typos in the dependency name'
  ],
  severity: 'error'
}

// Circular dependency
{
  code: 'MODULE_CIRCULAR_DEPENDENCY',
  message: 'Circular dependency detected: users -> auth -> users',
  context: {
    cycle: ['users', 'auth', 'users']
  },
  suggestions: [
    'Refactor modules to remove circular dependency',
    'Extract shared functionality into a separate module'
  ],
  severity: 'error'
}

// Configuration validation
{
  code: 'MODULE_CONFIG_VALIDATION_FAILED',
  message: 'Configuration validation failed for module "users"',
  moduleName: 'users',
  field: 'config.maxLoginAttempts',
  context: {
    expected: 'number >= 1',
    received: -5
  },
  suggestions: [
    'Set maxLoginAttempts to a positive number',
    'Check environment variable USER_MAX_LOGIN_ATTEMPTS'
  ],
  severity: 'error'
}
```

## Testing Strategy

### Unit Testing

Unit tests will verify individual components of the module system in isolation:

**Module Discovery**
- Test discovery of modules in different locations
- Test filtering by module type
- Test handling of missing directories

**Module Validation**
- Test manifest validation with various invalid manifests
- Test structure validation with various directory layouts
- Test export validation with missing exports

**Dependency Resolution**
- Test topological sorting with various dependency graphs
- Test circular dependency detection
- Test missing dependency detection

**Configuration Management**
- Test configuration merging with various source combinations
- Test schema validation with valid and invalid configs
- Test environment variable parsing

**Type Generation**
- Test type generation from various schema types
- Test file output and formatting
- Test incremental regeneration

**Service Container**
- Test service registration and resolution
- Test singleton behavior
- Test dependency injection

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using **fast-check** (JavaScript/TypeScript property testing library):

**Testing Framework**: fast-check
**Minimum Iterations**: 100 runs per property

Each property-based test will be tagged with a comment referencing the correctness property:

```typescript
// Feature: module-system, Property 6: Dependency resolution correctness
test('dependency resolution produces valid load order', () => {
  fc.assert(
    fc.property(
      moduleSetArbitrary(),
      (modules) => {
        const resolution = dependencyResolver.resolve(modules);
        // Verify no module appears before its dependencies
        return verifyLoadOrder(resolution.loadOrder, modules);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test Coverage**:
- All 36 correctness properties will have corresponding property-based tests
- Tests will use smart generators that produce valid and edge-case inputs
- Generators will be designed to explore the input space intelligently

**Example Generators**:

```typescript
// Generate random module manifests
const moduleManifestArbitrary = () =>
  fc.record({
    name: fc.string({ minLength: 1 }),
    version: fc.string({ pattern: /^\d+\.\d+\.\d+$/ }),
    namespace: fc.string({ pattern: /^gati\.[a-z]+$/ }),
    dependencies: fc.array(fc.string()),
    exports: fc.record({
      services: fc.array(fc.string()),
      events: fc.array(fc.string()),
    }),
  });

// Generate dependency graphs with known properties
const dependencyGraphArbitrary = () =>
  fc.array(moduleManifestArbitrary(), { minLength: 1, maxLength: 20 });

// Generate configuration sources
const configSourceArbitrary = () =>
  fc.record({
    name: fc.constantFrom('defaults', 'app', 'env', 'plugin', 'runtime'),
    priority: fc.integer({ min: 1, max: 5 }),
    data: fc.dictionary(fc.string(), fc.anything()),
  });
```

### Integration Testing

Integration tests will verify the module system works correctly with the Gati runtime:

**Module Loading Integration**
- Test loading modules into a running Gati application
- Test handler registration and HTTP routing
- Test event emission and handling
- Test effect scheduling

**Plugin Integration**
- Test loading plugin modules from node_modules
- Test plugin interaction with core modules
- Test plugin configuration overrides

**Lifecycle Integration**
- Test module startup sequence
- Test graceful shutdown
- Test health checks

### Test Organization

```
tests/
  unit/
    module-system/
      discovery.test.ts
      validation.test.ts
      dependency-resolution.test.ts
      configuration.test.ts
      type-generation.test.ts
      service-container.test.ts
  property/
    module-system/
      module-structure.property.test.ts
      dependency-resolution.property.test.ts
      configuration-merge.property.test.ts
      handler-registration.property.test.ts
      event-system.property.test.ts
  integration/
    module-system/
      module-loading.integration.test.ts
      plugin-system.integration.test.ts
      lifecycle.integration.test.ts
```

### Test Utilities

The module system will provide test utilities for module developers:

```typescript
// Mock module context
export function createMockModuleContext<T>(
  config?: Partial<T>
): ModuleSetupContext<T>;

// Mock service container
export function createMockContainer(): ServiceContainer;

// Mock event bus
export function createMockEventBus(): EventBus;

// Test module builder
export function buildTestModule(
  overrides?: Partial<ModuleManifest>
): ModuleManifest;
```

## Implementation Notes

### Phase 1: Core Infrastructure
1. Module discovery service
2. Module validator
3. Dependency resolver
4. Configuration manager

### Phase 2: Registration Systems
1. Service container
2. Handler registry
3. Event registry
4. Effect scheduler

### Phase 3: Type Generation
1. Type generator
2. Schema-to-TypeScript converter
3. File writer

### Phase 4: Runtime Integration
1. Extended module loader
2. Lifecycle orchestration
3. Runtime binding

### Phase 5: Plugin System
1. Plugin discovery
2. Plugin validation
3. Plugin loading

### Phase 6: Developer Experience
1. CLI commands
2. Test utilities
3. Documentation generation
4. Error messages

### Performance Considerations

- **Lazy Loading**: Modules should be loaded lazily when possible to reduce startup time
- **Caching**: Module manifests and generated types should be cached to avoid redundant work
- **Parallel Processing**: Independent modules can be validated and loaded in parallel
- **Incremental Updates**: Type generation and validation should be incremental when possible

### Security Considerations

- **Sandbox Evaluation**: Module manifests should be loaded in a sandboxed environment
- **Path Validation**: All file paths should be validated to prevent directory traversal
- **Dependency Verification**: Plugin dependencies should be verified against a whitelist
- **Code Signing**: Consider requiring signed plugins for production use

### Backward Compatibility

The module system should maintain backward compatibility with existing Gati applications:

- Existing handler files should continue to work without modification
- Existing module loader API should remain functional
- Migration path should be provided for converting to the new module system
- Both old and new systems should be able to coexist during migration
