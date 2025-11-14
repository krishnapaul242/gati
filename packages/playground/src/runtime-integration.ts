/**
 * @module playground/runtime-integration
 * @description Integration with Gati runtime
 */

import type { GlobalContext, Handler } from '@gati-framework/runtime';
import { playgroundEngine } from './playground-engine.js';
import { PlaygroundWebSocketServer } from './websocket-server.js';
import { createBlocksFromManifest } from './manifest-loader.js';

export interface PlaygroundConfig {
  enabled: boolean;
  port?: number;
  wsPort?: number;
  debugMode?: boolean;
  priority?: number;
}

export class PlaygroundIntegration {
  private wsServer?: PlaygroundWebSocketServer;
  private config: PlaygroundConfig;

  constructor(config: PlaygroundConfig) {
    this.config = config;
  }

  async initialize(gctx: GlobalContext): Promise<void> {
    if (!this.config.enabled) return;

    // Load manifest and create blocks
    const manifest = await this.loadManifest();
    const blocks = createBlocksFromManifest(manifest);
    
    blocks.forEach(block => {
      playgroundEngine.registerBlock(block);
    });

    // Start WebSocket server with configured port
    const wsPort = this.config.wsPort || 8080;
    this.wsServer = new PlaygroundWebSocketServer(playgroundEngine, wsPort);
    playgroundEngine.enable();

    console.log(`[Playground] Enabled - WebSocket server on port ${wsPort}`);
    if (this.config.debugMode) {
      console.log('[Playground] Debug mode enabled');
    }

    // Register lifecycle hooks
    gctx.lifecycle.onShutdown('playground', () => this.cleanup());
  }

  wrapHandler(handler: Handler, path: string): Handler {
    if (!this.config.enabled) return handler;
    
    const blockId = `handler_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
    return playgroundEngine.wrapHandler(handler, blockId);
  }

  private async loadManifest() {
    // Load from .gati/manifest.json or generate
    return {
      handlers: [],
      modules: [],
      middlewares: []
    };
  }

  private cleanup(): void {
    this.wsServer?.close();
    playgroundEngine.disable();
  }
}

export function createPlaygroundIntegration(config: PlaygroundConfig): PlaygroundIntegration {
  return new PlaygroundIntegration(config);
}