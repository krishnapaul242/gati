/**
 * Validator Performance Benchmarks
 * 
 * Tests runtime validation performance for different type shapes.
 * Target: Simple objects <0.1ms, Nested objects 0.2-1ms, Large arrays <10ms
 */

import { bench, describe } from 'vitest';

// Mock validator functions (replace with actual Gati validators when implemented)
const validateSimpleUser = (data: unknown): boolean => {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email as string) &&
    typeof obj.age === 'number' &&
    (obj.age as number) >= 0 &&
    (obj.age as number) <= 120
  );
};

const validateNestedOrder = (data: unknown): boolean => {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  
  if (typeof obj.id !== 'string') return false;
  
  // Validate nested user object
  const user = obj.user;
  if (typeof user !== 'object' || user === null) return false;
  const userObj = user as Record<string, unknown>;
  if (typeof userObj.id !== 'string' || typeof userObj.name !== 'string') return false;
  
  // Validate items array
  if (!Array.isArray(obj.items)) return false;
  for (const item of obj.items) {
    if (typeof item !== 'object' || item === null) return false;
    const itemObj = item as Record<string, unknown>;
    if (
      typeof itemObj.id !== 'string' ||
      typeof itemObj.price !== 'number' ||
      typeof itemObj.quantity !== 'number'
    ) {
      return false;
    }
  }
  
  return true;
};

const validateLargeArray = (data: unknown): boolean => {
  if (!Array.isArray(data)) return false;
  
  for (const item of data) {
    if (typeof item !== 'object' || item === null) return false;
    const obj = item as Record<string, unknown>;
    if (
      typeof obj.id !== 'string' ||
      typeof obj.name !== 'string' ||
      typeof obj.value !== 'number'
    ) {
      return false;
    }
  }
  
  return true;
};

describe('Validator Performance', () => {
  describe('Simple Object (3-10 fields)', () => {
    const simpleUserData = {
      id: 'user_123',
      email: 'test@example.com',
      age: 25,
    };

    bench('validate simple user object', () => {
      validateSimpleUser(simpleUserData);
    }, { iterations: 10000 });

    bench('validate simple user object (invalid)', () => {
      validateSimpleUser({ id: 123, email: 'invalid', age: 'wrong' });
    }, { iterations: 10000 });
  });

  describe('Nested Object (depth 3-5)', () => {
    const nestedOrderData = {
      id: 'order_456',
      user: { id: 'user_123', name: 'John Doe' },
      items: [
        { id: 'item_1', price: 29.99, quantity: 2 },
        { id: 'item_2', price: 49.99, quantity: 1 },
      ],
    };

    bench('validate nested order object', () => {
      validateNestedOrder(nestedOrderData);
    }, { iterations: 1000 });

    bench('validate nested order object (invalid)', () => {
      validateNestedOrder({
        id: 'order_456',
        user: { id: 123, name: null },
        items: 'invalid',
      });
    }, { iterations: 1000 });
  });

  describe('Large Array (100 items)', () => {
    const largeArray = Array.from({ length: 100 }, (_, i) => ({
      id: `item_${i}`,
      name: `Item ${i}`,
      value: Math.random() * 100,
    }));

    bench('validate large array (100 items)', () => {
      validateLargeArray(largeArray);
    }, { iterations: 100 });

    bench('validate large array (invalid item at end)', () => {
      const invalidArray = [...largeArray];
      invalidArray[99] = { id: 123, name: null, value: 'wrong' };
      validateLargeArray(invalidArray);
    }, { iterations: 100 });
  });

  describe('Complex Unions (5-10 branches)', () => {
    const validateUnion = (data: unknown): boolean => {
      if (typeof data !== 'object' || data === null) return false;
      const obj = data as Record<string, unknown>;
      
      const type = obj.type;
      if (typeof type !== 'string') return false;
      
      switch (type) {
        case 'user':
          return typeof obj.email === 'string';
        case 'post':
          return typeof obj.title === 'string';
        case 'comment':
          return typeof obj.text === 'string';
        case 'like':
          return typeof obj.userId === 'string';
        case 'share':
          return typeof obj.platform === 'string';
        default:
          return false;
      }
    };

    bench('validate union type (first branch)', () => {
      validateUnion({ type: 'user', email: 'test@example.com' });
    }, { iterations: 5000 });

    bench('validate union type (last branch)', () => {
      validateUnion({ type: 'share', platform: 'twitter' });
    }, { iterations: 5000 });
  });
});

// Performance expectations (to be verified against actual Gati validators):
// - Simple object: < 0.1ms (10,000+ ops/sec)
// - Nested object: 0.2-1ms (1,000-5,000 ops/sec)
// - Large array: < 10ms (100-1,000 ops/sec)
// - Complex unions: 0.5-2ms (500-2,000 ops/sec)
