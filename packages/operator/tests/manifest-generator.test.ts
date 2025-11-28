import { ManifestGenerator } from '../src/manifest-generator.js';
import type { HandlerSpec, ModuleSpec } from '@gati-framework/contracts';

describe('ManifestGenerator', () => {
  const generator = new ManifestGenerator();

  describe('generateDeployment', () => {
    it('should generate deployment with correct replicas', () => {
      const spec: HandlerSpec = {
        handlerPath: '/api/users',
        version: 'v1.0.0',
        replicas: 3,
        image: 'my-app:v1',
        port: 3000,
      };

      const deployment = generator.generateDeployment(spec);

      expect(deployment.replicas).toBe(3);
      expect(deployment.selector.matchLabels.app).toBe('gati-handler');
      expect(deployment.template.spec.containers[0].image).toBe('my-app:v1');
    });

    it('should add default resources if not specified', () => {
      const spec: HandlerSpec = {
        handlerPath: '/api/test',
        version: 'v1',
        replicas: 1,
        image: 'test:v1',
        port: 3000,
      };

      const deployment = generator.generateDeployment(spec);
      const resources = deployment.template.spec.containers[0].resources;

      expect(resources?.requests?.cpu).toBe('100m');
      expect(resources?.requests?.memory).toBe('128Mi');
      expect(resources?.limits?.cpu).toBe('500m');
      expect(resources?.limits?.memory).toBe('512Mi');
    });
  });

  describe('generateService', () => {
    it('should generate ClusterIP service', () => {
      const spec: ModuleSpec = {
        moduleName: 'db',
        moduleType: 'node',
        runtime: 'node:20',
        replicas: 1,
        image: 'db-module:v1',
        port: 50051,
      };

      const service = generator.generateService(spec);

      expect(service.type).toBe('ClusterIP');
      expect(service.ports[0].port).toBe(50051);
      expect(service.selector.app).toBe('gati-module');
    });
  });
});
