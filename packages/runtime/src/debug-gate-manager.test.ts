/**
 * @module runtime/debug-gate-manager.test
 * @description Unit tests for DebugGateManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DebugGateManager } from './debug-gate-manager.js';

describe('DebugGateManager', () => {
  let manager: DebugGateManager;

  beforeEach(() => {
    manager = new DebugGateManager({ enabled: true, defaultTimeout: 1000 });
  });

  describe('createGate', () => {
    it('should create a debug gate', () => {
      const gate = manager.createGate('trace-1', 'handler');

      expect(gate.id).toBeDefined();
      expect(gate.traceId).toBe('trace-1');
      expect(gate.stage).toBe('handler');
      expect(gate.status).toBe('active');
    });

    it('should create gate with condition', () => {
      const gate = manager.createGate('trace-1', 'handler', 'userId === "123"');

      expect(gate.condition).toBe('userId === "123"');
    });
  });

  describe('checkGate', () => {
    it('should not pause when disabled', async () => {
      manager.disable();
      manager.createGate('trace-1', 'handler');

      const start = Date.now();
      await manager.checkGate('trace-1', 'handler');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10);
    });

    it('should not pause when no matching gate', async () => {
      manager.createGate('trace-1', 'handler');

      const start = Date.now();
      await manager.checkGate('trace-2', 'handler');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10);
    });

    it('should trigger gate and emit event', async () => {
      const gate = manager.createGate('trace-1', 'handler');
      const eventPromise = new Promise(resolve => {
        manager.once('gate:triggered', resolve);
      });

      // Start check in background
      const checkPromise = manager.checkGate('trace-1', 'handler');

      // Wait for trigger event
      const event = await eventPromise;
      expect(event).toMatchObject({
        gateId: gate.id,
        traceId: 'trace-1',
        stage: 'handler',
      });

      // Release to complete
      manager.releaseGate(gate.id);
      await checkPromise;
    });

    it('should evaluate condition', async () => {
      manager.createGate('trace-1', 'handler', 'userId === "123"');

      // Should not pause (condition false)
      const start1 = Date.now();
      await manager.checkGate('trace-1', 'handler', { userId: '456' });
      expect(Date.now() - start1).toBeLessThan(10);

      // Should pause (condition true)
      const checkPromise = manager.checkGate('trace-1', 'handler', { userId: '123' });
      
      // Give it time to trigger
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const gates = manager.listGates('trace-1');
      expect(gates[0].status).toBe('triggered');

      manager.releaseGate(gates[0].id);
      await checkPromise;
    });
  });

  describe('releaseGate', () => {
    it('should release gate and resume execution', async () => {
      const gate = manager.createGate('trace-1', 'handler');

      const checkPromise = manager.checkGate('trace-1', 'handler');
      
      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 10));

      const released = manager.releaseGate(gate.id);
      expect(released).toBe(true);

      await checkPromise;

      const updatedGate = manager.getGate(gate.id);
      expect(updatedGate?.status).toBe('released');
    });

    it('should return false for non-existent gate', () => {
      const released = manager.releaseGate('non-existent');
      expect(released).toBe(false);
    });

    it('should emit release event', async () => {
      const gate = manager.createGate('trace-1', 'handler');
      manager.checkGate('trace-1', 'handler');

      await new Promise(resolve => setTimeout(resolve, 10));

      const eventPromise = new Promise(resolve => {
        manager.once('gate:released', resolve);
      });

      manager.releaseGate(gate.id);

      const event = await eventPromise;
      expect(event).toMatchObject({ gateId: gate.id });
    });
  });

  describe('removeGate', () => {
    it('should remove a gate', () => {
      const gate = manager.createGate('trace-1', 'handler');

      const removed = manager.removeGate(gate.id);
      expect(removed).toBe(true);

      const retrieved = manager.getGate(gate.id);
      expect(retrieved).toBeNull();
    });

    it('should release triggered gate before removing', async () => {
      const gate = manager.createGate('trace-1', 'handler');
      const checkPromise = manager.checkGate('trace-1', 'handler');

      await new Promise(resolve => setTimeout(resolve, 10));

      manager.removeGate(gate.id);
      await checkPromise; // Should complete without hanging
    });
  });

  describe('listGates', () => {
    it('should list all gates', () => {
      manager.createGate('trace-1', 'handler');
      manager.createGate('trace-2', 'ingress');

      const gates = manager.listGates();
      expect(gates).toHaveLength(2);
    });

    it('should filter by trace ID', () => {
      manager.createGate('trace-1', 'handler');
      manager.createGate('trace-2', 'ingress');

      const gates = manager.listGates('trace-1');
      expect(gates).toHaveLength(1);
      expect(gates[0].traceId).toBe('trace-1');
    });
  });

  describe('clear', () => {
    it('should clear all gates', () => {
      manager.createGate('trace-1', 'handler');
      manager.createGate('trace-2', 'ingress');

      manager.clear();

      const gates = manager.listGates();
      expect(gates).toHaveLength(0);
    });

    it('should release all paused executions', async () => {
      const gate = manager.createGate('trace-1', 'handler');
      const checkPromise = manager.checkGate('trace-1', 'handler');

      await new Promise(resolve => setTimeout(resolve, 10));

      manager.clear();
      await checkPromise; // Should complete
    });
  });

  describe('enable/disable', () => {
    it('should enable and disable', () => {
      expect(manager.isEnabled()).toBe(true);

      manager.disable();
      expect(manager.isEnabled()).toBe(false);

      manager.enable();
      expect(manager.isEnabled()).toBe(true);
    });
  });

  describe('timeout', () => {
    it('should auto-release after timeout', async () => {
      const shortManager = new DebugGateManager({ enabled: true, defaultTimeout: 50 });
      const gate = shortManager.createGate('trace-1', 'handler');

      const start = Date.now();
      await shortManager.checkGate('trace-1', 'handler');
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(50);
      expect(duration).toBeLessThan(100);

      const updatedGate = shortManager.getGate(gate.id);
      expect(updatedGate?.status).toBe('released');
    });
  });
});
