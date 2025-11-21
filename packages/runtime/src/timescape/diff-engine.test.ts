import { describe, it, expect, beforeEach } from 'vitest';
import { DiffEngine } from './diff-engine.js';
import type { HandlerSchema, FieldSchema, SchemaDiff } from './diff-engine.js';

describe('DiffEngine', () => {
    let engine: DiffEngine;

    beforeEach(() => {
        engine = new DiffEngine();
    });

    describe('Schema Diffing', () => {
        it('should detect no changes when schemas are identical', () => {
            const schema: HandlerSchema = {
                request: {
                    body: {
                        name: { type: 'string', required: true },
                        age: { type: 'number', required: false },
                    },
                },
                response: {
                    body: {
                        id: { type: 'string', required: true },
                        name: { type: 'string', required: true },
                    },
                },
            };

            const diff = engine.diffSchemas(schema, schema);

            expect(diff.breaking).toHaveLength(0);
            expect(diff.nonBreaking).toHaveLength(0);
            expect(diff.requiresTransformer).toBe(false);
            expect(diff.summary).toBe('No changes detected');
        });

        it('should cache diff results', () => {
            const oldSchema: HandlerSchema = {
                request: { body: { name: { type: 'string' } } },
            };
            const newSchema: HandlerSchema = {
                request: { body: { name: { type: 'number' } } },
            };

            const diff1 = engine.diffSchemas(oldSchema, newSchema);
            const diff2 = engine.diffSchemas(oldSchema, newSchema);

            expect(diff1).toBe(diff2); // Same object reference (cached)
            expect(engine.getCacheStats().size).toBe(1);
        });
    });

    describe('Request Schema Changes', () => {
        describe('Adding Fields', () => {
            it('should detect adding required field as breaking', () => {
                const oldSchema: HandlerSchema = {
                    request: {
                        body: {
                            name: { type: 'string', required: true },
                        },
                    },
                };

                const newSchema: HandlerSchema = {
                    request: {
                        body: {
                            name: { type: 'string', required: true },
                            email: { type: 'string', required: true },
                        },
                    },
                };

                const diff = engine.diffSchemas(oldSchema, newSchema);

                expect(diff.breaking).toHaveLength(1);
                expect(diff.breaking[0].operation).toBe('add');
                expect(diff.breaking[0].path).toBe('/request/body/email');
                expect(diff.breaking[0].description).toContain('Required request field');
                expect(diff.requiresTransformer).toBe(true);
            });

            it('should detect adding optional field as non-breaking', () => {
                const oldSchema: HandlerSchema = {
                    request: {
                        body: {
                            name: { type: 'string', required: true },
                        },
                    },
                };

                const newSchema: HandlerSchema = {
                    request: {
                        body: {
                            name: { type: 'string', required: true },
                            email: { type: 'string', required: false },
                        },
                    },
                };

                const diff = engine.diffSchemas(oldSchema, newSchema);

                expect(diff.breaking).toHaveLength(0);
                expect(diff.nonBreaking).toHaveLength(1);
                expect(diff.nonBreaking[0].operation).toBe('add');
                expect(diff.nonBreaking[0].description).toContain('Optional request field');
                expect(diff.requiresTransformer).toBe(false);
            });
        });

        describe('Removing Fields', () => {
            it('should detect removing required field as non-breaking for request', () => {
                const oldSchema: HandlerSchema = {
                    request: {
                        body: {
                            name: { type: 'string', required: true },
                            email: { type: 'string', required: true },
                        },
                    },
                };

                const newSchema: HandlerSchema = {
                    request: {
                        body: {
                            name: { type: 'string', required: true },
                        },
                    },
                };

                const diff = engine.diffSchemas(oldSchema, newSchema);

                expect(diff.breaking).toHaveLength(0);
                expect(diff.nonBreaking).toHaveLength(1);
                expect(diff.nonBreaking[0].operation).toBe('remove');
            });
        });

        describe('Type Changes', () => {
            it('should detect type change as breaking', () => {
                const oldSchema: HandlerSchema = {
                    request: {
                        body: {
                            price: { type: 'string', required: true },
                        },
                    },
                };

                const newSchema: HandlerSchema = {
                    request: {
                        body: {
                            price: { type: 'number', required: true },
                        },
                    },
                };

                const diff = engine.diffSchemas(oldSchema, newSchema);

                expect(diff.breaking).toHaveLength(1);
                expect(diff.breaking[0].operation).toBe('modify');
                expect(diff.breaking[0].description).toContain('type changed from string to number');
                expect(diff.requiresTransformer).toBe(true);
            });
        });

        describe('Required Flag Changes', () => {
            it('should detect making field required as breaking', () => {
                const oldSchema: HandlerSchema = {
                    request: {
                        body: {
                            email: { type: 'string', required: false },
                        },
                    },
                };

                const newSchema: HandlerSchema = {
                    request: {
                        body: {
                            email: { type: 'string', required: true },
                        },
                    },
                };

                const diff = engine.diffSchemas(oldSchema, newSchema);

                expect(diff.breaking).toHaveLength(1);
                expect(diff.breaking[0].description).toContain('is now required');
            });

            it('should detect making field optional as non-breaking', () => {
                const oldSchema: HandlerSchema = {
                    request: {
                        body: {
                            email: { type: 'string', required: true },
                        },
                    },
                };

                const newSchema: HandlerSchema = {
                    request: {
                        body: {
                            email: { type: 'string', required: false },
                        },
                    },
                };

                const diff = engine.diffSchemas(oldSchema, newSchema);

                expect(diff.breaking).toHaveLength(0);
                expect(diff.nonBreaking).toHaveLength(1);
            });
        });

        describe('Nullable Flag Changes', () => {
            it('should detect making field nullable as non-breaking', () => {
                const oldSchema: HandlerSchema = {
                    request: {
                        body: {
                            name: { type: 'string', nullable: false },
                        },
                    },
                };

                const newSchema: HandlerSchema = {
                    request: {
                        body: {
                            name: { type: 'string', nullable: true },
                        },
                    },
                };

                const diff = engine.diffSchemas(oldSchema, newSchema);

                expect(diff.breaking).toHaveLength(0);
                expect(diff.nonBreaking).toHaveLength(1);
                expect(diff.nonBreaking[0].description).toContain('is now nullable');
            });

            it('should detect making field non-nullable as breaking', () => {
                const oldSchema: HandlerSchema = {
                    request: {
                        body: {
                            name: { type: 'string', nullable: true },
                        },
                    },
                };

                const newSchema: HandlerSchema = {
                    request: {
                        body: {
                            name: { type: 'string', nullable: false },
                        },
                    },
                };

                const diff = engine.diffSchemas(oldSchema, newSchema);

                expect(diff.breaking).toHaveLength(1);
                expect(diff.breaking[0].description).toContain('is no longer nullable');
            });
        });
    });

    describe('Response Schema Changes', () => {
        describe('Adding Fields', () => {
            it('should detect adding optional field as non-breaking', () => {
                const oldSchema: HandlerSchema = {
                    response: {
                        body: {
                            id: { type: 'string', required: true },
                        },
                    },
                };

                const newSchema: HandlerSchema = {
                    response: {
                        body: {
                            id: { type: 'string', required: true },
                            createdAt: { type: 'string', required: false },
                        },
                    },
                };

                const diff = engine.diffSchemas(oldSchema, newSchema);

                expect(diff.breaking).toHaveLength(0);
                expect(diff.nonBreaking).toHaveLength(1);
                expect(diff.nonBreaking[0].operation).toBe('add');
            });
        });

        describe('Removing Fields', () => {
            it('should detect removing required field as breaking', () => {
                const oldSchema: HandlerSchema = {
                    response: {
                        body: {
                            id: { type: 'string', required: true },
                            name: { type: 'string', required: true },
                        },
                    },
                };

                const newSchema: HandlerSchema = {
                    response: {
                        body: {
                            id: { type: 'string', required: true },
                        },
                    },
                };

                const diff = engine.diffSchemas(oldSchema, newSchema);

                expect(diff.breaking).toHaveLength(1);
                expect(diff.breaking[0].operation).toBe('remove');
                expect(diff.breaking[0].description).toContain('Required response field');
            });

            it('should detect removing optional field as non-breaking', () => {
                const oldSchema: HandlerSchema = {
                    response: {
                        body: {
                            id: { type: 'string', required: true },
                            metadata: { type: 'object', required: false },
                        },
                    },
                };

                const newSchema: HandlerSchema = {
                    response: {
                        body: {
                            id: { type: 'string', required: true },
                        },
                    },
                };

                const diff = engine.diffSchemas(oldSchema, newSchema);

                expect(diff.breaking).toHaveLength(0);
                expect(diff.nonBreaking).toHaveLength(1);
            });
        });

        describe('Status Code Changes', () => {
            it('should detect status code change as breaking', () => {
                const oldSchema: HandlerSchema = {
                    response: {
                        status: 200,
                        body: {},
                    },
                };

                const newSchema: HandlerSchema = {
                    response: {
                        status: 201,
                        body: {},
                    },
                };

                const diff = engine.diffSchemas(oldSchema, newSchema);

                expect(diff.breaking).toHaveLength(1);
                expect(diff.breaking[0].description).toContain('Response status changed from 200 to 201');
            });
        });
    });

    describe('Nested Object Changes', () => {
        it('should detect changes in nested objects', () => {
            const oldSchema: HandlerSchema = {
                request: {
                    body: {
                        user: {
                            type: 'object',
                            required: true,
                            properties: {
                                name: { type: 'string', required: true },
                                age: { type: 'number', required: false },
                            },
                        },
                    },
                },
            };

            const newSchema: HandlerSchema = {
                request: {
                    body: {
                        user: {
                            type: 'object',
                            required: true,
                            properties: {
                                name: { type: 'string', required: true },
                                age: { type: 'number', required: false },
                                email: { type: 'string', required: true },
                            },
                        },
                    },
                },
            };

            const diff = engine.diffSchemas(oldSchema, newSchema);

            expect(diff.breaking).toHaveLength(1);
            expect(diff.breaking[0].path).toBe('/request/body/user/properties/email');
        });

        it('should detect deeply nested changes', () => {
            const oldSchema: HandlerSchema = {
                response: {
                    body: {
                        data: {
                            type: 'object',
                            properties: {
                                user: {
                                    type: 'object',
                                    properties: {
                                        profile: {
                                            type: 'object',
                                            properties: {
                                                bio: { type: 'string', required: true },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            };

            const newSchema: HandlerSchema = {
                response: {
                    body: {
                        data: {
                            type: 'object',
                            properties: {
                                user: {
                                    type: 'object',
                                    properties: {
                                        profile: {
                                            type: 'object',
                                            properties: {
                                                bio: { type: 'string', required: false },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            };

            const diff = engine.diffSchemas(oldSchema, newSchema);

            expect(diff.breaking).toHaveLength(1);
            expect(diff.breaking[0].path).toContain('/data/properties/user/properties/profile/properties/bio');
        });
    });

    describe('Array Changes', () => {
        it('should detect changes in array item types', () => {
            const oldSchema: HandlerSchema = {
                response: {
                    body: {
                        items: {
                            type: 'array',
                            items: { type: 'string' },
                        },
                    },
                },
            };

            const newSchema: HandlerSchema = {
                response: {
                    body: {
                        items: {
                            type: 'array',
                            items: { type: 'number' },
                        },
                    },
                },
            };

            const diff = engine.diffSchemas(oldSchema, newSchema);

            expect(diff.breaking).toHaveLength(1);
            expect(diff.breaking[0].description).toContain('type changed from string to number');
        });
    });

    describe('Multiple Changes', () => {
        it('should detect multiple breaking and non-breaking changes', () => {
            const oldSchema: HandlerSchema = {
                request: {
                    body: {
                        name: { type: 'string', required: true },
                        age: { type: 'number', required: false },
                    },
                },
                response: {
                    body: {
                        id: { type: 'string', required: true },
                        status: { type: 'string', required: true },
                    },
                },
            };

            const newSchema: HandlerSchema = {
                request: {
                    body: {
                        name: { type: 'string', required: true },
                        age: { type: 'number', required: true }, // Now required (breaking)
                        email: { type: 'string', required: false }, // Added optional (non-breaking)
                    },
                },
                response: {
                    body: {
                        id: { type: 'string', required: true },
                        // status removed (breaking)
                        createdAt: { type: 'string', required: false }, // Added optional (non-breaking)
                    },
                },
            };

            const diff = engine.diffSchemas(oldSchema, newSchema);

            expect(diff.breaking).toHaveLength(2);
            expect(diff.nonBreaking).toHaveLength(2);
            expect(diff.requiresTransformer).toBe(true);
            expect(diff.summary).toBe('2 breaking changes, 2 non-breaking changes');
        });
    });

    describe('Summary Generation', () => {
        it('should generate correct summary for no changes', () => {
            const schema: HandlerSchema = { request: { body: {} } };
            const diff = engine.diffSchemas(schema, schema);
            expect(diff.summary).toBe('No changes detected');
        });

        it('should generate correct summary for only breaking changes', () => {
            const oldSchema: HandlerSchema = {
                request: { body: { name: { type: 'string' } } },
            };
            const newSchema: HandlerSchema = {
                request: { body: { name: { type: 'number' } } },
            };
            const diff = engine.diffSchemas(oldSchema, newSchema);
            expect(diff.summary).toBe('1 breaking change');
        });

        it('should generate correct summary for only non-breaking changes', () => {
            const oldSchema: HandlerSchema = {
                request: { body: { name: { type: 'string' } } },
            };
            const newSchema: HandlerSchema = {
                request: { body: { name: { type: 'string' }, age: { type: 'number', required: false } } },
            };
            const diff = engine.diffSchemas(oldSchema, newSchema);
            expect(diff.summary).toBe('1 non-breaking change');
        });

        it('should use plural form for multiple changes', () => {
            const oldSchema: HandlerSchema = {
                request: { body: { a: { type: 'string' }, b: { type: 'string' } } },
            };
            const newSchema: HandlerSchema = {
                request: { body: { a: { type: 'number' }, b: { type: 'number' } } },
            };
            const diff = engine.diffSchemas(oldSchema, newSchema);
            expect(diff.summary).toBe('2 breaking changes');
        });
    });

    describe('Object Diff', () => {
        it('should detect primitive changes', () => {
            const ops = engine.diff('hello', 'world');
            expect(ops).toHaveLength(1);
            expect(ops[0].op).toBe('replace');
            expect(ops[0].value).toBe('world');
            expect(ops[0].oldValue).toBe('hello');
        });

        it('should detect object property additions', () => {
            const ops = engine.diff({ a: 1 }, { a: 1, b: 2 });
            expect(ops).toHaveLength(1);
            expect(ops[0].op).toBe('add');
            expect(ops[0].path).toBe('/b');
            expect(ops[0].value).toBe(2);
        });

        it('should detect object property removals', () => {
            const ops = engine.diff({ a: 1, b: 2 }, { a: 1 });
            expect(ops).toHaveLength(1);
            expect(ops[0].op).toBe('remove');
            expect(ops[0].path).toBe('/b');
            expect(ops[0].oldValue).toBe(2);
        });

        it('should detect array additions', () => {
            const ops = engine.diff([1, 2], [1, 2, 3]);
            expect(ops).toHaveLength(1);
            expect(ops[0].op).toBe('add');
            expect(ops[0].path).toBe('/2');
            expect(ops[0].value).toBe(3);
        });

        it('should detect array removals', () => {
            const ops = engine.diff([1, 2, 3], [1, 2]);
            expect(ops).toHaveLength(1);
            expect(ops[0].op).toBe('remove');
            expect(ops[0].path).toBe('/2');
            expect(ops[0].oldValue).toBe(3);
        });
    });

    describe('Hashing', () => {
        it('should generate consistent hashes', () => {
            const obj = { name: 'test', value: 123 };
            const hash1 = engine.hash(obj);
            const hash2 = engine.hash(obj);
            expect(hash1).toBe(hash2);
        });

        it('should generate different hashes for different objects', () => {
            const hash1 = engine.hash({ name: 'test' });
            const hash2 = engine.hash({ name: 'other' });
            expect(hash1).not.toBe(hash2);
        });

        it('should hash strings', () => {
            const hash = engine.hash('hello world');
            expect(hash).toBeTruthy();
            expect(hash).toHaveLength(64); // SHA-256 produces 64 hex characters
        });
    });

    describe('Cache Management', () => {
        it('should clear cache', () => {
            const oldSchema: HandlerSchema = { request: { body: {} } };
            const newSchema: HandlerSchema = { response: { body: {} } };

            engine.diffSchemas(oldSchema, newSchema);
            expect(engine.getCacheStats().size).toBe(1);

            engine.clearCache();
            expect(engine.getCacheStats().size).toBe(0);
        });

        it('should respect max cache size', () => {
            // Create 101 different diffs (max is 100)
            for (let i = 0; i < 101; i++) {
                const oldSchema: HandlerSchema = {
                    request: { body: { [`field${i}`]: { type: 'string' } } },
                };
                const newSchema: HandlerSchema = {
                    request: { body: { [`field${i}`]: { type: 'number' } } },
                };
                engine.diffSchemas(oldSchema, newSchema);
            }

            const stats = engine.getCacheStats();
            expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
        });
    });
});
