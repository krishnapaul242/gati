/**
 * @module contracts/utils/validation
 * @description Validation utilities for contract schemas
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Load schemas
const envelopeSchema = JSON.parse(
  readFileSync(join(__dirname, '../schemas/envelope.schema.json'), 'utf-8')
);
const manifestSchema = JSON.parse(
  readFileSync(join(__dirname, '../schemas/manifest.schema.json'), 'utf-8')
);

// Compile validators
const validateRequestEnvelope = ajv.compile(envelopeSchema.definitions.GatiRequestEnvelope);
const validateResponseEnvelope = ajv.compile(envelopeSchema.definitions.GatiResponseEnvelope);
const validateError = ajv.compile(envelopeSchema.definitions.GatiError);
const validateHandlerVersion = ajv.compile(manifestSchema.definitions.HandlerVersion);
const validateModuleManifest = ajv.compile(manifestSchema.definitions.ModuleManifest);

export interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    path: string;
    message: string;
    value?: any;
  }>;
}

function formatErrors(errors: any[]): ValidationResult['errors'] {
  return errors.map(err => ({
    path: err.instancePath || err.dataPath || '/',
    message: err.message || 'Validation failed',
    value: err.data
  }));
}

export function validateEnvelope(data: any, type: 'request' | 'response' = 'request'): ValidationResult {
  const validator = type === 'request' ? validateRequestEnvelope : validateResponseEnvelope;
  const valid = validator(data);
  
  if (!valid && validator.errors) {
    return { valid: false, errors: formatErrors(validator.errors) };
  }
  
  return { valid: true };
}

export function validateGatiError(data: any): ValidationResult {
  const valid = validateError(data);
  
  if (!valid && validateError.errors) {
    return { valid: false, errors: formatErrors(validateError.errors) };
  }
  
  return { valid: true };
}

export function validateManifest(data: any, type: 'handler' | 'module' = 'module'): ValidationResult {
  const validator = type === 'handler' ? validateHandlerVersion : validateModuleManifest;
  const valid = validator(data);
  
  if (!valid && validator.errors) {
    return { valid: false, errors: formatErrors(validator.errors) };
  }
  
  return { valid: true };
}

export function validateGTypeSchema(data: any): ValidationResult {
  // GType validation with recursive schemas is complex
  // For now, just check basic structure
  if (!data || typeof data !== 'object' || !data.kind) {
    return { valid: false, errors: [{ path: '/', message: 'Invalid GType: missing kind field' }] };
  }
  return { valid: true };
}
