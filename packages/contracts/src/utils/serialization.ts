/**
 * @module contracts/utils/serialization
 * @description Serialization helpers for contracts
 */

import * as protobuf from 'protobufjs';
import { encode as msgpackEncode, decode as msgpackDecode } from '@msgpack/msgpack';
import { join } from 'path';

export interface SerializationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Cache for loaded protobuf roots
const protoCache = new Map<string, protobuf.Root>();

/**
 * Load a protobuf definition
 */
function loadProto(protoFile: string): protobuf.Root {
  if (protoCache.has(protoFile)) {
    return protoCache.get(protoFile)!;
  }
  
  try {
    const protoPath = join(__dirname, '..', 'proto', protoFile);
    const root = protobuf.loadSync(protoPath);
    protoCache.set(protoFile, root);
    return root;
  } catch (error) {
    throw new Error(`Failed to load proto file ${protoFile}: ${error}`);
  }
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

/**
 * Serialize data to Protobuf format
 * @param data - Data to serialize
 * @param messageName - Protobuf message name (e.g., 'GatiRequestEnvelope')
 * @param protoFile - Proto file name (e.g., 'envelope.proto')
 */
export function serializeProtobuf<T = any>(
  data: T,
  messageName: string,
  protoFile: string
): SerializationResult<Buffer> {
  try {
    const root = loadProto(protoFile);
    const MessageType = root.lookupType(messageName);
    
    // Verify the message
    const errMsg = MessageType.verify(data as any);
    if (errMsg) {
      return { success: false, error: `Verification failed: ${errMsg}` };
    }
    
    // Encode to buffer
    const message = MessageType.create(data as any);
    const buffer = MessageType.encode(message).finish();
    
    return {
      success: true,
      data: Buffer.from(buffer)
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Protobuf serialization failed'
    };
  }
}

/**
 * Deserialize data from Protobuf format
 * @param buffer - Buffer to deserialize
 * @param messageName - Protobuf message name
 * @param protoFile - Proto file name
 */
export function deserializeProtobuf<T = any>(
  buffer: Buffer,
  messageName: string,
  protoFile: string
): SerializationResult<T> {
  try {
    const root = loadProto(protoFile);
    const MessageType = root.lookupType(messageName);
    
    // Decode from buffer
    const message = MessageType.decode(buffer);
    const object = MessageType.toObject(message, {
      longs: String,
      enums: String,
      bytes: String,
      defaults: true
    });
    
    return {
      success: true,
      data: object as T
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Protobuf deserialization failed'
    };
  }
}

/**
 * Serialize data to MessagePack format
 * @param data - Data to serialize
 */
export function serializeMessagePack<T = any>(data: T): SerializationResult<Buffer> {
  try {
    const encoded = msgpackEncode(data);
    return {
      success: true,
      data: Buffer.from(encoded)
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'MessagePack serialization failed'
    };
  }
}

/**
 * Deserialize data from MessagePack format
 * @param buffer - Buffer to deserialize
 */
export function deserializeMessagePack<T = any>(buffer: Buffer): SerializationResult<T> {
  try {
    const decoded = msgpackDecode(buffer) as T;
    return {
      success: true,
      data: decoded
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'MessagePack deserialization failed'
    };
  }
}
