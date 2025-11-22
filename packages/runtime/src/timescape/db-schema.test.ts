import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DBSchemaManager, type DBSchemaMetadata, type DBSchemaManagerConfig } from './db-schema.js';
import type { TSV } from './types.js';

describe('DBSchemaManager', () => {
    let manager: DBSchemaManager;
    let executedMigrations: string[];
    let executedRollbacks: string[];
    let mockExecuteMigration: (script: string) => Promise<boolean>;
    let mockExecuteRollback: (script: string) => Promise<boolean>;

    beforeEach(() => {
        executedMigrations = [];
        executedRollbacks = [];

        mockExecuteMigration = vi.fn(async (script: string) => {
            executedMigrations.push(script);
            return true;
        });

        mockExecuteRollback = vi.fn(async (script: string) => {
            executedRollbacks.push(script);
            return true;
        });

        const config: DBSchemaManagerConfig = {
            executeMigration: mockExecuteMigration,
            executeRollback: mockExecuteRollback,
        };

        manager = new DBSchemaManager(config);
    });

    describe('Schema Registration', () => {
        it('should register a schema version', () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: ['DROP TABLE users'],
            };

            manager.registerSchema(tsv, '/api/users', metadata);

            const status = manager.getSchemaStatus('schema_v1');
            expect(status).toBeDefined();
            expect(status?.schemaVersion).toBe('schema_v1');
            expect(status?.tsv).toBe(tsv);
            expect(status?.status).toBe('pending');
        });

        it('should track schema usage by TSV', () => {
            const tsv1: TSV = 'tsv:1732186200-users-001';
            const tsv2: TSV = 'tsv:1732186300-users-002';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: [],
                rollback: [],
            };

            manager.registerSchema(tsv1, '/api/users', metadata);
            manager.registerSchema(tsv2, '/api/users', metadata);

            const usage = manager.getSchemaUsage('schema_v1');
            expect(usage).toHaveLength(2);
            expect(usage).toContain(tsv1);
            expect(usage).toContain(tsv2);
        });

        it('should not duplicate schema registration', () => {
            const tsv1: TSV = 'tsv:1732186200-users-001';
            const tsv2: TSV = 'tsv:1732186300-users-002';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: [],
                rollback: [],
            };

            manager.registerSchema(tsv1, '/api/users', metadata);
            manager.registerSchema(tsv2, '/api/users', metadata);

            const schemas = manager.getAllSchemas();
            expect(schemas).toHaveLength(1);
        });
    });

    describe('Migration Execution', () => {
        it('should apply migrations successfully', async () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: [
                    'CREATE TABLE users (id INT)',
                    'CREATE INDEX idx_users_id ON users(id)',
                ],
                rollback: ['DROP TABLE users'],
            };

            manager.registerSchema(tsv, '/api/users', metadata);
            const result = await manager.applyMigrations('schema_v1', metadata);

            expect(result.success).toBe(true);
            expect(result.executedMigrations).toHaveLength(2);
            expect(executedMigrations).toEqual(metadata.migrations);
            expect(manager.isSchemaActive('schema_v1')).toBe(true);
        });

        it('should not re-apply already applied migrations', async () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: ['DROP TABLE users'],
            };

            manager.registerSchema(tsv, '/api/users', metadata);
            await manager.applyMigrations('schema_v1', metadata);
            
            executedMigrations = [];
            const result = await manager.applyMigrations('schema_v1', metadata);

            expect(result.success).toBe(true);
            expect(executedMigrations).toHaveLength(0);
        });

        it('should handle migration failure', async () => {
            const failingMigration = vi.fn(async () => false);
            const failManager = new DBSchemaManager({
                executeMigration: failingMigration,
                executeRollback: mockExecuteRollback,
            });

            const tsv: TSV = 'tsv:1732186200-users-001';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: ['DROP TABLE users'],
            };

            failManager.registerSchema(tsv, '/api/users', metadata);
            const result = await failManager.applyMigrations('schema_v1', metadata);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(failManager.isSchemaActive('schema_v1')).toBe(false);
        });

        it('should fail if schema not registered', async () => {
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: ['DROP TABLE users'],
            };

            const result = await manager.applyMigrations('schema_v1', metadata);

            expect(result.success).toBe(false);
            expect(result.error).toContain('not registered');
        });

        it('should call onSchemaApplied callback', async () => {
            const onSchemaApplied = vi.fn();
            const callbackManager = new DBSchemaManager({
                executeMigration: mockExecuteMigration,
                executeRollback: mockExecuteRollback,
                onSchemaApplied,
            });

            const tsv: TSV = 'tsv:1732186200-users-001';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: ['DROP TABLE users'],
            };

            callbackManager.registerSchema(tsv, '/api/users', metadata);
            await callbackManager.applyMigrations('schema_v1', metadata);

            expect(onSchemaApplied).toHaveBeenCalledWith('schema_v1', tsv);
        });
    });

    describe('Rollback Execution', () => {
        it('should rollback schema successfully', async () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: [
                    'DROP INDEX idx_users_id',
                    'DROP TABLE users',
                ],
            };

            manager.registerSchema(tsv, '/api/users', metadata);
            await manager.applyMigrations('schema_v1', metadata);

            const result = await manager.rollbackSchema('schema_v1', metadata);

            expect(result.success).toBe(true);
            expect(result.executedRollbacks).toHaveLength(2);
            // Rollbacks should be executed in reverse order
            expect(executedRollbacks).toEqual([...metadata.rollback].reverse());
            expect(manager.isSchemaActive('schema_v1')).toBe(false);
        });

        it('should not rollback non-applied schema', async () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: ['DROP TABLE users'],
            };

            manager.registerSchema(tsv, '/api/users', metadata);
            const result = await manager.rollbackSchema('schema_v1', metadata);

            expect(result.success).toBe(true);
            expect(executedRollbacks).toHaveLength(0);
        });

        it('should handle rollback failure', async () => {
            const failingRollback = vi.fn(async () => false);
            const failManager = new DBSchemaManager({
                executeMigration: mockExecuteMigration,
                executeRollback: failingRollback,
            });

            const tsv: TSV = 'tsv:1732186200-users-001';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: ['DROP TABLE users'],
            };

            failManager.registerSchema(tsv, '/api/users', metadata);
            await failManager.applyMigrations('schema_v1', metadata);

            const result = await failManager.rollbackSchema('schema_v1', metadata);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should call onSchemaRolledBack callback', async () => {
            const onSchemaRolledBack = vi.fn();
            const callbackManager = new DBSchemaManager({
                executeMigration: mockExecuteMigration,
                executeRollback: mockExecuteRollback,
                onSchemaRolledBack,
            });

            const tsv: TSV = 'tsv:1732186200-users-001';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: ['DROP TABLE users'],
            };

            callbackManager.registerSchema(tsv, '/api/users', metadata);
            await callbackManager.applyMigrations('schema_v1', metadata);
            await callbackManager.rollbackSchema('schema_v1', metadata);

            expect(onSchemaRolledBack).toHaveBeenCalledWith('schema_v1', tsv);
        });
    });

    describe('Version Activation/Deactivation', () => {
        it('should activate version with schema', async () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: ['DROP TABLE users'],
            };

            const result = await manager.activateVersion(tsv, '/api/users', metadata);

            expect(result).not.toBeNull();
            expect(result?.success).toBe(true);
            expect(manager.isSchemaActive('schema_v1')).toBe(true);
        });

        it('should not apply migrations if schema already active', async () => {
            const tsv1: TSV = 'tsv:1732186200-users-001';
            const tsv2: TSV = 'tsv:1732186300-users-002';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: ['DROP TABLE users'],
            };

            await manager.activateVersion(tsv1, '/api/users', metadata);
            executedMigrations = [];

            const result = await manager.activateVersion(tsv2, '/api/users', metadata);

            expect(result).toBeNull();
            expect(executedMigrations).toHaveLength(0);
        });

        it('should deactivate version and rollback if no other users', async () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: ['DROP TABLE users'],
            };

            await manager.activateVersion(tsv, '/api/users', metadata);
            const result = await manager.deactivateVersion(tsv, metadata);

            expect(result).not.toBeNull();
            expect(result?.success).toBe(true);
            expect(manager.isSchemaActive('schema_v1')).toBe(false);
        });

        it('should not rollback if other versions use the schema', async () => {
            const tsv1: TSV = 'tsv:1732186200-users-001';
            const tsv2: TSV = 'tsv:1732186300-users-002';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: ['DROP TABLE users'],
            };

            await manager.activateVersion(tsv1, '/api/users', metadata);
            await manager.activateVersion(tsv2, '/api/users', metadata);

            executedRollbacks = [];
            const result = await manager.deactivateVersion(tsv1, metadata);

            expect(result).toBeNull();
            expect(executedRollbacks).toHaveLength(0);
            expect(manager.isSchemaActive('schema_v1')).toBe(true);
        });
    });

    describe('Schema Usage Tracking', () => {
        it('should check if schema is used by others', () => {
            const tsv1: TSV = 'tsv:1732186200-users-001';
            const tsv2: TSV = 'tsv:1732186300-users-002';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: [],
                rollback: [],
            };

            manager.registerSchema(tsv1, '/api/users', metadata);
            manager.registerSchema(tsv2, '/api/users', metadata);

            expect(manager.isSchemaUsedByOthers('schema_v1', tsv1)).toBe(true);
            expect(manager.isSchemaUsedByOthers('schema_v1', tsv2)).toBe(true);
        });

        it('should return false if schema not used by others', () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: [],
                rollback: [],
            };

            manager.registerSchema(tsv, '/api/users', metadata);

            expect(manager.isSchemaUsedByOthers('schema_v1', tsv)).toBe(false);
        });

        it('should get all TSVs using a schema', () => {
            const tsv1: TSV = 'tsv:1732186200-users-001';
            const tsv2: TSV = 'tsv:1732186300-users-002';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: [],
                rollback: [],
            };

            manager.registerSchema(tsv1, '/api/users', metadata);
            manager.registerSchema(tsv2, '/api/users', metadata);

            const usage = manager.getSchemaUsage('schema_v1');
            expect(usage).toHaveLength(2);
            expect(usage).toContain(tsv1);
            expect(usage).toContain(tsv2);
        });
    });

    describe('Schema Compatibility', () => {
        it('should check if schemas are compatible', () => {
            const metadata: DBSchemaMetadata = {
                version: 'schema_v2',
                migrations: [],
                rollback: [],
                compatibleWith: ['schema_v1'],
            };

            expect(manager.areCompatible('schema_v1', 'schema_v2', metadata)).toBe(true);
            expect(manager.areCompatible('schema_v2', 'schema_v1', metadata)).toBe(true);
        });

        it('should return true for same schema', () => {
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: [],
                rollback: [],
            };

            expect(manager.areCompatible('schema_v1', 'schema_v1', metadata)).toBe(true);
        });

        it('should return false for incompatible schemas', () => {
            const metadata: DBSchemaMetadata = {
                version: 'schema_v2',
                migrations: [],
                rollback: [],
            };

            expect(manager.areCompatible('schema_v1', 'schema_v2', metadata)).toBe(false);
        });
    });

    describe('Statistics', () => {
        it('should return correct statistics', async () => {
            const tsv1: TSV = 'tsv:1732186200-users-001';
            const tsv2: TSV = 'tsv:1732186300-users-002';
            const tsv3: TSV = 'tsv:1732186400-users-003';

            const metadata1: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: ['DROP TABLE users'],
            };

            const metadata2: DBSchemaMetadata = {
                version: 'schema_v2',
                migrations: ['CREATE TABLE posts (id INT)'],
                rollback: ['DROP TABLE posts'],
            };

            const metadata3: DBSchemaMetadata = {
                version: 'schema_v3',
                migrations: ['CREATE TABLE comments (id INT)'],
                rollback: ['DROP TABLE comments'],
            };

            // Applied
            await manager.activateVersion(tsv1, '/api/users', metadata1);
            
            // Pending
            manager.registerSchema(tsv2, '/api/posts', metadata2);
            
            // Rolled back
            await manager.activateVersion(tsv3, '/api/comments', metadata3);
            await manager.deactivateVersion(tsv3, metadata3);

            const stats = manager.getStatistics();

            expect(stats.totalSchemas).toBe(3);
            expect(stats.activeSchemas).toBe(1);
            expect(stats.pendingSchemas).toBe(1);
            expect(stats.rolledBackSchemas).toBe(1);
        });
    });

    describe('Query Methods', () => {
        it('should get schema status', async () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: ['DROP TABLE users'],
            };

            manager.registerSchema(tsv, '/api/users', metadata);
            await manager.applyMigrations('schema_v1', metadata);

            const status = manager.getSchemaStatus('schema_v1');

            expect(status).toBeDefined();
            expect(status?.status).toBe('applied');
            expect(status?.appliedAt).toBeDefined();
        });

        it('should get all active schemas', async () => {
            const tsv1: TSV = 'tsv:1732186200-users-001';
            const tsv2: TSV = 'tsv:1732186300-posts-001';

            const metadata1: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: ['DROP TABLE users'],
            };

            const metadata2: DBSchemaMetadata = {
                version: 'schema_v2',
                migrations: ['CREATE TABLE posts (id INT)'],
                rollback: ['DROP TABLE posts'],
            };

            await manager.activateVersion(tsv1, '/api/users', metadata1);
            await manager.activateVersion(tsv2, '/api/posts', metadata2);

            const activeSchemas = manager.getActiveSchemas();

            expect(activeSchemas).toHaveLength(2);
            expect(activeSchemas).toContain('schema_v1');
            expect(activeSchemas).toContain('schema_v2');
        });

        it('should get all schemas', () => {
            const tsv1: TSV = 'tsv:1732186200-users-001';
            const tsv2: TSV = 'tsv:1732186300-posts-001';

            const metadata1: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: [],
                rollback: [],
            };

            const metadata2: DBSchemaMetadata = {
                version: 'schema_v2',
                migrations: [],
                rollback: [],
            };

            manager.registerSchema(tsv1, '/api/users', metadata1);
            manager.registerSchema(tsv2, '/api/posts', metadata2);

            const allSchemas = manager.getAllSchemas();

            expect(allSchemas).toHaveLength(2);
        });
    });

    describe('Timeout Handling', () => {
        it('should timeout long-running migrations', async () => {
            const slowMigration = vi.fn(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return true;
            });

            const timeoutManager = new DBSchemaManager({
                executeMigration: slowMigration,
                executeRollback: mockExecuteRollback,
                migrationTimeout: 10, // 10ms timeout
            });

            const tsv: TSV = 'tsv:1732186200-users-001';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: ['DROP TABLE users'],
            };

            timeoutManager.registerSchema(tsv, '/api/users', metadata);
            const result = await timeoutManager.applyMigrations('schema_v1', metadata);

            expect(result.success).toBe(false);
            expect(result.error).toContain('timeout');
        });

        it('should timeout long-running rollbacks', async () => {
            const slowRollback = vi.fn(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return true;
            });

            const timeoutManager = new DBSchemaManager({
                executeMigration: mockExecuteMigration,
                executeRollback: slowRollback,
                migrationTimeout: 10, // 10ms timeout
            });

            const tsv: TSV = 'tsv:1732186200-users-001';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: ['CREATE TABLE users (id INT)'],
                rollback: ['DROP TABLE users'],
            };

            timeoutManager.registerSchema(tsv, '/api/users', metadata);
            await timeoutManager.applyMigrations('schema_v1', metadata);

            const result = await timeoutManager.rollbackSchema('schema_v1', metadata);

            expect(result.success).toBe(false);
            expect(result.error).toContain('timeout');
        });
    });

    describe('Clear', () => {
        it('should clear all schemas', () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            const metadata: DBSchemaMetadata = {
                version: 'schema_v1',
                migrations: [],
                rollback: [],
            };

            manager.registerSchema(tsv, '/api/users', metadata);
            manager.clear();

            expect(manager.getAllSchemas()).toHaveLength(0);
            expect(manager.getActiveSchemas()).toHaveLength(0);
        });
    });
});
