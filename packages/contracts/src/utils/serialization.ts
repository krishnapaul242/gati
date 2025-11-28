/**
 * @module contracts/utils/serialization
 * @description Serialization helpers for contracts
 */

export interface SerializationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function serializeJSON<T = any>(data: T): SerializationResult<string> {
  try {
    return {
      success: true,
      data: JSON.stringify(data)
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Serialization failed'
    };
  }
}

export function deserializeJSON<T = any>(json: string): SerializationResult<T> {
  try {
    return {
      success: true,
      data: JSON.parse(json)
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deserialization failed'
    };
  }
}

// Protobuf stubs (to be implemented with protobufjs)
export function serializeProtobuf<T = any>(data: T): SerializationResult<Buffer> {
  // Stub: Return JSON as buffer for now
  const jsonResult = serializeJSON(data);
  if (!jsonResult.success || !jsonResult.data) {
    return { success: false, error: jsonResult.error };
  }
  return {
    success: true,
    data: Buffer.from(jsonResult.data, 'utf-8')
  };
}

export function deserializeProtobuf<T = any>(buffer: Buffer): SerializationResult<T> {
  // Stub: Parse JSON from buffer for now
  try {
    const json = buffer.toString('utf-8');
    return deserializeJSON<T>(json);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deserialization failed'
    };
  }
}

// MessagePack stubs (to be implemented with msgpack)
export function serializeMessagePack<T = any>(data: T): SerializationResult<Buffer> {
  // Stub: Return JSON as buffer for now
  const jsonResult = serializeJSON(data);
  if (!jsonResult.success || !jsonResult.data) {
    return { success: false, error: jsonResult.error };
  }
  return {
    success: true,
    data: Buffer.from(jsonResult.data, 'utf-8')
  };
}

export function deserializeMessagePack<T = any>(buffer: Buffer): SerializationResult<T> {
  // Stub: Parse JSON from buffer for now
  try {
    const json = buffer.toString('utf-8');
    return deserializeJSON<T>(json);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deserialization failed'
    };
  }
}
