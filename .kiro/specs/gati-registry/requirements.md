# Requirements Document

## Introduction

The Gati Registry is a unified, secure, multi-artifact registry that serves as the official distribution hub for the Gati ecosystem. It stores and distributes modules (JS/TS, OCI images, WASM, binaries, external adapters), plugins, AI models, AI agents, templates, and environment snapshots. The Registry integrates deeply with Timescape for versioning, supports marketplace monetization, and powers Gati Cloud deployments. It is the first online component of Gati Dev Cloud and serves as the foundation for the entire Gati ecosystem, similar to npm, Docker Hub, and HuggingFace Hub combined.

## Glossary

- **Gati Registry**: The official distribution hub for all Gati artifacts including modules, plugins, models, agents, and templates
- **Artifact**: Any distributable component stored in the registry (module, plugin, model, agent, template)
- **OCI Artifact**: Container image or artifact stored in OCI-compliant format
- **Namespace**: A unique identifier for publishers in the format `gati.dev/users/<username>` or `gati.dev/orgs/<org>`
- **Publisher**: A verified user or organization that can publish artifacts to the registry
- **Module Artifact**: A Gati module packaged as an OCI artifact (JS/TS, Docker, WASM, binary, or external adapter)
- **Plugin Artifact**: An extension that adds capabilities to Gati (brands, middleware, resolvers, DB adapters, auth systems)
- **Model Artifact**: AI/ML models packaged for Gati (WASM models, ONNX, TensorRT, LLMs, embeddings)
- **Agent Artifact**: AI agents packaged as recipe YAML with model references and skill graphs
- **Template Artifact**: Reusable app starters, boilerplates, and examples
- **Signature**: Cryptographic signature for artifact verification using cosign/sigstore
- **Metadata Index**: Searchable index of artifact metadata including namespaces, versions, tags, GTypes, and publisher info
- **Marketplace**: Monetization layer enabling paid modules, plugins, models, and agents
- **Publisher Verification**: Process to verify and trust artifact publishers
- **Vulnerability Scanning**: Automated security scanning for CVEs, malicious code, and model poisoning

## Requirements

### Requirement 1

**User Story:** As a developer, I want to publish modules to the Gati Registry, so that I can share my work with the community and enable reuse.

#### Acceptance Criteria

1. WHEN a developer runs `gati module publish` THEN the system SHALL bundle the module, generate manifest, sign the artifact, and upload to the Registry
2. WHEN a module is published THEN the system SHALL support all module types: node, oci, wasm, binary, and external
3. WHEN a module is uploaded THEN the Registry SHALL validate the signature and extract metadata
4. WHEN a module is stored THEN the Registry SHALL update the namespace, tags, and version index
5. WHEN a module is published THEN the Registry SHALL make it discoverable via search and namespace browsing

### Requirement 2

**User Story:** As a developer, I want to install modules from the Gati Registry, so that I can use community-contributed functionality in my applications.

#### Acceptance Criteria

1. WHEN a developer runs `gati module install <name>` THEN the system SHALL fetch the module from the Registry
2. WHEN a module is fetched THEN the Registry SHALL verify the signature before download
3. WHEN a module is downloaded THEN the system SHALL validate checksums match stored values
4. WHEN a module is installed THEN the system SHALL update the application manifest with the dependency
5. WHEN a module has dependencies THEN the system SHALL recursively fetch and install all required dependencies

### Requirement 3

**User Story:** As a developer, I want to search for modules, plugins, and templates in the Registry, so that I can discover solutions for my needs.

#### Acceptance Criteria

1. WHEN a developer searches THEN the Registry SHALL support search by name, type, language, capabilities, keywords, and tags
2. WHEN search results are returned THEN the Registry SHALL include metadata: name, version, description, downloads, stars, and publisher
3. WHEN searching by capabilities THEN the Registry SHALL filter by declared capabilities (db, auth, ai, queue, cache)
4. WHEN searching by compatibility THEN the Registry SHALL filter by Gati version compatibility
5. WHEN searching by type signature THEN the Registry SHALL support semantic search over GTypes (future)

### Requirement 4

**User Story:** As a publisher, I want to manage my namespace and artifacts, so that I can organize and control my published work.

#### Acceptance Criteria

1. WHEN a publisher creates an account THEN the Registry SHALL assign a user namespace `gati.dev/users/<username>`
2. WHEN a publisher creates an organization THEN the Registry SHALL assign an org namespace `gati.dev/orgs/<org>`
3. WHEN a publisher manages artifacts THEN the Registry SHALL support publish, unpublish, update, and deprecate operations
4. WHEN a publisher sets permissions THEN the Registry SHALL enforce read/write access controls per namespace
5. WHEN a publisher is verified THEN the Registry SHALL display verification badges and prevent namespace squatting

### Requirement 5

**User Story:** As a security engineer, I want all artifacts to be signed and verified, so that I can trust the supply chain.

#### Acceptance Criteria

1. WHEN an artifact is published THEN the Registry SHALL require a valid signature using cosign or sigstore
2. WHEN an artifact is fetched THEN the Registry SHALL verify the signature before allowing download
3. WHEN an artifact is uploaded THEN the Registry SHALL scan for vulnerabilities using CVE detection and static analysis
4. WHEN malicious content is detected THEN the Registry SHALL reject the artifact and notify the publisher
5. WHEN a publisher is compromised THEN the Registry SHALL support signature revocation and artifact quarantine

### Requirement 6

**User Story:** As a developer, I want to publish and use plugins from the Registry, so that I can extend Gati with additional capabilities.

#### Acceptance Criteria

1. WHEN a plugin is published THEN the Registry SHALL store the plugin manifest, code, metadata, capabilities, and signatures
2. WHEN a plugin is fetched THEN the Registry SHALL include GType interactions and required modules
3. WHEN a plugin declares dependencies THEN the Registry SHALL validate that required modules exist
4. WHEN a plugin is installed THEN the system SHALL verify compatibility with the current Gati version
5. WHEN a plugin is loaded THEN the system SHALL enforce declared capabilities and permissions

### Requirement 7

**User Story:** As an AI developer, I want to publish and distribute AI models through the Registry, so that others can use my models in their applications.

#### Acceptance Criteria

1. WHEN a model is published THEN the Registry SHALL support WASM models, ONNX, TensorRT, CUDA images, LLMs, embeddings, and vision models
2. WHEN a model is stored THEN the Registry SHALL include model manifest, inference signature, input/output GTypes, and performance benchmarks
3. WHEN a model is large THEN the Registry SHALL support chunked uploads and resumable downloads
4. WHEN a model is fetched THEN the Registry SHALL provide model cards with dataset information and usage examples
5. WHEN a model is deployed THEN the system SHALL support inference runtime adapters for different model formats

### Requirement 8

**User Story:** As an AI developer, I want to publish AI agents to the Registry, so that I can share reusable agent recipes and execution environments.

#### Acceptance Criteria

1. WHEN an agent is published THEN the Registry SHALL store agent recipe YAML, model references, skill graph definitions, and execution runtime adapters
2. WHEN an agent is packaged THEN the Registry SHALL support JS, WASM, or container-based execution runtimes
3. WHEN an agent declares permissions THEN the Registry SHALL store capability requirements and enforce them at runtime
4. WHEN an agent is installed THEN the system SHALL fetch all referenced models and dependencies
5. WHEN an agent is executed THEN the system SHALL provide sandboxed execution with declared capabilities

### Requirement 9

**User Story:** As a developer, I want to use templates from the Registry, so that I can quickly start new projects with best practices.

#### Acceptance Criteria

1. WHEN a template is published THEN the Registry SHALL support app templates, module templates, plugin templates, and infrastructure templates
2. WHEN a template is fetched THEN the Registry SHALL include all files, configuration, and setup instructions
3. WHEN a template is used THEN the CLI SHALL support `gati init --template <name>` to scaffold a new project
4. WHEN a template has variables THEN the CLI SHALL prompt for values and substitute them in generated files
5. WHEN a template is versioned THEN the Registry SHALL maintain version history and allow pinning to specific versions

### Requirement 10

**User Story:** As a platform operator, I want the Registry to integrate with Gati Cloud deployments, so that modules are automatically fetched during deployment.

#### Acceptance Criteria

1. WHEN a Gati app is deployed THEN the operator SHALL pull module images/WASM from the Registry
2. WHEN modules are fetched THEN the operator SHALL validate signatures before loading
3. WHEN modules are loaded THEN the operator SHALL provision containers, set environment variables, and configure secrets
4. WHEN modules require scaling THEN the operator SHALL fetch and start additional instances from the Registry
5. WHEN deployment fails THEN the operator SHALL report which artifacts failed verification or download

### Requirement 11

**User Story:** As a developer, I want the Registry to integrate with Timescape, so that I can manage versioned artifacts and breaking changes.

#### Acceptance Criteria

1. WHEN a module version is published THEN the Registry SHALL store the version in the Timescape version graph
2. WHEN a module GType changes THEN the Registry SHALL detect breaking changes and update compatibility metadata
3. WHEN multiple versions exist THEN the Registry SHALL store transformers and backward compatibility notes
4. WHEN a version is deprecated THEN the Registry SHALL mark it and suggest migration paths
5. WHEN Timescape routes requests THEN the Registry SHALL provide version metadata to determine which version to use

### Requirement 12

**User Story:** As a publisher, I want to monetize my artifacts through the Marketplace, so that I can earn revenue from my work.

#### Acceptance Criteria

1. WHEN a publisher enables monetization THEN the Registry SHALL support one-time purchases, subscriptions, and usage-based billing
2. WHEN a paid artifact is purchased THEN the Registry SHALL process payment and grant access to the buyer
3. WHEN usage-based billing is enabled THEN the Registry SHALL track usage metrics (downloads, inference time, execution time)
4. WHEN revenue is generated THEN the Registry SHALL apply revenue split (default 70/30) and transfer funds to publishers
5. WHEN enterprise features are needed THEN the Registry SHALL support private artifact repos and organization-level policies

### Requirement 13

**User Story:** As a developer, I want to view artifact details in the Registry web UI, so that I can evaluate artifacts before using them.

#### Acceptance Criteria

1. WHEN viewing an artifact THEN the UI SHALL display installation instructions, version history, manifest, GTypes, and API signatures
2. WHEN viewing versions THEN the UI SHALL show Timescape diff visualization between versions
3. WHEN viewing statistics THEN the UI SHALL display download counts, stars, and usage trends
4. WHEN viewing publisher info THEN the UI SHALL show verification status, other artifacts, and contact information
5. WHEN viewing pricing THEN the UI SHALL clearly display free vs paid tiers and billing details

### Requirement 14

**User Story:** As a security engineer, I want vulnerability scanning for all artifacts, so that I can identify and mitigate security risks.

#### Acceptance Criteria

1. WHEN an artifact is uploaded THEN the Registry SHALL scan for CVEs using Trivy or Clair
2. WHEN malicious code is detected THEN the Registry SHALL flag the artifact and prevent publication
3. WHEN a vulnerability is found THEN the Registry SHALL assign a security score and notify the publisher
4. WHEN ML models are uploaded THEN the Registry SHALL check for model poisoning indicators
5. WHEN vulnerabilities are fixed THEN the Registry SHALL update the security score and notify users

### Requirement 15

**User Story:** As a developer, I want to authenticate with the Registry, so that I can publish artifacts and access private repos.

#### Acceptance Criteria

1. WHEN authenticating THEN the Registry SHALL support token-based authentication, API keys, and OAuth (GitHub/Google)
2. WHEN logging in THEN the CLI SHALL support `gati login` to store credentials securely
3. WHEN accessing private artifacts THEN the Registry SHALL verify permissions before allowing access
4. WHEN using API keys THEN the Registry SHALL support scoped permissions (read-only, publish, admin)
5. WHEN tokens expire THEN the Registry SHALL support token refresh and re-authentication

### Requirement 16

**User Story:** As a platform architect, I want the Registry to use OCI-compliant storage, so that it integrates with existing container infrastructure.

#### Acceptance Criteria

1. WHEN storing artifacts THEN the Registry SHALL use OCI-compliant blob storage for all artifact types
2. WHEN storing large artifacts THEN the Registry SHALL support chunked uploads and resumable transfers
3. WHEN storing metadata THEN the Registry SHALL maintain a separate metadata index for fast search
4. WHEN storing layers THEN the Registry SHALL deduplicate common layers across artifacts
5. WHEN integrating with cloud storage THEN the Registry SHALL support S3, MinIO, and other object stores

### Requirement 17

**User Story:** As a developer, I want the Registry to provide health badges and metrics, so that I can assess artifact quality.

#### Acceptance Criteria

1. WHEN viewing an artifact THEN the Registry SHALL display health badges for popularity, stability, and compatibility
2. WHEN calculating health scores THEN the Registry SHALL consider download counts, update frequency, and issue reports
3. WHEN viewing metrics THEN the Registry SHALL show download trends, version adoption, and dependency usage
4. WHEN artifacts have dependencies THEN the Registry SHALL display dependency health and security scores
5. WHEN artifacts are outdated THEN the Registry SHALL flag them and suggest updated alternatives

### Requirement 18

**User Story:** As an enterprise customer, I want private registry features, so that I can host internal artifacts securely.

#### Acceptance Criteria

1. WHEN subscribing to enterprise tier THEN the Registry SHALL provide private artifact repositories
2. WHEN using private repos THEN the Registry SHALL enforce organization-level access policies
3. WHEN deploying internally THEN the Registry SHALL support offline registry mirrors for air-gapped environments
4. WHEN managing artifacts THEN the Registry SHALL provide signed internal modules with custom CA certificates
5. WHEN auditing THEN the Registry SHALL provide access logs and compliance reports

### Requirement 19

**User Story:** As a developer, I want the Registry to recommend artifacts, so that I can discover relevant solutions for my needs.

#### Acceptance Criteria

1. WHEN viewing the Registry THEN the system SHALL recommend modules based on app structure and dependencies
2. WHEN searching THEN the system SHALL suggest related artifacts and commonly used combinations
3. WHEN installing modules THEN the system SHALL recommend complementary plugins and tools
4. WHEN using AI models THEN the system SHALL suggest compatible inference runtimes and optimizations
5. WHEN building apps THEN the system SHALL recommend templates based on tech stack and requirements

### Requirement 20

**User Story:** As a developer, I want environment snapshots in the Registry, so that I can share and reproduce development environments.

#### Acceptance Criteria

1. WHEN creating a snapshot THEN the system SHALL capture modules used, plugins installed, versions, AI agents, and CLI version
2. WHEN storing a snapshot THEN the Registry SHALL version it and make it shareable via URL
3. WHEN restoring a snapshot THEN the system SHALL fetch all artifacts and recreate the environment
4. WHEN snapshots are used in Dev Cloud THEN the system SHALL provision workspace environments automatically
5. WHEN snapshots are shared THEN the Registry SHALL support public and private snapshot visibility

