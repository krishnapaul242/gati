import type { IManifestGenerator, DeploymentSpec, ServiceSpec, ConfigMapSpec, HandlerSpec, ModuleSpec } from '@gati-framework/contracts';

export class ManifestGenerator implements IManifestGenerator {
  generateDeployment(spec: HandlerSpec | ModuleSpec): DeploymentSpec {
    const isHandler = 'handlerPath' in spec;
    const name = isHandler ? `handler-${spec.version}` : `module-${(spec as ModuleSpec).moduleName}`;
    const labels = isHandler 
      ? { app: 'gati-handler', version: spec.version }
      : { app: 'gati-module', module: (spec as ModuleSpec).moduleName };

    return {
      replicas: spec.replicas,
      selector: { matchLabels: labels },
      template: {
        metadata: { labels },
        spec: {
          containers: [{
            name: isHandler ? 'handler' : 'module',
            image: spec.image,
            ports: [{ containerPort: spec.port, protocol: 'TCP' }],
            env: spec.env ? Object.entries(spec.env).map(([name, value]) => ({ name, value })) : [],
            resources: spec.resources,
            readinessProbe: {
              httpGet: { path: '/health', port: spec.port },
              initialDelaySeconds: 5,
              periodSeconds: 10,
            },
            livenessProbe: {
              httpGet: { path: '/health', port: spec.port },
              initialDelaySeconds: 15,
              periodSeconds: 20,
            },
          }],
        },
      },
    };
  }

  generateService(spec: HandlerSpec | ModuleSpec): ServiceSpec {
    const isHandler = 'handlerPath' in spec;
    const labels = isHandler 
      ? { app: 'gati-handler', version: spec.version }
      : { app: 'gati-module', module: (spec as ModuleSpec).moduleName };

    return {
      type: 'ClusterIP',
      selector: labels,
      ports: [{
        port: spec.port,
        targetPort: spec.port,
        protocol: 'TCP',
        name: 'http',
      }],
    };
  }

  generateConfigMap(spec: HandlerSpec | ModuleSpec): ConfigMapSpec {
    const isHandler = 'handlerPath' in spec;
    const data: Record<string, string> = {};

    if (isHandler) {
      data['handler-path'] = (spec as HandlerSpec).handlerPath;
      data['version'] = spec.version;
    } else {
      data['module-name'] = (spec as ModuleSpec).moduleName;
      data['module-type'] = (spec as ModuleSpec).moduleType;
      data['runtime'] = (spec as ModuleSpec).runtime;
    }

    data['port'] = String(spec.port);
    data['replicas'] = String(spec.replicas);

    if (spec.env) {
      Object.entries(spec.env).forEach(([key, value]) => {
        data[`env-${key}`] = value;
      });
    }

    return { data };
  }
}
