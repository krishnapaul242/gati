#!/usr/bin/env node

/**
 * @module contracts/cli/validate
 * @description CLI tool for validating contract files
 */

import { readFileSync } from 'fs';
import { validateEnvelope, validateGatiError, validateManifest, validateGTypeSchema } from '../utils/validation.js';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: gati-contracts-validate <file> [type]');
  console.log('');
  console.log('Types:');
  console.log('  request       - GatiRequestEnvelope');
  console.log('  response      - GatiResponseEnvelope');
  console.log('  error         - GatiError');
  console.log('  handler       - HandlerVersion');
  console.log('  module        - ModuleManifest');
  console.log('  gtype         - GType');
  console.log('');
  console.log('Example: gati-contracts-validate envelope.json request');
  process.exit(1);
}

const file = args[0];
const type = args[1] || 'request';

if (!file) {
  console.error('Error: File path is required');
  process.exit(1);
}

try {
  const content = readFileSync(file, 'utf-8');
  const data = JSON.parse(content);
  
  let result;
  
  switch (type) {
    case 'request':
      result = validateEnvelope(data, 'request');
      break;
    case 'response':
      result = validateEnvelope(data, 'response');
      break;
    case 'error':
      result = validateGatiError(data);
      break;
    case 'handler':
      result = validateManifest(data, 'handler');
      break;
    case 'module':
      result = validateManifest(data, 'module');
      break;
    case 'gtype':
      result = validateGTypeSchema(data);
      break;
    default:
      console.error(`Unknown type: ${type}`);
      process.exit(1);
  }
  
  if (result.valid) {
    console.log('✓ Validation passed');
    process.exit(0);
  } else {
    console.error('✗ Validation failed:');
    result.errors?.forEach(err => {
      console.error(`  ${err.path}: ${err.message}`);
    });
    process.exit(1);
  }
} catch (error) {
  console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
}
