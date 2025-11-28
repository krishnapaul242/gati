#!/usr/bin/env node
/**
 * Sync package versions in CLI templates with actual package.json versions
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Read package versions
const packages = {
  core: JSON.parse(readFileSync(join(rootDir, 'packages/core/package.json'), 'utf8')),
  runtime: JSON.parse(readFileSync(join(rootDir, 'packages/runtime/package.json'), 'utf8')),
  cli: JSON.parse(readFileSync(join(rootDir, 'packages/cli/package.json'), 'utf8')),
};

const versions = {
  core: packages.core.version,
  runtime: packages.runtime.version,
  cli: packages.cli.version,
};

console.log('📦 Current versions:');
console.log(`  @gati-framework/core: ${versions.core}`);
console.log(`  @gati-framework/runtime: ${versions.runtime}`);
console.log(`  @gati-framework/cli: ${versions.cli}`);
console.log('');

// Update CLI template file
const templatePath = join(rootDir, 'packages/cli/src/utils/file-generator.ts');
let templateContent = readFileSync(templatePath, 'utf8');

// Replace versions in both templates
const replacements = [
  { old: /@gati-framework\/core': '\^[\d.]+'/g, new: `@gati-framework/core': '^${versions.core}'` },
  { old: /@gati-framework\/runtime': '\^[\d.]+'/g, new: `@gati-framework/runtime': '^${versions.runtime}'` },
  { old: /@gati-framework\/cli': '\^[\d.]+'/g, new: `@gati-framework/cli': '^${versions.cli}'` },
];

let updated = false;
for (const { old, new: newStr } of replacements) {
  if (templateContent.match(old)) {
    templateContent = templateContent.replace(old, newStr);
    updated = true;
  }
}

if (updated) {
  writeFileSync(templatePath, templateContent, 'utf8');
  console.log('✅ Updated CLI template versions');
} else {
  console.log('✓ CLI template versions already up to date');
}
