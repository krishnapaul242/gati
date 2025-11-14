/**
 * @module playground/playground-engine
 * @description Core playground engine for runtime integration
 */

import { EventEmitter } from 'events';
import type { Handler } from '@gati-framework/runtime';

/**
 * Playground request headers
 */
export const PLAYGROUND_HEADERS = {
  /** Indicates this is a playground request */
  PLAYGROUND_REQUEST: 'x-gati-playground',
  /** Unique playground instance ID */
  PLAYGROUND_ID: 'x-gati-playground-id',
} as const;

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
  playgroundId?: string;
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
    const headerValue = headers[PLAYGROUND_HEADERS.PLAYGROUND_REQUEST];
    return headerValue === 'true' || headerValue === '1';
  }

  getPlaygroundId(headers: Record<string, string | string[] | undefined>): string | undefined {
    const id = headers[PLAYGROUND_HEADERS.PLAYGROUND_ID];
    return typeof id === 'string' ? id : undefined;
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

      const playgroundId = this.getPlaygroundId(req.headers);

      this.emitEvent({
        requestId: lctx.requestId,
        blockId,
        type: 'enter',
        timestamp: Date.now(),
        playgroundId,
      });

      try {
        const result = await handler(req, res, gctx, lctx);
        this.emitEvent({
          requestId: lctx.requestId,
          blockId,
          type: 'exit',
          timestamp: Date.now(),
          playgroundId,
        });
        return result;
      } catch (error) {
        this.emitEvent({
          requestId: lctx.requestId,
          blockId,
          type: 'error',
          timestamp: Date.now(),
          data: error,
          playgroundId,
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