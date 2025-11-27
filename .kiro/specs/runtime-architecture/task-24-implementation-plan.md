# Task 24: Kubernetes Operator Implementation - Comprehensive Plan

## 1. Task Overview

**Objective**: Create a Kubernetes Operator using contracts abstraction to enable deployment to Kubernetes, Helm, GitOps, or other targets.

**Scope**: 
- ✅ Included: CRDs, Operator controller, deployment contracts, handler/module deployment, scaling, Timescape orchestration, version decommissioning
- ❌ Excluded: Helm chart creation (kubernetes-deployment spec), cloud provider integrations (exist), Timescape core (M3)

**Context**: 
- Gati has `@gati-framework/contracts` for pluggable implementations
- Current CLI generates raw manifests - Operator will use contracts for target abstraction
- Requirements 4.5: automatic version decommissioning after traffic drains
- Bridges M2 (Cloud Infrastructure) and M3 (Timescape)

---

## 2. Task Breakdown

### **Main Task 1: Extend Contracts Package with Deployment Contracts** (Medium Complexity)
**Subtasks**:
- 1.1 Create `src/deployment/` directory in contracts package
- 1.2 Define `IDeploymentTarget` interface (apply, delete, get, list, watch methods)
- 1.3 Define `IManifestGenerator` interface (generateDeployment, generateService, generateConfigMap)
- 1.4 Define deployment resource types (DeploymentSpec, ServiceSpec, ConfigMapSpec)
- 1.5 Export from contracts package index

**Dependencies**: None  
**Estimated Complexity**: Medium (30 minutes)

---

### **Main Task 2: Create Operator Package Structure** (Low Complexity)
**Subtasks**:
- 2.1 Create `packages/operator/` with TypeScript config
- 2.2 Add dependencies (@gati-framework/contracts, @gati-framework/core, pino)
- 2.3 Create package.json with peer dependencies
- 2.4 Create initial README with architecture overview

**Dependencies**: Task 1  
**Estimated Complexity**: Low (15 minutes)

---

### **Main Task 3: Define Custom Resource Definitions** (Medium Complexity)
**Subtasks**:
- 3.1 Create `GatiHandler` CRD schema (handlerPath, version, replicas, resources, timescape)
- 3.2 Create `GatiModule` CRD schema (moduleType, runtime, capabilities, resources)
- 3.3 Create `GatiVersion` CRD schema (versionId, breaking, transformers, routingWeight)
- 3.4 Generate TypeScript types from CRDs
- 3.5 Create CRD YAML manifests in `crds/`

**Dependencies**: Task 2  
**Estimated Complexity**: Medium (45 minutes)

---

### **Main Task 4: Implement Kubernetes Deployment Target** (High Complexity)
**Subtasks**:
- 4.1 Create `KubernetesDeploymentTarget` implementing `IDeploymentTarget`
- 4.2 Implement apply method using @kubernetes/client-node
- 4.3 Implement delete, get, list methods
- 4.4 Implement watch method with informer pattern
- 4.5 Add error handling with exponential backoff
- 4.6 Add structured logging for all operations

**Dependencies**: Task 1, Task 3  
**Estimated Complexity**: High (60 minutes)

---

### **Main Task 5: Implement Manifest Generator** (High Complexity)
**Subtasks**:
- 5.1 Create `ManifestGenerator` implementing `IManifestGenerator`
- 5.2 Implement generateDeployment (from GatiHandler/GatiModule CRD)
- 5.3 Implement generateService (ClusterIP, LoadBalancer support)
- 5.4 Implement generateConfigMap (handler/module configuration)
- 5.5 Add health probe generation (readiness/liveness)
- 5.6 Add resource limits calculation

**Dependencies**: Task 1, Task 3  
**Estimated Complexity**: High (60 minutes)

---

### **Main Task 6: Implement Operator Core Controller** (High Complexity)
**Subtasks**:
- 6.1 Create `OperatorController` with IDeploymentTarget injection
- 6.2 Implement watch mechanism for GatiHandler, GatiModule, GatiVersion
- 6.3 Create reconciliation loop with retry logic
- 6.4 Implement event handlers (ADDED, MODIFIED, DELETED)
- 6.5 Add structured logging with request IDs
- 6.6 Implement graceful shutdown

**Dependencies**: Task 4, Task 5  
**Estimated Complexity**: High (90 minutes)

---

### **Main Task 7: Implement Handler Deployment Logic** (Medium Complexity)
**Subtasks**:
- 7.1 Create `HandlerDeployer` using IManifestGenerator
- 7.2 Implement reconcile method (generate + apply manifests)
- 7.3 Add label management for version tracking
- 7.4 Implement status updates on CRD
- 7.5 Add owner references for garbage collection

**Dependencies**: Task 6  
**Estimated Complexity**: Medium (45 minutes)

---

### **Main Task 8: Implement Module Deployment Logic** (Medium Complexity)
**Subtasks**:
- 8.1 Create `ModuleDeployer` using IManifestGenerator
- 8.2 Add runtime-specific configs (Node/WASM/OCI)
- 8.3 Implement capability enforcement via SecurityContext
- 8.4 Add module Service creation for RPC
- 8.5 Implement health checks and restart policies

**Dependencies**: Task 6  
**Estimated Complexity**: Medium (50 minutes)

---

### **Main Task 9: Implement Scaling Logic** (Medium Complexity)
**Subtasks**:
- 9.1 Create `ScalingController` using IDeploymentTarget
- 9.2 Implement HPA generation for CPU-based scaling
- 9.3 Add KEDA ScaledObject generation for request-rate scaling
- 9.4 Implement scale decision logic with stabilization
- 9.5 Add warm pool management

**Dependencies**: Task 7, Task 8  
**Estimated Complexity**: Medium (50 minutes)

---

### **Main Task 10: Implement Timescape Orchestration** (High Complexity)
**Subtasks**:
- 10.1 Create `TimescapeOrchestrator` using IDeploymentTarget
- 10.2 Implement breaking change detection stub (for M3)
- 10.3 Add traffic routing weight management
- 10.4 Implement gradual rollout (canary: 10% → 50% → 100%)
- 10.5 Add rollback on health check failures
- 10.6 Implement transformer coordination stub (for M3)

**Dependencies**: Task 7, Task 9  
**Estimated Complexity**: High (90 minutes)

---

### **Main Task 11: Implement Version Decommissioning** (Medium Complexity)
**Subtasks**:
- 11.1 Create `VersionDecommissioner` using IDeploymentTarget
- 11.2 Implement traffic drain detection
- 11.3 Add grace period configuration (5 min default)
- 11.4 Implement safe deletion (check in-flight requests)
- 11.5 Add resource cleanup
- 11.6 Emit decommission events

**Dependencies**: Task 10  
**Estimated Complexity**: Medium (45 minutes)

---

### **Main Task 12: Add Observability** (Low Complexity)
**Subtasks**:
- 12.1 Add Prometheus metrics (reconciliation_duration, deployment_count)
- 12.2 Implement structured logging with Pino
- 12.3 Add Kubernetes Events for status updates
- 12.4 Create ServiceMonitor for Operator
- 12.5 Add health endpoints (/healthz, /readyz)

**Dependencies**: Task 6  
**Estimated Complexity**: Low (30 minutes)

---

### **Main Task 13: Implement Alternative Deployment Targets** (Medium Complexity)
**Subtasks**:
- 13.1 Create `HelmDeploymentTarget` implementing IDeploymentTarget
- 13.2 Create `GitOpsDeploymentTarget` (ArgoCD/Flux integration)
- 13.3 Add target selection via configuration
- 13.4 Document target-specific requirements

**Dependencies**: Task 4  
**Estimated Complexity**: Medium (60 minutes)

---

### **Main Task 14: Write Tests** (High Complexity)
**Subtasks**:
- 14.1 Write unit tests for ManifestGenerator
- 14.2 Write unit tests for HandlerDeployer/ModuleDeployer
- 14.3 Write unit tests for ScalingController
- 14.4 Write unit tests for TimescapeOrchestrator
- 14.5 Write unit tests for VersionDecommissioner
- 14.6 Write integration tests with fake IDeploymentTarget
- 14.7 Write property tests for reconciliation idempotency

**Dependencies**: Tasks 5-11  
**Estimated Complexity**: High (120 minutes)

---

### **Main Task 15: Create Documentation** (Low Complexity)
**Subtasks**:
- 15.1 Write operator architecture documentation
- 15.2 Document CRD schemas with examples
- 15.3 Create deployment guide (RBAC, CRD installation)
- 15.4 Document deployment target implementations
- 15.5 Add troubleshooting guide

**Dependencies**: All previous tasks  
**Estimated Complexity**: Low (30 minutes)

---

## 3. Acceptance Criteria

### **Functional Requirements**
- ✅ Operator watches CRDs and reconciles via IDeploymentTarget contract
- ✅ Handler/module deployments created with correct resources
- ✅ Scaling generates HPA or KEDA via IManifestGenerator
- ✅ Timescape orchestrator manages multi-version deployments
- ✅ Version decommissioner removes drained versions
- ✅ All operations are idempotent
- ✅ Multiple deployment targets supported (Kubernetes, Helm, GitOps)

### **Non-Functional Requirements**
- ⚡ Reconciliation completes within 5 seconds
- 🔒 Minimal RBAC permissions
- 📊 Structured logs and Prometheus metrics
- 🛡️ Graceful error handling with backoff
- 🔄 Survives restarts without state loss

### **Edge Cases**
- ⚠️ CRD deletion with finalizers
- ⚠️ Conflicting version updates
- ⚠️ Kubernetes API unavailability
- ⚠️ Partial deployment failures
- ⚠️ Zero-traffic detection false positives

### **Definition of Done**
- [ ] Deployment contracts defined in @gati-framework/contracts
- [ ] Operator deploys handlers/modules via contracts
- [ ] Multiple deployment targets implemented (Kubernetes, Helm)
- [ ] Scaling and Timescape orchestration working
- [ ] Version decommissioning functional
- [ ] All tests pass (unit, integration, property)
- [ ] Documentation complete

---

## 4. Testing Strategy

### **Unit Tests**

```typescript
// Test ManifestGenerator
describe('ManifestGenerator', () => {
  it('should generate Deployment with correct resources', () => {
    const crd: GatiHandler = {
      metadata: { name: 'user-handler', namespace: 'default' },
      spec: {
        handlerPath: '/api/users',
        version: 'v1.0.0',
        replicas: 2,
        resources: { requests: { cpu: '100m', memory: '128Mi' } }
      }
    };
    
    const deployment = generator.generateDeployment(crd);
    
    expect(deployment.spec.replicas).toBe(2);
    expect(deployment.spec.template.spec.containers[0].resources.requests.cpu).toBe('100m');
  });
});

// Test VersionDecommissioner
describe('VersionDecommissioner', () => {
  it('should decommission after 5 min zero traffic', async () => {
    const version = createTestVersion('v1.0.0');
    
    await decommissioner.recordTraffic(version, 0);
    await sleep(5 * 60 * 1000);
    
    expect(await decommissioner.shouldDecommission(version)).toBe(true);
  });
});
```

### **Integration Tests**

```typescript
// Test with fake deployment target
describe('OperatorController Integration', () => {
  let target: FakeDeploymentTarget;
  let controller: OperatorController;
  
  beforeEach(() => {
    target = new FakeDeploymentTarget();
    controller = new OperatorController(target);
  });
  
  it('should create Deployment when GatiHandler added', async () => {
    const handler: GatiHandler = {
      metadata: { name: 'test', namespace: 'default' },
      spec: { handlerPath: '/api/test', version: 'v1', replicas: 1 }
    };
    
    await target.apply(handler);
    await controller.reconcile();
    
    const deployments = await target.list('Deployment', 'default');
    expect(deployments).toHaveLength(1);
  });
});
```

### **Property Tests**

```typescript
// Property: Reconciliation is idempotent
fc.assert(
  fc.asyncProperty(
    fc.record({
      name: fc.string(),
      version: fc.string(),
      replicas: fc.integer({ min: 1, max: 10 })
    }),
    async (spec) => {
      const handler = createHandler(spec);
      
      const result1 = await controller.reconcile(handler);
      const result2 = await controller.reconcile(handler);
      
      expect(result1).toEqual(result2);
    }
  ),
  { numRuns: 100 }
);
```

---

## 5. Implementation Examples

### **Deployment Contracts**

```typescript
// packages/contracts/src/deployment/deployment-target.contract.ts
export interface IDeploymentTarget {
  apply(resource: DeploymentResource): Promise<void>;
  delete(kind: string, namespace: string, name: string): Promise<void>;
  get(kind: string, namespace: string, name: string): Promise<DeploymentResource | null>;
  list(kind: string, namespace: string): Promise<DeploymentResource[]>;
  watch(kind: string, namespace: string, callback: WatchCallback): Promise<void>;
}

export interface IManifestGenerator {
  generateDeployment(spec: HandlerSpec | ModuleSpec): DeploymentSpec;
  generateService(spec: HandlerSpec | ModuleSpec): ServiceSpec;
  generateConfigMap(spec: HandlerSpec | ModuleSpec): ConfigMapSpec;
}

export type DeploymentResource = {
  kind: string;
  metadata: { name: string; namespace: string; labels?: Record<string, string> };
  spec: any;
  status?: any;
};
```

### **Kubernetes Implementation**

```typescript
// packages/operator/src/targets/kubernetes.target.ts
import { IDeploymentTarget, DeploymentResource } from '@gati-framework/contracts';
import * as k8s from '@kubernetes/client-node';

export class KubernetesDeploymentTarget implements IDeploymentTarget {
  private k8sApi: k8s.AppsV1Api;
  private coreApi: k8s.CoreV1Api;
  
  constructor(kubeconfig?: string) {
    const kc = new k8s.KubeConfig();
    kubeconfig ? kc.loadFromString(kubeconfig) : kc.loadFromDefault();
    this.k8sApi = kc.makeApiClient(k8s.AppsV1Api);
    this.coreApi = kc.makeApiClient(k8s.CoreV1Api);
  }
  
  async apply(resource: DeploymentResource): Promise<void> {
    const { kind, metadata, spec } = resource;
    
    try {
      await this.get(kind, metadata.namespace, metadata.name);
      // Update existing
      if (kind === 'Deployment') {
        await this.k8sApi.replaceNamespacedDeployment(
          metadata.name,
          metadata.namespace,
          { metadata, spec }
        );
      }
    } catch {
      // Create new
      if (kind === 'Deployment') {
        await this.k8sApi.createNamespacedDeployment(
          metadata.namespace,
          { metadata, spec }
        );
      }
    }
  }
  
  async delete(kind: string, namespace: string, name: string): Promise<void> {
    if (kind === 'Deployment') {
      await this.k8sApi.deleteNamespacedDeployment(name, namespace);
    }
  }
  
  async get(kind: string, namespace: string, name: string): Promise<DeploymentResource | null> {
    try {
      if (kind === 'Deployment') {
        const res = await this.k8sApi.readNamespacedDeployment(name, namespace);
        return { kind, metadata: res.body.metadata!, spec: res.body.spec! };
      }
    } catch {
      return null;
    }
    return null;
  }
  
  async list(kind: string, namespace: string): Promise<DeploymentResource[]> {
    if (kind === 'Deployment') {
      const res = await this.k8sApi.listNamespacedDeployment(namespace);
      return res.body.items.map(item => ({
        kind,
        metadata: item.metadata!,
        spec: item.spec!
      }));
    }
    return [];
  }
  
  async watch(kind: string, namespace: string, callback: WatchCallback): Promise<void> {
    // Implement watch with informer
  }
}
```

### **Operator Controller**

```typescript
// packages/operator/src/controller.ts
import { IDeploymentTarget, IManifestGenerator } from '@gati-framework/contracts';

export class OperatorController {
  constructor(
    private target: IDeploymentTarget,
    private generator: IManifestGenerator
  ) {}
  
  async reconcile(handler: GatiHandler): Promise<void> {
    const deployment = this.generator.generateDeployment(handler.spec);
    const service = this.generator.generateService(handler.spec);
    
    await this.target.apply({
      kind: 'Deployment',
      metadata: { name: handler.metadata.name, namespace: handler.metadata.namespace },
      spec: deployment
    });
    
    await this.target.apply({
      kind: 'Service',
      metadata: { name: handler.metadata.name, namespace: handler.metadata.namespace },
      spec: service
    });
    
    // Update status
    handler.status = { phase: 'Running', lastUpdated: new Date().toISOString() };
  }
}
```

### **Version Decommissioning**

```typescript
// packages/operator/src/decommissioner.ts
export class VersionDecommissioner {
  private trafficHistory = new Map<string, number[]>();
  private readonly GRACE_PERIOD_MS = 5 * 60 * 1000;
  private readonly ZERO_TRAFFIC_THRESHOLD = 5;
  
  async recordTraffic(version: GatiVersion, count: number): Promise<void> {
    const history = this.trafficHistory.get(version.metadata.name) || [];
    history.push(count);
    if (history.length > 10) history.shift();
    this.trafficHistory.set(version.metadata.name, history);
  }
  
  async shouldDecommission(version: GatiVersion): Promise<boolean> {
    const history = this.trafficHistory.get(version.metadata.name) || [];
    if (history.length < this.ZERO_TRAFFIC_THRESHOLD) return false;
    
    const lastN = history.slice(-this.ZERO_TRAFFIC_THRESHOLD);
    const allZero = lastN.every(c => c === 0);
    if (!allZero) return false;
    
    const lastUpdate = new Date(version.status?.lastTrafficTimestamp || 0);
    return Date.now() - lastUpdate.getTime() >= this.GRACE_PERIOD_MS;
  }
  
  async decommission(version: GatiVersion): Promise<void> {
    await this.target.delete('Deployment', version.metadata.namespace, version.spec.deploymentName);
    await this.target.delete('Service', version.metadata.namespace, version.spec.serviceName);
    
    version.status = { phase: 'Decommissioned', decommissionedAt: new Date().toISOString() };
  }
}
```

---

## 6. Risk Analysis

### **Technical Bottlenecks**
- ⚠️ **Kubernetes API rate limiting**: Batching and caching mitigate
- ⚠️ **Reconciliation performance**: Profile and optimize hot paths
- ⚠️ **State consistency**: Use Kubernetes as source of truth

### **Dependencies**
- 📦 **@kubernetes/client-node**: Pin version, test upgrades
- 📦 **Timescape API (M3)**: Create stubs for breaking change detection
- 📦 **Prometheus Operator**: Make optional

### **Breaking Changes**
- 🔴 **CRD schema changes**: Use versioned CRDs (v1alpha1 → v1beta1)
- 🔴 **Contract interface changes**: Semantic versioning

### **Migration Concerns**
- 🔄 **Existing deployments**: Provide manifest-to-CRD conversion tool
- 🔄 **Data migration**: Initialize missing status fields

---

## 7. Recommendations

### **Best Practices**
- 💡 Use controller-runtime patterns (informers, work queues)
- 💡 Implement finalizers for safe cleanup
- 💡 Use owner references for garbage collection
- 💡 Emit Kubernetes Events for visibility
- 💡 Use status subresources

### **Optimization Opportunities**
- ⚡ Cache manifest templates
- ⚡ Batch Kubernetes API calls
- ⚡ Use informers with shared caches
- ⚡ Implement leader election

### **Alternative Approaches**
- 🔀 **Helm Operator**: More flexible but adds dependency
- 🔀 **Operator SDK**: More boilerplate but better scaffolding
- 🔀 **GitOps**: Simpler Operator but requires external tooling

### **Future Considerations**
- 🔮 Multi-cluster support
- 🔮 Blue-green deployments
- 🔮 Cost optimization
- 🔮 Observability dashboard

---

## 8. Implementation Order

### **Phase 1: Contracts Foundation (Task 1)** ⏱️ 30 minutes
1. Create deployment contracts in @gati-framework/contracts
2. Define IDeploymentTarget and IManifestGenerator interfaces
3. Define deployment resource types

### **Phase 2: Operator Setup (Tasks 2-3)** ⏱️ 60 minutes
1. Create operator package structure
2. Define CRDs (GatiHandler, GatiModule, GatiVersion)
3. Generate TypeScript types

### **Phase 3: Core Implementation (Tasks 4-6)** ⏱️ 210 minutes
1. Implement KubernetesDeploymentTarget
2. Implement ManifestGenerator
3. Implement OperatorController with reconciliation

### **Phase 4: Deployment Logic (Tasks 7-8)** ⏱️ 95 minutes
1. Implement HandlerDeployer
2. Implement ModuleDeployer
3. Test deployment creation

### **Phase 5: Orchestration (Tasks 9-11)** ⏱️ 185 minutes
1. Implement ScalingController
2. Implement TimescapeOrchestrator
3. Implement VersionDecommissioner

### **Phase 6: Extensions (Tasks 12-13)** ⏱️ 90 minutes
1. Add observability
2. Implement HelmDeploymentTarget
3. Implement GitOpsDeploymentTarget

### **Phase 7: Testing & Docs (Tasks 14-15)** ⏱️ 150 minutes
1. Write unit tests
2. Write integration tests
3. Write property tests
4. Create documentation

---

**Total Estimated Time**: ~13.5 hours (820 minutes)

**Critical Path**: Tasks 1 → 2 → 3 → 4 → 5 → 6 → 7 → 10 → 11

**Key Innovation**: Contracts abstraction enables deployment to Kubernetes, Helm, GitOps, or custom targets without changing Operator logic.
