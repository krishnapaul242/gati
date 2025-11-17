/**
 * @module __tests__/registry
 * @description Unit tests for BrandRegistry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BrandRegistry } from '../registry.js';
import type { BrandValidator } from '../registry.js';

describe('BrandRegistry', () => {
  beforeEach(() => {
    BrandRegistry.clear();
  });

  describe('register()', () => {
    it('should register a new validator', () => {
      const validator: BrandValidator = {
        name: 'test',
        validate: (value: unknown): boolean => typeof value === 'string',
        description: 'Test validator',
      };

      BrandRegistry.register(validator);
      expect(BrandRegistry.has('test')).toBe(true);
    });

    it('should throw on duplicate registration', () => {
      const validator: BrandValidator = {
        name: 'test',
        validate: (value: unknown): boolean => typeof value === 'string',
        description: 'Test validator',
      };

      BrandRegistry.register(validator);
      
      expect(() => BrandRegistry.register(validator)).toThrow(
        "Brand validator 'test' is already registered"
      );
    });

    it('should throw on async validator with correct error message', () => {
      const asyncValidator: BrandValidator = {
        name: 'async-test',
        validate: async (value: unknown): Promise<boolean> => {
          return typeof value === 'string';
        },
        description: 'Async test validator',
      };

      expect(() => BrandRegistry.register(asyncValidator)).toThrow(
        'Brand validators must be synchronous. For async validation (DNS, API calls), use middleware or separate validation phase. Async validators planned for Phase 2.'
      );
    });

    it('should reject validators without name', () => {
      const invalidValidator = {
        name: '',
        validate: (value: unknown): boolean => typeof value === 'string',
        description: 'Invalid validator',
      };

      expect(() => BrandRegistry.register(invalidValidator)).toThrow();
    });
  });

  describe('get()', () => {
    it('should retrieve registered validator', () => {
      const validator: BrandValidator = {
        name: 'test',
        validate: (value: unknown): boolean => typeof value === 'string',
        description: 'Test validator',
      };

      BrandRegistry.register(validator);
      const retrieved = BrandRegistry.get('test');
      
      expect(retrieved).toEqual(validator);
      expect(retrieved?.validate('hello')).toBe(true);
      expect(retrieved?.validate(123)).toBe(false);
    });

    it('should return undefined for non-existent validator', () => {
      expect(BrandRegistry.get('non-existent')).toBeUndefined();
    });
  });

  describe('getAll()', () => {
    it('should return empty array when no validators registered', () => {
      expect(BrandRegistry.getAll()).toEqual([]);
    });

    it('should return all registered validators', () => {
      const validator1: BrandValidator = {
        name: 'test1',
        validate: (value: unknown): boolean => typeof value === 'string',
        description: 'Test validator 1',
      };

      const validator2: BrandValidator = {
        name: 'test2',
        validate: (value: unknown): boolean => typeof value === 'number',
        description: 'Test validator 2',
      };

      BrandRegistry.register(validator1);
      BrandRegistry.register(validator2);

      const all = BrandRegistry.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContainEqual(validator1);
      expect(all).toContainEqual(validator2);
    });

    it('should return array in registration order', () => {
      const validator1: BrandValidator = {
        name: 'alpha',
        validate: (value: unknown): boolean => true,
        description: 'Alpha',
      };

      const validator2: BrandValidator = {
        name: 'beta',
        validate: (value: unknown): boolean => true,
        description: 'Beta',
      };

      const validator3: BrandValidator = {
        name: 'gamma',
        validate: (value: unknown): boolean => true,
        description: 'Gamma',
      };

      BrandRegistry.register(validator1);
      BrandRegistry.register(validator2);
      BrandRegistry.register(validator3);

      const all = BrandRegistry.getAll();
      expect(all[0]?.name).toBe('alpha');
      expect(all[1]?.name).toBe('beta');
      expect(all[2]?.name).toBe('gamma');
    });
  });

  describe('has()', () => {
    it('should return true for registered validator', () => {
      const validator: BrandValidator = {
        name: 'test',
        validate: (value: unknown): boolean => typeof value === 'string',
        description: 'Test validator',
      };

      BrandRegistry.register(validator);
      expect(BrandRegistry.has('test')).toBe(true);
    });

    it('should return false for non-existent validator', () => {
      expect(BrandRegistry.has('non-existent')).toBe(false);
    });

    it('should be case-sensitive', () => {
      const validator: BrandValidator = {
        name: 'test',
        validate: (value: unknown): boolean => typeof value === 'string',
        description: 'Test validator',
      };

      BrandRegistry.register(validator);
      expect(BrandRegistry.has('test')).toBe(true);
      expect(BrandRegistry.has('Test')).toBe(false);
      expect(BrandRegistry.has('TEST')).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should remove all validators', () => {
      const validator1: BrandValidator = {
        name: 'test1',
        validate: (value: unknown): boolean => typeof value === 'string',
        description: 'Test validator 1',
      };

      const validator2: BrandValidator = {
        name: 'test2',
        validate: (value: unknown): boolean => typeof value === 'number',
        description: 'Test validator 2',
      };

      BrandRegistry.register(validator1);
      BrandRegistry.register(validator2);

      expect(BrandRegistry.getAll()).toHaveLength(2);

      BrandRegistry.clear();

      expect(BrandRegistry.getAll()).toHaveLength(0);
      expect(BrandRegistry.has('test1')).toBe(false);
      expect(BrandRegistry.has('test2')).toBe(false);
    });

    it('should allow re-registration after clear', () => {
      const validator: BrandValidator = {
        name: 'test',
        validate: (value: unknown): boolean => typeof value === 'string',
        description: 'Test validator',
      };

      BrandRegistry.register(validator);
      BrandRegistry.clear();
      
      // Should not throw
      expect(() => BrandRegistry.register(validator)).not.toThrow();
      expect(BrandRegistry.has('test')).toBe(true);
    });
  });

  describe('Validator Execution', () => {
    it('should execute validator correctly', () => {
      const numberValidator: BrandValidator = {
        name: 'positive-number',
        validate: (value: unknown): boolean => {
          return typeof value === 'number' && value > 0;
        },
        description: 'Positive number validator',
      };

      BrandRegistry.register(numberValidator);
      const validator = BrandRegistry.get('positive-number');

      expect(validator?.validate(10)).toBe(true);
      expect(validator?.validate(0)).toBe(false);
      expect(validator?.validate(-5)).toBe(false);
      expect(validator?.validate('10')).toBe(false);
    });

    it('should handle complex validation logic', () => {
      const complexValidator: BrandValidator = {
        name: 'complex',
        validate: (value: unknown): boolean => {
          if (typeof value !== 'string') return false;
          const str = value as string;
          return str.length >= 3 && str.length <= 10 && /^[a-z]+$/.test(str);
        },
        description: 'Lowercase string, 3-10 characters',
      };

      BrandRegistry.register(complexValidator);
      const validator = BrandRegistry.get('complex');

      expect(validator?.validate('hello')).toBe(true);
      expect(validator?.validate('hi')).toBe(false); // too short
      expect(validator?.validate('verylongstring')).toBe(false); // too long
      expect(validator?.validate('Hello')).toBe(false); // uppercase
      expect(validator?.validate('hello123')).toBe(false); // numbers
    });
  });

  describe('Edge Cases', () => {
    it('should handle validators with same validate function', () => {
      const sharedValidate = (value: unknown): boolean => typeof value === 'string';

      const validator1: BrandValidator = {
        name: 'validator1',
        validate: sharedValidate,
        description: 'Validator 1',
      };

      const validator2: BrandValidator = {
        name: 'validator2',
        validate: sharedValidate,
        description: 'Validator 2',
      };

      BrandRegistry.register(validator1);
      BrandRegistry.register(validator2);

      expect(BrandRegistry.has('validator1')).toBe(true);
      expect(BrandRegistry.has('validator2')).toBe(true);
      expect(BrandRegistry.getAll()).toHaveLength(2);
    });

    it('should handle special characters in validator names', () => {
      const validator: BrandValidator = {
        name: 'special-name_123',
        validate: (value: unknown): boolean => true,
        description: 'Special name validator',
      };

      BrandRegistry.register(validator);
      expect(BrandRegistry.has('special-name_123')).toBe(true);
    });

    it('should not mutate validator object on registration', () => {
      const validator: BrandValidator = {
        name: 'test',
        validate: (value: unknown): boolean => typeof value === 'string',
        description: 'Test validator',
      };

      const originalDescription = validator.description;
      BrandRegistry.register(validator);

      expect(validator.description).toBe(originalDescription);
      expect(Object.isFrozen(validator)).toBe(false);
    });
  });
});
