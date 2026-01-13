/**
 * @module cli/codegen/handler-types-generator
 * @description Generate handler type files
 */

import type { GType } from '@gati-framework/types/gtype';
import { serializeGType } from '@gati-framework/types';

export interface HandlerTypeInfo {
  name: string;
  paramsSchema?: GType;
  querySchema?: GType;
  inputSchema?: GType;
  outputSchema?: GType;
}

/**
 * Generate handler type file
 */
export function generateHandlerTypes(
  handler: HandlerTypeInfo,
  gctxCode: string,
  lctxCode: string
): string {
  const lines: string[] = [];
  
  lines.push('/**');
  lines.push(` * Auto-generated types for ${handler.name} handler`);
  lines.push(' * @generated');
  lines.push(' */');
  lines.push('');
  lines.push("import type { Handler } from '@gati-framework/runtime';");
  lines.push('');
  
  // PARAMS type
  if (handler.paramsSchema) {
    lines.push(`export type ${capitalize(handler.name)}Params = ${gtypeToTypeScript(handler.paramsSchema)};`);
    lines.push('');
  }
  
  // QUERY type
  if (handler.querySchema) {
    lines.push(`export type ${capitalize(handler.name)}Query = ${gtypeToTypeScript(handler.querySchema)};`);
    lines.push('');
  }
  
  // INPUT type
  if (handler.inputSchema) {
    lines.push(`export type ${capitalize(handler.name)}Input = ${gtypeToTypeScript(handler.inputSchema)};`);
    lines.push('');
  }
  
  // OUTPUT type
  if (handler.outputSchema) {
    lines.push(`export type ${capitalize(handler.name)}Output = ${gtypeToTypeScript(handler.outputSchema)};`);
    lines.push('');
  }
  
  // GCTX (inline)
  lines.push(gctxCode);
  lines.push('');
  
  // LCTX (inline)
  lines.push(lctxCode);
  lines.push('');
  
  // Full Handler type
  const inputType = handler.inputSchema ? `${capitalize(handler.name)}Input` : 'unknown';
  const outputType = handler.outputSchema ? `${capitalize(handler.name)}Output` : 'unknown';
  const paramsType = handler.paramsSchema ? `${capitalize(handler.name)}Params` : 'Record<string, string>';
  const queryType = handler.querySchema ? `${capitalize(handler.name)}Query` : 'Record<string, string | string[]>';
  
  lines.push(`export type ${capitalize(handler.name)}Handler = Handler<`);
  lines.push(`  ${inputType},`);
  lines.push(`  ${outputType},`);
  lines.push(`  ${paramsType},`);
  lines.push(`  ${queryType},`);
  lines.push(`  GCTX & LCTX`);
  lines.push('>;');
  
  return lines.join('\n');
}

/**
 * Convert GType to TypeScript type string
 */
function gtypeToTypeScript(schema: GType): string {
  switch (schema.type) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    case 'object': {
      const props: string[] = [];
      for (const [key, prop] of Object.entries(schema.properties || {})) {
        const optional = !prop.required ? '?' : '';
        props.push(`${key}${optional}: ${gtypeToTypeScript(prop.type)}`);
      }
      return `{ ${props.join('; ')} }`;
    }
    case 'array':
      return `${gtypeToTypeScript(schema.items)}[]`;
    case 'union':
      return schema.anyOf.map(gtypeToTypeScript).join(' | ');
    case 'literal':
      return typeof schema.value === 'string' ? `'${schema.value}'` : String(schema.value);
    default:
      return 'unknown';
  }
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
