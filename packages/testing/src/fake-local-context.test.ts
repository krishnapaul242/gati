import { describe, it, expect } from 'vitest';
import { FakeLocalContextBuilder, createFakeLocalContext } from './fake-local-context';

describe('FakeLocalContextBuilder', () => {
  it('builds with defaults', () => {
    const builder = new FakeLocalContextBuilder();
    const lctx = builder.build();
    
    expect(lctx.requestId).toBeDefined();
    expect(lctx.traceId).toBeDefined();
    expect(lctx.state).toEqual({});
  });

  it('sets custom requestId', () => {
    const lctx = new FakeLocalContextBuilder()
      .withRequestId('custom-id')
      .build();
    
    expect(lctx.requestId).toBe('custom-id');
  });

  it('sets custom traceId', () => {
    const lctx = new FakeLocalContextBuilder()
      .withTraceId('trace-123')
      .build();
    
    expect(lctx.traceId).toBe('trace-123');
  });

  it('sets custom clientId', () => {
    const lctx = new FakeLocalContextBuilder()
      .withClientId('client-456')
      .build();
    
    expect(lctx.clientId).toBe('client-456');
  });

  it('sets custom state', () => {
    const state = { user: 'test', count: 42 };
    const lctx = new FakeLocalContextBuilder()
      .withState(state)
      .build();
    
    expect(lctx.state).toEqual(state);
  });

  it('sets custom metadata', () => {
    const lctx = new FakeLocalContextBuilder()
      .withMetadata({ startTime: 1000 })
      .build();
    
    expect(lctx.meta.startTime).toBe(1000);
  });

  it('chains methods fluently', () => {
    const lctx = new FakeLocalContextBuilder()
      .withRequestId('req-1')
      .withTraceId('trace-1')
      .withClientId('client-1')
      .withState({ key: 'value' })
      .build();
    
    expect(lctx.requestId).toBe('req-1');
    expect(lctx.traceId).toBe('trace-1');
    expect(lctx.clientId).toBe('client-1');
    expect(lctx.state.key).toBe('value');
  });
});

describe('createFakeLocalContext', () => {
  it('creates with defaults', () => {
    const lctx = createFakeLocalContext();
    
    expect(lctx.requestId).toMatch(/^test-req-/);
    expect(lctx.traceId).toMatch(/^test-trace-/);
    expect(lctx.state).toEqual({});
  });

  it('accepts custom options', () => {
    const lctx = createFakeLocalContext({
      requestId: 'custom-req',
      state: { foo: 'bar' }
    });
    
    expect(lctx.requestId).toBe('custom-req');
    expect(lctx.state.foo).toBe('bar');
  });
});
