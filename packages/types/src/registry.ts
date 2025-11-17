/**
 * @module registry
 * @description Brand validator registry for runtime validation
 */

/**
 * Brand validator interface
 * Validators MUST be synchronous - async validation should use middleware
 */
export interface BrandValidator {
  /**
   * Unique brand name (e.g., 'email', 'uuid')
   */
  name: string;

  /**
   * Synchronous validation function
   * Returns true if value is valid for this brand
   */
  validate: (value: unknown) => boolean;

  /**
   * Must be false or undefined - async validators are not supported in MVP
   */
  async?: false;

  /**
   * Optional description for documentation
   */
  description?: string;
}

/**
 * Brand validator registry singleton
 * Manages runtime validators for branded types
 */
class BrandRegistryImpl {
  private validators = new Map<string, BrandValidator>();

  /**
   * Register a brand validator
   * 
   * @throws {Error} If validator is async
   * @throws {Error} If brand name already registered
   * 
   * @example
   * ```typescript
   * BrandRegistry.register({
   *   name: 'email',
   *   validate: (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
   *   description: 'RFC 5322 email format'
   * });
   * ```
   */
  register(validator: BrandValidator): void {
    // Validate name
    if (!validator.name || validator.name.trim() === '') {
      throw new Error('Brand validator name cannot be empty');
    }

    // Check for async validators
    if (validator.validate.constructor.name === 'AsyncFunction') {
      throw new Error(
        `Brand validators must be synchronous. For async validation (DNS, API calls), use middleware or separate validation phase. ` +
        `Async validators planned for Phase 2. Brand: ${validator.name}`
      );
    }

    // Check for duplicate registration
    if (this.validators.has(validator.name)) {
      throw new Error(`Brand validator '${validator.name}' is already registered`);
    }

    this.validators.set(validator.name, validator);
  }

  /**
   * Get a brand validator by name
   * 
   * @param name - Brand name
   * @returns Validator or undefined if not found
   */
  get(name: string): BrandValidator | undefined {
    return this.validators.get(name);
  }

  /**
   * Get all registered brand validators
   * 
   * @returns Array of all validators
   */
  getAll(): BrandValidator[] {
    return Array.from(this.validators.values());
  }

  /**
   * Clear all registered validators (for testing)
   * @internal
   */
  clear(): void {
    this.validators.clear();
  }

  /**
   * Check if a brand is registered
   * 
   * @param name - Brand name
   * @returns True if brand is registered
   */
  has(name: string): boolean {
    return this.validators.has(name);
  }
}

/**
 * Global brand validator registry
 */
export const BrandRegistry = new BrandRegistryImpl();
