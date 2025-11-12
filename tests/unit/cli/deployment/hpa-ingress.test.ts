/**
 * @module tests/unit/cli/deployment/hpa-ingress
 * @description Tests for HPA and Ingress manifest generation
 */

import { describe, it, expect } from 'vitest';
import { 
  generateHPA, 
  generateIngress,
  generateCompleteManifests 
} from '../../../../packages/cli/src/deployment/kubernetes';
import type { 
  HPAConfig, 
  IngressConfig 
} from '../../../../packages/cli/src/deployment/types';

describe('HPA Generation', () => {
  it('should generate basic HPA manifest', () => {
    const config: HPAConfig = {
      name: 'test-app-hpa',
      namespace: 'default',
      targetDeployment: 'test-app',
      minReplicas: 2,
      maxReplicas: 10,
      targetCPUUtilizationPercentage: 70,
    };

    const hpa = generateHPA(config);

    expect(hpa).toContain('kind: HorizontalPodAutoscaler');
    expect(hpa).toContain('apiVersion: autoscaling/v2');
    expect(hpa).toContain('name: test-app-hpa');
    expect(hpa).toContain('namespace: default');
    expect(hpa).toContain('name: test-app');
    expect(hpa).toContain('minReplicas: 2');
    expect(hpa).toContain('maxReplicas: 10');
    expect(hpa).toContain('averageUtilization: 70');
  });

  it('should include memory target when specified', () => {
    const config: HPAConfig = {
      name: 'test-app-hpa',
      namespace: 'default',
      targetDeployment: 'test-app',
      minReplicas: 2,
      maxReplicas: 10,
      targetCPUUtilizationPercentage: 70,
      targetMemoryUtilizationPercentage: 80,
    };

    const hpa = generateHPA(config);

    expect(hpa).toContain('name: cpu');
    expect(hpa).toContain('name: memory');
    expect(hpa).toContain('averageUtilization: 80');
  });

  it('should include custom labels', () => {
    const config: HPAConfig = {
      name: 'test-app-hpa',
      namespace: 'default',
      targetDeployment: 'test-app',
      minReplicas: 2,
      maxReplicas: 10,
      targetCPUUtilizationPercentage: 70,
      labels: {
        environment: 'production',
        team: 'platform',
      },
    };

    const hpa = generateHPA(config);

    expect(hpa).toContain('environment: production');
    expect(hpa).toContain('team: platform');
  });

  it('should include scaling behavior policies', () => {
    const config: HPAConfig = {
      name: 'test-app-hpa',
      namespace: 'default',
      targetDeployment: 'test-app',
      minReplicas: 2,
      maxReplicas: 10,
      targetCPUUtilizationPercentage: 70,
    };

    const hpa = generateHPA(config);

    expect(hpa).toContain('behavior:');
    expect(hpa).toContain('scaleDown:');
    expect(hpa).toContain('scaleUp:');
    expect(hpa).toContain('stabilizationWindowSeconds:');
  });
});

describe('Ingress Generation', () => {
  it('should generate basic Ingress manifest', () => {
    const config: IngressConfig = {
      name: 'test-app-ingress',
      namespace: 'default',
      ingressClassName: 'nginx',
      rules: [
        {
          host: 'api.example.com',
          paths: [
            {
              path: '/',
              pathType: 'Prefix',
              serviceName: 'test-app',
              servicePort: 80,
            },
          ],
        },
      ],
    };

    const ingress = generateIngress(config);

    expect(ingress).toContain('kind: Ingress');
    expect(ingress).toContain('apiVersion: networking.k8s.io/v1');
    expect(ingress).toContain('name: test-app-ingress');
    expect(ingress).toContain('namespace: default');
    expect(ingress).toContain('ingressClassName: nginx');
    expect(ingress).toContain('host: api.example.com');
    expect(ingress).toContain('path: /');
    expect(ingress).toContain('pathType: Prefix');
    expect(ingress).toContain('name: test-app');
    expect(ingress).toContain('number: 80');
  });

  it('should include TLS configuration', () => {
    const config: IngressConfig = {
      name: 'test-app-ingress',
      namespace: 'default',
      ingressClassName: 'nginx',
      rules: [
        {
          host: 'api.example.com',
          paths: [
            {
              path: '/',
              pathType: 'Prefix',
              serviceName: 'test-app',
              servicePort: 80,
            },
          ],
        },
      ],
      tls: [
        {
          hosts: ['api.example.com'],
          secretName: 'test-app-tls',
        },
      ],
    };

    const ingress = generateIngress(config);

    expect(ingress).toContain('tls:');
    expect(ingress).toContain('- api.example.com');
    expect(ingress).toContain('secretName: test-app-tls');
  });

  it('should support multiple hosts and paths', () => {
    const config: IngressConfig = {
      name: 'test-app-ingress',
      namespace: 'default',
      ingressClassName: 'nginx',
      rules: [
        {
          host: 'api.example.com',
          paths: [
            {
              path: '/v1',
              pathType: 'Prefix',
              serviceName: 'test-app-v1',
              servicePort: 80,
            },
            {
              path: '/v2',
              pathType: 'Prefix',
              serviceName: 'test-app-v2',
              servicePort: 80,
            },
          ],
        },
        {
          host: 'admin.example.com',
          paths: [
            {
              path: '/',
              pathType: 'Prefix',
              serviceName: 'test-app-admin',
              servicePort: 80,
            },
          ],
        },
      ],
    };

    const ingress = generateIngress(config);

    expect(ingress).toContain('host: api.example.com');
    expect(ingress).toContain('path: /v1');
    expect(ingress).toContain('path: /v2');
    expect(ingress).toContain('host: admin.example.com');
    expect(ingress).toContain('name: test-app-v1');
    expect(ingress).toContain('name: test-app-v2');
    expect(ingress).toContain('name: test-app-admin');
  });

  it('should include default annotations for nginx and ALB', () => {
    const config: IngressConfig = {
      name: 'test-app-ingress',
      namespace: 'default',
      ingressClassName: 'nginx',
      rules: [
        {
          host: 'api.example.com',
          paths: [
            {
              path: '/',
              pathType: 'Prefix',
              serviceName: 'test-app',
              servicePort: 80,
            },
          ],
        },
      ],
    };

    const ingress = generateIngress(config);

    // Nginx annotations
    expect(ingress).toContain('nginx.ingress.kubernetes.io/rewrite-target');
    expect(ingress).toContain('nginx.ingress.kubernetes.io/ssl-redirect');

    // ALB annotations
    expect(ingress).toContain('alb.ingress.kubernetes.io/scheme');
    expect(ingress).toContain('alb.ingress.kubernetes.io/target-type');
    expect(ingress).toContain('alb.ingress.kubernetes.io/healthcheck-path');
  });

  it('should support custom annotations', () => {
    const config: IngressConfig = {
      name: 'test-app-ingress',
      namespace: 'default',
      ingressClassName: 'nginx',
      rules: [
        {
          host: 'api.example.com',
          paths: [
            {
              path: '/',
              pathType: 'Prefix',
              serviceName: 'test-app',
              servicePort: 80,
            },
          ],
        },
      ],
      annotations: {
        'cert-manager.io/cluster-issuer': 'letsencrypt-prod',
        'nginx.ingress.kubernetes.io/rate-limit': '100',
      },
    };

    const ingress = generateIngress(config);

    expect(ingress).toContain('cert-manager.io/cluster-issuer: letsencrypt-prod');
    expect(ingress).toContain('nginx.ingress.kubernetes.io/rate-limit: 100');
  });

  it('should support different path types', () => {
    const config: IngressConfig = {
      name: 'test-app-ingress',
      namespace: 'default',
      ingressClassName: 'nginx',
      rules: [
        {
          host: 'api.example.com',
          paths: [
            {
              path: '/exact-match',
              pathType: 'Exact',
              serviceName: 'test-app',
              servicePort: 80,
            },
            {
              path: '/prefix-match',
              pathType: 'Prefix',
              serviceName: 'test-app',
              servicePort: 80,
            },
          ],
        },
      ],
    };

    const ingress = generateIngress(config);

    expect(ingress).toContain('pathType: Exact');
    expect(ingress).toContain('pathType: Prefix');
  });
});

describe('Integration - Complete Manifests with HPA and Ingress', () => {
  it('should include HPA when autoscaling is enabled in production', () => {
    const manifests = generateCompleteManifests(
      'test-app',
      'default',
      'production',
      {
        enableAutoscaling: true,
        minReplicas: 3,
        maxReplicas: 15,
        targetCPUUtilization: 75,
      }
    );

    expect(manifests.hpa).toBeDefined();
    expect(manifests.hpa).toContain('kind: HorizontalPodAutoscaler');
    expect(manifests.hpa).toContain('minReplicas: 3');
    expect(manifests.hpa).toContain('maxReplicas: 15');
    expect(manifests.hpa).toContain('averageUtilization: 75');
  });

  it('should NOT include HPA in development even with autoscaling enabled', () => {
    const manifests = generateCompleteManifests(
      'test-app',
      'default',
      'development',
      {
        enableAutoscaling: true,
      }
    );

    expect(manifests.hpa).toBeUndefined();
  });

  it('should include Ingress when enabled with host', () => {
    const manifests = generateCompleteManifests(
      'test-app',
      'default',
      'production',
      {
        enableIngress: true,
        ingressHost: 'api.example.com',
        ingressClassName: 'alb',
      }
    );

    expect(manifests.ingress).toBeDefined();
    expect(manifests.ingress).toContain('kind: Ingress');
    expect(manifests.ingress).toContain('host: api.example.com');
    expect(manifests.ingress).toContain('ingressClassName: alb');
  });

  it('should include TLS in Ingress when enabled', () => {
    const manifests = generateCompleteManifests(
      'test-app',
      'default',
      'production',
      {
        enableIngress: true,
        ingressHost: 'api.example.com',
        enableTLS: true,
        tlsSecretName: 'my-custom-tls',
      }
    );

    expect(manifests.ingress).toBeDefined();
    expect(manifests.ingress).toContain('tls:');
    expect(manifests.ingress).toContain('secretName: my-custom-tls');
  });

  it('should NOT include Ingress when disabled', () => {
    const manifests = generateCompleteManifests(
      'test-app',
      'default',
      'production',
      {
        enableIngress: false,
      }
    );

    expect(manifests.ingress).toBeUndefined();
  });
});
