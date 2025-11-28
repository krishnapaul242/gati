import { describe, it, expectTypeOf } from 'vitest';
import type {
  GatiRequestEnvelope,
  GatiResponseEnvelope,
  GatiError,
  LocalContext,
  GlobalContext,
  ModuleClient,
  HandlerVersion,
  ModuleManifest,
  GType,
  GPrimitiveType,
  GObjectType
} from '../src/types/index.js';

describe('Type Tests', () => {
  it('should enforce required fields in GatiRequestEnvelope', () => {
    const validRequest: GatiRequestEnvelope = {
      id: 'test',
      method: 'GET',
      path: '/test',
      headers: {},
      receivedAt: Date.now()
    };
    
    expectTypeOf(validRequest).toMatchTypeOf<GatiRequestEnvelope>();
    expectTypeOf(validRequest.id).toBeString();
    expectTypeOf(validRequest.query).toEqualTypeOf<Record<string, string | string[]> | undefined>();
  });

  it('should enforce required fields in GatiResponseEnvelope', () => {
    const validResponse: GatiResponseEnvelope = {
      requestId: 'test',
      status: 200,
      producedAt: Date.now()
    };
    
    expectTypeOf(validResponse).toMatchTypeOf<GatiResponseEnvelope>();
    expectTypeOf(validResponse.warnings).toEqualTypeOf<string[] | undefined>();
  });

  it('should enforce required message in GatiError', () => {
    const error: GatiError = {
      message: 'Error'
    };
    
    expectTypeOf(error).toMatchTypeOf<GatiError>();
    expectTypeOf(error.code).toEqualTypeOf<string | undefined>();
  });

  it('should support generic types in LocalContext', () => {
    type TestContext = LocalContext;
    
    expectTypeOf<TestContext['get']>().toBeFunction();
    expectTypeOf<TestContext['set']>().toBeFunction();
    expectTypeOf<TestContext['get']>().returns.toEqualTypeOf<any | undefined>();
  });

  it('should enforce module types in ModuleManifest', () => {
    const manifest: ModuleManifest = {
      name: 'test',
      id: 'test',
      version: '1.0.0',
      type: 'node',
      exports: {}
    };
    
    expectTypeOf(manifest.type).toEqualTypeOf<'node' | 'oci' | 'wasm' | 'binary' | 'external'>();
  });

  it('should support discriminated unions in GType', () => {
    const stringType: GPrimitiveType = {
      kind: 'string',
      minLength: 1
    };
    
    const objectType: GObjectType = {
      kind: 'object',
      properties: {}
    };
    
    expectTypeOf(stringType).toMatchTypeOf<GType>();
    expectTypeOf(objectType).toMatchTypeOf<GType>();
    expectTypeOf(stringType.kind).toEqualTypeOf<'string' | 'number' | 'boolean'>();
  });

  it('should enforce ModuleClient interface', () => {
    const client: ModuleClient = {
      id: 'test',
      call: async () => ({}),
      health: async () => ({ ok: true })
    };
    
    expectTypeOf(client.call).toBeFunction();
    expectTypeOf(client.call).returns.resolves.toBeAny();
    expectTypeOf(client.health).returns.resolves.toMatchTypeOf<{ ok: boolean; meta?: any }>();
  });

  it('should enforce GlobalContext structure', () => {
    type TestGlobalContext = GlobalContext;
    
    expectTypeOf<TestGlobalContext['appId']>().toBeString();
    expectTypeOf<TestGlobalContext['modules']>().toEqualTypeOf<Record<string, ModuleClient>>();
    expectTypeOf<TestGlobalContext['secrets']['get']>().toBeFunction();
  });
});
