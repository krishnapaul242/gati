import type { SchemaDiff, SchemaChange } from '../../../runtime/src/timescape/diff-engine.js';
import type { TSV } from '../../../runtime/src/timescape/types.js';

export interface TransformerGenerationOptions {
    includeComments?: boolean;
    includeTypeImports?: boolean;
    targetVersion?: 'es2020' | 'es2022';
}

export interface GeneratedTransformer {
    code: string;
    filename: string;
    fromVersion: TSV;
    toVersion: TSV;
}

/**
 * Generate transformer stub code from schema diff
 */
export class TransformerGenerator {
    /**
     * Generate transformer pair from schema diff
     */
    public generate(
        fromVersion: TSV,
        toVersion: TSV,
        diff: SchemaDiff,
        options: TransformerGenerationOptions = {}
    ): GeneratedTransformer {
        const opts = {
            includeComments: true,
            includeTypeImports: true,
            targetVersion: 'es2022' as const,
            ...options,
        };

        const code = this.generateCode(fromVersion, toVersion, diff, opts);
        const filename = this.generateFilename(fromVersion, toVersion);

        return {
            code,
            filename,
            fromVersion,
            toVersion,
        };
    }

    /**
     * Generate transformer code
     */
    private generateCode(
        fromVersion: TSV,
        toVersion: TSV,
        diff: SchemaDiff,
        options: Required<TransformerGenerationOptions>
    ): string {
        const lines: string[] = [];

        // Header comment
        if (options.includeComments) {
            lines.push('/**');
            lines.push(` * Auto-generated transformer: ${fromVersion} ↔ ${toVersion}`);
            lines.push(` * Generated: ${new Date().toISOString()}`);
            lines.push(` * `);
            lines.push(` * Summary: ${diff.summary}`);
            lines.push(` * Breaking changes: ${diff.breaking.length}`);
            lines.push(` * Non-breaking changes: ${diff.nonBreaking.length}`);
            lines.push(` * `);
            lines.push(` * ⚠️  This transformer is IMMUTABLE once deployed.`);
            lines.push(` * ⚠️  Do not modify after it has been used in production.`);
            lines.push(` */`);
            lines.push('');
        }

        // Imports
        if (options.includeTypeImports) {
            lines.push("import { createTransformerPair } from '@gati-framework/runtime';");
            lines.push("import type { TSV } from '@gati-framework/runtime';");
            lines.push('');
        }

        // Version constants
        lines.push(`const FROM_VERSION: TSV = '${fromVersion}';`);
        lines.push(`const TO_VERSION: TSV = '${toVersion}';`);
        lines.push('');

        // Forward transformer
        lines.push('/**');
        lines.push(` * Forward transformation: ${fromVersion} → ${toVersion}`);
        lines.push(' */');
        lines.push('function transformRequestForward(data: any): any {');
        lines.push('  // TODO: Implement forward request transformation');
        lines.push('  const result = { ...data };');
        lines.push('');

        // Add TODOs for breaking changes
        for (const change of diff.breaking) {
            lines.push(`  // TODO: ${change.description}`);
            lines.push(`  // Path: ${change.path}`);
            if (change.operation === 'add') {
                lines.push(`  // Action: Add required field`);
                lines.push(`  // result.${this.getFieldName(change.path)} = /* provide value */;`);
            } else if (change.operation === 'remove') {
                lines.push(`  // Action: Remove field`);
                lines.push(`  // delete result.${this.getFieldName(change.path)};`);
            } else if (change.operation === 'modify') {
                lines.push(`  // Action: Transform field`);
                lines.push(
                    `  // result.${this.getFieldName(change.path)} = /* transform from ${change.oldValue} to ${change.newValue} */;`
                );
            }
            lines.push('');
        }

        lines.push('  return result;');
        lines.push('}');
        lines.push('');

        lines.push('function transformResponseForward(data: any): any {');
        lines.push('  // TODO: Implement forward response transformation');
        lines.push('  const result = { ...data };');
        lines.push('');

        // Add TODOs for response changes
        for (const change of diff.breaking.filter((c) => c.path.includes('/response/'))) {
            lines.push(`  // TODO: ${change.description}`);
        }

        lines.push('  return result;');
        lines.push('}');
        lines.push('');

        // Backward transformer
        lines.push('/**');
        lines.push(` * Backward transformation: ${toVersion} → ${fromVersion}`);
        lines.push(' */');
        lines.push('function transformRequestBackward(data: any): any {');
        lines.push('  // TODO: Implement backward request transformation');
        lines.push('  const result = { ...data };');
        lines.push('');

        // Reverse the changes for backward
        for (const change of diff.breaking) {
            if (change.operation === 'add') {
                lines.push(`  // TODO: Remove field added in forward transformation`);
                lines.push(`  // delete result.${this.getFieldName(change.path)};`);
            } else if (change.operation === 'remove') {
                lines.push(`  // TODO: Restore field removed in forward transformation`);
                lines.push(`  // result.${this.getFieldName(change.path)} = /* restore value */;`);
            }
            lines.push('');
        }

        lines.push('  return result;');
        lines.push('}');
        lines.push('');

        lines.push('function transformResponseBackward(data: any): any {');
        lines.push('  // TODO: Implement backward response transformation');
        lines.push('  const result = { ...data };');
        lines.push('  return result;');
        lines.push('}');
        lines.push('');

        // Export transformer pair
        lines.push('/**');
        lines.push(' * Transformer pair (IMMUTABLE)');
        lines.push(' */');
        lines.push('export const transformer = createTransformerPair(');
        lines.push('  FROM_VERSION,');
        lines.push('  TO_VERSION,');
        lines.push('  {');
        lines.push('    transformRequest: transformRequestForward,');
        lines.push('    transformResponse: transformResponseForward,');
        lines.push('  },');
        lines.push('  {');
        lines.push('    transformRequest: transformRequestBackward,');
        lines.push('    transformResponse: transformResponseBackward,');
        lines.push('  },');
        lines.push("  'auto-generated'");
        lines.push(');');
        lines.push('');

        // Export default
        lines.push('export default transformer;');

        return lines.join('\n');
    }

    /**
     * Generate filename for transformer
     */
    private generateFilename(fromVersion: TSV, toVersion: TSV): string {
        // Extract version identifiers
        const fromId = this.extractVersionId(fromVersion);
        const toId = this.extractVersionId(toVersion);

        return `transformer-${fromId}-to-${toId}.ts`;
    }

    /**
     * Extract version identifier from TSV
     */
    private extractVersionId(tsv: TSV): string {
        // tsv:1732186200-users-001 -> 1732186200-users-001
        return tsv.replace('tsv:', '').replace(/:/g, '-');
    }

    /**
     * Extract field name from path
     */
    private getFieldName(path: string): string {
        const parts = path.split('/').filter(Boolean);
        return parts[parts.length - 1] || 'field';
    }

    /**
     * Generate multiple transformers from a series of diffs
     */
    public generateMultiple(
        versions: Array<{ version: TSV; diff: SchemaDiff }>,
        options: TransformerGenerationOptions = {}
    ): GeneratedTransformer[] {
        const transformers: GeneratedTransformer[] = [];

        for (let i = 0; i < versions.length - 1; i++) {
            const from = versions[i].version;
            const to = versions[i + 1].version;
            const diff = versions[i + 1].diff;

            transformers.push(this.generate(from, to, diff, options));
        }

        return transformers;
    }

    /**
     * Generate index file for all transformers
     */
    public generateIndex(transformers: GeneratedTransformer[]): string {
        const lines: string[] = [];

        lines.push('/**');
        lines.push(' * Auto-generated transformer index');
        lines.push(` * Generated: ${new Date().toISOString()}`);
        lines.push(' */');
        lines.push('');

        // Import all transformers
        for (const transformer of transformers) {
            const name = transformer.filename.replace('.ts', '');
            const varName = this.toVariableName(name);
            lines.push(`import ${varName} from './${name}.js';`);
        }

        lines.push('');
        lines.push('export const transformers = [');
        for (const transformer of transformers) {
            const name = transformer.filename.replace('.ts', '');
            const varName = this.toVariableName(name);
            lines.push(`  ${varName},`);
        }
        lines.push('];');
        lines.push('');

        lines.push('export default transformers;');

        return lines.join('\n');
    }

    /**
     * Convert filename to valid variable name
     */
    private toVariableName(filename: string): string {
        return filename.replace(/[^a-zA-Z0-9]/g, '_');
    }
}

/**
 * Create transformer generator instance
 */
export function createTransformerGenerator(): TransformerGenerator {
    return new TransformerGenerator();
}
