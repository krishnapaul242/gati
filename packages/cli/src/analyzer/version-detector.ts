/**
 * @module cli/analyzer/version-detector
 * @description Detects handler changes and creates new versions automatically
 */

import { readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import { createHash } from 'crypto';

// @ts-expect-error - Imports are valid after build
import { VersionRegistry } from '@gati-framework/runtime/timescape/registry';
// @ts-expect-error - Imports are valid after build
import { DiffEngine } from '@gati-framework/runtime/timescape/diff-engine';
// @ts-expect-error - Imports are valid after build
import type { TSV, TypeSchema } from '@gati-framework/runtime/timescape/types';

export interface VersionChange {
  handlerPath: string;
  oldVersion?: TSV;
  newVersion: TSV;
  breaking: boolean;
  changes: string[];
  timestamp: number;
}

export class VersionDetector {
  private registry: VersionRegistry;
  private diffEngine: DiffEngine;
  private projectRoot: string;
  private registryPath: string;
  private enabled: boolean;

  constructor(projectRoot: string, enabled: boolean = true) {
    this.projectRoot = projectRoot;
    this.enabled = enabled;
    this.registry = new VersionRegistry();
    this.diffEngine = new DiffEngine();
    
    // Initialize registry path
    const timescapeDir = resolve(projectRoot, '.gati', 'timescape');
    if (!existsSync(timescapeDir)) {
      mkdirSync(timescapeDir, { recursive: true });
    }
    this.registryPath = resolve(timescapeDir, 'registry.json');
    
    // Load existing registry if it exists
    if (existsSync(this.registryPath)) {
      try {
        this.registry.deserialize(this.registryPath);
        console.log(chalk.gray('📋 Loaded existing version registry'));
      } catch (error) {
        console.log(chalk.yellow('⚠ Failed to load version registry, starting fresh'));
      }
    }
  }

  /**
   * Detect if a handler has changed and create a new version if needed
   */
  async detectChange(handlerPath: string, handlerCode: string): Promise<VersionChange | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      // Extract schema from handler code
      const schema = this.extractSchema(handlerCode);
      if (!schema) {
        return null; // No schema found, skip versioning
      }

      // Calculate hash of the schema
      const schemaHash = this.calculateHash(schema);

      // Get latest version for this handler
      const versions = this.registry.getVersions(handlerPath);
      const latestVersion = versions.length > 0 ? versions[versions.length - 1] : null;

      // Check if schema has changed
      if (latestVersion && latestVersion.hash === schemaHash) {
        // No change detected
        return null;
      }

      // Schema has changed, create new version
      const timestamp = Date.now();
      const versionNumber = versions.length + 1;
      const handlerName = this.extractHandlerName(handlerPath);
      const tsv: TSV = `tsv:${Math.floor(timestamp / 1000)}-${handlerName}-${String(versionNumber).padStart(3, '0')}`;

      // Register new version
      this.registry.registerVersion(handlerPath, tsv, {
        hash: schemaHash,
        schema
      });

      // Detect breaking changes if there's a previous version
      let breaking = false;
      const changes: string[] = [];

      if (latestVersion && latestVersion.schema) {
        const diff = this.diffEngine.compareSchemas(latestVersion.schema, schema);
        breaking = diff.requiresTransformer;
        
        // Collect change descriptions
        for (const change of diff.breaking) {
          changes.push(`BREAKING: ${change.type} - ${change.path}`);
        }
        for (const change of diff.nonBreaking) {
          changes.push(`Non-breaking: ${change.type} - ${change.path}`);
        }
      } else {
        changes.push('Initial version created');
      }

      // Save registry
      this.registry.serialize(this.registryPath);

      // Return change information
      return {
        handlerPath,
        oldVersion: latestVersion?.tsv,
        newVersion: tsv,
        breaking,
        changes,
        timestamp
      };
    } catch (error) {
      console.error(chalk.red(`Failed to detect version change for ${handlerPath}:`), error);
      return null;
    }
  }

  /**
   * Extract schema from handler code
   * This is a simplified version - in production, you'd use TypeScript compiler API
   */
  private extractSchema(handlerCode: string): TypeSchema | null {
    try {
      // Look for interface definitions
      const interfaceRegex = /export\s+interface\s+(\w+)\s*\{([^}]+)\}/g;
      const matches = [...handlerCode.matchAll(interfaceRegex)];

      if (matches.length === 0) {
        return null;
      }

      // Find request and response interfaces
      let requestSchema: any = null;
      let responseSchema: any = null;

      for (const match of matches) {
        const interfaceName = match[1];
        const interfaceBody = match[2];

        if (interfaceName.toLowerCase().includes('request') || interfaceName.toLowerCase().includes('input')) {
          requestSchema = this.parseInterfaceBody(interfaceBody);
        } else if (interfaceName.toLowerCase().includes('response') || interfaceName.toLowerCase().includes('output')) {
          responseSchema = this.parseInterfaceBody(interfaceBody);
        }
      }

      // If we found at least one schema, return it
      if (requestSchema || responseSchema) {
        return {
          request: requestSchema || {},
          response: responseSchema || {}
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to extract schema:', error);
      return null;
    }
  }

  /**
   * Parse interface body to extract fields
   */
  private parseInterfaceBody(body: string): Record<string, any> {
    const fields: Record<string, any> = {};
    const lines = body.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) {
        continue;
      }

      // Match field: type pattern
      const fieldMatch = trimmed.match(/(\w+)(\?)?:\s*([^;]+)/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const optional = !!fieldMatch[2];
        const fieldType = fieldMatch[3].trim();

        fields[fieldName] = {
          type: fieldType,
          required: !optional
        };
      }
    }

    return fields;
  }

  /**
   * Calculate hash of schema for change detection
   */
  private calculateHash(schema: TypeSchema): string {
    const schemaStr = JSON.stringify(schema, Object.keys(schema).sort());
    return createHash('sha256').update(schemaStr).digest('hex').substring(0, 12);
  }

  /**
   * Extract handler name from path
   */
  private extractHandlerName(handlerPath: string): string {
    // Extract last part of path and remove extension
    const parts = handlerPath.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.replace(/\.(ts|js)$/, '').replace(/[^a-zA-Z0-9]/g, '-');
  }

  /**
   * Get version registry for external access
   */
  getRegistry(): VersionRegistry {
    return this.registry;
  }

  /**
   * Check if versioning is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
