/**
 * @module cloud-provider
 * @description Common cloud provider interface for unified multi-cloud abstraction
 */
/**
 * Factory for creating cloud provider instances
 */
export class CloudProviderFactory {
    static providers = new Map();
    /**
     * Register a cloud provider implementation
     */
    static register(name, factory) {
        this.providers.set(name, factory);
    }
    /**
     * Create a cloud provider instance
     */
    static create(name) {
        const factory = this.providers.get(name);
        if (!factory) {
            throw new Error(`Cloud provider '${name}' not registered`);
        }
        return factory();
    }
    /**
     * Check if a provider is registered
     */
    static has(name) {
        return this.providers.has(name);
    }
    /**
     * Get list of registered providers
     */
    static getRegistered() {
        return Array.from(this.providers.keys());
    }
}
