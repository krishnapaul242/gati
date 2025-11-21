# Requirements Document

## Introduction

The Gati Module System provides a structured, plugin-friendly ecosystem for composing application logic with strict contracts for isolation, dependency resolution, configuration merging, type generation, runtime binding, and lifecycle handling. This system enables developers to build self-contained packages of functionality that can be discovered, validated, configured, and executed by the Gati runtime.

## Glossary

- **Module**: A self-contained package of functionality containing definitions, APIs, events, effects, services, and optional storage adapters
- **Plugin Module**: A module authored by external developers that extends or enhances core modules
- **Module Instance**: A fully resolved and hydrated module with bound dependencies, resolved configuration, and registered runtime components
- **Module Manifest**: The `module.ts` file that declares a module's metadata, dependencies, exports, and configuration schema
- **Service Container**: The dependency injection system that manages service instances and cross-module dependencies
- **Handler Tree**: The compiled routing structure mapping HTTP endpoints to handler functions
- **Event Graph**: The compiled event topology showing event definitions and their handlers
- **Effect Scheduler**: The runtime component that manages long-running processes, scheduled jobs, and background workers
- **Capability Flags**: Module declarations indicating required infrastructure (database, cache, workers)
- **Namespace**: A unique identifier for runtime resolution and global event routing in the format `gati.<moduleName>`

## Requirements

### Requirement 1

**User Story:** As a developer, I want to create self-contained modules with a standard directory structure, so that I can organize my application logic in a consistent and maintainable way.

#### Acceptance Criteria

1. WHEN a developer creates a module THEN the system SHALL enforce the standard directory structure with folders for apis, definitions, handlers, events, effects, services, config, and tests
2. WHEN a module is created THEN the system SHALL require a module.ts manifest file at the module root
3. WHEN the system scans for modules THEN the system SHALL discover modules in src/modules, node_modules/gati-*, and bundled core modules
4. WHEN a module directory is missing required folders THEN the system SHALL create them during initialization or provide clear error messages
5. WHEN multiple modules exist THEN the system SHALL maintain isolation between module internal implementations

### Requirement 2

**User Story:** As a developer, I want to define module metadata in a manifest file, so that the system can understand my module's dependencies, exports, and configuration requirements.

#### Acceptance Criteria

1. WHEN a module manifest is created THEN the system SHALL require name, version, and namespace fields
2. WHEN a module declares dependencies THEN the system SHALL validate that all dependency names reference existing modules
3. WHEN a module declares exports THEN the system SHALL validate that exported services, events, types, handlers, and effects exist in the module
4. WHEN a module defines a configSchema THEN the system SHALL use Gati's type-extended validators for schema definition
5. WHEN a module includes a setup function THEN the system SHALL support async execution during module initialization

### Requirement 3

**User Story:** As a developer, I want the system to automatically resolve module dependencies, so that modules are loaded in the correct order without circular dependency issues.

#### Acceptance Criteria

1. WHEN modules declare dependencies THEN the system SHALL construct a dependency graph
2. WHEN the dependency graph is constructed THEN the system SHALL perform topological sorting to determine load order
3. WHEN circular dependencies are detected THEN the system SHALL report all cycles with module names and prevent loading
4. WHEN dependencies are resolved THEN the system SHALL produce a loadOrder array, cycles array, and dependencyMap
5. WHEN a module depends on a non-existent module THEN the system SHALL report the missing dependency and prevent loading

### Requirement 4

**User Story:** As a developer, I want module configurations to be merged from multiple sources with clear precedence, so that I can override settings at different levels.

#### Acceptance Criteria

1. WHEN configurations are merged THEN the system SHALL apply sources in order: module defaults, app config, environment overrides, plugin overrides, runtime overrides
2. WHEN a module defines a configSchema THEN the system SHALL validate the merged configuration against that schema
3. WHEN configuration validation fails THEN the system SHALL report specific validation errors with field names and expected types
4. WHEN configuration is resolved THEN the system SHALL produce a moduleConfig record with one entry per module
5. WHEN environment variables override config THEN the system SHALL support nested property paths using dot notation or underscores

### Requirement 5

**User Story:** As a developer, I want TypeScript types to be automatically generated from my module definitions, so that I have type safety across my application.

#### Acceptance Criteria

1. WHEN modules define validators and schemas THEN the system SHALL generate corresponding TypeScript type definitions
2. WHEN types are generated THEN the system SHALL create files in .gati/types/<module>.d.ts
3. WHEN types are generated THEN the system SHALL include ModuleConfig types, HandlerInput/Output types, Event Payload types, Effect context types, and shared model types
4. WHEN module definitions change THEN the system SHALL regenerate types to reflect the changes
5. WHEN generated types are imported THEN the system SHALL provide full IDE autocomplete and type checking

### Requirement 6

**User Story:** As a developer, I want services to be registered in a dependency injection container, so that I can access cross-module services without direct imports.

#### Acceptance Criteria

1. WHEN a module contains services THEN the system SHALL register each service in the DI container with the pattern `<moduleName>.<ServiceName>`
2. WHEN services are registered THEN the system SHALL treat them as singletons unless explicitly configured otherwise
3. WHEN a module needs a service from another module THEN the system SHALL resolve it only via the container
4. WHEN direct cross-module imports are attempted THEN the system SHALL prevent them through linting or runtime checks
5. WHEN a service is requested THEN the system SHALL instantiate it with all its dependencies resolved

### Requirement 7

**User Story:** As a developer, I want handlers to be automatically discovered and registered, so that my API endpoints are available without manual routing configuration.

#### Acceptance Criteria

1. WHEN a module contains handler files THEN the system SHALL parse each file in /handlers/*.ts
2. WHEN a handler is defined THEN the system SHALL extract method, path, input schema, output schema, and handler function
3. WHEN handlers are registered THEN the system SHALL store route, validation schema, rate limits, transformations, and security policies
4. WHEN the runtime starts THEN the system SHALL make all registered routes available to the HTTP server
5. WHEN handlers are compiled THEN the system SHALL produce a HandlerTree structure organizing routes by module and path

### Requirement 8

**User Story:** As a developer, I want to define and handle events within and across modules, so that I can build loosely coupled, event-driven architectures.

#### Acceptance Criteria

1. WHEN a module defines events THEN the system SHALL register event definitions from events/definitions/*.ts
2. WHEN a module defines event handlers THEN the system SHALL register handlers from events/handlers/*.ts
3. WHEN an event is defined THEN the system SHALL validate the payload schema using Gati validators
4. WHEN events are registered THEN the system SHALL support local events (module-only), global events (all modules), and external events (Kafka/SQS)
5. WHEN events are compiled THEN the system SHALL produce an EventGraph showing event definitions and their handlers

### Requirement 9

**User Story:** As a developer, I want to define long-running processes and scheduled jobs as effects, so that I can handle background work within the module system.

#### Acceptance Criteria

1. WHEN a module defines effects THEN the system SHALL register effect definitions from effects/*.ts
2. WHEN an effect includes a schedule THEN the system SHALL support cron expression syntax
3. WHEN effects are registered THEN the system SHALL support workflows, scheduled jobs, subscribers, durable processes, and saga orchestration
4. WHEN the runtime starts THEN the system SHALL register cron jobs or background workers for each effect
5. WHEN effects are compiled THEN the system SHALL produce an EffectScheduler that manages execution

### Requirement 10

**User Story:** As a developer, I want modules to execute setup logic in dependency order, so that initialization happens correctly with all dependencies available.

#### Acceptance Criteria

1. WHEN all modules are loaded THEN the system SHALL call each module's setup function
2. WHEN setup functions are called THEN the system SHALL execute them in dependency-sorted order
3. WHEN a setup function is async THEN the system SHALL await its completion before proceeding to the next module
4. WHEN setup is called THEN the system SHALL provide context including config, service container, logger, event bus, db connections, capabilities, and plugin metadata
5. WHEN a setup function fails THEN the system SHALL report the error and prevent application startup

### Requirement 11

**User Story:** As a developer, I want modules to declare capability requirements, so that the runtime can automatically provision necessary infrastructure.

#### Acceptance Criteria

1. WHEN a module declares capabilities THEN the system SHALL support flags for requiresDB, requiresCache, and usesBackgroundWorkers
2. WHEN capabilities are declared THEN the system SHALL validate that the runtime environment can satisfy them
3. WHEN the runtime starts THEN the system SHALL auto-provision infrastructure based on declared capabilities
4. WHEN a capability cannot be satisfied THEN the system SHALL report the missing capability and prevent module loading
5. WHEN capabilities are resolved THEN the system SHALL provide access to provisioned resources through the module context

### Requirement 12

**User Story:** As a developer, I want to enforce security boundaries between modules, so that modules cannot bypass the module system's isolation guarantees.

#### Acceptance Criteria

1. WHEN a module attempts direct imports of another module's internal files THEN the system SHALL prevent the import
2. WHEN modules interact THEN the system SHALL allow only public exports via manifest, DI container resolution, event emission, and API consumption
3. WHEN a module accesses another module's functionality THEN the system SHALL enforce that access goes through declared exports
4. WHEN plugin modules are loaded THEN the system SHALL apply the same security boundaries as core modules
5. WHEN security violations are detected THEN the system SHALL report the violation with module names and attempted access

### Requirement 13

**User Story:** As a developer, I want to install and use plugin modules from npm, so that I can extend my application with community or third-party functionality.

#### Acceptance Criteria

1. WHEN a plugin module is installed via npm THEN the system SHALL discover it by scanning node_modules/gati-* directories
2. WHEN plugin modules are discovered THEN the system SHALL load them using the same pipeline as core modules
3. WHEN a plugin module is loaded THEN the system SHALL allow it to add handlers, events, effects, override configs, provide validators, and extend existing modules
4. WHEN plugin modules declare dependencies THEN the system SHALL resolve them in the same dependency graph as core modules
5. WHEN plugin modules are loaded THEN the system SHALL validate their manifests with the same rules as core modules

### Requirement 14

**User Story:** As a developer, I want to test my modules in isolation, so that I can verify functionality without running the entire application.

#### Acceptance Criteria

1. WHEN a module contains tests THEN the system SHALL discover test files in /tests/*
2. WHEN module tests run THEN the system SHALL support unit tests for services, integration tests for handlers, event bus simulations, and effect simulations
3. WHEN the CLI test command is executed THEN the system SHALL run tests for specified modules using the pattern `gati test modules.<moduleName>`
4. WHEN tests need dependencies THEN the system SHALL provide mock services through the Gati CLI
5. WHEN tests complete THEN the system SHALL report results with pass/fail status and coverage metrics

### Requirement 15

**User Story:** As a developer, I want the system to generate runtime artifacts, so that I can inspect module structure, API schemas, and event topology.

#### Acceptance Criteria

1. WHEN modules are loaded THEN the system SHALL generate .gati/types/*.d.ts files for type definitions
2. WHEN modules are loaded THEN the system SHALL generate .gati/module-graph.json showing the dependency graph
3. WHEN handlers are registered THEN the system SHALL generate .gati/openapi.json with API schema documentation
4. WHEN events are registered THEN the system SHALL generate .gati/event-graph.json showing event topology
5. WHEN configuration is resolved THEN the system SHALL generate .gati/runtime-config.json with merged configurations
