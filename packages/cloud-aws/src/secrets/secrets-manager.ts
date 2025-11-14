/**
 * @module cloud-aws/secrets
 * @description AWS Secrets Manager integration for secure secret storage
 */

import {
  SecretsManagerClient,
  CreateSecretCommand,
  GetSecretValueCommand,
  DeleteSecretCommand,
  UpdateSecretCommand,
  DescribeSecretCommand,
  type GetSecretValueCommandOutput,
} from '@aws-sdk/client-secrets-manager';
import type { SecretConfig } from '@gati-framework/core/cloud-provider';

/**
 * AWS Secrets Manager client wrapper
 */
export class AWSSecretsManager {
  private client: SecretsManagerClient;
  private region: string;

  constructor(region: string = 'us-east-1') {
    this.region = region;
    this.client = new SecretsManagerClient({ region });
  }

  /**
   * Store a secret in AWS Secrets Manager
   */
  async storeSecret(config: SecretConfig): Promise<void> {
    const secretString = JSON.stringify(config.values);

    try {
      // Try to update existing secret
      const updateCommand = new UpdateSecretCommand({
        SecretId: config.name,
        SecretString: secretString,
      });
      await this.client.send(updateCommand);
    } catch (error) {
      // Secret doesn't exist, create it
      const createCommand = new CreateSecretCommand({
        Name: config.name,
        SecretString: secretString,
        Tags: config.tags
          ? Object.entries(config.tags).map(([Key, Value]) => ({
              Key,
              Value,
            }))
          : undefined,
      });
      await this.client.send(createCommand);
    }
  }

  /**
   * Retrieve a secret from AWS Secrets Manager
   */
  async retrieveSecret(name: string): Promise<Record<string, string>> {
    const command = new GetSecretValueCommand({
      SecretId: name,
    });

    const response: GetSecretValueCommandOutput =
      await this.client.send(command);

    if (!response.SecretString) {
      throw new Error(`Secret ${name} has no string value`);
    }

    return JSON.parse(response.SecretString);
  }

  /**
   * Delete a secret from AWS Secrets Manager
   */
  async deleteSecret(
    name: string,
    options: { force?: boolean; recoveryWindow?: number } = {}
  ): Promise<void> {
    const command = new DeleteSecretCommand({
      SecretId: name,
      ForceDeleteWithoutRecovery: options.force || false,
      RecoveryWindowInDays: options.recoveryWindow || 30,
    });

    await this.client.send(command);
  }

  /**
   * Check if a secret exists
   */
  async secretExists(name: string): Promise<boolean> {
    try {
      const command = new DescribeSecretCommand({
        SecretId: name,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Rotate secret value
   */
  async rotateSecret(
    name: string,
    newValues: Record<string, string>
  ): Promise<void> {
    const secretString = JSON.stringify(newValues);

    const command = new UpdateSecretCommand({
      SecretId: name,
      SecretString: secretString,
    });

    await this.client.send(command);
  }
}
