# Changelog

## [1.2.0] - 2025-11-28

### Added
- **Full Protobuf serialization** - Complete implementation using protobufjs
- **Full MessagePack serialization** - Binary serialization support
- **Validation caching** - Improved performance for repeated validations
- **Migration guide** - Complete documentation for migrating from runtime types
- **Advanced test coverage** - 47+ tests including edge cases and round-trip tests
- **Serialization tests** - Cross-format compatibility tests
- **Edge case tests** - Comprehensive validation edge case coverage

### Changed
- Bumped version to 1.2.0 (minor release - new features)
- Updated dependencies: protobufjs@7.5.4, @msgpack/msgpack@3.1.2
- Enhanced validation utilities with caching statistics

### Fixed
- TypeScript compilation errors in serialization module
- Test imports for validation functions

## [1.1.0] - 2025-11-XX

### Added
- Core runtime contracts (envelopes, handlers, contexts, modules)
- JSON Schema definitions for all contracts
- Protobuf definitions for all contracts
- Validation utilities with Ajv
- CLI tool for contract validation
- Comprehensive test suite (24 tests)
- Full documentation

### Initial Release
- Observability contracts (metrics, tracing, logging)
- Deployment contracts (Kubernetes, manifests)
