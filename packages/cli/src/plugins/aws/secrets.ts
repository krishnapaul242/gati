/**
 * @module plugins/aws/secrets
 * @description AWS Secrets Manager integration
 */

import type { SecretsConfig } from './types';

/**
 * Generate CloudFormation template for secrets
 */
export function generateSecretsTemplate(
  clusterName: string,
  config: SecretsConfig
): string {
  const resources: Record<string, unknown> = {};
  
  config.secrets?.forEach((secret, index) => {
    const resourceName = `Secret${index + 1}`;
    resources[resourceName] = {
      Type: 'AWS::SecretsManager::Secret',
      Properties: {
        Name: `${config.secretPrefix}/${secret.name}`,
        Description: secret.description || `Secret for ${clusterName}: ${secret.name}`,
        SecretString: secret.value || JSON.stringify({ placeholder: 'UPDATE_ME' }),
        Tags: [
          { Key: 'Name', Value: `${config.secretPrefix}/${secret.name}` },
          { Key: 'Cluster', Value: clusterName },
          { Key: 'ManagedBy', Value: 'Gati' },
        ],
      },
    };
    
    if (config.enableRotation) {
      resources[`${resourceName}RotationSchedule`] = {
        Type: 'AWS::SecretsManager::RotationSchedule',
        Properties: {
          SecretId: { Ref: resourceName },
          RotationRules: {
            AutomaticallyAfterDays: 30,
          },
        },
      };
    }
  });
  
  const template = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: `Secrets for Gati cluster: ${clusterName}`,
    Resources: resources,
    Outputs: Object.fromEntries(
      (config.secrets || []).map((secret, index) => [
        `Secret${index + 1}Arn`,
        {
          Value: { Ref: `Secret${index + 1}` },
          Export: { Name: `${clusterName}-${secret.name}-SecretArn` },
        },
      ])
    ),
  };
  
  return JSON.stringify(template, null, 2);
}

/**
 * Generate Kubernetes Secret manifest from AWS Secrets Manager
 */
export function generateK8sSecretManifest(
  secretName: string,
  namespace: string,
  awsSecretArn: string,
  region: string
): string {
  return `apiVersion: v1
kind: Secret
metadata:
  name: ${secretName}
  namespace: ${namespace}
  annotations:
    aws-secret-arn: ${awsSecretArn}
    aws-region: ${region}
type: Opaque
# Secret data will be populated by AWS Secrets Manager CSI driver or External Secrets Operator
`;
}

/**
 * Generate External Secrets Operator SecretStore
 */
export function generateExternalSecretStore(
  _clusterName: string,
  region: string,
  roleArn: string
): string {
  return `apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: default
spec:
  provider:
    aws:
      service: SecretsManager
      region: ${region}
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: external-secrets-sa
  namespace: default
  annotations:
    eks.amazonaws.com/role-arn: ${roleArn}
`;
}

/**
 * Generate IAM policy for Secrets Manager access
 */
export function generateSecretsIAMPolicy(
  _clusterName: string,
  secretArns: string[]
): string {
  return JSON.stringify(
    {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'secretsmanager:GetSecretValue',
            'secretsmanager:DescribeSecret',
          ],
          Resource: secretArns,
        },
      ],
    },
    null,
    2
  );
}

/**
 * Validate secrets configuration
 */
export function validateSecretsConfig(config: SecretsConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!config.secretPrefix) {
    errors.push('Secret prefix is required');
  }
  
  if (config.secretPrefix && config.secretPrefix.includes('//')) {
    errors.push('Secret prefix cannot contain consecutive slashes');
  }
  
  config.secrets?.forEach((secret, index) => {
    if (!secret.name) {
      errors.push(`Secret ${index + 1}: name is required`);
    }
    
    if (secret.name && /[^a-zA-Z0-9/_-]/.test(secret.name)) {
      errors.push(`Secret ${index + 1}: name contains invalid characters`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get default secrets configuration
 */
export function getDefaultSecretsConfig(clusterName: string): SecretsConfig {
  return {
    enabled: true,
    secretPrefix: `gati/${clusterName}`,
    secrets: [
      {
        name: 'database-url',
        description: 'Database connection string',
      },
      {
        name: 'api-keys',
        description: 'API keys and tokens',
      },
    ],
    enableRotation: false,
  };
}
