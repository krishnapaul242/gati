/**
 * @module playground/static
 * @description Static file server for playground UI
 */

import type { Handler } from '@gati-framework/runtime';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Serve playground static files
 */
export const servePlaygroundUI: Handler = async (req, res) => {
  try {
    const publicDir = join(__dirname, '..', 'public');
    
    // Extract the file path from the request
    let requestPath = req.path || '/';
    console.log('Playground request:', requestPath);
    
    // Remove /playground prefix
    if (requestPath.startsWith('/playground')) {
      requestPath = requestPath.replace('/playground', '');
    }
    
    // Default to index.html for root or empty path
    if (requestPath === '' || requestPath === '/') {
      requestPath = '/index.html';
    }
    
    const filePath = join(publicDir, requestPath);
    console.log('Looking for file:', filePath);

    if (!existsSync(filePath)) {
      console.log('File not found:', filePath);
      res.status(404).json({ error: 'File not found', path: requestPath, publicDir, filePath });
      return;
    }

    const content = readFileSync(filePath);
    
    // Set content type based on extension
    const ext = filePath.split('.').pop();
    const contentTypes: Record<string, string> = {
      'html': 'text/html',
      'js': 'application/javascript',
      'css': 'text/css',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'svg': 'image/svg+xml',
    };

    const contentType = contentTypes[ext || 'html'] || 'text/plain';
    console.log('Serving file:', filePath, 'as', contentType);
    
    res.header('Content-Type', contentType);
    res.raw?.end(content);
  } catch (error) {
    console.error('Playground static file error:', error);
    res.status(500).json({ error: 'Failed to read file', details: error instanceof Error ? error.message : 'Unknown error' });
  }
};
