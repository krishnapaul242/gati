# Requirements Document

## Introduction

The Gati Kubernetes Deployment system provides production-ready Helm charts and Kubernetes manifests for deploying Gati components to Kubernetes clusters. This includes deployments for the Ingress Layer, Route Manager, and supporting infrastructure such as ConfigMaps, Services, Horizontal Pod Autoscalers, ServiceMonitors for Prometheus, and KEDA ScaledObjects for advanced autoscaling. The deployment system supports multi-environment configurations (dev, staging, production), multi-zone high availability, TLS certificate management, and comprehensive observability integration.

The Helm charts follow cloud-native best practices including resource limits, health checks, pod disruption budgets, RBAC configuration, and graceful shutdown handling. The system supports both CPU-based autoscaling via HPA and request-rate based autoscaling via KEDA, enabling efficient resource utilization across different workload patterns. Configuration management is externalized through ConfigMaps and values files, allowing environment-specific customization without image rebuilds.

## Glossary

- **Helm**: Package manager for Kubernetes that uses charts to define, install, and upgrade applications
- **Chart**: Helm package containing Kubernetes resource templates and configuration values
- **values.yaml**: Configuration file defining default values for Helm chart templates
- **Deployment**: Kubernetes resource managing a replicated set of pods
- **Service**: Kubernetes resource providing stable networking for pods
- **ConfigMap**: Kubernetes resource storing configuration data as key-value pairs
- **HPA (Horizontal Pod Autoscaler)**: Kubernetes resource for automatic scaling based on metrics
- **KEDA**: Kubernetes Event-Driven Autoscaling for advanced scaling triggers
- **ServiceMonitor**: Prometheus Operator CRD for configuring metric scraping
- **PodDisruptionBudget**: Kubernetes resource ensuring minimum availability during disruptions
- **Ingress**: Kubernetes resource for exposing HTTP/HTTPS routes from outside the cluster
- **cert-manager**: Kubernetes add-on for automated TLS certificate management
- **RBAC**: Role-Based Access Control for Kubernetes API permissions
- **Affinity**: Kubernetes scheduling constraint for pod placement
- **Toleration**: Kubernetes mechanism allowing pods to schedule on tainted nodes

## Requirements

### Requirement 1

**User Story:** As a platform engineer, I want a Helm chart for Gati components, so that I can deploy ingress and RouteManager to Kubernetes with consistent configuration.

#### Acceptance Criteria

1. WHEN the Helm chart is created THEN the system SHALL include Chart.yaml with name, version, and description
2. WHEN the Helm chart is created THEN the system SHALL include values.yaml with configurable defaults for all components
3. WHEN the Helm chart is created THEN the system SHALL include templates for Deployment, Service, ConfigMap, and HPA resources
4. WHEN the Helm chart is installed THEN the system SHALL create a dedicated namespace for Gati components
5. WHEN the Helm chart is customized THEN the system SHALL support overriding values via custom values files

### Requirement 2

**User Story:** As a platform engineer, I want the Helm chart to deploy the ingress with proper resource limits, so that the cluster can schedule and manage pods effectively.

#### Acceptance Criteria

1. WHEN the ingress Deployment is created THEN the system SHALL set CPU requests to 250m and memory requests to 256Mi
2. WHEN the ingress Deployment is created THEN the system SHALL set CPU limits to 1000m and memory limits to 512Mi
3. WHEN the ingress Deployment is created THEN the system SHALL configure readiness probes on /readyz endpoint
4. WHEN the ingress Deployment is created THEN the system SHALL configure liveness probes on /healthz endpoint
5. WHEN the ingress Deployment is created THEN the system SHALL support configurable replica count with default of 2

### Requirement 3

**User Story:** As a platform engineer, I want the Helm chart to deploy the RouteManager with proper resource limits, so that it runs efficiently alongside the ingress.

#### Acceptance Criteria

1. WHEN the RouteManager Deployment is created THEN the system SHALL set CPU requests to 100m and memory requests to 128Mi
2. WHEN the RouteManager Deployment is created THEN the system SHALL set CPU limits to 500m and memory limits to 256Mi
3. WHEN the RouteManager Deployment is created THEN the system SHALL expose port 50051 for gRPC communication
4. WHEN the RouteManager Deployment is created THEN the system SHALL support configurable replica count with default of 1
5. WHEN the RouteManager Deployment is created THEN the system SHALL allow enabling or disabling via values.yaml

### Requirement 4

**User Story:** As a platform engineer, I want the Helm chart to create Kubernetes Services, so that components can communicate via stable DNS names.

#### Acceptance Criteria

1. WHEN the ingress Service is created THEN the system SHALL expose port 80 mapping to container port 8080
2. WHEN the ingress Service is created THEN the system SHALL use selector matching the ingress Deployment labels
3. WHEN the RouteManager Service is created THEN the system SHALL expose port 50051 for gRPC
4. WHEN the RouteManager Service is created THEN the system SHALL use selector matching the RouteManager Deployment labels
5. WHEN Services are created THEN the system SHALL use ClusterIP type for internal communication

### Requirement 5

**User Story:** As a platform engineer, I want the Helm chart to create a ConfigMap for ingress configuration, so that settings can be updated without rebuilding images.

#### Acceptance Criteria

1. WHEN the ConfigMap is created THEN the system SHALL include ROUTE_MANAGER_ADDR pointing to the RouteManager Service
2. WHEN the ConfigMap is created THEN the system SHALL include TIMESCAPE_ADDR for Timescape service integration
3. WHEN the ConfigMap is created THEN the system SHALL include FEATURE_PLAYGROUND flag for enabling playground mode
4. WHEN the ConfigMap is created THEN the system SHALL support arbitrary key-value pairs from values.yaml
5. WHEN the ConfigMap is mounted THEN the system SHALL inject values as environment variables in the ingress container

### Requirement 6

**User Story:** As a platform engineer, I want the Helm chart to create an HPA for the ingress, so that it scales automatically based on CPU utilization.

#### Acceptance Criteria

1. WHEN the HPA is created THEN the system SHALL target the ingress Deployment for scaling
2. WHEN the HPA is created THEN the system SHALL set minReplicas to 2 and maxReplicas to 10
3. WHEN the HPA is created THEN the system SHALL scale up when CPU utilization exceeds 60%
4. WHEN the HPA is created THEN the system SHALL use autoscaling/v2 API version
5. WHEN the HPA is disabled in values THEN the system SHALL not create the HPA resource

### Requirement 7

**User Story:** As a platform engineer, I want the Helm chart to create a ServiceMonitor for Prometheus Operator, so that metrics are automatically scraped.

#### Acceptance Criteria

1. WHEN the ServiceMonitor is created THEN the system SHALL target the ingress Service using label selectors
2. WHEN the ServiceMonitor is created THEN the system SHALL scrape the /metrics endpoint every 15 seconds
3. WHEN the ServiceMonitor is created THEN the system SHALL honor labels from scraped metrics
4. WHEN the ServiceMonitor is created THEN the system SHALL support configurable namespace for Prometheus Operator
5. WHEN the ServiceMonitor is disabled in values THEN the system SHALL not create the ServiceMonitor resource

### Requirement 8

**User Story:** As a platform engineer, I want the Helm chart to support node affinity and tolerations, so that I can control pod placement in the cluster.

#### Acceptance Criteria

1. WHEN node selectors are specified in values THEN the system SHALL apply them to all Deployments
2. WHEN tolerations are specified in values THEN the system SHALL apply them to all Deployments
3. WHEN affinity rules are specified in values THEN the system SHALL apply them to all Deployments
4. WHEN placement controls are not specified THEN the system SHALL use empty defaults allowing any node
5. WHEN placement controls are applied THEN the system SHALL validate that pods can be scheduled

### Requirement 9

**User Story:** As a platform engineer, I want the Helm chart to support KEDA-based autoscaling, so that I can scale based on request rate instead of CPU.

#### Acceptance Criteria

1. WHEN KEDA is enabled THEN the system SHALL create a ScaledObject resource instead of HPA
2. WHEN KEDA is enabled THEN the system SHALL configure Prometheus-based triggers for request rate metrics
3. WHEN KEDA is enabled THEN the system SHALL set scaling thresholds based on requests per second
4. WHEN KEDA is enabled THEN the system SHALL support scale-to-zero for development environments
5. WHEN KEDA is disabled THEN the system SHALL fall back to standard HPA with CPU metrics

### Requirement 10

**User Story:** As a platform engineer, I want the Helm chart to support external Ingress resources, so that the ingress can be exposed outside the cluster.

#### Acceptance Criteria

1. WHEN external Ingress is enabled THEN the system SHALL create an Ingress resource for the ingress Service
2. WHEN external Ingress is enabled THEN the system SHALL support annotations for NGINX, ALB, or other ingress controllers
3. WHEN external Ingress is enabled THEN the system SHALL configure TLS termination with cert-manager integration
4. WHEN external Ingress is enabled THEN the system SHALL support multiple hostnames and path-based routing
5. WHEN external Ingress is disabled THEN the system SHALL rely on external load balancers or port forwarding

### Requirement 11

**User Story:** As a security engineer, I want the Helm chart to support TLS certificate management, so that connections are encrypted end-to-end.

#### Acceptance Criteria

1. WHEN TLS is enabled THEN the system SHALL mount certificate secrets into the ingress container
2. WHEN TLS is enabled THEN the system SHALL configure the ingress to accept HTTPS connections
3. WHEN TLS is enabled THEN the system SHALL support cert-manager annotations for automatic certificate provisioning
4. WHEN TLS is enabled THEN the system SHALL support custom CA bundles for internal certificate authorities
5. WHEN TLS is disabled THEN the system SHALL accept plain HTTP connections for internal-only deployments

### Requirement 12

**User Story:** As a platform engineer, I want the Helm chart to support RBAC configuration, so that components have appropriate permissions for Kubernetes API access.

#### Acceptance Criteria

1. WHEN RBAC is enabled THEN the system SHALL create ServiceAccount resources for each component
2. WHEN RBAC is enabled THEN the system SHALL create Role resources with minimal required permissions
3. WHEN RBAC is enabled THEN the system SHALL create RoleBinding resources linking ServiceAccounts to Roles
4. WHEN RBAC is enabled THEN the system SHALL support reading ConfigMaps and Secrets
5. WHEN RBAC is disabled THEN the system SHALL use the default ServiceAccount

### Requirement 13

**User Story:** As a platform engineer, I want the Helm chart to include PodDisruptionBudget, so that availability is maintained during cluster maintenance.

#### Acceptance Criteria

1. WHEN PodDisruptionBudget is enabled THEN the system SHALL ensure at least 1 ingress pod remains available during disruptions
2. WHEN PodDisruptionBudget is enabled THEN the system SHALL target the ingress Deployment using label selectors
3. WHEN PodDisruptionBudget is enabled THEN the system SHALL support configurable minAvailable or maxUnavailable values
4. WHEN PodDisruptionBudget is enabled THEN the system SHALL prevent voluntary disruptions that violate availability requirements
5. WHEN PodDisruptionBudget is disabled THEN the system SHALL allow unrestricted pod evictions

### Requirement 14

**User Story:** As a platform engineer, I want the Helm chart to support multi-zone deployment, so that the system is resilient to zone failures.

#### Acceptance Criteria

1. WHEN multi-zone deployment is enabled THEN the system SHALL configure pod anti-affinity to spread replicas across zones
2. WHEN multi-zone deployment is enabled THEN the system SHALL use topology spread constraints for even distribution
3. WHEN multi-zone deployment is enabled THEN the system SHALL ensure at least one replica per availability zone
4. WHEN multi-zone deployment is enabled THEN the system SHALL support configurable zone labels
5. WHEN multi-zone deployment is disabled THEN the system SHALL allow default Kubernetes scheduling

### Requirement 15

**User Story:** As a developer, I want Helm chart documentation, so that I understand how to install, configure, and customize the deployment.

#### Acceptance Criteria

1. WHEN the Helm chart is packaged THEN the system SHALL include a README.md with installation instructions
2. WHEN the Helm chart is packaged THEN the system SHALL document all configurable values in values.yaml with comments
3. WHEN the Helm chart is packaged THEN the system SHALL include examples of common customization scenarios
4. WHEN the Helm chart is packaged THEN the system SHALL document prerequisites including Kubernetes version and dependencies
5. WHEN the Helm chart is installed THEN the system SHALL display NOTES.txt with post-installation instructions

### Requirement 16

**User Story:** As a platform engineer, I want the Helm chart to support environment-specific configurations, so that I can deploy to dev, staging, and production with appropriate settings.

#### Acceptance Criteria

1. WHEN environment-specific values are provided THEN the system SHALL support separate values files for dev, staging, and production
2. WHEN environment-specific values are provided THEN the system SHALL allow overriding replica counts per environment
3. WHEN environment-specific values are provided THEN the system SHALL allow overriding resource limits per environment
4. WHEN environment-specific values are provided THEN the system SHALL allow enabling or disabling features per environment
5. WHEN environment-specific values are merged THEN the system SHALL apply precedence rules with later values overriding earlier ones

### Requirement 17

**User Story:** As a developer, I want Docker Compose configuration for local testing, so that I can run Gati components together without Kubernetes.

#### Acceptance Criteria

1. WHEN Docker Compose is configured THEN the system SHALL define services for ingress and route-manager
2. WHEN Docker Compose is configured THEN the system SHALL configure networking for inter-service communication
3. WHEN Docker Compose is configured THEN the system SHALL mount configuration files as volumes
4. WHEN Docker Compose is configured THEN the system SHALL expose ports for external access
5. WHEN Docker Compose is run THEN the system SHALL build and start all services with proper dependencies

### Requirement 18

**User Story:** As a platform engineer, I want the Helm chart to support graceful shutdown, so that in-flight requests complete before pods terminate.

#### Acceptance Criteria

1. WHEN pods are terminated THEN the system SHALL configure preStop hooks to delay shutdown
2. WHEN pods are terminated THEN the system SHALL set terminationGracePeriodSeconds to allow request completion
3. WHEN pods are terminated THEN the system SHALL remove pods from Service endpoints before shutdown
4. WHEN pods are terminated THEN the system SHALL log shutdown events for debugging
5. WHEN pods are terminated THEN the system SHALL ensure no requests are dropped during rolling updates

### Requirement 19

**User Story:** As a platform engineer, I want the Helm chart to support custom annotations and labels, so that I can integrate with cluster policies and tooling.

#### Acceptance Criteria

1. WHEN custom annotations are specified THEN the system SHALL apply them to all created resources
2. WHEN custom labels are specified THEN the system SHALL apply them to all created resources
3. WHEN custom annotations are specified THEN the system SHALL support pod-level and resource-level annotations
4. WHEN custom labels are specified THEN the system SHALL preserve required labels for selectors
5. WHEN custom metadata is applied THEN the system SHALL validate that it does not conflict with system labels

### Requirement 20

**User Story:** As a platform engineer, I want the Helm chart to support init containers, so that I can perform setup tasks before main containers start.

#### Acceptance Criteria

1. WHEN init containers are specified THEN the system SHALL add them to the pod spec before main containers
2. WHEN init containers are specified THEN the system SHALL support configurable image, command, and resources
3. WHEN init containers run THEN the system SHALL wait for completion before starting main containers
4. WHEN init containers fail THEN the system SHALL prevent main containers from starting
5. WHEN init containers are used THEN the system SHALL support common use cases like schema migrations and config validation
