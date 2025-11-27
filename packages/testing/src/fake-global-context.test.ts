import { describe, it, expect } from 'vitest';
import { FakeGlobalContextBuilder, createFakeGlobalContext } from './fake-global-context';

describe('FakeGlobalContextBuilder', () => {
  it('builds with defaults', () => {
    const builder = new FakeGlobalContextBuilder();
    const gctx = builder.build();
    
    expect(gctx.modules).toEqual({});
    expect(gctx.config).toEqual({});
  });

  it('registers module', () => {
    const mockDb = { query: () => 'result' };
    const gctx = new FakeGlobalContextBuilder()
      .withModule('db', mockDb)
      .build();
    
    expect(gctx.modules['db']).toBe(mockDb);
  });

  it('registers multiple modules', () => {
    const mockDb = { query: () => 'result' };
    const mockCache = { get: () => 'cached' };
    
    const gctx = new FakeGlobalContextBuilder()
      .withModule('db', mockDb)
      .withModule('cache', mockCache)
      .build();
    
    expect(gctx.modules['db']).toBe(mockDb);
    expect(gctx.modules['cache']).toBe(mockCache);
  });

  it('sets custom config', () => {
    const config = { apiKey: 'test', timeout: 5000 };
    const gctx = new FakeGlobalContextBuilder()
      .withConfig(config)
      .build();
    
    expect(gctx.config).toEqual(config);
  });

  it('sets custom instanceId', () => {
    const gctx = new FakeGlobalContextBuilder()
      .withInstanceId('instance-123')
      .build();
    
    // instanceId is internal, just verify build succeeds
    expect(gctx).toBeDefined();
  });

  it('sets custom region', () => {
    const gctx = new FakeGlobalContextBuilder()
      .withRegion('us-west-2')
      .build();
    
    // region is internal, just verify build succeeds
    expect(gctx).toBeDefined();
  });

  it('chains methods fluently', () => {
    const mockDb = { query: () => 'result' };
    const gctx = new FakeGlobalContextBuilder()
      .withModule('db', mockDb)
      .withConfig({ key: 'value' })
      .withInstanceId('inst-1')
      .withRegion('eu-west-1')
      .build();
    
    expect(gctx.modules['db']).toBe(mockDb);
    expect(gctx.config.key).toBe('value');
  });
});

describe('createFakeGlobalContext', () => {
  it('creates with defaults', () => {
    const gctx = createFakeGlobalContext();
    
    expect(gctx.modules).toEqual({});
    expect(gctx.config).toEqual({});
  });

  it('accepts custom options', () => {
    const mockDb = { query: () => 'result' };
    const gctx = createFakeGlobalContext({
      modules: { db: mockDb },
      config: { env: 'test' }
    });
    
    expect(gctx.modules['db']).toBe(mockDb);
    expect(gctx.config.env).toBe('test');
  });
});
