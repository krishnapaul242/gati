/**
 * @module cli/commands/generate-manifests
 * @description Generate individual file manifests
 */

import { Command } from 'commander';

async function generateManifests(cwd: string): Promise<void> {
  const { analyzeFile } = await import('../analyzer/simple-analyzer.js');
  const { resolve } = await import('path');
  const { writeFileSync, mkdirSync, existsSync } = await import('fs');
  const { glob } = await import('glob');
  
  console.log('🔍 Generating manifests...');
  
  const srcDir = resolve(cwd, 'src');
  const manifestsDir = resolve(cwd, '.gati', 'manifests');
  
  if (!existsSync(manifestsDir)) {
    mkdirSync(manifestsDir, { recursive: true });
  }
  
  const handlers: any[] = [];
  const modules: any[] = [];
  
  // Find all TypeScript files
  const files = await glob('src/**/*.{ts,js}', { cwd, absolute: true });
  
  for (const filePath of files) {
    const result = analyzeFile(filePath, srcDir);
    
    if (result) {
      // Create individual manifest with short name
      const { relative } = await import('path');
      const relativePath = relative(srcDir, filePath).replace(/\\/g, '/');
      
      let manifestName;
      if (relativePath.startsWith('handlers/')) {
        manifestName = relativePath
          .replace('handlers/', '')
          .replace(/\//g, '_')
          .replace(/\.(ts|js)$/, '.json');
      } else if (relativePath.startsWith('modules/')) {
        manifestName = relativePath
          .replace('modules/', '')
          .replace(/\//g, '_')
          .replace(/\.(ts|js)$/, '.json');
      } else {
        manifestName = relativePath
          .replace(/\//g, '_')
          .replace(/\.(ts|js)$/, '.json');
      }
      
      const individualManifest = {
        filePath,
        type: (result as any).route ? 'handler' : 'module',
        data: result,
        timestamp: Date.now()
      };
      
      const manifestPath = resolve(manifestsDir, manifestName);
      writeFileSync(manifestPath, JSON.stringify(individualManifest, null, 2));
      
      // Add to collections
      if ((result as any).route) {
        handlers.push(result);
        console.log(`✅ Handler: ${(result as any).method} ${(result as any).route}`);
      } else {
        modules.push(result);
        console.log(`✅ Module: ${(result as any).exportName}`);
      }
    }
  }
  
  // Write app manifest
  const appManifest = { handlers, modules, timestamp: Date.now() };
  const appManifestPath = resolve(manifestsDir, '_app.json');
  writeFileSync(appManifestPath, JSON.stringify(appManifest, null, 2));
  
  console.log(`✅ Generated ${handlers.length} handlers, ${modules.length} modules`);
}

export const generateManifestsCommand = new Command('generate:manifests')
  .description('Generate individual file manifests')
  .action(async () => {
    const cwd = process.cwd();
    await generateManifests(cwd);
  });