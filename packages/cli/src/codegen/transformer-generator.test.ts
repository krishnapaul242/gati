import { describe, it, expect } from 'vitest';
import { TransformerGenerator } from './transformer-generator.js';
import type { SchemaDiff } from '../../../runtime/src/timescape/diff-engine.js';
import type { TSV } from '../../../runtime/src/timescape/types.js';

describe('TransformerGenerator', () => {
    const generator = new TransformerGenerator();
    const fromVersion: TSV = 'tsv:1732186200-users-001';
    const toVersion: TSV = 'tsv:1732186300-users-002';

    describe('Basic Generation', () => {
        it('should generate transformer code', () => {
            const diff: SchemaDiff = {
                breaking: [],
                nonBreaking: [],
                requiresTransformer: false,
                summary: 'No changes',
                hash: 'abc123',
            };

            const result = generator.generate(fromVersion, toVersion, diff);

            expect(result.code).toBeTruthy();
            expect(result.filename).toBe('transformer-1732186200-users-001-to-1732186300-users-002.ts');
            expect(result.fromVersion).toBe(fromVersion);
            expect(result.toVersion).toBe(toVersion);
        });

        it('should include header comments by default', () => {
            const diff: SchemaDiff = {
                breaking: [],
                nonBreaking: [],
                requiresTransformer: false,
                summary: 'No changes',
                hash: 'abc123',
            };

            const result = generator.generate(fromVersion, toVersion, diff);

            expect(result.code).toContain('Auto-generated transformer');
            expect(result.code).toContain('IMMUTABLE');
            expect(result.code).toContain(fromVersion);
            expect(result.code).toContain(toVersion);
        });

        it('should exclude comments when option disabled', () => {
            const diff: SchemaDiff = {
                breaking: [],
                nonBreaking: [],
                requiresTransformer: false,
                summary: 'No changes',
                hash: 'abc123',
            };

            const result = generator.generate(fromVersion, toVersion, diff, {
                includeComments: false,
            });

            expect(result.code).not.toContain('Auto-generated transformer');
        });

        it('should include type imports by default', () => {
            const diff: SchemaDiff = {
                breaking: [],
                nonBreaking: [],
                requiresTransformer: false,
                summary: 'No changes',
                hash: 'abc123',
            };

            const result = generator.generate(fromVersion, toVersion, diff);

            expect(result.code).toContain("import { createTransformerPair }");
            expect(result.code).toContain("import type { TSV }");
        });
    });

    describe('Breaking Changes', () => {
        it('should generate TODOs for added required fields', () => {
            const diff: SchemaDiff = {
                breaking: [
                    {
                        type: 'breaking',
                        operation: 'add',
                        path: '/request/body/email',
                        description: 'Required request field "email" added',
                        newValue: { type: 'string', required: true },
                    },
                ],
                nonBreaking: [],
                requiresTransformer: true,
                summary: '1 breaking change',
                hash: 'abc123',
            };

            const result = generator.generate(fromVersion, toVersion, diff);

            expect(result.code).toContain('TODO: Required request field "email" added');
            expect(result.code).toContain('Path: /request/body/email');
            expect(result.code).toContain('Action: Add required field');
        });

        it('should generate TODOs for removed fields', () => {
            const diff: SchemaDiff = {
                breaking: [
                    {
                        type: 'breaking',
                        operation: 'remove',
                        path: '/response/body/status',
                        description: 'Required response field "status" removed',
                        oldValue: { type: 'string', required: true },
                    },
                ],
                nonBreaking: [],
                requiresTransformer: true,
                summary: '1 breaking change',
                hash: 'abc123',
            };

            const result = generator.generate(fromVersion, toVersion, diff);

            expect(result.code).toContain('TODO: Required response field "status" removed');
            expect(result.code).toContain('Action: Remove field');
        });

        it('should generate TODOs for type changes', () => {
            const diff: SchemaDiff = {
                breaking: [
                    {
                        type: 'breaking',
                        operation: 'modify',
                        path: '/request/body/price',
                        description: 'Field "price" type changed from string to number',
                        oldValue: 'string',
                        newValue: 'number',
                    },
                ],
                nonBreaking: [],
                requiresTransformer: true,
                summary: '1 breaking change',
                hash: 'abc123',
            };

            const result = generator.generate(fromVersion, toVersion, diff);

            expect(result.code).toContain('TODO: Field "price" type changed from string to number');
            expect(result.code).toContain('Action: Transform field');
        });

        it('should generate multiple TODOs for multiple changes', () => {
            const diff: SchemaDiff = {
                breaking: [
                    {
                        type: 'breaking',
                        operation: 'add',
                        path: '/request/body/email',
                        description: 'Required field "email" added',
                    },
                    {
                        type: 'breaking',
                        operation: 'modify',
                        path: '/request/body/age',
                        description: 'Field "age" type changed',
                    },
                ],
                nonBreaking: [],
                requiresTransformer: true,
                summary: '2 breaking changes',
                hash: 'abc123',
            };

            const result = generator.generate(fromVersion, toVersion, diff);

            expect(result.code).toContain('Required field "email" added');
            expect(result.code).toContain('Field "age" type changed');
        });
    });

    describe('Transformer Structure', () => {
        it('should generate forward request transformer', () => {
            const diff: SchemaDiff = {
                breaking: [],
                nonBreaking: [],
                requiresTransformer: false,
                summary: 'No changes',
                hash: 'abc123',
            };

            const result = generator.generate(fromVersion, toVersion, diff);

            expect(result.code).toContain('function transformRequestForward(data: any): any');
            expect(result.code).toContain('const result = { ...data }');
            expect(result.code).toContain('return result');
        });

        it('should generate forward response transformer', () => {
            const diff: SchemaDiff = {
                breaking: [],
                nonBreaking: [],
                requiresTransformer: false,
                summary: 'No changes',
                hash: 'abc123',
            };

            const result = generator.generate(fromVersion, toVersion, diff);

            expect(result.code).toContain('function transformResponseForward(data: any): any');
        });

        it('should generate backward request transformer', () => {
            const diff: SchemaDiff = {
                breaking: [],
                nonBreaking: [],
                requiresTransformer: false,
                summary: 'No changes',
                hash: 'abc123',
            };

            const result = generator.generate(fromVersion, toVersion, diff);

            expect(result.code).toContain('function transformRequestBackward(data: any): any');
        });

        it('should generate backward response transformer', () => {
            const diff: SchemaDiff = {
                breaking: [],
                nonBreaking: [],
                requiresTransformer: false,
                summary: 'No changes',
                hash: 'abc123',
            };

            const result = generator.generate(fromVersion, toVersion, diff);

            expect(result.code).toContain('function transformResponseBackward(data: any): any');
        });

        it('should export transformer pair', () => {
            const diff: SchemaDiff = {
                breaking: [],
                nonBreaking: [],
                requiresTransformer: false,
                summary: 'No changes',
                hash: 'abc123',
            };

            const result = generator.generate(fromVersion, toVersion, diff);

            expect(result.code).toContain('export const transformer = createTransformerPair');
            expect(result.code).toContain('transformRequest: transformRequestForward');
            expect(result.code).toContain('transformResponse: transformResponseForward');
            expect(result.code).toContain('transformRequest: transformRequestBackward');
            expect(result.code).toContain('transformResponse: transformResponseBackward');
            expect(result.code).toContain("'auto-generated'");
        });

        it('should export default', () => {
            const diff: SchemaDiff = {
                breaking: [],
                nonBreaking: [],
                requiresTransformer: false,
                summary: 'No changes',
                hash: 'abc123',
            };

            const result = generator.generate(fromVersion, toVersion, diff);

            expect(result.code).toContain('export default transformer');
        });
    });

    describe('Backward Transformation TODOs', () => {
        it('should generate reverse TODOs for added fields', () => {
            const diff: SchemaDiff = {
                breaking: [
                    {
                        type: 'breaking',
                        operation: 'add',
                        path: '/request/body/email',
                        description: 'Required field "email" added',
                    },
                ],
                nonBreaking: [],
                requiresTransformer: true,
                summary: '1 breaking change',
                hash: 'abc123',
            };

            const result = generator.generate(fromVersion, toVersion, diff);

            expect(result.code).toContain('Remove field added in forward transformation');
        });

        it('should generate reverse TODOs for removed fields', () => {
            const diff: SchemaDiff = {
                breaking: [
                    {
                        type: 'breaking',
                        operation: 'remove',
                        path: '/request/body/status',
                        description: 'Field "status" removed',
                    },
                ],
                nonBreaking: [],
                requiresTransformer: true,
                summary: '1 breaking change',
                hash: 'abc123',
            };

            const result = generator.generate(fromVersion, toVersion, diff);

            expect(result.code).toContain('Restore field removed in forward transformation');
        });
    });

    describe('Multiple Transformers', () => {
        it('should generate multiple transformers', () => {
            const versions = [
                {
                    version: 'tsv:1000-v1-001' as TSV,
                    diff: {
                        breaking: [],
                        nonBreaking: [],
                        requiresTransformer: false,
                        summary: 'v1',
                        hash: 'a',
                    } as SchemaDiff,
                },
                {
                    version: 'tsv:2000-v2-001' as TSV,
                    diff: {
                        breaking: [],
                        nonBreaking: [],
                        requiresTransformer: false,
                        summary: 'v2',
                        hash: 'b',
                    } as SchemaDiff,
                },
                {
                    version: 'tsv:3000-v3-001' as TSV,
                    diff: {
                        breaking: [],
                        nonBreaking: [],
                        requiresTransformer: false,
                        summary: 'v3',
                        hash: 'c',
                    } as SchemaDiff,
                },
            ];

            const results = generator.generateMultiple(versions);

            expect(results).toHaveLength(2);
            expect(results[0].fromVersion).toBe('tsv:1000-v1-001');
            expect(results[0].toVersion).toBe('tsv:2000-v2-001');
            expect(results[1].fromVersion).toBe('tsv:2000-v2-001');
            expect(results[1].toVersion).toBe('tsv:3000-v3-001');
        });
    });

    describe('Index Generation', () => {
        it('should generate index file', () => {
            const transformers = [
                {
                    code: '',
                    filename: 'transformer-1000-v1-001-to-2000-v2-001.ts',
                    fromVersion: 'tsv:1000-v1-001' as TSV,
                    toVersion: 'tsv:2000-v2-001' as TSV,
                },
                {
                    code: '',
                    filename: 'transformer-2000-v2-001-to-3000-v3-001.ts',
                    fromVersion: 'tsv:2000-v2-001' as TSV,
                    toVersion: 'tsv:3000-v3-001' as TSV,
                },
            ];

            const index = generator.generateIndex(transformers);

            expect(index).toContain('Auto-generated transformer index');
            expect(index).toContain("import transformer_1000_v1_001_to_2000_v2_001 from './transformer-1000-v1-001-to-2000-v2-001.js'");
            expect(index).toContain("import transformer_2000_v2_001_to_3000_v3_001 from './transformer-2000-v2-001-to-3000-v3-001.js'");
            expect(index).toContain('export const transformers = [');
            expect(index).toContain('transformer_1000_v1_001_to_2000_v2_001,');
            expect(index).toContain('transformer_2000_v2_001_to_3000_v3_001,');
            expect(index).toContain('export default transformers');
        });

        it('should handle empty transformer list', () => {
            const index = generator.generateIndex([]);

            expect(index).toContain('export const transformers = [');
            expect(index).toContain('];');
        });
    });

    describe('Filename Generation', () => {
        it('should generate valid filename', () => {
            const diff: SchemaDiff = {
                breaking: [],
                nonBreaking: [],
                requiresTransformer: false,
                summary: 'No changes',
                hash: 'abc123',
            };

            const result = generator.generate(
                'tsv:1732186200-users-001' as TSV,
                'tsv:1732186300-users-002' as TSV,
                diff
            );

            expect(result.filename).toBe('transformer-1732186200-users-001-to-1732186300-users-002.ts');
        });

        it('should handle colons in version', () => {
            const diff: SchemaDiff = {
                breaking: [],
                nonBreaking: [],
                requiresTransformer: false,
                summary: 'No changes',
                hash: 'abc123',
            };

            const result = generator.generate(
                'tsv:1000:test-001' as TSV,
                'tsv:2000:test-002' as TSV,
                diff
            );

            expect(result.filename).not.toContain(':');
            expect(result.filename).toContain('-');
        });
    });
});
