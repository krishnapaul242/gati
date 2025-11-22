/**
 * Database Module
 * 
 * Provides database access with schema versioning support.
 * This module demonstrates how database schemas evolve with API versions.
 */

import type { Module } from '@gati-framework/runtime';

export interface DatabaseClient {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<void>;
  close(): Promise<void>;
}

/**
 * Mock database client for demonstration
 * In production, this would be a real database connection (SQLite, PostgreSQL, etc.)
 */
class MockDatabaseClient implements DatabaseClient {
  private data: Map<string, any[]> = new Map();
  private schemaVersion: string;

  constructor(schemaVersion: string) {
    this.schemaVersion = schemaVersion;
    this.initializeData();
  }

  private initializeData() {
    // Initialize with data based on schema version
    if (this.schemaVersion === 'schema_v1') {
      this.data.set('products', [
        { id: '1', name: 'Wireless Mouse', price: '29.99', description: 'Ergonomic wireless mouse with USB receiver' },
        { id: '2', name: 'Mechanical Keyboard', price: '89.99', description: 'RGB mechanical keyboard with blue switches' },
        { id: '3', name: 'USB-C Cable', price: '12.50', description: '6ft USB-C to USB-C cable, fast charging' }
      ]);
    } else if (this.schemaVersion === 'schema_v2') {
      this.data.set('products', [
        { id: '1', name: 'Wireless Mouse', price_in_cents: 2999, description: 'Ergonomic wireless mouse with USB receiver' },
        { id: '2', name: 'Mechanical Keyboard', price_in_cents: 8999, description: 'RGB mechanical keyboard with blue switches' },
        { id: '3', name: 'USB-C Cable', price_in_cents: 1250, description: '6ft USB-C to USB-C cable, fast charging' }
      ]);
    } else if (this.schemaVersion === 'schema_v3') {
      this.data.set('products', [
        { id: '1', name: 'Wireless Mouse', price_in_cents: 2999, currency: 'USD', description: 'Ergonomic wireless mouse with USB receiver', in_stock: 1 },
        { id: '2', name: 'Mechanical Keyboard', price_in_cents: 8999, currency: 'USD', description: 'RGB mechanical keyboard with blue switches', in_stock: 1 },
        { id: '3', name: 'USB-C Cable', price_in_cents: 1250, currency: 'USD', description: '6ft USB-C to USB-C cable, fast charging', in_stock: 0 }
      ]);
    }
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    // Simple mock query implementation
    const table = this.data.get('products') || [];
    return table as T[];
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    // Mock execute (no-op for demo)
    console.log(`[DB] Executing: ${sql.substring(0, 50)}...`);
  }

  async close(): Promise<void> {
    // Mock close (no-op for demo)
    console.log('[DB] Connection closed');
  }
}

export const databaseModule: Module = {
  name: 'database',
  
  async init(gctx) {
    // Get the active schema version from Timescape
    const schemaVersion = gctx.timescape?.activeSchemaVersion || 'schema_v1';
    
    console.log(`[DB Module] Initializing with schema: ${schemaVersion}`);
    
    // Create database client
    const client = new MockDatabaseClient(schemaVersion);
    
    return {
      // Expose database operations
      products: {
        findAll: async () => {
          return client.query('SELECT * FROM products');
        },
        
        findById: async (id: string) => {
          const results = await client.query('SELECT * FROM products WHERE id = ?', [id]);
          return results[0] || null;
        },
        
        create: async (product: any) => {
          await client.execute('INSERT INTO products VALUES (?)', [product]);
          return product;
        },
        
        update: async (id: string, product: any) => {
          await client.execute('UPDATE products SET ? WHERE id = ?', [product, id]);
          return product;
        },
        
        delete: async (id: string) => {
          await client.execute('DELETE FROM products WHERE id = ?', [id]);
        }
      },
      
      // Expose raw client for advanced queries
      client,
      
      // Cleanup function
      cleanup: async () => {
        await client.close();
      }
    };
  }
};
