/**
 * @module runtime/types/__tests__/handler
 * @description Tests for Handler type system
 */

import { describe, it, expectTypeOf } from 'vitest';
import type { Handler, TypedRequest, TypedResponse, InferInput, InferOutput, InferParams, InferQuery } from '../handler';
import type { GlobalContext, LocalContext } from '../context';

describe('Handler Type System', () => {
  it('should infer unknown types by default', () => {
    type DefaultHandler = Handler;
    
    expectTypeOf<DefaultHandler>().parameters.toMatchTypeOf<[
      TypedRequest<unknown, Record<string, string>, Record<string, string | string[]>>,
      TypedResponse<unknown>,
      GlobalContext,
      LocalContext
    ]>();
  });

  it('should infer INPUT type', () => {
    type INPUT = { title: string; description?: string };
    type TestHandler = Handler<INPUT>;
    
    expectTypeOf<TestHandler>().parameter(0).toHaveProperty('body').toEqualTypeOf<INPUT>();
  });

  it('should infer OUTPUT type', () => {
    type OUTPUT = { todo: { id: string; title: string } };
    type TestHandler = Handler<unknown, OUTPUT>;
    
    expectTypeOf<TestHandler>().parameter(1).toHaveProperty('json').parameter(0).toEqualTypeOf<OUTPUT>();
  });

  it('should infer PARAMS type', () => {
    type PARAMS = { id: string; userId: string };
    type TestHandler = Handler<unknown, unknown, PARAMS>;
    
    expectTypeOf<TestHandler>().parameter(0).toHaveProperty('params').toEqualTypeOf<PARAMS>();
  });

  it('should infer QUERY type', () => {
    type QUERY = { page?: string; limit?: string };
    type TestHandler = Handler<unknown, unknown, Record<string, string>, QUERY>;
    
    expectTypeOf<TestHandler>().parameter(0).toHaveProperty('query').toEqualTypeOf<QUERY>();
  });

  it('should support type inference utilities', () => {
    type INPUT = { email: string };
    type OUTPUT = { user: { id: string } };
    type PARAMS = { userId: string };
    type QUERY = { active?: string };
    
    type TestHandler = Handler<INPUT, OUTPUT, PARAMS, QUERY>;
    
    expectTypeOf<InferInput<TestHandler>>().toEqualTypeOf<INPUT>();
    expectTypeOf<InferOutput<TestHandler>>().toEqualTypeOf<OUTPUT>();
    expectTypeOf<InferParams<TestHandler>>().toEqualTypeOf<PARAMS>();
    expectTypeOf<InferQuery<TestHandler>>().toEqualTypeOf<QUERY>();
  });
});
