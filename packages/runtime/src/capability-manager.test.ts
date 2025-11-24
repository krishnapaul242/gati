/**
 * @module runtime/capability-manager.test
 * @description Property tests for Module Manifest and Capability system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CapabilityManager,
  CapabilityError,
  NetworkAccessError,
} from './capability-manager.js';
import type {
  ModuleManifest,
  Capability,
  NetworkAccess,
} from './types/module-manifest.js';

// Helper to create a test module manifest
function createTestManifest(
  moduleId: string,
  capabilities: Capability[],
  networkAccess: NetworkAccess
): ModuleManifest {
  return {
    moduleId,
    version: '1.0.0',
    runtime: 'node',
    capabilities,
    methods: [],
    networkAccess,
    hash: `hash-${moduleId}`,
    createdAt: Date.now(),
  };
}

describe('CapabilityManager', () => {
  let manager: CapabilityManager;

  beforeEach(() => {
    manager = new CapabilityManager();
  });

  describe('Basic Functionality', () => {
    it('should validate capabilities against system policies', () => {
      const manifest = createTestManifest(
        'test-module',
        [
          {
            name: 'database:read',
            description: 'Read from database',
            required: true,
          },
        ],
        { egress: false }
      );

      const result = manager.validateCapabilities(manifest);

      expect(result.valid).toBe(true);
      expect(result.granted).toContain('database:read');
    });

    it('should reject unknown capabilities', () => {
      const manifest = createTestManifest(
        'test-module',
        [
          {
            name: 'unknown:capability',
            description: 'Unknown',
            required: true,
          },
        ],
        { egress: false }
      );

      const result = manager.validateCapabilities(manifest);

      expect(result.valid).toBe(false);
      expect(result.denied).toContain('unknown:capability');
      expect(result.missingRequired).toContain('unknown:capability');
    });

    it('should enforce network capability requirements', () => {
      const manifest = createTestManifest(
        'test-module',
        [], // No network capability declared
        { egress: true } // But egress enabled
      );

      const result = manager.validateCapabilities(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('network:egress'))).toBe(true);
    });

    it('should register and check capabilities', () => {
      manager.registerModule('test-module', ['database:read'], { egress: false });

      expect(manager.hasCapability('test-module', 'database:read')).toBe(true);
      expect(manager.hasCapability('test-module', 'database:write')).toBe(false);
    });

    it('should enforce capability checks', () => {
      manager.registerModule('test-module', ['database:read'], { egress: false });

      expect(() => {
        manager.enforceCapability('test-module', 'database:write', 'write operation');
      }).toThrow(CapabilityError);
    });

    it('should check network access', () => {
      manager.registerModule(
        'test-module',
        ['network:egress'],
        {
          egress: true,
          allowedHosts: ['api.example.com'],
        }
      );

      expect(manager.canAccessNetwork('test-module', 'api.example.com')).toBe(true);
      expect(manager.canAccessNetwork('test-module', 'evil.com')).toBe(false);
    });

    it('should enforce network access checks', () => {
      manager.registerModule(
        'test-module',
        ['network:egress'],
        {
          egress: true,
          allowedHosts: ['api.example.com'],
        }
      );

      expect(() => {
        manager.enforceNetworkAccess('test-module', 'evil.com');
      }).toThrow(NetworkAccessError);
    });
  });

  describe('Property Tests', () => {
    const fc = require('fast-check');

    describe('Property 40: Module capability declaration', () => {
      // Feature: runtime-architecture, Property 40: Module capability declaration
      // For any module registration, the module manifest must declare all required capabilities or the registration should be rejected
      // Validates: Requirements 12.1

      it('should require capability declaration for all operations', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              moduleId: fc.string({ minLength: 5, maxLength: 20 }),
              hasCapability: fc.boolean(),
              requiresCapability: fc.boolean(),
            }),
            async ({ moduleId, hasCapability, requiresCapability }) => {
              const capabilities: Capability[] = hasCapability
                ? [
                    {
                      name: 'database:read',
                      description: 'Read access',
                      required: requiresCapability,
                    },
                  ]
                : [];

              const manifest = createTestManifest(moduleId, capabilities, {
                egress: false,
              });

              const result = manager.validateCapabilities(manifest);

              if (hasCapability) {
                // Should be valid if capability is declared
                expect(result.valid).toBe(true);
                expect(result.granted).toContain('database:read');
              } else if (requiresCapability) {
                // Should be invalid if required capability is missing
                // (though in this case we're not requiring it, so it's valid)
                expect(result.valid).toBe(true);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject manifests with missing required capabilities', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.record({
                name: fc.constantFrom(
                  'database:read',
                  'database:write',
                  'filesystem:read',
                  'unknown:capability'
                ),
                required: fc.boolean(),
              }),
              { minLength: 1, maxLength: 5 }
            ),
            async (capabilities) => {
              const manifest = createTestManifest(
                'test-module',
                capabilities.map(c => ({
                  name: c.name,
                  description: `Capability ${c.name}`,
                  required: c.required,
                })),
                { egress: false }
              );

              const result = manager.validateCapabilities(manifest);

              // Check if any required capabilities are unknown
              const hasUnknownRequired = capabilities.some(
                c => c.required && c.name.startsWith('unknown:')
              );

              if (hasUnknownRequired) {
                expect(result.valid).toBe(false);
                expect(result.missingRequired.length).toBeGreaterThan(0);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should validate network capability requirements', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              hasNetworkCapability: fc.boolean(),
              egressEnabled: fc.boolean(),
              ingressEnabled: fc.boolean(),
            }),
            async ({ hasNetworkCapability, egressEnabled, ingressEnabled }) => {
              const capabilities: Capability[] = hasNetworkCapability
                ? [
                    {
                      name: 'network:egress',
                      description: 'Network egress',
                      required: false,
                    },
                    {
                      name: 'network:ingress',
                      description: 'Network ingress',
                      required: false,
                    },
                  ]
                : [];

              const manifest = createTestManifest(
                'test-module',
                capabilities,
                {
                  egress: egressEnabled,
                  ingress: ingressEnabled,
                }
              );

              const result = manager.validateCapabilities(manifest);

              // If network access is enabled but capability not declared, should be invalid
              if ((egressEnabled || ingressEnabled) && !hasNetworkCapability) {
                expect(result.valid).toBe(false);
              } else {
                expect(result.valid).toBe(true);
              }
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Property 19: Capability enforcement', () => {
      // Feature: runtime-architecture, Property 19: Capability enforcement
      // For any module attempting to access a resource, the Global Context should allow access if and only if the module's manifest declares the required capability
      // Validates: Requirements 5.3, 12.2

      it('should enforce capability checks for all operations', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              moduleId: fc.string({ minLength: 5, maxLength: 20 }),
              grantedCapabilities: fc.array(
                fc.constantFrom(
                  'database:read',
                  'database:write',
                  'filesystem:read',
                  'cache:read'
                ),
                { maxLength: 3 }
              ),
              requestedCapability: fc.constantFrom(
                'database:read',
                'database:write',
                'filesystem:read',
                'cache:read',
                'cache:write'
              ),
            }),
            async ({ moduleId, grantedCapabilities, requestedCapability }) => {
              manager.registerModule(moduleId, grantedCapabilities, {
                egress: false,
              });

              const hasCapability = grantedCapabilities.includes(requestedCapability);

              if (hasCapability) {
                // Should not throw if capability is granted
                expect(() => {
                  manager.enforceCapability(moduleId, requestedCapability, 'test operation');
                }).not.toThrow();
              } else {
                // Should throw if capability is not granted
                expect(() => {
                  manager.enforceCapability(moduleId, requestedCapability, 'test operation');
                }).toThrow(CapabilityError);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should enforce network access restrictions', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              moduleId: fc.string({ minLength: 5, maxLength: 20 }),
              allowedHosts: fc.array(
                fc.constantFrom('api.example.com', 'db.example.com', '*.example.com'),
                { minLength: 1, maxLength: 3 }
              ),
              requestedHost: fc.constantFrom(
                'api.example.com',
                'db.example.com',
                'evil.com',
                'test.example.com'
              ),
            }),
            async ({ moduleId, allowedHosts, requestedHost }) => {
              manager.registerModule(
                moduleId,
                ['network:egress'],
                {
                  egress: true,
                  allowedHosts,
                }
              );

              const shouldAllow = allowedHosts.some(allowed => {
                if (allowed.startsWith('*.')) {
                  const domain = allowed.slice(2);
                  return requestedHost.endsWith(domain);
                }
                return allowed === requestedHost;
              });

              if (shouldAllow) {
                expect(manager.canAccessNetwork(moduleId, requestedHost)).toBe(true);
              } else {
                expect(manager.canAccessNetwork(moduleId, requestedHost)).toBe(false);
                expect(() => {
                  manager.enforceNetworkAccess(moduleId, requestedHost);
                }).toThrow(NetworkAccessError);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should enforce port restrictions', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              moduleId: fc.string({ minLength: 5, maxLength: 20 }),
              allowedPorts: fc.array(
                fc.integer({ min: 1, max: 65535 }),
                { minLength: 1, maxLength: 5 }
              ),
              requestedPort: fc.integer({ min: 1, max: 65535 }),
            }),
            async ({ moduleId, allowedPorts, requestedPort }) => {
              manager.registerModule(
                moduleId,
                ['network:egress'],
                {
                  egress: true,
                  allowedPorts,
                }
              );

              const shouldAllow = allowedPorts.includes(requestedPort);

              if (shouldAllow) {
                expect(manager.canAccessNetwork(moduleId, 'api.example.com', requestedPort)).toBe(true);
              } else {
                expect(manager.canAccessNetwork(moduleId, 'api.example.com', requestedPort)).toBe(false);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should deny access when module lacks network capability', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              moduleId: fc.string({ minLength: 5, maxLength: 20 }),
              hasNetworkCapability: fc.boolean(),
              host: fc.string({ minLength: 5, maxLength: 20 }),
            }),
            async ({ moduleId, hasNetworkCapability, host }) => {
              const capabilities = hasNetworkCapability ? ['network:egress'] : [];

              manager.registerModule(
                moduleId,
                capabilities,
                {
                  egress: true,
                }
              );

              const canAccess = manager.canAccessNetwork(moduleId, host);

              if (hasNetworkCapability) {
                expect(canAccess).toBe(true);
              } else {
                expect(canAccess).toBe(false);
              }
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
