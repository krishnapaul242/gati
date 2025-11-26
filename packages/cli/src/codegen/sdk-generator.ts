/**
 * @module cli/codegen/sdk-generator
 * @description Generate type-safe SDK client stubs from handler manifests
 */

import type { HandlerManifest } from '../analyzer/manifest-generator.js';

export interface SDKGeneratorOptions {
  includeComments?: boolean;
  className?: string;
  includeAuth?: boolean;
  includeTimeout?: boolean;
}

export interface GeneratedSDK {
  code: string;
  className: string;
}

/**
 * Generate SDK client from handler manifests
 */
export class SDKGenerator {
  generate(manifests: HandlerManifest[], options: SDKGeneratorOptions = {}): GeneratedSDK {
    const opts = {
      includeComments: true,
      className: 'GatiClient',
      includeAuth: true,
      includeTimeout: true,
      ...options,
    };

    const lines: string[] = [];

    // Header comment
    if (opts.includeComments) {
      lines.push('/**');
      lines.push(' * Auto-generated Gati API Client');
      lines.push(` * Generated: ${new Date().toISOString()}`);
      lines.push(' * DO NOT EDIT - This file is auto-generated');
      lines.push(' */');
      lines.push('');
    }

    // Client options interface
    lines.push('export interface ClientOptions {');
    if (opts.includeAuth) {
      lines.push('  token?: string;');
    }
    if (opts.includeTimeout) {
      lines.push('  timeout?: number;');
    }
    lines.push('  headers?: Record<string, string>;');
    lines.push('}');
    lines.push('');

    // Client class
    lines.push(`export class ${opts.className} {`);
    lines.push('  constructor(');
    lines.push('    private baseUrl: string,');
    lines.push('    private options?: ClientOptions');
    lines.push('  ) {}');
    lines.push('');

    // Generate methods for each handler
    for (const manifest of manifests) {
      lines.push(this.generateMethod(manifest, opts));
      lines.push('');
    }

    // Helper methods
    lines.push(this.generateHelperMethods(opts));

    lines.push('}');

    return {
      code: lines.join('\n'),
      className: opts.className,
    };
  }

  private generateMethod(manifest: HandlerManifest, options: SDKGeneratorOptions): string {
    const lines: string[] = [];
    const methodName = this.extractMethodName(manifest);
    const httpMethod = Array.isArray(manifest.method) ? manifest.method[0] : manifest.method;
    const pathParams = this.extractPathParams(manifest.path);
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(httpMethod.toUpperCase());

    // JSDoc comment
    if (options.includeComments) {
      lines.push('  /**');
      lines.push(`   * ${httpMethod} ${manifest.path}`);
      if (pathParams.length > 0) {
        pathParams.forEach(param => {
          lines.push(`   * @param ${param} - Path parameter`);
        });
      }
      if (hasBody) {
        lines.push(`   * @param body - Request body`);
      }
      lines.push(`   * @returns Response data`);
      lines.push('   */');
    }

    // Method signature
    const params: string[] = [];
    pathParams.forEach(param => params.push(`${param}: string`));
    if (hasBody) {
      params.push('body: any');
    }
    params.push('query?: Record<string, string>');

    lines.push(`  async ${methodName}(${params.join(', ')}): Promise<any> {`);

    // Build URL
    let urlExpr = this.buildUrlExpression(manifest.path, pathParams);
    lines.push(`    const url = \`\${this.baseUrl}${urlExpr}\`;`);
    lines.push('    const queryString = query ? \'?\' + new URLSearchParams(query).toString() : \'\';');
    lines.push('    const fullUrl = url + queryString;');
    lines.push('');

    // Fetch options
    lines.push('    const response = await fetch(fullUrl, {');
    lines.push(`      method: '${httpMethod.toUpperCase()}',`);
    lines.push('      headers: this.getHeaders(),');
    if (hasBody) {
      lines.push('      body: JSON.stringify(body),');
    }
    if (options.includeTimeout) {
      lines.push('      signal: this.getAbortSignal(),');
    }
    lines.push('    });');
    lines.push('');

    // Error handling
    lines.push('    if (!response.ok) {');
    lines.push('      throw new Error(`HTTP ${response.status}: ${response.statusText}`);');
    lines.push('    }');
    lines.push('');

    // Return response
    lines.push('    return response.json();');
    lines.push('  }');

    return lines.join('\n');
  }

  private generateHelperMethods(options: SDKGeneratorOptions): string {
    const lines: string[] = [];

    // getHeaders method
    lines.push('  private getHeaders(): Record<string, string> {');
    lines.push('    const headers: Record<string, string> = {');
    lines.push("      'Content-Type': 'application/json',");
    lines.push('    };');
    lines.push('');
    
    if (options.includeAuth) {
      lines.push('    if (this.options?.token) {');
      lines.push('      headers[\'Authorization\'] = `Bearer ${this.options.token}`;');
      lines.push('    }');
      lines.push('');
    }
    
    lines.push('    if (this.options?.headers) {');
    lines.push('      Object.assign(headers, this.options.headers);');
    lines.push('    }');
    lines.push('');
    lines.push('    return headers;');
    lines.push('  }');

    if (options.includeTimeout) {
      lines.push('');
      lines.push('  private getAbortSignal(): AbortSignal | undefined {');
      lines.push('    if (this.options?.timeout) {');
      lines.push('      return AbortSignal.timeout(this.options.timeout);');
      lines.push('    }');
      lines.push('    return undefined;');
      lines.push('  }');
    }

    return lines.join('\n');
  }

  private extractMethodName(manifest: HandlerManifest): string {
    const httpMethod = Array.isArray(manifest.method) ? manifest.method[0] : manifest.method;
    const path = manifest.path;

    // Extract path segments
    const segments = path.split('/').filter(s => s && !s.startsWith(':'));
    
    // Build method name: httpMethod + PathSegments
    // e.g., GET /users/:id -> getUsers
    // e.g., POST /users -> createUser
    // e.g., PUT /users/:id -> updateUser
    // e.g., DELETE /users/:id -> deleteUser
    
    const methodPrefix = this.getMethodPrefix(httpMethod.toUpperCase());
    const resourceName = segments.length > 0 ? this.toCamelCase(segments.join('_')) : 'resource';
    
    return methodPrefix + this.capitalize(resourceName);
  }

  private getMethodPrefix(httpMethod: string): string {
    const prefixMap: Record<string, string> = {
      'GET': 'get',
      'POST': 'create',
      'PUT': 'update',
      'PATCH': 'patch',
      'DELETE': 'delete',
    };
    return prefixMap[httpMethod] || 'call';
  }

  private extractPathParams(path: string): string[] {
    const params: string[] = [];
    const segments = path.split('/');
    
    for (const segment of segments) {
      if (segment.startsWith(':')) {
        params.push(segment.substring(1));
      }
    }
    
    return params;
  }

  private buildUrlExpression(path: string, pathParams: string[]): string {
    let expr = path;
    
    // Replace :param with ${param}
    for (const param of pathParams) {
      expr = expr.replace(`:${param}`, `\${${param}}`);
    }
    
    return expr;
  }

  private toCamelCase(str: string): string {
    // Handle both underscores and hyphens
    return str
      .split(/[_-]/)
      .map((word, index) => {
        if (index === 0) return word.toLowerCase();
        return this.capitalize(word);
      })
      .join('');
  }

  private capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Create SDK generator instance
 */
export function createSDKGenerator(): SDKGenerator {
  return new SDKGenerator();
}
