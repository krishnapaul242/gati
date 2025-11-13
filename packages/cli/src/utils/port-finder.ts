/**
 * @module cli/utils/port-finder
 * @description Find available port with auto-increment
 */

import { createServer } from 'net';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export async function findAvailablePort(startPort: number = 3000): Promise<number> {
  const lastPortFile = resolve(process.cwd(), '.gati', 'last-port.txt');
  
  // Try to read last used port
  let port = startPort;
  if (existsSync(lastPortFile)) {
    try {
      const lastPort = parseInt(readFileSync(lastPortFile, 'utf-8').trim());
      if (lastPort && lastPort > 0) {
        port = lastPort + 1;
      }
    } catch (error) {
      // Ignore error, use default
    }
  }
  
  // Find available port
  while (port < 65535) {
    if (await isPortAvailable(port)) {
      // Save last used port
      try {
        writeFileSync(lastPortFile, port.toString());
      } catch (error) {
        // Ignore error
      }
      return port;
    }
    port++;
  }
  
  throw new Error('No available ports found');
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    
    server.on('error', () => resolve(false));
  });
}