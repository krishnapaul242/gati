/**
 * @module cli/analyzer/file-watcher
 * @description Real-time file and manifest watcher
 */

import { watch } from 'chokidar';
import { resolve, relative } from 'path';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { analyzeFile } from './simple-analyzer.js';

export class FileWatcher {
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
    console.log('👁 Starting file watcher...');
    
    // Watch source files
    this.fileWatcher = watch([
      `${this.srcDir}/**/*.{ts,js}`
    ], { ignoreInitial: false });

    this.fileWatcher.on('add', (filePath: string) => {
      console.log(`📄 File added: ${relative(this.srcDir, filePath)}`);
      this.processFile(filePath);
    });
    
    this.fileWatcher.on('change', (filePath: string) => {
      console.log(`📝 File changed: ${relative(this.srcDir, filePath)}`);
      this.processFile(filePath);
    });
    
    this.fileWatcher.on('unlink', (filePath: string) => {
      console.log(`🗑️ File removed: ${relative(this.srcDir, filePath)}`);
      this.removeManifest(filePath);
    });

    // Watch manifest files
    this.manifestWatcher = watch(`${this.manifestsDir}/*.json`, { ignoreInitial: true });
    
    this.manifestWatcher.on('add', () => this.updateAppManifest());
    this.manifestWatcher.on('change', () => this.updateAppManifest());
    this.manifestWatcher.on('unlink', () => this.updateAppManifest());
  }

  private processFile(filePath: string) {
    try {
      const result = analyzeFile(filePath, this.srcDir);
      
      if (result) {
        // Create individual manifest
        const manifestName = this.getManifestName(filePath);
        const individualManifest = {
          filePath,
          type: (result as any).route ? 'handler' : 'module',
          data: result,
          timestamp: Date.now()
        };
        
        const manifestPath = resolve(this.manifestsDir, manifestName);
        writeFileSync(manifestPath, JSON.stringify(individualManifest, null, 2));
        
        console.log(`✅ Updated manifest: ${manifestName}`);
      }
    } catch (error) {
      console.error(`❌ Failed to process ${filePath}:`, error);
    }
  }

  private removeManifest(filePath: string) {
    const manifestName = this.getManifestName(filePath);
    const manifestPath = resolve(this.manifestsDir, manifestName);
    
    if (existsSync(manifestPath)) {
      require('fs').unlinkSync(manifestPath);
      console.log(`🗑️ Removed manifest: ${manifestName}`);
    }
  }

  private getManifestName(filePath: string): string {
    const relativePath = relative(this.srcDir, filePath).replace(/\\/g, '/');
    
    if (relativePath.startsWith('handlers/')) {
      return relativePath
        .replace('handlers/', '')
        .replace(/\//g, '_')
        .replace(/\.(ts|js)$/, '.json');
    } else if (relativePath.startsWith('modules/')) {
      return relativePath
        .replace('modules/', '')
        .replace(/\//g, '_')
        .replace(/\.(ts|js)$/, '.json');
    }
    
    return relativePath
      .replace(/\//g, '_')
      .replace(/\.(ts|js)$/, '.json');
  }

  private updateAppManifest() {
    try {
      const handlers: any[] = [];
      const modules: any[] = [];
      
      // Read all individual manifests
      const manifestFiles = require('fs').readdirSync(this.manifestsDir);
      
      for (const file of manifestFiles) {
        if (file.endsWith('.json') && file !== '_app.json') {
          const manifestPath = resolve(this.manifestsDir, file);
          const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
          
          if (manifest.type === 'handler') {
            handlers.push(manifest.data);
          } else if (manifest.type === 'module') {
            modules.push(manifest.data);
          }
        }
      }
      
      const appManifest = { handlers, modules, timestamp: Date.now() };
      const appManifestPath = resolve(this.manifestsDir, '_app.json');
      writeFileSync(appManifestPath, JSON.stringify(appManifest, null, 2));
      
      console.log(`🔄 Updated app manifest: ${handlers.length} handlers, ${modules.length} modules`);
      
      if (this.onUpdate) {
        this.onUpdate(appManifest);
      }
    } catch (error) {
      console.error('❌ Failed to update app manifest:', error);
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