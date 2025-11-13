/**
 * @module cli/analyzer/manifest-watcher
 * @description Watch files and generate individual manifests
 */

import { watch } from 'chokidar';
import { resolve, relative } from 'path';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { analyzeSingleFile } from './single-file-analyzer.js';
import type { HandlerInfo, ModuleInfo } from './handler-analyzer.js';

export interface FileManifest {
  filePath: string;
  type: 'handler' | 'module';
  handler?: HandlerInfo;
  module?: ModuleInfo;
  timestamp: number;
}

export class ManifestWatcher {
  private srcDir: string;
  private manifestsDir: string;
  private fileWatcher?: any;
  private manifestWatcher?: any;
  private onUpdate?: (manifest: any) => void;

  constructor(projectRoot: string, onUpdate?: (manifest: any) => void) {
    this.srcDir = resolve(projectRoot, 'src');
    this.manifestsDir = resolve(projectRoot, '.gati', 'manifests');
    this.onUpdate = onUpdate;
    
    if (!existsSync(this.manifestsDir)) {
      mkdirSync(this.manifestsDir, { recursive: true });
    }
  }

  start() {
    console.log(`Watching: ${this.srcDir}/handlers/**/*.{ts,js}`);
    console.log(`Watching: ${this.srcDir}/modules/**/*.{ts,js}`);
    
    // Watch source files
    this.fileWatcher = watch([
      `${this.srcDir}\\handlers\\**\\*.{ts,js}`,
      `${this.srcDir}\\modules\\**\\*.{ts,js}`,
      `${this.srcDir}/handlers/**/*.{ts,js}`,
      `${this.srcDir}/modules/**/*.{ts,js}`
    ], { ignoreInitial: false });

    this.fileWatcher.on('add', (filePath: string) => {
      console.log(`File added: ${filePath}`);
      this.processFile(filePath);
    });
    this.fileWatcher.on('change', (filePath: string) => {
      console.log(`File changed: ${filePath}`);
      this.processFile(filePath);
    });
    this.fileWatcher.on('unlink', (filePath: string) => {
      console.log(`File removed: ${filePath}`);
      this.removeManifest(filePath);
    });

    // Watch manifest files
    this.manifestWatcher = watch(`${this.manifestsDir}/**/*.json`, { ignoreInitial: false });
    this.manifestWatcher.on('add', () => this.updateAppManifest());
    this.manifestWatcher.on('change', () => this.updateAppManifest());
    this.manifestWatcher.on('unlink', () => this.updateAppManifest());
  }

  private async processFile(filePath: string) {
    try {
      console.log(`Processing file: ${filePath}`);
      const result = analyzeSingleFile(filePath, this.srcDir);
      console.log(`Analysis result:`, result);
      
      if (result) {
        const fileManifest: FileManifest = {
          filePath,
          type: (result as any).route ? 'handler' : 'module',
          handler: (result as any).route ? result as HandlerInfo : undefined,
          module: !(result as any).route ? result as ModuleInfo : undefined,
          timestamp: Date.now()
        };
        
        const manifestPath = this.getManifestPath(filePath);
        console.log(`Writing manifest to: ${manifestPath}`);
        writeFileSync(manifestPath, JSON.stringify(fileManifest, null, 2));
      } else {
        console.log(`No result for file: ${filePath}`);
      }
    } catch (error) {
      console.error(`Failed to process ${filePath}:`, error);
    }
  }

  private removeManifest(filePath: string) {
    const manifestPath = this.getManifestPath(filePath);
    if (existsSync(manifestPath)) {
      require('fs').unlinkSync(manifestPath);
    }
  }

  private getManifestPath(filePath: string): string {
    const relativePath = relative(this.srcDir, filePath);
    const manifestName = relativePath.replace(/[/\\]/g, '_').replace(/\.(ts|js)$/, '.json');
    return resolve(this.manifestsDir, manifestName);
  }

  private updateAppManifest() {
    try {
      const handlers: HandlerInfo[] = [];
      const modules: ModuleInfo[] = [];
      
      // Read all manifest files
      const manifestFiles = require('fs').readdirSync(this.manifestsDir);
      
      for (const file of manifestFiles) {
        if (file.endsWith('.json')) {
          const manifestPath = resolve(this.manifestsDir, file);
          const manifest: FileManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
          
          if (manifest.handler) {
            handlers.push(manifest.handler);
          } else if (manifest.module) {
            modules.push(manifest.module);
          }
        }
      }
      
      const appManifest = { handlers, modules, timestamp: Date.now() };
      const appManifestPath = resolve(this.manifestsDir, '_app.json');
      writeFileSync(appManifestPath, JSON.stringify(appManifest, null, 2));
      
      if (this.onUpdate) {
        this.onUpdate(appManifest);
      }
    } catch (error) {
      console.error('Failed to update app manifest:', error);
    }
  }

  stop() {
    if (this.fileWatcher) {
      this.fileWatcher.close();
    }
    if (this.manifestWatcher) {
      this.manifestWatcher.close();
    }
  }
}