/**
 * Migration Runner
 * 
 * Runs database migrations for the intermediate example.
 * This demonstrates how database schemas evolve with API versions.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const migrations = [
  {
    version: 'schema_v1',
    file: '001_initial_schema.sql',
    description: 'Initial schema with string price'
  },
  {
    version: 'schema_v2',
    file: '002_price_to_cents.sql',
    description: 'Convert price to cents (BREAKING CHANGE)'
  },
  {
    version: 'schema_v3',
    file: '003_add_currency_and_stock.sql',
    description: 'Add currency and stock fields'
  }
];

async function runMigrations() {
  console.log('\n' + '='.repeat(70));
  console.log('Database Migration Runner');
  console.log('='.repeat(70) + '\n');

  for (const migration of migrations) {
    console.log(`Running: ${migration.version}`);
    console.log(`File: ${migration.file}`);
    console.log(`Description: ${migration.description}`);
    
    try {
      const sqlPath = resolve(process.cwd(), 'migrations', migration.file);
      const sql = readFileSync(sqlPath, 'utf-8');
      
      console.log(`SQL Preview:\n${sql.substring(0, 200)}...\n`);
      
      // In a real application, you would execute the SQL here
      // await db.execute(sql);
      
      console.log(`✓ Migration ${migration.version} completed successfully\n`);
    } catch (error) {
      console.error(`✗ Migration ${migration.version} failed:`, error.message);
      process.exit(1);
    }
  }

  console.log('='.repeat(70));
  console.log('All migrations completed successfully!');
  console.log('='.repeat(70) + '\n');
  
  console.log('Database Schema Evolution:');
  console.log('  V1: price (string)');
  console.log('  V2: price_in_cents (integer) ← BREAKING CHANGE');
  console.log('  V3: + currency, in_stock ← NON-BREAKING\n');
}

runMigrations().catch(console.error);
