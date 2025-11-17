/**
 * @module __tests__/brands
 * @description Unit tests for built-in branded type validators
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BrandRegistry } from '../registry.js';
import {
  emailValidator,
  uuidValidator,
  urlValidator,
  timestampValidator,
  cuidValidator,
} from '../brands/index.js';

describe('Built-in Brand Validators', () => {
  beforeEach(() => {
    // Clear registry before each test to ensure clean state
    BrandRegistry.clear();
    
    // Re-register validators (simulating module import)
    BrandRegistry.register(emailValidator);
    BrandRegistry.register(uuidValidator);
    BrandRegistry.register(urlValidator);
    BrandRegistry.register(timestampValidator);
    BrandRegistry.register(cuidValidator);
  });

  describe('Email Validator', () => {
    it('should validate correct email addresses', () => {
      expect(emailValidator.validate('test@example.com')).toBe(true);
      expect(emailValidator.validate('user.name@domain.co.uk')).toBe(true);
      expect(emailValidator.validate('first+last@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(emailValidator.validate('not-an-email')).toBe(false);
      expect(emailValidator.validate('missing@domain')).toBe(false);
      expect(emailValidator.validate('@nodomain.com')).toBe(false);
      expect(emailValidator.validate('no-at-sign.com')).toBe(false);
      expect(emailValidator.validate('')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(emailValidator.validate(123)).toBe(false);
      expect(emailValidator.validate(null)).toBe(false);
      expect(emailValidator.validate(undefined)).toBe(false);
      expect(emailValidator.validate({})).toBe(false);
    });
  });

  describe('UUID Validator', () => {
    it('should validate correct UUID v4 format', () => {
      expect(uuidValidator.validate('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(uuidValidator.validate('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(false); // v1, not v4
      expect(uuidValidator.validate('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
    });

    it('should reject invalid UUID formats', () => {
      expect(uuidValidator.validate('not-a-uuid')).toBe(false);
      expect(uuidValidator.validate('550e8400-e29b-41d4-a716')).toBe(false); // too short
      expect(uuidValidator.validate('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false);
      expect(uuidValidator.validate('')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(uuidValidator.validate('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
      expect(uuidValidator.validate('550e8400-E29B-41d4-A716-446655440000')).toBe(true);
    });

    it('should reject non-string values', () => {
      expect(uuidValidator.validate(123)).toBe(false);
      expect(uuidValidator.validate(null)).toBe(false);
      expect(uuidValidator.validate(undefined)).toBe(false);
    });
  });

  describe('URL Validator', () => {
    it('should validate correct URLs', () => {
      expect(urlValidator.validate('https://example.com')).toBe(true);
      expect(urlValidator.validate('http://localhost:3000')).toBe(true);
      expect(urlValidator.validate('https://example.com/path?query=value')).toBe(true);
      expect(urlValidator.validate('ftp://files.example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(urlValidator.validate('not-a-url')).toBe(false);
      expect(urlValidator.validate('http://')).toBe(false);
      expect(urlValidator.validate('//missing-protocol.com')).toBe(false);
      expect(urlValidator.validate('')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(urlValidator.validate(123)).toBe(false);
      expect(urlValidator.validate(null)).toBe(false);
      expect(urlValidator.validate(undefined)).toBe(false);
    });
  });

  describe('Timestamp Validator', () => {
    it('should validate correct ISO 8601 timestamps', () => {
      expect(timestampValidator.validate('2024-11-15T10:30:00Z')).toBe(true);
      expect(timestampValidator.validate('2024-11-15T10:30:00.123Z')).toBe(true);
      expect(timestampValidator.validate('2024-11-15T10:30:00+05:30')).toBe(true);
      expect(timestampValidator.validate('2024-11-15T10:30:00.123+05:30')).toBe(true);
      expect(timestampValidator.validate('2024-11-15T10:30:00-08:00')).toBe(true);
    });

    it('should reject invalid timestamp formats', () => {
      expect(timestampValidator.validate('2024-11-15')).toBe(false); // date only
      expect(timestampValidator.validate('10:30:00')).toBe(false); // time only
      expect(timestampValidator.validate('2024-11-15 10:30:00')).toBe(false); // space instead of T
      expect(timestampValidator.validate('2024-11-15T10:30:00')).toBe(false); // missing timezone
      expect(timestampValidator.validate('')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(timestampValidator.validate(123)).toBe(false);
      expect(timestampValidator.validate(new Date())).toBe(false);
      expect(timestampValidator.validate(null)).toBe(false);
    });
  });

  describe('CUID Validator', () => {
    it('should validate correct CUID2 format', () => {
      expect(cuidValidator.validate('ckl1234567890abcdefghijk')).toBe(true); // 24 chars
      expect(cuidValidator.validate('cl9abc123def456ghi789xyz')).toBe(true); // 24 chars
      expect(cuidValidator.validate('a'.repeat(24))).toBe(true);
    });

    it('should reject invalid CUID formats', () => {
      expect(cuidValidator.validate('short')).toBe(false); // too short
      expect(cuidValidator.validate('a'.repeat(25))).toBe(false); // too long
      expect(cuidValidator.validate('CKABCDEFGHIJKLMNOPQRSTUV')).toBe(false); // uppercase
      expect(cuidValidator.validate('ck@#$%^&*()_+abcdefghij')).toBe(false); // special chars
      expect(cuidValidator.validate('')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(cuidValidator.validate(123)).toBe(false);
      expect(cuidValidator.validate(null)).toBe(false);
      expect(cuidValidator.validate(undefined)).toBe(false);
    });
  });

  describe('Brand Registry Integration', () => {
    it('should have all validators registered', () => {
      expect(BrandRegistry.has('email')).toBe(true);
      expect(BrandRegistry.has('uuid')).toBe(true);
      expect(BrandRegistry.has('url')).toBe(true);
      expect(BrandRegistry.has('timestamp')).toBe(true);
      expect(BrandRegistry.has('cuid')).toBe(true);
    });

    it('should retrieve validators from registry', () => {
      expect(BrandRegistry.get('email')).toEqual(emailValidator);
      expect(BrandRegistry.get('uuid')).toEqual(uuidValidator);
      expect(BrandRegistry.get('url')).toEqual(urlValidator);
      expect(BrandRegistry.get('timestamp')).toEqual(timestampValidator);
      expect(BrandRegistry.get('cuid')).toEqual(cuidValidator);
    });

    it('should list all registered validators', () => {
      const all = BrandRegistry.getAll();
      expect(all).toHaveLength(5);
      expect(all.map(v => v.name)).toContain('email');
      expect(all.map(v => v.name)).toContain('uuid');
      expect(all.map(v => v.name)).toContain('url');
      expect(all.map(v => v.name)).toContain('timestamp');
      expect(all.map(v => v.name)).toContain('cuid');
    });
  });
});
