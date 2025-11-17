/**
 * @module production-hardening/secrets
 * @description Secure secret management with encryption and rotation
 */

import * as crypto from 'crypto';
import * as fs from 'fs';

/**
 * Secret configuration
 */
export interface SecretConfig {
  /** Secret name */
  name: string;
  /** Secret value */
  value: string;
  /** Rotation interval in days */
  rotationDays?: number;
  /** Last rotation timestamp */
  lastRotated?: Date;
}

/**
 * Secure secret manager with encryption
 */
export class SecretManager {
  private encryptionKey: Buffer;
  private algorithm = 'aes-256-gcm';

  constructor(encryptionKey?: string) {
    // Use provided key or generate from environment
    const key = encryptionKey || process.env['GATI_SECRET_KEY'];
    
    if (!key) {
      throw new Error('Encryption key required for SecretManager');
    }

    // Derive 32-byte key from provided key
    this.encryptionKey = crypto.scryptSync(key, 'salt', 32);
  }

  /**
   * Encrypt a secret value
   */
  encrypt(value: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv) as crypto.CipherGCM;

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt a secret value
   */
  decrypt(encryptedValue: string): string {
    const parts = encryptedValue.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted value format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted value format');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Store encrypted secret to file
   */
  storeSecret(config: SecretConfig, filePath: string): void {
    const encrypted = this.encrypt(config.value);
    
    const secretData = {
      name: config.name,
      value: encrypted,
      rotationDays: config.rotationDays,
      lastRotated: config.lastRotated || new Date(),
    };

    fs.writeFileSync(filePath, JSON.stringify(secretData, null, 2), 'utf8');
  }

  /**
   * Load and decrypt secret from file
   */
  loadSecret(filePath: string): SecretConfig {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Secret file not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent) as {
      name: string;
      value: string;
      rotationDays?: number;
      lastRotated?: string;
    };
    
    return {
      name: data.name,
      value: this.decrypt(data.value),
      rotationDays: data.rotationDays,
      lastRotated: data.lastRotated ? new Date(data.lastRotated) : undefined,
    };
  }

  /**
   * Check if secret needs rotation
   */
  needsRotation(secret: SecretConfig): boolean {
    if (!secret.rotationDays || !secret.lastRotated) {
      return false;
    }

    const now = new Date();
    const daysSinceRotation = Math.floor(
      (now.getTime() - secret.lastRotated.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceRotation >= secret.rotationDays;
  }

  /**
   * Generate a secure random secret
   */
  generateSecret(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * Hash a value (for comparing secrets without storing plaintext)
   */
  hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }
}

/**
 * Environment variable validator for secrets
 */
export class SecretValidator {
  /**
   * Validate required secrets are present
   */
  static validateRequired(requiredSecrets: string[]): void {
    const missing: string[] = [];

    for (const secret of requiredSecrets) {
      if (!process.env[secret]) {
        missing.push(secret);
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing required secrets: ${missing.join(', ')}\n` +
        'Set these environment variables or use a secret manager.'
      );
    }
  }

  /**
   * Sanitize secret for logging (show only first/last chars)
   */
  static sanitize(secret: string, showChars: number = 4): string {
    if (!secret || secret.length <= showChars * 2) {
      return '***';
    }

    const start = secret.substring(0, showChars);
    const end = secret.substring(secret.length - showChars);
    
    return `${start}***${end}`;
  }

  /**
   * Check secret strength
   */
  static checkStrength(secret: string): {
    strong: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (secret.length >= 16) score += 25;
    else if (secret.length >= 12) score += 15;
    else feedback.push('Secret should be at least 16 characters long');

    // Complexity checks
    if (/[a-z]/.test(secret)) score += 15;
    else feedback.push('Should contain lowercase letters');

    if (/[A-Z]/.test(secret)) score += 15;
    else feedback.push('Should contain uppercase letters');

    if (/[0-9]/.test(secret)) score += 15;
    else feedback.push('Should contain numbers');

    if (/[^a-zA-Z0-9]/.test(secret)) score += 15;
    else feedback.push('Should contain special characters');

    // Entropy check (no repeated patterns)
    if (!/(.)\1{2,}/.test(secret)) score += 15;
    else feedback.push('Avoid repeated characters');

    return {
      strong: score >= 70,
      score,
      feedback,
    };
  }
}
