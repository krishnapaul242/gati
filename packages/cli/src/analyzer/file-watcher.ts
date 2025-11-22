/**
 * @module cli/analyzer/file-watcher
 * @description Real-time file and manifest watcher
 */

import { watch } from 'chokidar';
import { resolve, relative } from 'path';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import chalk from 'chalk';
import { analyzeFile } from './simple-analyzer.js';
import { VersionDetector } from './version-detector.js';
import type { VersionChange } from './version-detector.js';

export class FileWatcher {
  private srcDir: string;
  private manifestsDir: string;
  private fileWatcher?: any;
  private manifestWatcher?: any;
  private onUpdate?: (manifest: any) => void;
  private versionDetector?: VersionDetector;
  private onVersionChange?: (change: VersionChange) => void;

  constructor(
    projectRoot: string, 
    onUpdate?: (manifest: any) => void,
    options?: {
      enableVersioning?: boolean;
      onVersionChange?: (change: VersionChange) => void;
    }
  ) {
    this.srcDir = resolve(projectRoot, 'src');
    this.manifestsDir = resolve(projectRoot, '.gati', 'manifests');
    this.onUpdate = onUpdate;
    this.onVersionChange = options?.onVersionChange;
    
    if (!existsSync(this.manifestsDir)) {
      mkdirSync(this.manifestsDir, { recursive: true });
    }

    // Initialize version detector if enabled
    if (options?.enableVersioning !== false) {
      this.versionDetector = new VersionDetector(projectRoot, true);
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

  private async processFile(filePath: string) {
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

        // Detect version changes for handlers
        if ((result as any).route && this.versionDetector) {
          const handlerCode = readFileSync(filePath, 'utf-8');
          const handlerPath = (result as any).route;
          
          const versionChange = await this.versionDetector.detectChange(handlerPath, handlerCode);
          
          if (versionChange) {
            this.notifyVersionChange(versionChange);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Failed to process ${filePath}:`, error);
    }
  }

  private notifyVersionChange(change: VersionChange) {
    console.log('\n' + chalk.cyan('═'.repeat(70)));
    console.log(chalk.bold.cyan('🕰️  New Version Created'));
    console.log(chalk.cyan('═'.repeat(70)));
    
    console.log(chalk.bold('Handler:'), chalk.white(change.handlerPath));
    
    if (change.oldVersion) {
      console.log(chalk.bold('Previous:'), chalk.gray(change.oldVersion));
    }
    
    console.log(chalk.bold('New Version:'), chalk.green(change.newVersion));
    console.log(chalk.bold('Timestamp:'), chalk.gray(new Date(change.timestamp).toISOString()));
    
    if (change.breaking) {
      console.log(chalk.bold('Type:'), chalk.red.bold('BREAKING CHANGE'));
    } else {
      console.log(chalk.bold('Type:'), chalk.yellow('Non-breaking change'));
    }
    
    if (change.changes.length > 0) {
      console.log(chalk.bold('\nChanges:'));
      for (const changeDesc of change.changes) {
        if (changeDesc.startsWith('BREAKING:')) {
          console.log(chalk.red('  • ' + changeDesc));
        } else {
          console.log(chalk.yellow('  • ' + changeDesc));
        }
      }
    }
    
    if (change.breaking) {
      console.log('\n' + chalk.yellow('⚠️  Breaking change detected!'));
      console.log(chalk.gray('   A transformer stub will be generated to maintain backward compatibility.'));
      console.log(chalk.gray('   Location: src/transformers/' + this.getTransformerName(change)));
    }
    
    console.log(chalk.cyan('═'.repeat(70)) + '\n');
    
    // Call callback if provided
    if (this.onVersionChange) {
      this.onVersionChange(change);
    }
  }

  private getTransformerName(change: VersionChange): string {
    const handlerName = change.handlerPath.split('/').pop()?.replace(/^\//, '') || 'handler';
    const oldNum = change.oldVersion?.match(/-(\d+)$/)?.[1] || '001';
    const newNum = change.newVersion.match(/-(\d+)$/)?.[1] || '002';
    return `${handlerName}-v${oldNum}-v${newNum}.ts`;
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
