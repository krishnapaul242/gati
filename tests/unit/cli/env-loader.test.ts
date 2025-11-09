/**
 * @module tests/unit/cli/env-loader
 * @description Tests for environment variable loader
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { resolve } from 'path';
import { loadEnv, loadDevEnv } from '../../../src/cli/utils/env-loader';

const TEST_DIR = resolve(__dirname, 'test-env-loader');

describe('env-loader', () => {
  beforeEach(() => {
    // Clean up test directory before each test
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory after each test
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }

    // Clean up environment variables
    delete process.env['TEST_VAR'];
    delete process.env['API_KEY'];
    delete process.env['PORT'];
  });

  describe('loadEnv', () => {
    it('should load environment variables from .env file', () => {
      // Create .env file
      const envContent = 'TEST_VAR=test_value\nAPI_KEY=secret123\n';
      writeFileSync(resolve(TEST_DIR, '.env'), envContent);

      // Load environment
      loadEnv(TEST_DIR);

      // Check loaded values
      expect(process.env['TEST_VAR']).toBe('test_value');
      expect(process.env['API_KEY']).toBe('secret123');
    });

    it('should handle custom .env file path', () => {
      // Create custom .env file
      const envContent = 'PORT=4000\n';
      writeFileSync(resolve(TEST_DIR, '.env.custom'), envContent);

      // Load environment
      loadEnv(TEST_DIR, { path: '.env.custom' });

      // Check loaded value
      expect(process.env['PORT']).toBe('4000');
    });

    it('should not throw if .env file does not exist', () => {
      // Should not throw
      expect(() => {
        loadEnv(TEST_DIR);
      }).not.toThrow();
    });

    it('should not override existing variables by default', () => {
      // Set existing variable
      process.env['TEST_VAR'] = 'existing_value';

      // Create .env file
      const envContent = 'TEST_VAR=new_value\n';
      writeFileSync(resolve(TEST_DIR, '.env'), envContent);

      // Load environment
      loadEnv(TEST_DIR, { override: false });

      // Should keep existing value
      expect(process.env['TEST_VAR']).toBe('existing_value');
    });

    it('should override existing variables when override is true', () => {
      // Set existing variable
      process.env['TEST_VAR'] = 'existing_value';

      // Create .env file
      const envContent = 'TEST_VAR=new_value\n';
      writeFileSync(resolve(TEST_DIR, '.env'), envContent);

      // Load environment with override
      loadEnv(TEST_DIR, { override: true });

      // Should use new value
      expect(process.env['TEST_VAR']).toBe('new_value');
    });
  });

  describe('loadDevEnv', () => {
    it('should prefer .env.local over other env files', () => {
      // Create multiple env files
      writeFileSync(resolve(TEST_DIR, '.env'), 'TEST_VAR=from_env\n');
      writeFileSync(resolve(TEST_DIR, '.env.development'), 'TEST_VAR=from_dev\n');
      writeFileSync(resolve(TEST_DIR, '.env.local'), 'TEST_VAR=from_local\n');

      // Load dev environment
      loadDevEnv(TEST_DIR);

      // Should use .env.local
      expect(process.env['TEST_VAR']).toBe('from_local');
    });

    it('should use .env.development if .env.local does not exist', () => {
      // Create env files
      writeFileSync(resolve(TEST_DIR, '.env'), 'TEST_VAR=from_env\n');
      writeFileSync(resolve(TEST_DIR, '.env.development'), 'TEST_VAR=from_dev\n');

      // Load dev environment
      loadDevEnv(TEST_DIR);

      // Should use .env.development
      expect(process.env['TEST_VAR']).toBe('from_dev');
    });

    it('should use .env if no other env files exist', () => {
      // Create only .env file
      writeFileSync(resolve(TEST_DIR, '.env'), 'TEST_VAR=from_env\n');

      // Load dev environment
      loadDevEnv(TEST_DIR);

      // Should use .env
      expect(process.env['TEST_VAR']).toBe('from_env');
    });

    it('should not throw if no env files exist', () => {
      // Should not throw
      expect(() => {
        loadDevEnv(TEST_DIR);
      }).not.toThrow();
    });
  });
});
