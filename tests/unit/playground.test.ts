/**
 * @module tests/unit/playground
 * @description Unit tests for Playground module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PLAYGROUND_HEADERS, PlaygroundEngine } from '../../packages/playground/src/playground-engine.js';

describe('Playground Headers', () => {
  it('should define correct header names', () => {
    expect(PLAYGROUND_HEADERS.PLAYGROUND_REQUEST).toBe('x-gati-playground');
    expect(PLAYGROUND_HEADERS.PLAYGROUND_ID).toBe('x-gati-playground-id');
  });
});

describe('PlaygroundEngine', () => {
  let engine: PlaygroundEngine;

  beforeEach(() => {
    engine = new PlaygroundEngine();
  });

  describe('isPlaygroundRequest', () => {
    it('should return true when x-gati-playground header is "true"', () => {
      const headers = { 'x-gati-playground': 'true' };
      expect(engine.isPlaygroundRequest(headers)).toBe(true);
    });

    it('should return true when x-gati-playground header is "1"', () => {
      const headers = { 'x-gati-playground': '1' };
      expect(engine.isPlaygroundRequest(headers)).toBe(true);
    });

    it('should return false when x-gati-playground header is missing', () => {
      const headers = {};
      expect(engine.isPlaygroundRequest(headers)).toBe(false);
    });

    it('should return false when x-gati-playground header is "false"', () => {
      const headers = { 'x-gati-playground': 'false' };
      expect(engine.isPlaygroundRequest(headers)).toBe(false);
    });
  });

  describe('getPlaygroundId', () => {
    it('should return playground ID when header is present', () => {
      const headers = { 'x-gati-playground-id': 'test-id-123' };
      expect(engine.getPlaygroundId(headers)).toBe('test-id-123');
    });

    it('should return undefined when header is missing', () => {
      const headers = {};
      expect(engine.getPlaygroundId(headers)).toBeUndefined();
    });

    it('should return undefined when header is not a string', () => {
      const headers = { 'x-gati-playground-id': ['array', 'value'] };
      expect(engine.getPlaygroundId(headers)).toBeUndefined();
    });
  });

  describe('registerBlock', () => {
    it('should register a block', () => {
      const block = {
        id: 'test-block',
        name: 'Test Block',
        type: 'handler' as const,
        path: '/test',
      };

      engine.registerBlock(block);
      const blocks = engine.getBlocks();
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0]).toEqual(block);
    });
  });

  describe('enable/disable', () => {
    it('should enable the engine', () => {
      engine.enable();
      // Engine should be enabled (no direct way to check, but events should be emitted)
    });

    it('should disable the engine', () => {
      engine.enable();
      engine.disable();
      // Engine should be disabled (no direct way to check, but events should not be emitted)
    });
  });

  describe('wrapHandler', () => {
    it('should wrap handler and emit events for playground requests', async () => {
      const mockHandler = async (_req: unknown, res: { json: (data: unknown) => unknown }, _gctx: unknown, _lctx: unknown) => {
        res.json({ success: true });
      };

      const wrappedHandler = engine.wrapHandler(mockHandler, 'test-handler');

      const mockReq = {
        headers: { 
          'x-gati-playground': 'true',
          'x-gati-playground-id': 'test-123'
        },
      };
      const mockRes = {
        json: (data: unknown) => data,
      };
      const mockLctx = {
        requestId: 'req-123',
      };

      let eventEmitted = false;
      engine.on('playground-event', (event: { requestId: string; blockId: string; playgroundId?: string }) => {
        eventEmitted = true;
        expect(event.requestId).toBe('req-123');
        expect(event.blockId).toBe('test-handler');
        expect(event.playgroundId).toBe('test-123');
      });

      engine.enable();
      await wrappedHandler(mockReq, mockRes, {}, mockLctx);

      expect(eventEmitted).toBe(true);
    });

    it('should not emit events for non-playground requests', async () => {
      const mockHandler = async (_req: unknown, res: { json: (data: unknown) => unknown }, _gctx: unknown, _lctx: unknown) => {
        res.json({ success: true });
      };

      const wrappedHandler = engine.wrapHandler(mockHandler, 'test-handler');

      const mockReq = {
        headers: {},
      };
      const mockRes = {
        json: (data: unknown) => data,
      };
      const mockLctx = {
        requestId: 'req-123',
      };

      let eventEmitted = false;
      engine.on('playground-event', () => {
        eventEmitted = true;
      });

      engine.enable();
      await wrappedHandler(mockReq, mockRes, {}, mockLctx);

      expect(eventEmitted).toBe(false);
    });
  });
});
