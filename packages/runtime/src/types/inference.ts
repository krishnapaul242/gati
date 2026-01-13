/**
 * @module runtime/types/inference
 * @description Type inference utilities for GType to TypeScript conversion
 */

import type { GType } from '@gati-framework/types/gtype';

/**
 * Infer TypeScript type from GType schema
 */
export type InferGType<T extends GType> =
  T extends { type: 'string' } ? string :
  T extends { type: 'number' } ? number :
  T extends { type: 'boolean' } ? boolean :
  T extends { type: 'null' } ? null :
  T extends { type: 'object'; properties: infer P } ? InferObject<P> :
  T extends { type: 'array'; items: infer I } ? I extends GType ? InferGType<I>[] : unknown[] :
  T extends { type: 'tuple'; items: infer I } ? I extends GType[] ? InferTuple<I> : unknown[] :
  T extends { type: 'union'; anyOf: infer U } ? U extends GType[] ? InferUnion<U> : unknown :
  T extends { type: 'intersection'; allOf: infer A } ? A extends GType[] ? InferIntersection<A> : unknown :
  T extends { type: 'literal'; value: infer V } ? V :
  unknown;

/**
 * Infer object type from properties
 */
type InferObject<P> = P extends Record<string, { type: GType; required?: boolean }>
  ? {
      [K in keyof P as P[K] extends { required: false } ? never : K]: P[K] extends { type: infer T }
        ? T extends GType
          ? InferGType<T>
          : unknown
        : unknown;
    } & {
      [K in keyof P as P[K] extends { required: false } ? K : never]?: P[K] extends { type: infer T }
        ? T extends GType
          ? InferGType<T>
          : unknown
        : unknown;
    }
  : Record<string, unknown>;

/**
 * Infer tuple type from items array
 */
type InferTuple<T extends readonly GType[]> = {
  [K in keyof T]: T[K] extends GType ? InferGType<T[K]> : unknown;
};

/**
 * Infer union type from anyOf array
 */
type InferUnion<T extends readonly GType[]> = T extends readonly [infer First, ...infer Rest]
  ? First extends GType
    ? Rest extends GType[]
      ? InferGType<First> | InferUnion<Rest>
      : InferGType<First>
    : unknown
  : never;

/**
 * Infer intersection type from allOf array
 */
type InferIntersection<T extends readonly GType[]> = T extends readonly [infer First, ...infer Rest]
  ? First extends GType
    ? Rest extends GType[]
      ? InferGType<First> & InferIntersection<Rest>
      : InferGType<First>
    : unknown
  : unknown;

/**
 * Infer primitive type
 */
export type InferPrimitive<T extends GType> =
  T extends { type: 'string' } ? string :
  T extends { type: 'number' } ? number :
  T extends { type: 'boolean' } ? boolean :
  T extends { type: 'null' } ? null :
  unknown;

/**
 * Infer array type
 */
export type InferArray<T extends GType> =
  T extends { type: 'array'; items: infer I }
    ? I extends GType
      ? InferGType<I>[]
      : unknown[]
    : unknown[];
