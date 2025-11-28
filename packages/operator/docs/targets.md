# Deployment Targets

## Kubernetes (Default)

Direct deployment to Kubernetes via API.

```typescript
import { KubernetesDeploymentTarget } from '@gati-framework/operator';

const target = new KubernetesDeploymentTarget();
```

**Features:**
- Direct API access
- Real-time reconciliation
- Watch support

## Helm

Generates Helm charts for deployment.

```typescript
import { HelmDeploymentTarget } from '@gati-framework/operator';

const target = new HelmDeploymentTarget();
```

**Features:**
- Helm chart generation
- Release management
- Rollback support

**Status:** Stub implementation

## GitOps

Commits manifests to Git for ArgoCD/Flux.

```typescript
import { GitOpsDeploymentTarget } from '@gati-framework/operator';

const target = new GitOpsDeploymentTarget('git@github.com:org/repo.git');
```

**Features:**
- Git-based deployment
- ArgoCD/Flux integration
- Audit trail

**Status:** Stub implementation

## Factory

Use the factory for dynamic target selection:

```typescript
import { createDeploymentTarget } from '@gati-framework/operator';

const target = createDeploymentTarget('kubernetes');
// or 'helm', 'gitops'
```
