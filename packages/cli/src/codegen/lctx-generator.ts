/**
 * @module cli/codegen/lctx-generator
 * @description Generate LCTX type from middleware chain
 */

export interface LCTXGeneratorOptions {
  middlewares?: string[];
  hasAuth?: boolean;
}

/**
 * Generate LCTX interface
 */
export function generateLCTX(options: LCTXGeneratorOptions = {}): string {
  const lines: string[] = [];
  
  lines.push('/**');
  lines.push(' * Auto-generated Local Context type');
  lines.push(' * @generated');
  lines.push(' */');
  lines.push('');
  lines.push('export interface LCTX {');
  
  // Standard fields
  lines.push('  requestId: string;');
  lines.push('  timestamp: number;');
  lines.push('  method: string;');
  lines.push('  path: string;');
  
  // Auth extension
  if (options.hasAuth) {
    lines.push('  user?: {');
    lines.push('    id: string;');
    lines.push('    email: string;');
    lines.push('    roles: string[];');
    lines.push('  };');
  }
  
  // Logger
  lines.push('  logger: {');
  lines.push('    info: (message: string, ...args: any[]) => void;');
  lines.push('    warn: (message: string, ...args: any[]) => void;');
  lines.push('    error: (message: string, ...args: any[]) => void;');
  lines.push('    debug: (message: string, ...args: any[]) => void;');
  lines.push('  };');
  
  lines.push('}');
  
  return lines.join('\n');
}
