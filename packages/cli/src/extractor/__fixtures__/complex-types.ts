/**
 * @file complex-types.ts
 * @description Complex types: unions, intersections, arrays, tuples, nested objects
 */

// Union types
export type StringOrNumber = string | number;
export type Status = 'pending' | 'active' | 'completed';
export type MixedUnion = string | number | boolean | null;
export type BrandedUnion = (string & { __brand: 'email' }) | (string & { __brand: 'phone' });

// Intersection types
export type ConstrainedString = string & { __minLen: 5 } & { __maxLen: 50 } & { __pattern: '^[a-zA-Z]+$' };
export type MultiConstraintNumber = number & { __min: 0 } & { __max: 100 } & { __multipleOf: 5 };
export type BrandedAndConstrained = string & { __brand: 'username' } & { __minLen: 3 } & { __maxLen: 20 };

// Array types
export type StringArray = string[];
export type NumberArray = number[];
export type BrandedArray = (string & { __brand: 'email' })[];
export type ConstrainedArray = (string & { __minLen: 5 })[];
export type NestedArray = string[][];

// Tuple types
export type Pair = [string, number];
export type Triple = [string, number, boolean];
export type MixedTuple = [string & { __brand: 'email' }, number & { __min: 0 }, boolean];
export type NestedTuple = [string, [number, boolean]];

// Object types
export interface SimpleObject {
  name: string;
  age: number;
}

export interface BrandedObject {
  email: string & { __brand: 'email' };
  userId: string & { __brand: 'userId' };
  createdAt: number & { __min: 0 };
}

export interface NestedObject {
  user: {
    name: string;
    email: string & { __brand: 'email' };
  };
  metadata: {
    createdAt: number;
    tags: string[];
  };
}

export interface OptionalFields {
  required: string;
  optional?: number;
  nullableOptional?: string | null;
}

export interface ArrayFields {
  tags: string[];
  scores: number[];
  nested: {
    items: string[];
  }[];
}

// Deep nesting (level 10)
export interface DeeplyNested {
  level1: {
    level2: {
      level3: {
        level4: {
          level5: {
            level6: {
              level7: {
                level8: {
                  level9: {
                    level10: {
                      value: string;
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}

// Additional types for test compatibility
export interface User {
  id: string;
  name: string;
  email: string;
}

export type UserWithMetadata = User & {
  metadata: {
    createdAt: number;
    updatedAt: number;
  };
};

export type Tags = string[];
export type Coordinate = [number, number];
export type DeepNested = DeeplyNested; // Alias for name compatibility
