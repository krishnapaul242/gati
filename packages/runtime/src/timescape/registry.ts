import type { 
    TimescapeArtifact, 
    TSV, 
    VersionRegistryState, 
    VersionTimeline, 
    VersionInfo,
    VersionTag,
    VersionStatus 
} from './types.js';

export class VersionRegistry {
    private state: VersionRegistryState = {
        modules: {},
        schemas: {},
        config: null,
        routes: {},
        events: {},
        effects: {},
        handlers: {},
        tags: {},
        activeVersions: new Set(),
        coldVersions: new Set(),
    };

    private history: Map<string, TSV[]> = new Map();
    private versionCache: Map<string, TSV> = new Map();
    private readonly maxCacheSize: number = 1000;

    constructor(initialState?: Partial<VersionRegistryState>) {
        if (initialState) {
            this.state = { 
                ...this.state, 
                ...initialState,
                activeVersions: new Set(initialState.activeVersions || []),
                coldVersions: new Set(initialState.coldVersions || []),
            };
        }
    }

    public register(artifact: TimescapeArtifact): void {
        const { type, id, version } = artifact;

        switch (type) {
            case 'module':
                this.state.modules[id] = version;
                break;
            case 'schema':
                this.state.schemas[id] = version;
                break;
            case 'config':
                this.state.config = version;
                break;
            case 'route':
                this.state.routes[id] = version;
                break;
            case 'event_handler':
                this.state.events[id] = version;
                break;
            case 'effect':
                this.state.effects[id] = version;
                break;
            default:
                // For other types, we might just log or ignore for the main registry state
                // depending on if they need global tracking
                break;
        }

        this.addToHistory(type, id, version);
    }

    public get(type: 'module' | 'schema' | 'route' | 'event_handler' | 'effect', id: string): TSV | undefined {
        switch (type) {
            case 'module': return this.state.modules[id];
            case 'schema': return this.state.schemas[id];
            case 'route': return this.state.routes[id];
            case 'event_handler': return this.state.events[id];
            case 'effect': return this.state.effects[id];
        }
        return undefined;
    }

    public getConfigVersion(): TSV | null {
        return this.state.config;
    }

    public getAll(): VersionRegistryState {
        return { ...this.state };
    }

    private addToHistory(type: string, id: string, version: TSV) {
        const key = `${type}:${id}`;
        if (!this.history.has(key)) {
            this.history.set(key, []);
        }
        this.history.get(key)?.push(version);
    }

    public getHistory(type: string, id: string): TSV[] {
        return this.history.get(`${type}:${id}`) || [];
    }

    /**
     * Register a handler version in the timeline
     */
    public registerVersion(
        handlerPath: string, 
        tsv: TSV, 
        metadata: Partial<VersionInfo>
    ): void {
        if (!this.state.handlers[handlerPath]) {
            this.state.handlers[handlerPath] = {
                handlerPath,
                versions: [],
            };
        }

        const timeline = this.state.handlers[handlerPath];
        const timestamp = this.extractTimestamp(tsv);

        const versionInfo: VersionInfo = {
            tsv,
            timestamp,
            hash: metadata.hash || '',
            status: metadata.status || 'hot',
            requestCount: metadata.requestCount || 0,
            lastAccessed: metadata.lastAccessed || Date.now(),
            tags: metadata.tags || [],
            dbSchemaVersion: metadata.dbSchemaVersion,
        };

        // Insert in chronological order
        const insertIndex = timeline.versions.findIndex(v => v.timestamp > timestamp);
        if (insertIndex === -1) {
            timeline.versions.push(versionInfo);
        } else {
            timeline.versions.splice(insertIndex, 0, versionInfo);
        }

        this.state.activeVersions.add(tsv);
        this.clearCache();
    }

    /**
     * Get version at a specific timestamp using binary search
     */
    public getVersionAt(handlerPath: string, timestamp: number): TSV | undefined {
        const cacheKey = `${handlerPath}:${timestamp}`;
        
        if (this.versionCache.has(cacheKey)) {
            return this.versionCache.get(cacheKey);
        }

        const timeline = this.state.handlers[handlerPath];
        if (!timeline || timeline.versions.length === 0) {
            return undefined;
        }

        // Binary search for version at or before timestamp
        let left = 0;
        let right = timeline.versions.length - 1;
        let result: TSV | undefined;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const version = timeline.versions[mid];

            if (version.timestamp <= timestamp) {
                result = version.tsv;
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        if (result) {
            this.cacheVersion(cacheKey, result);
        }

        return result;
    }

    /**
     * Get latest version for a handler
     */
    public getLatestVersion(handlerPath: string): TSV | undefined {
        const timeline = this.state.handlers[handlerPath];
        if (!timeline || timeline.versions.length === 0) {
            return undefined;
        }

        return timeline.versions[timeline.versions.length - 1].tsv;
    }

    /**
     * Tag a version with a semantic label
     */
    public tagVersion(tsv: TSV, label: string, createdBy: string = 'system'): void {
        const tag: VersionTag = {
            label,
            tsv,
            createdAt: Date.now(),
            createdBy,
        };

        this.state.tags[label] = tag;

        // Add tag to version info
        for (const timeline of Object.values(this.state.handlers)) {
            const version = timeline.versions.find(v => v.tsv === tsv);
            if (version && !version.tags.includes(label)) {
                version.tags.push(label);
            }
        }

        this.clearCache();
    }

    /**
     * Get version by semantic tag
     */
    public getVersionByTag(handlerPath: string, tag: string): TSV | undefined {
        const versionTag = this.state.tags[tag];
        if (!versionTag) {
            return undefined;
        }

        // Verify the tagged version exists for this handler
        const timeline = this.state.handlers[handlerPath];
        if (!timeline) {
            return undefined;
        }

        const exists = timeline.versions.some(v => v.tsv === versionTag.tsv);
        return exists ? versionTag.tsv : undefined;
    }

    /**
     * Remove a tag
     */
    public untagVersion(label: string): boolean {
        const tag = this.state.tags[label];
        if (!tag) {
            return false;
        }

        delete this.state.tags[label];

        // Remove tag from version info
        for (const timeline of Object.values(this.state.handlers)) {
            for (const version of timeline.versions) {
                const index = version.tags.indexOf(label);
                if (index !== -1) {
                    version.tags.splice(index, 1);
                }
            }
        }

        this.clearCache();
        return true;
    }

    /**
     * Get all versions for a handler
     */
    public getVersions(handlerPath: string): VersionInfo[] {
        const timeline = this.state.handlers[handlerPath];
        return timeline ? [...timeline.versions] : [];
    }

    /**
     * Get all active versions
     */
    public getActiveVersions(handlerPath?: string): TSV[] {
        if (handlerPath) {
            const timeline = this.state.handlers[handlerPath];
            if (!timeline) return [];
            
            return timeline.versions
                .filter(v => this.state.activeVersions.has(v.tsv))
                .map(v => v.tsv);
        }

        return Array.from(this.state.activeVersions);
    }

    /**
     * Mark a version as cold
     */
    public markCold(tsv: TSV): void {
        this.state.coldVersions.add(tsv);
        this.state.activeVersions.delete(tsv);

        // Update status in version info
        for (const timeline of Object.values(this.state.handlers)) {
            const version = timeline.versions.find(v => v.tsv === tsv);
            if (version) {
                version.status = 'cold';
            }
        }

        this.clearCache();
    }

    /**
     * Update version status
     */
    public updateVersionStatus(tsv: TSV, status: VersionStatus): void {
        for (const timeline of Object.values(this.state.handlers)) {
            const version = timeline.versions.find(v => v.tsv === tsv);
            if (version) {
                version.status = status;
                
                if (status === 'cold') {
                    this.state.coldVersions.add(tsv);
                    this.state.activeVersions.delete(tsv);
                } else {
                    this.state.activeVersions.add(tsv);
                    this.state.coldVersions.delete(tsv);
                }
            }
        }
    }

    /**
     * Increment request count for a version
     */
    public recordRequest(tsv: TSV): void {
        for (const timeline of Object.values(this.state.handlers)) {
            const version = timeline.versions.find(v => v.tsv === tsv);
            if (version) {
                version.requestCount++;
                version.lastAccessed = Date.now();
                
                // Update status based on activity
                if (version.status === 'cold') {
                    version.status = 'warm';
                    this.state.coldVersions.delete(tsv);
                    this.state.activeVersions.add(tsv);
                }
            }
        }
    }

    /**
     * Get version info
     */
    public getVersionInfo(tsv: TSV): VersionInfo | undefined {
        for (const timeline of Object.values(this.state.handlers)) {
            const version = timeline.versions.find(v => v.tsv === tsv);
            if (version) {
                return { ...version };
            }
        }
        return undefined;
    }

    /**
     * Get all tags
     */
    public getAllTags(): VersionTag[] {
        return Object.values(this.state.tags);
    }

    /**
     * Get tags for a specific version
     */
    public getTagsForVersion(tsv: TSV): string[] {
        const info = this.getVersionInfo(tsv);
        return info ? [...info.tags] : [];
    }

    /**
     * Extract timestamp from TSV
     */
    private extractTimestamp(tsv: TSV): number {
        const match = tsv.match(/^tsv:(\d+)-/);
        return match ? parseInt(match[1], 10) : Date.now();
    }

    /**
     * Cache a version lookup
     */
    private cacheVersion(key: string, tsv: TSV): void {
        if (this.versionCache.size >= this.maxCacheSize) {
            // Simple LRU: remove first entry
            const firstKey = this.versionCache.keys().next().value;
            this.versionCache.delete(firstKey);
        }
        this.versionCache.set(key, tsv);
    }

    /**
     * Clear version cache
     */
    private clearCache(): void {
        this.versionCache.clear();
    }

    /**
     * Serialize state for persistence
     */
    public serialize(): string {
        return JSON.stringify({
            ...this.state,
            activeVersions: Array.from(this.state.activeVersions),
            coldVersions: Array.from(this.state.coldVersions),
        });
    }

    /**
     * Deserialize state from persistence
     */
    public static deserialize(data: string): VersionRegistry {
        const parsed = JSON.parse(data);
        return new VersionRegistry({
            ...parsed,
            activeVersions: new Set(parsed.activeVersions || []),
            coldVersions: new Set(parsed.coldVersions || []),
        });
    }
}
