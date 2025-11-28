import type { IDeploymentTarget } from '@gati-framework/contracts';
import { KubernetesDeploymentTarget } from '../kubernetes-target.js';
import { HelmDeploymentTarget } from './helm.target.js';
import { GitOpsDeploymentTarget } from './gitops.target.js';

export type DeploymentTargetType = 'kubernetes' | 'helm' | 'gitops';

export function createDeploymentTarget(type: DeploymentTargetType, config?: any): IDeploymentTarget {
  switch (type) {
    case 'kubernetes':
      return new KubernetesDeploymentTarget();
    case 'helm':
      return new HelmDeploymentTarget();
    case 'gitops':
      return new GitOpsDeploymentTarget(config?.gitRepo);
    default:
      throw new Error(`Unknown deployment target type: ${type}`);
  }
}
