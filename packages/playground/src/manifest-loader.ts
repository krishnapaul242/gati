/**
 * @module playground/manifest-loader
 * @description Loads application manifest and creates playground blocks
 */

import type { PlaygroundBlock } from './playground-engine.js';

export interface ManifestEntry {
  path: string;
  type: 'handler' | 'module' | 'middleware';
  name?: string;
}

export interface AppManifest {
  handlers: ManifestEntry[];
  modules: ManifestEntry[];
  middlewares: ManifestEntry[];
}

export function createBlocksFromManifest(manifest: AppManifest): PlaygroundBlock[] {
  const blocks: PlaygroundBlock[] = [];

  [...manifest.handlers, ...manifest.modules, ...manifest.middlewares].forEach((entry, index) => {
    blocks.push({
      id: `${entry.type}_${index}`,
      name: entry.name || entry.path.split('/').pop()?.replace(/\.(ts|js)$/, '') || 'Unknown',
      type: entry.type,
      path: entry.path
    });
  });

  return blocks;
}

export function generateHumanReadableName(path: string): string {
  return path
    .split('/')
    .pop()
    ?.replace(/\.(ts|js)$/, '')
    ?.replace(/[-_]/g, ' ')
    ?.replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
}