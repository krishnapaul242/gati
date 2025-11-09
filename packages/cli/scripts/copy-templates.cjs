// Copy non-TS template assets to dist for deployment commands
const { copySync, existsSync } = require('fs-extra');
const { join } = require('path');

const srcDir = join(__dirname, '..', 'src', 'deployment', 'templates');
const destDir = join(__dirname, '..', 'dist', 'deployment', 'templates');

try {
  if (!existsSync(srcDir)) {
    process.exit(0);
  }
  copySync(srcDir, destDir, { overwrite: true });
  // eslint-disable-next-line no-console
  console.log(`[copy-templates] Copied templates to ${destDir}`);
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[copy-templates] Failed to copy templates:', err);
  process.exit(1);
}
