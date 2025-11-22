/**
 * Phase 5 Example: Database Schema Versioning
 * 
 * This example demonstrates how to use the DBSchemaManager to:
 * 1. Register schema versions alongside TSV versions
 * 2. Apply migrations when activating versions
 * 3. Rollback schemas when deactivating versions
 * 4. Share schemas across multiple versions
 * 5. Track schema usage and compatibility
 */

import { DBSchemaManager, type DBSchemaMetadata } from './db-schema.js';
import { VersionRegistry } from './registry.js';
import type { TSV, TimescapeArtifact } from './types.js';

// Simulated database connection
class MockDatabase {
    private tables: Set<string> = new Set();
    private indices: Set<string> = new Set();

    async executeSql(sql: string): Promise<boolean> {
        await Promise.resolve(); // Simulate async operation
        console.log(`[DB] Executing: ${sql}`);
        
        // Simulate SQL execution
        if (sql.includes('CREATE TABLE')) {
            const match = sql.match(/CREATE TABLE (\w+)/);
            if (match) this.tables.add(match[1]);
        } else if (sql.includes('DROP TABLE')) {
            const match = sql.match(/DROP TABLE (\w+)/);
            if (match) this.tables.delete(match[1]);
        } else if (sql.includes('CREATE INDEX')) {
            const match = sql.match(/CREATE INDEX (\w+)/);
            if (match) this.indices.add(match[1]);
        } else if (sql.includes('DROP INDEX')) {
            const match = sql.match(/DROP INDEX (\w+)/);
            if (match) this.indices.delete(match[1]);
        } else if (sql.includes('ALTER TABLE')) {
            // Handle ALTER TABLE
            console.log('[DB] Table altered');
        }

        return true;
    }

    getTables(): string[] {
        return Array.from(this.tables);
    }

    getIndices(): string[] {
        return Array.from(this.indices);
    }

    clear(): void {
        this.tables.clear();
        this.indices.clear();
    }
}

// Example: E-commerce API with evolving schema
async function example1_BasicSchemaVersioning() {
    console.log('\n=== Example 1: Basic Schema Versioning ===\n');

    const db = new MockDatabase();
    const registry = new VersionRegistry();
    const schemaManager = new DBSchemaManager({
        executeMigration: async (script) => db.executeSql(script),
        executeRollback: async (script) => db.executeSql(script),
        onSchemaApplied: (version, tsv) => {
            console.log(`✅ Schema ${version} applied for ${tsv}`);
        },
        onSchemaRolledBack: (version, tsv) => {
            console.log(`🔄 Schema ${version} rolled back for ${tsv}`);
        },
    });

    // Version 1: Initial schema
    const v1: TSV = 'tsv:1732186200-products-001';
    const schema_v1: DBSchemaMetadata = {
        version: 'schema_v1',
        migrations: [
            'CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(255), price DECIMAL(10,2))',
            'CREATE INDEX idx_products_name ON products(name)',
        ],
        rollback: [
            'DROP INDEX idx_products_name',
            'DROP TABLE products',
        ],
    };

    // Register and activate v1
    registry.registerVersion('/api/products', v1, {
        hash: 'abc123',
        dbSchemaVersion: schema_v1.version,
    });

    const result1 = await schemaManager.activateVersion(v1, '/api/products', schema_v1);
    console.log(`Migration result:`, result1);
    console.log(`Active tables:`, db.getTables());
    console.log(`Active indices:`, db.getIndices());

    // Version 2: Add category column (non-breaking, shares schema)
    const v2: TSV = 'tsv:1732186300-products-002';
    const schema_v2: DBSchemaMetadata = {
        version: 'schema_v2',
        migrations: [
            'ALTER TABLE products ADD COLUMN category VARCHAR(100)',
        ],
        rollback: [
            'ALTER TABLE products DROP COLUMN category',
        ],
        compatibleWith: ['schema_v1'], // v2 is compatible with v1
    };

    registry.registerVersion('/api/products', v2, {
        hash: 'def456',
        dbSchemaVersion: schema_v2.version,
    });

    const result2 = await schemaManager.activateVersion(v2, '/api/products', schema_v2);
    console.log(`\nMigration result:`, result2);

    // Deactivate v1 (schema should remain because v2 still uses it)
    console.log(`\nDeactivating v1...`);
    const rollback1 = await schemaManager.deactivateVersion(v1, schema_v1);
    console.log(`Rollback result:`, rollback1);
    console.log(`Schema still active:`, schemaManager.isSchemaActive('schema_v1'));

    // Deactivate v2 (now schema should be rolled back)
    console.log(`\nDeactivating v2...`);
    const rollback2 = await schemaManager.deactivateVersion(v2, schema_v2);
    console.log(`Rollback result:`, rollback2);
    console.log(`Active tables after rollback:`, db.getTables());
}

// Example: Multiple versions sharing the same schema
async function example2_SharedSchemas() {
    console.log('\n=== Example 2: Shared Schemas ===\n');

    const db = new MockDatabase();
    const schemaManager = new DBSchemaManager({
        executeMigration: async (script) => db.executeSql(script),
        executeRollback: async (script) => db.executeSql(script),
    });

    const sharedSchema: DBSchemaMetadata = {
        version: 'schema_v1',
        migrations: [
            'CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(255), name VARCHAR(255))',
        ],
        rollback: [
            'DROP TABLE users',
        ],
    };

    // Three versions all use the same schema
    const v1: TSV = 'tsv:1732186200-users-001';
    const v2: TSV = 'tsv:1732186300-users-002';
    const v3: TSV = 'tsv:1732186400-users-003';

    // Activate all three versions
    await schemaManager.activateVersion(v1, '/api/users', sharedSchema);
    await schemaManager.activateVersion(v2, '/api/users', sharedSchema);
    await schemaManager.activateVersion(v3, '/api/users', sharedSchema);

    console.log(`Schema usage:`, schemaManager.getSchemaUsage('schema_v1'));
    console.log(`Is schema used by others (excluding v1)?`, 
        schemaManager.isSchemaUsedByOthers('schema_v1', v1));

    // Deactivate v1 and v2 - schema should remain
    await schemaManager.deactivateVersion(v1, sharedSchema);
    await schemaManager.deactivateVersion(v2, sharedSchema);
    console.log(`\nAfter deactivating v1 and v2:`);
    console.log(`Schema still active:`, schemaManager.isSchemaActive('schema_v1'));
    console.log(`Tables:`, db.getTables());

    // Deactivate v3 - now schema should be rolled back
    await schemaManager.deactivateVersion(v3, sharedSchema);
    console.log(`\nAfter deactivating v3:`);
    console.log(`Schema still active:`, schemaManager.isSchemaActive('schema_v1'));
    console.log(`Tables:`, db.getTables());
}

// Example: Complex migration with multiple tables
async function example3_ComplexMigration() {
    console.log('\n=== Example 3: Complex Migration ===\n');

    const db = new MockDatabase();
    const schemaManager = new DBSchemaManager({
        executeMigration: async (script) => db.executeSql(script),
        executeRollback: async (script) => db.executeSql(script),
    });

    const v1: TSV = 'tsv:1732186200-ecommerce-001';
    const schema_v1: DBSchemaMetadata = {
        version: 'schema_v1',
        migrations: [
            // Create multiple tables
            'CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(255))',
            'CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(255), price DECIMAL(10,2))',
            'CREATE TABLE orders (id INT PRIMARY KEY, user_id INT, product_id INT, quantity INT)',
            
            // Create foreign keys
            'ALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)',
            'ALTER TABLE orders ADD CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id)',
            
            // Create indices
            'CREATE INDEX idx_orders_user ON orders(user_id)',
            'CREATE INDEX idx_orders_product ON orders(product_id)',
        ],
        rollback: [
            // Drop in reverse order
            'DROP INDEX idx_orders_product',
            'DROP INDEX idx_orders_user',
            'ALTER TABLE orders DROP CONSTRAINT fk_product',
            'ALTER TABLE orders DROP CONSTRAINT fk_user',
            'DROP TABLE orders',
            'DROP TABLE products',
            'DROP TABLE users',
        ],
    };

    console.log(`Applying complex migration...`);
    const result = await schemaManager.activateVersion(v1, '/api/ecommerce', schema_v1);
    
    console.log(`\nMigration completed in ${result?.duration}ms`);
    console.log(`Executed ${result?.executedMigrations.length} migrations`);
    console.log(`Active tables:`, db.getTables());
    console.log(`Active indices:`, db.getIndices());

    // Rollback
    console.log(`\nRolling back...`);
    const rollback = await schemaManager.deactivateVersion(v1, schema_v1);
    console.log(`Rollback completed in ${rollback?.duration}ms`);
    console.log(`Executed ${rollback?.executedRollbacks.length} rollbacks`);
    console.log(`Active tables:`, db.getTables());
}

// Example: Schema compatibility checking
function example4_SchemaCompatibility() {
    console.log('\n=== Example 4: Schema Compatibility ===\n');

    const db = new MockDatabase();
    const schemaManager = new DBSchemaManager({
        executeMigration: async (script) => db.executeSql(script),
        executeRollback: async (script) => db.executeSql(script),
    });

    const _schema_v1: DBSchemaMetadata = {
        version: 'schema_v1',
        migrations: ['CREATE TABLE users (id INT, name VARCHAR(255))'],
        rollback: ['DROP TABLE users'],
    };

    const schema_v2: DBSchemaMetadata = {
        version: 'schema_v2',
        migrations: ['ALTER TABLE users ADD COLUMN email VARCHAR(255)'],
        rollback: ['ALTER TABLE users DROP COLUMN email'],
        compatibleWith: ['schema_v1'], // v2 is backward compatible with v1
    };

    const schema_v3: DBSchemaMetadata = {
        version: 'schema_v3',
        migrations: ['ALTER TABLE users DROP COLUMN name'], // Breaking change!
        rollback: ['ALTER TABLE users ADD COLUMN name VARCHAR(255)'],
        // NOT compatible with v1 or v2
    };

    console.log(`v1 ↔ v2 compatible:`, schemaManager.areCompatible('schema_v1', 'schema_v2', schema_v2));
    console.log(`v2 ↔ v3 compatible:`, schemaManager.areCompatible('schema_v2', 'schema_v3', schema_v3));
    console.log(`v1 ↔ v3 compatible:`, schemaManager.areCompatible('schema_v1', 'schema_v3', schema_v3));
}

// Example: Statistics and monitoring
async function example5_Statistics() {
    console.log('\n=== Example 5: Statistics and Monitoring ===\n');

    const db = new MockDatabase();
    const schemaManager = new DBSchemaManager({
        executeMigration: async (script) => db.executeSql(script),
        executeRollback: async (script) => db.executeSql(script),
    });

    // Create multiple schemas in different states
    const schemas = [
        { tsv: 'tsv:1732186200-users-001' as TSV, version: 'schema_v1', apply: true },
        { tsv: 'tsv:1732186300-products-001' as TSV, version: 'schema_v2', apply: true },
        { tsv: 'tsv:1732186400-orders-001' as TSV, version: 'schema_v3', apply: false },
    ];

    for (const { tsv, version, apply } of schemas) {
        const metadata: DBSchemaMetadata = {
            version,
            migrations: [`CREATE TABLE ${version} (id INT)`],
            rollback: [`DROP TABLE ${version}`],
        };

        schemaManager.registerSchema(tsv, `/api/${version}`, metadata);
        
        if (apply) {
            await schemaManager.applyMigrations(version, metadata);
        }
    }

    // Rollback one schema
    await schemaManager.rollbackSchema('schema_v2', {
        version: 'schema_v2',
        migrations: [],
        rollback: ['DROP TABLE schema_v2'],
    });

    const stats = schemaManager.getStatistics();
    console.log(`\nSchema Statistics:`);
    console.log(`  Total schemas: ${stats.totalSchemas}`);
    console.log(`  Active: ${stats.activeSchemas}`);
    console.log(`  Pending: ${stats.pendingSchemas}`);
    console.log(`  Rolled back: ${stats.rolledBackSchemas}`);
    console.log(`  Failed: ${stats.failedSchemas}`);

    console.log(`\nActive schemas:`, schemaManager.getActiveSchemas());
    console.log(`\nAll schemas:`, schemaManager.getAllSchemas().map(s => ({
        version: s.schemaVersion,
        status: s.status,
        tsv: s.tsv,
    })));
}

// Run all examples
async function runAllExamples() {
    try {
        await example1_BasicSchemaVersioning();
        await example2_SharedSchemas();
        await example3_ComplexMigration();
        await example4_SchemaCompatibility();
        await example5_Statistics();

        console.log('\n✅ All examples completed successfully!\n');
    } catch (error) {
        console.error('\n❌ Error running examples:', error);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    void runAllExamples();
}

export {
    example1_BasicSchemaVersioning,
    example2_SharedSchemas,
    example3_ComplexMigration,
    example4_SchemaCompatibility,
    example5_Statistics,
};
