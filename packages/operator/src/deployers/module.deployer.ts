import type { IDeploymentTarget, IManifestGenerator } from '@gati-framework/contracts';
import type { GatiModule } from '../types/crds.js';
import pino from 'pino';

export class ModuleDeployer {
  private target: IDeploymentTarget;
  private generator: IManifestGenerator;
  private logger: pino.Logger;

  constructor(target: IDeploymentTarget, generator: IManifestGenerator) {
    this.target = target;
    this.generator = generator;
    this.logger = pino({ name: 'module-deployer' });
  }

  async reconcile(module: GatiModule): Promise<void> {
    const { name, namespace } = module.metadata;
    const labels = this.getLabels(module);

    const deploymentSpec = this.generator.generateDeployment(module.spec);
    const serviceSpec = this.generator.generateService(module.spec);

    // Add runtime-specific configuration
    this.addRuntimeConfig(deploymentSpec, module);
    
    // Add capability enforcement
    this.addSecurityContext(deploymentSpec, module);

    await this.target.apply({
      kind: 'Deployment',
      metadata: {
        name: `module-${name}`,
        namespace,
        labels,
        annotations: {
          'gati.dev/module-type': module.spec.moduleType,
          'gati.dev/runtime': module.spec.runtime,
        },
      },
      spec: deploymentSpec,
    });

    await this.target.apply({
      kind: 'Service',
      metadata: {
        name: `module-${name}`,
        namespace,
        labels,
      },
      spec: serviceSpec,
    });

    this.logger.info({ module: name, namespace, type: module.spec.moduleType }, 'Module reconciled');
  }

  async delete(module: GatiModule): Promise<void> {
    const { name, namespace } = module.metadata;

    await this.target.delete('Deployment', namespace, `module-${name}`);
    await this.target.delete('Service', namespace, `module-${name}`);

    this.logger.info({ module: name, namespace }, 'Module deleted');
  }

  private getLabels(module: GatiModule): Record<string, string> {
    return {
      'app.kubernetes.io/name': 'gati-module',
      'app.kubernetes.io/instance': module.metadata.name,
      'app.kubernetes.io/component': module.spec.moduleName,
      'app.kubernetes.io/managed-by': 'gati-operator',
    };
  }

  private addRuntimeConfig(deploymentSpec: any, module: GatiModule): void {
    const container = deploymentSpec.template.spec.containers[0];
    
    switch (module.spec.moduleType) {
      case 'node':
        container.env = container.env || [];
        container.env.push({ name: 'NODE_ENV', value: 'production' });
        break;
      case 'wasm':
        container.env = container.env || [];
        container.env.push({ name: 'WASM_RUNTIME', value: module.spec.runtime });
        break;
      case 'oci':
        // OCI containers use image as-is
        break;
    }
  }

  private addSecurityContext(deploymentSpec: any, module: GatiModule): void {
    const container = deploymentSpec.template.spec.containers[0];
    const capabilities = module.spec.capabilities || [];

    container.securityContext = {
      allowPrivilegeEscalation: false,
      readOnlyRootFilesystem: true,
      runAsNonRoot: true,
      capabilities: {
        drop: ['ALL'],
        add: capabilities.map(cap => cap.toUpperCase()),
      },
    };

    // Add volume for writable tmp if needed
    if (!capabilities.includes('storage')) {
      deploymentSpec.template.spec.volumes = deploymentSpec.template.spec.volumes || [];
      deploymentSpec.template.spec.volumes.push({
        name: 'tmp',
        emptyDir: {},
      });
      
      container.volumeMounts = container.volumeMounts || [];
      container.volumeMounts.push({
        name: 'tmp',
        mountPath: '/tmp',
      });
    }
  }
}
