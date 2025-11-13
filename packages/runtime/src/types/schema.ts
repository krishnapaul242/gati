/**
 * @module runtime/types/schema
 * @description Type schema configuration for dynamic typing
 */

/**
 * Schema definition for request state
 */
export interface StateSchema {
  [key: string]: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

/**
 * Schema definition for modules
 */
export interface ModuleSchema {
  [moduleName: string]: {
    [method: string]: {
      params?: Record<string, string>;
      returns?: string;
    };
  };
}

/**
 * Complete type schema configuration
 */
export interface TypeSchema {
  state?: StateSchema;
  modules?: ModuleSchema;
  refs?: {
    sessionId?: string;
    userId?: string;
    tenantId?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Generate TypeScript declarations from schema
 */
export function generateTypes(schema: TypeSchema): string {
  let declarations = `// Auto-generated types - DO NOT EDIT\n\n`;
  
  // Generate state interface
  if (schema.state) {
    declarations += `declare module '@gati-framework/runtime' {\n`;
    declarations += `  interface LocalContextState {\n`;
    for (const [key, type] of Object.entries(schema.state)) {
      const tsType = mapSchemaType(type);
      declarations += `    ${key}: ${tsType};\n`;
    }
    declarations += `  }\n}\n\n`;
  }
  
  // Generate module interfaces
  if (schema.modules) {
    declarations += `declare module '@gati-framework/runtime' {\n`;
    declarations += `  interface ModuleRegistry {\n`;
    for (const [moduleName, methods] of Object.entries(schema.modules)) {
      declarations += `    ${moduleName}: {\n`;
      for (const [methodName, signature] of Object.entries(methods)) {
        const params = signature.params ? 
          Object.entries(signature.params).map(([name, type]) => `${name}: ${mapSchemaType(type)}`).join(', ') : '';
        const returns = signature.returns ? mapSchemaType(signature.returns) : 'void';
        declarations += `      ${methodName}(${params}): ${returns};\n`;
      }
      declarations += `    };\n`;
    }
    declarations += `  }\n}\n\n`;
  }
  
  return declarations;
}

function mapSchemaType(schemaType: string): string {
  switch (schemaType) {
    case 'string': return 'string';
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    case 'array': return 'unknown[]';
    case 'object': return 'Record<string, unknown>';
    default: return 'unknown';
  }
}