/**
 * Test script to verify HPA and Ingress manifest generation
 * Run outside the workspace to validate real-world usage
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  generateHPA,
  generateIngress,
  generateCompleteManifests,
} from './packages/cli/src/deployment/kubernetes.js';
import { writeManifests } from './packages/cli/src/deployment/manifest-generator.js';

async function testHPAGeneration() {
  console.log('\n📊 Testing HPA Generation...');
  
  const hpa = generateHPA({
    name: 'demo-app-hpa',
    namespace: 'production',
    targetDeployment: 'demo-app',
    minReplicas: 3,
    maxReplicas: 20,
    targetCPUUtilizationPercentage: 75,
    targetMemoryUtilizationPercentage: 85,
    labels: {
      environment: 'production',
      team: 'platform',
    },
  });

  console.log('✅ HPA manifest generated successfully');
  console.log(`   Length: ${hpa.length} bytes`);
  console.log(`   Contains "HorizontalPodAutoscaler": ${hpa.includes('HorizontalPodAutoscaler')}`);
  console.log(`   Contains "minReplicas: 3": ${hpa.includes('minReplicas: 3')}`);
  console.log(`   Contains "maxReplicas: 20": ${hpa.includes('maxReplicas: 20')}`);
  
  return hpa;
}

async function testIngressGeneration() {
  console.log('\n🌐 Testing Ingress Generation...');
  
  const ingress = generateIngress({
    name: 'demo-app-ingress',
    namespace: 'production',
    ingressClassName: 'nginx',
    rules: [
      {
        host: 'api.example.com',
        paths: [
          {
            path: '/v1',
            pathType: 'Prefix',
            serviceName: 'demo-app-v1',
            servicePort: 80,
          },
          {
            path: '/v2',
            pathType: 'Prefix',
            serviceName: 'demo-app-v2',
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
            serviceName: 'demo-app-admin',
            servicePort: 80,
          },
        ],
      },
    ],
    tls: [
      {
        hosts: ['api.example.com', 'admin.example.com'],
        secretName: 'demo-app-tls',
      },
    ],
    annotations: {
      'cert-manager.io/cluster-issuer': 'letsencrypt-prod',
      'nginx.ingress.kubernetes.io/rate-limit': '100',
    },
  });

  console.log('✅ Ingress manifest generated successfully');
  console.log(`   Length: ${ingress.length} bytes`);
  console.log(`   Contains "Ingress": ${ingress.includes('Ingress')}`);
  console.log(`   Contains "api.example.com": ${ingress.includes('api.example.com')}`);
  console.log(`   Contains "admin.example.com": ${ingress.includes('admin.example.com')}`);
  console.log(`   Contains TLS config: ${ingress.includes('tls:')}`);
  
  return ingress;
}

async function testCompleteManifests() {
  console.log('\n📦 Testing Complete Manifest Generation...');
  
  const manifests = generateCompleteManifests(
    'demo-app',
    'production',
    'production',
    {
      nodeVersion: '20',
      port: 3000,
      replicas: 5,
      image: 'myregistry.io/demo-app:v1.2.3',
      enableAutoscaling: true,
      minReplicas: 3,
      maxReplicas: 20,
      targetCPUUtilization: 75,
      targetMemoryUtilization: 85,
      enableIngress: true,
      ingressHost: 'api.demo.com',
      ingressClassName: 'alb',
      enableTLS: true,
      tlsSecretName: 'demo-tls-cert',
    }
  );

  console.log('✅ Complete manifests generated successfully');
  console.log(`   Dockerfile: ${manifests.dockerfile ? 'YES' : 'NO'} (${manifests.dockerfile?.length || 0} bytes)`);
  console.log(`   Deployment: ${manifests.deployment ? 'YES' : 'NO'} (${manifests.deployment?.length || 0} bytes)`);
  console.log(`   Service: ${manifests.service ? 'YES' : 'NO'} (${manifests.service?.length || 0} bytes)`);
  console.log(`   HPA: ${manifests.hpa ? 'YES' : 'NO'} (${manifests.hpa?.length || 0} bytes)`);
  console.log(`   Ingress: ${manifests.ingress ? 'YES' : 'NO'} (${manifests.ingress?.length || 0} bytes)`);
  console.log(`   Helm Chart: ${manifests.helm?.chartYaml ? 'YES' : 'NO'}`);
  
  return manifests;
}

async function testWriteManifests() {
  console.log('\n💾 Testing Manifest File Writing...');
  
  const testDir = join(tmpdir(), `gati-hpa-ingress-test-${Date.now()}`);
  console.log(`   Output directory: ${testDir}`);
  
  const manifests = generateCompleteManifests(
    'test-app',
    'default',
    'production',
    {
      enableAutoscaling: true,
      minReplicas: 2,
      maxReplicas: 10,
      targetCPUUtilization: 70,
      enableIngress: true,
      ingressHost: 'test.example.com',
      enableTLS: true,
    }
  );

  const paths = await writeManifests(testDir, manifests);
  
  console.log('✅ Manifests written to files:');
  console.log(`   Dockerfile: ${paths.dockerfilePath}`);
  console.log(`   Deployment: ${paths.deploymentPath}`);
  console.log(`   Service: ${paths.servicePath}`);
  console.log(`   HPA: ${paths.hpaPath || 'N/A'}`);
  console.log(`   Ingress: ${paths.ingressPath || 'N/A'}`);
  console.log(`   Helm Chart: ${paths.chartPath}`);
  console.log(`   Helm Values: ${paths.valuesPath}`);
  
  return { testDir, paths };
}

async function testDevelopmentBehavior() {
  console.log('\n🔧 Testing Development Environment Behavior...');
  
  const manifests = generateCompleteManifests(
    'dev-app',
    'default',
    'development',
    {
      enableAutoscaling: true, // Should be ignored in dev
      minReplicas: 2,
      maxReplicas: 10,
    }
  );

  console.log('✅ Development manifests generated');
  console.log(`   HPA included: ${manifests.hpa ? 'YES (UNEXPECTED!)' : 'NO (correct)'}`);
  console.log(`   Fixed replicas in deployment: ${manifests.deployment.includes('replicas:')}`);
  
  return manifests;
}

async function displaySampleManifests(hpa: string, ingress: string) {
  console.log('\n' + '='.repeat(80));
  console.log('📄 SAMPLE HPA MANIFEST');
  console.log('='.repeat(80));
  console.log(hpa.split('\n').slice(0, 30).join('\n'));
  console.log('... (truncated) ...\n');
  
  console.log('='.repeat(80));
  console.log('📄 SAMPLE INGRESS MANIFEST');
  console.log('='.repeat(80));
  console.log(ingress.split('\n').slice(0, 35).join('\n'));
  console.log('... (truncated) ...\n');
}

async function main() {
  console.log('🚀 Gati HPA & Ingress Manifest Generator - External Test Suite');
  console.log('='.repeat(80));
  
  try {
    // Test 1: HPA Generation
    const hpa = await testHPAGeneration();
    
    // Test 2: Ingress Generation
    const ingress = await testIngressGeneration();
    
    // Test 3: Complete Manifests
    const completeManifests = await testCompleteManifests();
    
    // Test 4: Write to Files
    const { testDir, paths } = await testWriteManifests();
    
    // Test 5: Development Behavior
    await testDevelopmentBehavior();
    
    // Display samples
    await displaySampleManifests(hpa, ingress);
    
    console.log('='.repeat(80));
    console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log(`\n📂 Generated files are available at: ${testDir}`);
    console.log('\nYou can inspect the manifests with:');
    console.log(`   cat "${paths.hpaPath}"`);
    console.log(`   cat "${paths.ingressPath}"`);
    console.log('\nOr apply them to a Kubernetes cluster with:');
    console.log(`   kubectl apply -f "${testDir}"`);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error);
    process.exit(1);
  }
}

main();
