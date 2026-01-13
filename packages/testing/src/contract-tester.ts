/**
 * @module @gati-framework/testing/contract-tester
 * @description Contract testing utilities for validating handler contracts
 */

import type { GType } from '@gati-framework/runtime/gtype/schema';
import { validate } from '@gati-framework/runtime/gtype/validator';
import type { ValidationResult } from '@gati-framework/runtime/gtype/errors';

export interface HandlerContract {
  path: string;
  method: string;
  request?: {
    params?: GType;
    query?: GType;
    body?: GType;
    headers?: GType;
  };
  response?: {
    status: number;
    body?: GType;
    headers?: GType;
  };
}

export interface ContractTestResult {
  valid: boolean;
  errors: ContractViolation[];
}

export interface ContractViolation {
  type: 'request' | 'response';
  field: string;
  message: string;
  path: string[];
  expected: string;
  actual: unknown;
}

export class ContractTester {
  constructor(private contract: HandlerContract) {}

  validateRequest(req: {
    params?: unknown;
    query?: unknown;
    body?: unknown;
    headers?: unknown;
  }): ContractTestResult {
    const errors: ContractViolation[] = [];

    if (this.contract.request?.params) {
      const result = validate(req.params, this.contract.request.params);
      errors.push(...this.toViolations('request', 'params', result));
    }

    if (this.contract.request?.query) {
      const result = validate(req.query, this.contract.request.query);
      errors.push(...this.toViolations('request', 'query', result));
    }

    if (this.contract.request?.body) {
      const result = validate(req.body, this.contract.request.body);
      errors.push(...this.toViolations('request', 'body', result));
    }

    if (this.contract.request?.headers) {
      const result = validate(req.headers, this.contract.request.headers);
      errors.push(...this.toViolations('request', 'headers', result));
    }

    return { valid: errors.length === 0, errors };
  }

  validateResponse(res: {
    status: number;
    body?: unknown;
    headers?: unknown;
  }): ContractTestResult {
    const errors: ContractViolation[] = [];

    if (this.contract.response && res.status !== this.contract.response.status) {
      errors.push({
        type: 'response',
        field: 'status',
        message: `Expected status ${this.contract.response.status}, got ${res.status}`,
        path: ['status'],
        expected: String(this.contract.response.status),
        actual: res.status,
      });
    }

    if (this.contract.response?.body) {
      const result = validate(res.body, this.contract.response.body);
      errors.push(...this.toViolations('response', 'body', result));
    }

    if (this.contract.response?.headers) {
      const result = validate(res.headers, this.contract.response.headers);
      errors.push(...this.toViolations('response', 'headers', result));
    }

    return { valid: errors.length === 0, errors };
  }

  private toViolations(
    type: 'request' | 'response',
    field: string,
    result: ValidationResult
  ): ContractViolation[] {
    if (result.valid) return [];

    return result.errors.map((err) => ({
      type,
      field,
      message: err.message,
      path: err.path.map(String),
      expected: err.expected,
      actual: err.actual,
    }));
  }
}

export function createContractTester(contract: HandlerContract): ContractTester {
  return new ContractTester(contract);
}

export function assertContract(
  result: ContractTestResult,
  message?: string
): asserts result is { valid: true; errors: [] } {
  if (!result.valid) {
    const errorMsg = message || 'Contract validation failed';
    const details = result.errors
      .map((e) => `  ${e.type}.${e.field}: ${e.message}`)
      .join('\n');
    throw new Error(`${errorMsg}\n${details}`);
  }
}
