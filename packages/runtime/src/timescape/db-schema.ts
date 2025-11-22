import type { TSV } from './types.js';

export interface DBSchemaMetadata {
    version: string;              // e.g., "schema_v42"
    migrations: string[];         // SQL/migration scripts
    rollback: string[];           // Rollback scripts
    compatibleWith?: string[];    // Other schema versions this works with
}

export interface DBSchemaVersion {
    schemaVersion: string;
    tsv: TSV;
    handlerPath: string;
    appliedAt?: number;
    rolledBackAt?: number;
    status: 'pending' | 'applied' | 'rolled_back' | 'failed';
    error?: string;
}

export interface MigrationResult {
    success: boolean;
    schemaVersion: string;
    executedMigrations: string[];
    error?: string;
    duration: number;
}

export interface RollbackResult {
    success: boolean;
    schemaVersion: string;
    executedRollbacks: string[];
    error?: string;
    duration: number;
}

export interface DBSchemaManagerConfig {
    /**
     * Function to execute a migration script
     * Should return true if successful, false otherwise
     */
    executeMigration: (script: string) => Promise<boolean>;

    /**
     * Function to execute a rollback script
     * Should return true if successful, false otherwise
     */
    executeRollback: (script: string) => Promise<boolean>;

    /**
     * Optional callback when schema is applied
     */
    onSchemaApplied?: (schemaVersion: string, tsv: TSV) => void;

    /**
     * Optional callback when schema is rolled back
     */
    onSchemaRolledBack?: (schemaVersion: string, tsv: TSV) => void;

    /**
     * Whether to run migrations in a transaction (if supported)
     */
    useTransaction?: boolean;

    /**
     * Timeout for migration execution (ms)
     */
    migrationTimeout?: number;
}

/**
 * Manages database schema versions alongside TSV versions
 */
export class DBSchemaManager {
    private schemas: Map<string, DBSchemaVersion> = new Map();
    private activeSchemas: Set<string> = new Set();
    private schemaUsage: Map<string, Set<TSV>> = new Map(); // Track which TSVs use each schema
    private config: DBSchemaManagerConfig;

    constructor(config: DBSchemaManagerConfig) {
        this.config = {
            useTransaction: true,
            migrationTimeout: 30000, // 30 seconds default
            ...config,
        };
    }

    /**
     * Register a schema version from TSV metadata
     */
    public registerSchema(
        tsv: TSV,
        handlerPath: string,
        schemaMetadata: DBSchemaMetadata
    ): void {
        const { version: schemaVersion } = schemaMetadata;

        // Track schema usage
        if (!this.schemaUsage.has(schemaVersion)) {
            this.schemaUsage.set(schemaVersion, new Set());
        }
        this.schemaUsage.get(schemaVersion)!.add(tsv);

        // Register schema if not already registered
        if (!this.schemas.has(schemaVersion)) {
            this.schemas.set(schemaVersion, {
                schemaVersion,
                tsv,
                handlerPath,
                status: 'pending',
            });
        }
    }

    /**
     * Apply migrations for a schema version
     */
    public async applyMigrations(
        schemaVersion: string,
        metadata: DBSchemaMetadata
    ): Promise<MigrationResult> {
        const startTime = Date.now();
        const schema = this.schemas.get(schemaVersion);

        if (!schema) {
            return {
                success: false,
                schemaVersion,
                executedMigrations: [],
                error: `Schema version ${schemaVersion} not registered`,
                duration: Date.now() - startTime,
            };
        }

        // Check if already applied
        if (schema.status === 'applied') {
            return {
                success: true,
                schemaVersion,
                executedMigrations: [],
                duration: Date.now() - startTime,
            };
        }

        const executedMigrations: string[] = [];

        try {
            // Execute migrations
            for (const migration of metadata.migrations) {
                const success = await this.executeMigrationWithTimeout(migration);
                
                if (!success) {
                    throw new Error(`Migration failed: ${migration.substring(0, 100)}...`);
                }

                executedMigrations.push(migration);
            }

            // Mark as applied
            schema.status = 'applied';
            schema.appliedAt = Date.now();
            this.activeSchemas.add(schemaVersion);

            // Callback
            if (this.config.onSchemaApplied) {
                this.config.onSchemaApplied(schemaVersion, schema.tsv);
            }

            return {
                success: true,
                schemaVersion,
                executedMigrations,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            schema.status = 'failed';
            schema.error = error instanceof Error ? error.message : String(error);

            return {
                success: false,
                schemaVersion,
                executedMigrations,
                error: schema.error,
                duration: Date.now() - startTime,
            };
        }
    }

    /**
     * Rollback a schema version
     */
    public async rollbackSchema(
        schemaVersion: string,
        metadata: DBSchemaMetadata
    ): Promise<RollbackResult> {
        const startTime = Date.now();
        const schema = this.schemas.get(schemaVersion);

        if (!schema) {
            return {
                success: false,
                schemaVersion,
                executedRollbacks: [],
                error: `Schema version ${schemaVersion} not registered`,
                duration: Date.now() - startTime,
            };
        }

        // Check if not applied
        if (schema.status !== 'applied') {
            return {
                success: true,
                schemaVersion,
                executedRollbacks: [],
                duration: Date.now() - startTime,
            };
        }

        const executedRollbacks: string[] = [];

        try {
            // Execute rollbacks in reverse order
            for (const rollback of [...metadata.rollback].reverse()) {
                const success = await this.executeRollbackWithTimeout(rollback);
                
                if (!success) {
                    throw new Error(`Rollback failed: ${rollback.substring(0, 100)}...`);
                }

                executedRollbacks.push(rollback);
            }

            // Mark as rolled back
            schema.status = 'rolled_back';
            schema.rolledBackAt = Date.now();
            this.activeSchemas.delete(schemaVersion);

            // Callback
            if (this.config.onSchemaRolledBack) {
                this.config.onSchemaRolledBack(schemaVersion, schema.tsv);
            }

            return {
                success: true,
                schemaVersion,
                executedRollbacks,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            schema.status = 'failed';
            schema.error = error instanceof Error ? error.message : String(error);

            return {
                success: false,
                schemaVersion,
                executedRollbacks,
                error: schema.error,
                duration: Date.now() - startTime,
            };
        }
    }

    /**
     * Check if a schema is active
     */
    public isSchemaActive(schemaVersion: string): boolean {
        return this.activeSchemas.has(schemaVersion);
    }

    /**
     * Check if a schema is used by other versions
     */
    public isSchemaUsedByOthers(schemaVersion: string, excludeTsv?: TSV): boolean {
        const usage = this.schemaUsage.get(schemaVersion);
        if (!usage) return false;

        if (excludeTsv) {
            return Array.from(usage).some(tsv => tsv !== excludeTsv);
        }

        return usage.size > 0;
    }

    /**
     * Get all TSVs using a schema version
     */
    public getSchemaUsage(schemaVersion: string): TSV[] {
        return Array.from(this.schemaUsage.get(schemaVersion) || []);
    }

    /**
     * Activate a version (apply schema if needed)
     */
    public async activateVersion(
        tsv: TSV,
        handlerPath: string,
        schemaMetadata?: DBSchemaMetadata
    ): Promise<MigrationResult | null> {
        if (!schemaMetadata) {
            return null;
        }

        const { version: schemaVersion } = schemaMetadata;

        // Register schema
        this.registerSchema(tsv, handlerPath, schemaMetadata);

        // Apply migrations if not already active
        if (!this.isSchemaActive(schemaVersion)) {
            return await this.applyMigrations(schemaVersion, schemaMetadata);
        }

        return null;
    }

    /**
     * Deactivate a version (rollback schema if no other versions use it)
     */
    public async deactivateVersion(
        tsv: TSV,
        schemaMetadata?: DBSchemaMetadata
    ): Promise<RollbackResult | null> {
        if (!schemaMetadata) {
            return null;
        }

        const { version: schemaVersion } = schemaMetadata;

        // Remove from usage tracking
        const usage = this.schemaUsage.get(schemaVersion);
        if (usage) {
            usage.delete(tsv);
        }

        // Only rollback if no other versions use this schema
        if (!this.isSchemaUsedByOthers(schemaVersion)) {
            return await this.rollbackSchema(schemaVersion, schemaMetadata);
        }

        return null;
    }

    /**
     * Get schema status
     */
    public getSchemaStatus(schemaVersion: string): DBSchemaVersion | undefined {
        return this.schemas.get(schemaVersion);
    }

    /**
     * Get all active schemas
     */
    public getActiveSchemas(): string[] {
        return Array.from(this.activeSchemas);
    }

    /**
     * Get all schemas
     */
    public getAllSchemas(): DBSchemaVersion[] {
        return Array.from(this.schemas.values());
    }

    /**
     * Check if schemas are compatible
     */
    public areCompatible(schema1: string, schema2: string, metadata: DBSchemaMetadata): boolean {
        if (schema1 === schema2) return true;
        
        const compatibleWith = metadata.compatibleWith || [];
        return compatibleWith.includes(schema1) || compatibleWith.includes(schema2);
    }

    /**
     * Get statistics
     */
    public getStatistics(): {
        totalSchemas: number;
        activeSchemas: number;
        pendingSchemas: number;
        failedSchemas: number;
        rolledBackSchemas: number;
    } {
        let pending = 0;
        let failed = 0;
        let rolledBack = 0;

        for (const schema of this.schemas.values()) {
            switch (schema.status) {
                case 'pending': pending++; break;
                case 'failed': failed++; break;
                case 'rolled_back': rolledBack++; break;
            }
        }

        return {
            totalSchemas: this.schemas.size,
            activeSchemas: this.activeSchemas.size,
            pendingSchemas: pending,
            failedSchemas: failed,
            rolledBackSchemas: rolledBack,
        };
    }

    /**
     * Clear all schemas (for testing)
     */
    public clear(): void {
        this.schemas.clear();
        this.activeSchemas.clear();
        this.schemaUsage.clear();
    }

    /**
     * Execute migration with timeout
     */
    private async executeMigrationWithTimeout(script: string): Promise<boolean> {
        const timeout = this.config.migrationTimeout || 30000;

        return Promise.race([
            this.config.executeMigration(script),
            new Promise<boolean>((_, reject) => 
                setTimeout(() => reject(new Error('Migration timeout')), timeout)
            ),
        ]);
    }

    /**
     * Execute rollback with timeout
     */
    private async executeRollbackWithTimeout(script: string): Promise<boolean> {
        const timeout = this.config.migrationTimeout || 30000;

        return Promise.race([
            this.config.executeRollback(script),
            new Promise<boolean>((_, reject) => 
                setTimeout(() => reject(new Error('Rollback timeout')), timeout)
            ),
        ]);
    }
}
