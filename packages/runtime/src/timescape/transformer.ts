import type { TSV } from './types.js';

/**
 * Transformer function type
 */
export type TransformFunction = (data: unknown) => unknown | Promise<unknown>;

/**
 * Transformer pair for bidirectional conversion between adjacent versions
 * Transformers are IMMUTABLE once created
 */
export interface TransformerPair {
    readonly fromVersion: TSV;
    readonly toVersion: TSV;
    readonly immutable: true;
    readonly createdAt: number;
    readonly createdBy: string;

    /**
     * Forward transformation: fromVersion → toVersion
     */
    readonly forward: {
        readonly transformRequest?: TransformFunction;
        readonly transformResponse?: TransformFunction;
    };

    /**
     * Backward transformation: toVersion → fromVersion
     */
    readonly backward: {
        readonly transformRequest?: TransformFunction;
        readonly transformResponse?: TransformFunction;
    };
}

/**
 * Transformation result
 */
export interface TransformResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: Error;
    transformedVersions: TSV[];
    chainLength?: number;
}

/**
 * Transformer chain execution options
 */
export interface ChainOptions {
    maxHops?: number;
    timeout?: number;
    fallbackOnError?: boolean;
}

/**
 * Transformer registry and execution engine
 */
export class TransformerEngine {
    private transformers: Map<string, TransformerPair> = new Map();
    private readonly maxChainLength: number;

    constructor(maxChainLength: number = 10) {
        this.maxChainLength = maxChainLength;
    }

    /**
     * Register a transformer pair (adjacent versions only)
     */
    public register(transformer: TransformerPair): void {
        // Validate immutability
        if (!transformer.immutable) {
            throw new Error('Transformer must be marked as immutable');
        }

        // Create bidirectional keys
        const forwardKey = this.makeKey(transformer.fromVersion, transformer.toVersion);
        const backwardKey = this.makeKey(transformer.toVersion, transformer.fromVersion);

        // Check if already registered (immutable - cannot override)
        if (this.transformers.has(forwardKey)) {
            throw new Error(
                `Transformer from ${transformer.fromVersion} to ${transformer.toVersion} already exists and is immutable`
            );
        }

        // Store transformer
        this.transformers.set(forwardKey, transformer);

        // Also store reverse reference for backward lookup
        this.transformers.set(backwardKey, transformer);
    }

    /**
     * Get transformer between two adjacent versions
     */
    public getTransformer(from: TSV, to: TSV): TransformerPair | undefined {
        const key = this.makeKey(from, to);
        return this.transformers.get(key);
    }

    /**
     * Check if transformer exists
     */
    public hasTransformer(from: TSV, to: TSV): boolean {
        return this.transformers.has(this.makeKey(from, to));
    }

    /**
     * Build transformation chain from source to target version
     * Returns linear chain (no circular dependencies possible)
     */
    public buildChain(from: TSV, to: TSV, versions: TSV[]): TSV[] | null {
        // Same version - no transformation needed
        if (from === to) {
            return [];
        }

        // Sort versions by timestamp
        const sortedVersions = [...versions].sort((a, b) => {
            const tsA = this.extractTimestamp(a);
            const tsB = this.extractTimestamp(b);
            return tsA - tsB;
        });

        const fromIndex = sortedVersions.indexOf(from);
        const toIndex = sortedVersions.indexOf(to);

        if (fromIndex === -1 || toIndex === -1) {
            return null;
        }

        // Build linear chain
        const chain: TSV[] = [];
        if (fromIndex < toIndex) {
            // Forward: from → to
            for (let i = fromIndex; i < toIndex; i++) {
                chain.push(sortedVersions[i]);
            }
            chain.push(to);
        } else {
            // Backward: from → to (going back in time)
            for (let i = fromIndex; i > toIndex; i--) {
                chain.push(sortedVersions[i]);
            }
            chain.push(to);
        }

        // Check chain length
        if (chain.length - 1 > this.maxChainLength) {
            throw new Error(
                `Transformation chain too long: ${chain.length - 1} hops (max: ${this.maxChainLength})`
            );
        }

        return chain;
    }

    /**
     * Execute transformation chain for request data
     */
    public async transformRequest(
        data: unknown,
        from: TSV,
        to: TSV,
        versions: TSV[],
        options: ChainOptions = {}
    ): Promise<TransformResult> {
        return this.executeChain(data, from, to, versions, 'request', options);
    }

    /**
     * Execute transformation chain for response data
     */
    public async transformResponse(
        data: unknown,
        from: TSV,
        to: TSV,
        versions: TSV[],
        options: ChainOptions = {}
    ): Promise<TransformResult> {
        return this.executeChain(data, from, to, versions, 'response', options);
    }

    /**
     * Execute transformation chain
     */
    private async executeChain(
        data: unknown,
        from: TSV,
        to: TSV,
        versions: TSV[],
        type: 'request' | 'response',
        options: ChainOptions
    ): Promise<TransformResult> {
        const chain = this.buildChain(from, to, versions);

        if (!chain) {
            return {
                success: false,
                error: new Error(`Cannot build transformation chain from ${from} to ${to}`),
                transformedVersions: [],
                chainLength: 0,
            };
        }

        if (chain.length === 0) {
            // No transformation needed
            return {
                success: true,
                data,
                transformedVersions: [],
                chainLength: 0,
            };
        }

        let currentData = data;
        const transformedVersions: TSV[] = [];

        try {
            // Execute chain
            for (let i = 0; i < chain.length - 1; i++) {
                const fromVer = chain[i];
                const toVer = chain[i + 1];

                const transformer = this.getTransformer(fromVer, toVer);
                if (!transformer) {
                    throw new Error(`No transformer found between ${fromVer} and ${toVer}`);
                }

                // Determine direction
                const isForward = this.extractTimestamp(fromVer) < this.extractTimestamp(toVer);
                const direction = isForward ? transformer.forward : transformer.backward;

                // Get transform function
                const transformFn =
                    type === 'request' ? direction.transformRequest : direction.transformResponse;

                if (transformFn) {
                    // Apply transformation with timeout
                    const result = transformFn(currentData);
                    if (options.timeout) {
                        currentData = await this.withTimeout(
                            Promise.resolve(result),
                            options.timeout
                        );
                    } else {
                        currentData = await Promise.resolve(result);
                    }
                }

                transformedVersions.push(toVer);
            }

            return {
                success: true,
                data: currentData,
                transformedVersions,
                chainLength: chain.length - 1,
            };
        } catch (error) {
            if (options.fallbackOnError) {
                // Return original data on error
                return {
                    success: false,
                    data,
                    error: error as Error,
                    transformedVersions,
                };
            }

            return {
                success: false,
                error: error as Error,
                transformedVersions,
            };
        }
    }

    /**
     * Get all registered transformers
     */
    public getAllTransformers(): TransformerPair[] {
        const seen = new Set<string>();
        const transformers: TransformerPair[] = [];

        for (const [key, transformer] of this.transformers.entries()) {
            const uniqueKey = `${transformer.fromVersion}-${transformer.toVersion}`;
            if (!seen.has(uniqueKey)) {
                seen.add(uniqueKey);
                transformers.push(transformer);
            }
        }

        return transformers;
    }

    /**
     * Get transformer count
     */
    public getTransformerCount(): number {
        return this.getAllTransformers().length;
    }

    /**
     * Clear all transformers (for testing)
     */
    public clear(): void {
        this.transformers.clear();
    }

    /**
     * Create key for transformer lookup
     */
    private makeKey(from: TSV, to: TSV): string {
        return `${from}→${to}`;
    }

    /**
     * Extract timestamp from TSV
     */
    private extractTimestamp(tsv: TSV): number {
        const match = tsv.match(/^tsv:(\d+)-/);
        return match ? parseInt(match[1], 10) : 0;
    }

    /**
     * Execute promise with timeout
     */
    private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error('Transformation timeout')), timeoutMs)
            ),
        ]);
    }
}

/**
 * Create a transformer pair
 */
export function createTransformerPair(
    fromVersion: TSV,
    toVersion: TSV,
    forward: TransformerPair['forward'],
    backward: TransformerPair['backward'],
    createdBy: string = 'system'
): TransformerPair {
    return {
        fromVersion,
        toVersion,
        immutable: true,
        createdAt: Date.now(),
        createdBy,
        forward,
        backward,
    };
}
