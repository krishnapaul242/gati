/**
 * @module playground/playground-engine
 * @description Core playground engine for runtime integration
 */

import { EventEmitter } from 'events';
import type { Handler } from '@gati-framework/runtime';

export interface PlaygroundBlock {
  id: string;
  name: string;
  type: 'handler' | 'module' | 'middleware';
  path: string;
}

export interface PlaygroundEvent {
  requestId: string;
  blockId: string;
  type: 'enter' | 'exit' | 'error';
  timestamp: number;
  data?: unknown;
}

export class PlaygroundEngine extends EventEmitter {
  private blocks = new Map<string, PlaygroundBlock>();
  private isEnabled = false;

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  registerBlock(block: PlaygroundBlock): void {
    this.blocks.set(block.id, block);
  }

  isPlaygroundRequest(headers: Record<string, string | string[] | undefined>): boolean {
    return !!headers['x-playground-request'];
  }

  emitEvent(event: PlaygroundEvent): void {
    if (this.isEnabled) {
      this.emit('playground-event', event);
    }
  }

  wrapHandler(handler: Handler, blockId: string): Handler {
    return async (req, res, gctx, lctx) => {
      if (!this.isPlaygroundRequest(req.headers)) {
        return handler(req, res, gctx, lctx);
      }

      this.emitEvent({
        requestId: lctx.requestId,
        blockId,
        type: 'enter',
        timestamp: Date.now()
      });

      try {
        const result = await handler(req, res, gctx, lctx);
        this.emitEvent({
          requestId: lctx.requestId,
          blockId,
          type: 'exit',
          timestamp: Date.now()
        });
        return result;
      } catch (error) {
        this.emitEvent({
          requestId: lctx.requestId,
          blockId,
          type: 'error',
          timestamp: Date.now(),
          data: error
        });
        throw error;
      }
    };
  }

  getBlocks(): PlaygroundBlock[] {
    return Array.from(this.blocks.values());
  }
}

export const playgroundEngine = new PlaygroundEngine();