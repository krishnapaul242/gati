export function generateTypes(schema) {
    let declarations = `// Auto-generated types - DO NOT EDIT\n\n`;
    if (schema.state) {
        declarations += `declare module '@gati-framework/runtime' {\n`;
        declarations += `  interface LocalContextState {\n`;
        for (const [key, type] of Object.entries(schema.state)) {
            const tsType = mapSchemaType(type);
            declarations += `    ${key}: ${tsType};\n`;
        }
        declarations += `  }\n}\n\n`;
    }
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
function mapSchemaType(schemaType) {
    switch (schemaType) {
        case 'string': return 'string';
        case 'number': return 'number';
        case 'boolean': return 'boolean';
        case 'array': return 'unknown[]';
        case 'object': return 'Record<string, unknown>';
        default: return 'unknown';
    }
}
