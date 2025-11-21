import { createHash } from 'crypto';

export interface DiffOperation {
    op: 'add' | 'remove' | 'replace';
    path: string;
    value?: unknown;
    oldValue?: unknown;
}

export type ChangeType = 'breaking' | 'non-breaking';

export interface SchemaChange {
    type: ChangeType;
    operation: 'add' | 'remove' | 'modify';
    path: string;
    description: string;
    oldValue?: unknown;
    newValue?: unknown;
}

export interface SchemaDiff {
    breaking: SchemaChange[];
    nonBreaking: SchemaChange[];
    requiresTransformer: boolean;
    summary: string;
    hash: string;
}

export interface HandlerSchema {
    request?: {
        params?: Record<string, FieldSchema>;
        query?: Record<string, FieldSchema>;
        body?: Record<string, FieldSchema>;
        headers?: Record<string, FieldSchema>;
    };
    response?: {
        status?: number;
        body?: Record<string, FieldSchema>;
        headers?: Record<string, FieldSchema>;
    };
}

export interface FieldSchema {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'undefined';
    required?: boolean;
    nullable?: boolean;
    items?: FieldSchema; // For arrays
    properties?: Record<string, FieldSchema>; // For objects
    enum?: unknown[];
    default?: unknown;
}

export class DiffEngine {
    private diffCache: Map<string, SchemaDiff> = new Map();
    private readonly maxCacheSize = 100;

    /**
     * Compare two handler schemas and detect breaking changes
     */
    public diffSchemas(oldSchema: HandlerSchema, newSchema: HandlerSchema): SchemaDiff {
        const cacheKey = this.hash(oldSchema) + ':' + this.hash(newSchema);
        
        if (this.diffCache.has(cacheKey)) {
            return this.diffCache.get(cacheKey)!;
        }

        const breaking: SchemaChange[] = [];
        const nonBreaking: SchemaChange[] = [];

        // Compare request schemas
        this.compareRequest(oldSchema.request, newSchema.request, breaking, nonBreaking);

        // Compare response schemas
        this.compareResponse(oldSchema.response, newSchema.response, breaking, nonBreaking);

        const requiresTransformer = breaking.length > 0;
        const summary = this.generateSummary(breaking, nonBreaking);

        const diff: SchemaDiff = {
            breaking,
            nonBreaking,
            requiresTransformer,
            summary,
            hash: cacheKey,
        };

        this.cacheDiff(cacheKey, diff);
        return diff;
    }

    /**
     * Compare request schemas
     */
    private compareRequest(
        oldReq: HandlerSchema['request'],
        newReq: HandlerSchema['request'],
        breaking: SchemaChange[],
        nonBreaking: SchemaChange[]
    ): void {
        if (!oldReq && !newReq) return;

        // Compare params
        this.compareFields(
            oldReq?.params || {},
            newReq?.params || {},
            '/request/params',
            breaking,
            nonBreaking,
            'request'
        );

        // Compare query
        this.compareFields(
            oldReq?.query || {},
            newReq?.query || {},
            '/request/query',
            breaking,
            nonBreaking,
            'request'
        );

        // Compare body
        this.compareFields(
            oldReq?.body || {},
            newReq?.body || {},
            '/request/body',
            breaking,
            nonBreaking,
            'request'
        );

        // Compare headers
        this.compareFields(
            oldReq?.headers || {},
            newReq?.headers || {},
            '/request/headers',
            breaking,
            nonBreaking,
            'request'
        );
    }

    /**
     * Compare response schemas
     */
    private compareResponse(
        oldRes: HandlerSchema['response'],
        newRes: HandlerSchema['response'],
        breaking: SchemaChange[],
        nonBreaking: SchemaChange[]
    ): void {
        if (!oldRes && !newRes) return;

        // Status code change
        if (oldRes?.status !== newRes?.status) {
            if (oldRes?.status && newRes?.status) {
                breaking.push({
                    type: 'breaking',
                    operation: 'modify',
                    path: '/response/status',
                    description: `Response status changed from ${oldRes.status} to ${newRes.status}`,
                    oldValue: oldRes.status,
                    newValue: newRes.status,
                });
            }
        }

        // Compare body
        this.compareFields(
            oldRes?.body || {},
            newRes?.body || {},
            '/response/body',
            breaking,
            nonBreaking,
            'response'
        );

        // Compare headers
        this.compareFields(
            oldRes?.headers || {},
            newRes?.headers || {},
            '/response/headers',
            breaking,
            nonBreaking,
            'response'
        );
    }

    /**
     * Compare field schemas
     */
    private compareFields(
        oldFields: Record<string, FieldSchema>,
        newFields: Record<string, FieldSchema>,
        basePath: string,
        breaking: SchemaChange[],
        nonBreaking: SchemaChange[],
        context: 'request' | 'response'
    ): void {
        const oldKeys = Object.keys(oldFields);
        const newKeys = Object.keys(newFields);
        const allKeys = new Set([...oldKeys, ...newKeys]);

        for (const key of allKeys) {
            const path = `${basePath}/${key}`;
            const oldField = oldFields[key];
            const newField = newFields[key];

            if (!oldField && newField) {
                // Field added
                if (context === 'request' && newField.required) {
                    breaking.push({
                        type: 'breaking',
                        operation: 'add',
                        path,
                        description: `Required ${context} field '${key}' added`,
                        newValue: newField,
                    });
                } else {
                    nonBreaking.push({
                        type: 'non-breaking',
                        operation: 'add',
                        path,
                        description: `Optional ${context} field '${key}' added`,
                        newValue: newField,
                    });
                }
            } else if (oldField && !newField) {
                // Field removed
                if (context === 'response' && oldField.required) {
                    breaking.push({
                        type: 'breaking',
                        operation: 'remove',
                        path,
                        description: `Required ${context} field '${key}' removed`,
                        oldValue: oldField,
                    });
                } else {
                    nonBreaking.push({
                        type: 'non-breaking',
                        operation: 'remove',
                        path,
                        description: `Optional ${context} field '${key}' removed`,
                        oldValue: oldField,
                    });
                }
            } else if (oldField && newField) {
                // Field modified
                this.compareField(oldField, newField, path, key, breaking, nonBreaking, context);
            }
        }
    }

    /**
     * Compare individual field schemas
     */
    private compareField(
        oldField: FieldSchema,
        newField: FieldSchema,
        path: string,
        fieldName: string,
        breaking: SchemaChange[],
        nonBreaking: SchemaChange[],
        context: 'request' | 'response'
    ): void {
        // Type change
        if (oldField.type !== newField.type) {
            breaking.push({
                type: 'breaking',
                operation: 'modify',
                path,
                description: `Field '${fieldName}' type changed from ${oldField.type} to ${newField.type}`,
                oldValue: oldField.type,
                newValue: newField.type,
            });
        }

        // Required flag change
        if (oldField.required !== newField.required) {
            if (context === 'request' && !oldField.required && newField.required) {
                breaking.push({
                    type: 'breaking',
                    operation: 'modify',
                    path,
                    description: `Field '${fieldName}' is now required`,
                    oldValue: oldField.required,
                    newValue: newField.required,
                });
            } else if (context === 'response' && oldField.required && !newField.required) {
                breaking.push({
                    type: 'breaking',
                    operation: 'modify',
                    path,
                    description: `Field '${fieldName}' is no longer required`,
                    oldValue: oldField.required,
                    newValue: newField.required,
                });
            } else {
                nonBreaking.push({
                    type: 'non-breaking',
                    operation: 'modify',
                    path,
                    description: `Field '${fieldName}' required flag changed`,
                    oldValue: oldField.required,
                    newValue: newField.required,
                });
            }
        }

        // Nullable flag change
        if (oldField.nullable !== newField.nullable) {
            if (!oldField.nullable && newField.nullable) {
                nonBreaking.push({
                    type: 'non-breaking',
                    operation: 'modify',
                    path,
                    description: `Field '${fieldName}' is now nullable`,
                    oldValue: oldField.nullable,
                    newValue: newField.nullable,
                });
            } else {
                breaking.push({
                    type: 'breaking',
                    operation: 'modify',
                    path,
                    description: `Field '${fieldName}' is no longer nullable`,
                    oldValue: oldField.nullable,
                    newValue: newField.nullable,
                });
            }
        }

        // Nested object comparison
        if (oldField.type === 'object' && newField.type === 'object') {
            if (oldField.properties && newField.properties) {
                this.compareFields(
                    oldField.properties,
                    newField.properties,
                    `${path}/properties`,
                    breaking,
                    nonBreaking,
                    context
                );
            }
        }

        // Array items comparison
        if (oldField.type === 'array' && newField.type === 'array') {
            if (oldField.items && newField.items) {
                this.compareField(
                    oldField.items,
                    newField.items,
                    `${path}/items`,
                    `${fieldName}[]`,
                    breaking,
                    nonBreaking,
                    context
                );
            }
        }
    }

    /**
     * Generate human-readable summary
     */
    private generateSummary(breaking: SchemaChange[], nonBreaking: SchemaChange[]): string {
        const parts: string[] = [];

        if (breaking.length > 0) {
            parts.push(`${breaking.length} breaking change${breaking.length > 1 ? 's' : ''}`);
        }

        if (nonBreaking.length > 0) {
            parts.push(`${nonBreaking.length} non-breaking change${nonBreaking.length > 1 ? 's' : ''}`);
        }

        if (parts.length === 0) {
            return 'No changes detected';
        }

        return parts.join(', ');
    }

    /**
     * Calculates the structural difference between two objects.
     * Returns a list of operations to transform obj1 into obj2.
     */
    public diff(obj1: unknown, obj2: unknown, path: string = ''): DiffOperation[] {
        const ops: DiffOperation[] = [];

        // Handle primitives
        if (obj1 === obj2) return ops;

        if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
            ops.push({ op: 'replace', path, value: obj2, oldValue: obj1 });
            return ops;
        }

        // Handle Arrays
        if (Array.isArray(obj1) && Array.isArray(obj2)) {
            const len = Math.max(obj1.length, obj2.length);
            for (let i = 0; i < len; i++) {
                const currentPath = `${path}/${i}`;
                if (i >= obj1.length) {
                    ops.push({ op: 'add', path: currentPath, value: obj2[i] });
                } else if (i >= obj2.length) {
                    ops.push({ op: 'remove', path: currentPath, oldValue: obj1[i] });
                } else {
                    ops.push(...this.diff(obj1[i], obj2[i], currentPath));
                }
            }
            return ops;
        }

        // Handle Objects
        const keys1 = Object.keys(obj1 as Record<string, unknown>);
        const keys2 = Object.keys(obj2 as Record<string, unknown>);
        const allKeys = new Set([...keys1, ...keys2]);

        for (const key of allKeys) {
            const currentPath = path ? `${path}/${key}` : `/${key}`;
            const o1 = obj1 as Record<string, unknown>;
            const o2 = obj2 as Record<string, unknown>;

            if (!Object.prototype.hasOwnProperty.call(obj1, key)) {
                ops.push({ op: 'add', path: currentPath, value: o2[key] });
            } else if (!Object.prototype.hasOwnProperty.call(obj2, key)) {
                ops.push({ op: 'remove', path: currentPath, oldValue: o1[key] });
            } else {
                ops.push(...this.diff(o1[key], o2[key], currentPath));
            }
        }

        return ops;
    }

    /**
     * Calculates a content hash for an object or string.
     * Useful for detecting if a module's code has changed.
     */
    public hash(content: unknown): string {
        const str = typeof content === 'string' ? content : JSON.stringify(content);
        return createHash('sha256').update(str).digest('hex');
    }

    /**
     * Cache a diff result
     */
    private cacheDiff(key: string, diff: SchemaDiff): void {
        if (this.diffCache.size >= this.maxCacheSize) {
            const firstKey = this.diffCache.keys().next().value;
            if (firstKey) {
                this.diffCache.delete(firstKey);
            }
        }
        this.diffCache.set(key, diff);
    }

    /**
     * Clear diff cache
     */
    public clearCache(): void {
        this.diffCache.clear();
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): { size: number; maxSize: number } {
        return {
            size: this.diffCache.size,
            maxSize: this.maxCacheSize,
        };
    }
}
