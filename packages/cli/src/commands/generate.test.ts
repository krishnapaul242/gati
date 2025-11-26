/**
 * @module cli/commands/generate.test
 * @description Tests for generate command
 */

import { describe, it, expect } from 'vitest';
import { generateCommand } from './generate.js';

describe('Generate Command', () => {
  it('should have correct name and alias', () => {
    expect(generateCommand.name()).toBe('generate');
    expect(generateCommand.aliases()).toContain('gen');
  });

  it('should have description', () => {
    expect(generateCommand.description()).toBeTruthy();
    expect(generateCommand.description()).toContain('Generate code artifacts');
  });

  it('should have validators subcommand', () => {
    const subcommands = generateCommand.commands;
    const validatorsCmd = subcommands.find(cmd => cmd.name() === 'validators');
    expect(validatorsCmd).toBeDefined();
    expect(validatorsCmd?.description()).toContain('validator');
  });

  it('should have types subcommand', () => {
    const subcommands = generateCommand.commands;
    const typesCmd = subcommands.find(cmd => cmd.name() === 'types');
    expect(typesCmd).toBeDefined();
    expect(typesCmd?.description()).toContain('TypeScript');
  });

  it('should have sdk subcommand', () => {
    const subcommands = generateCommand.commands;
    const sdkCmd = subcommands.find(cmd => cmd.name() === 'sdk');
    expect(sdkCmd).toBeDefined();
    expect(sdkCmd?.description()).toContain('SDK');
  });

  it('should have bundle subcommand', () => {
    const subcommands = generateCommand.commands;
    const bundleCmd = subcommands.find(cmd => cmd.name() === 'bundle');
    expect(bundleCmd).toBeDefined();
    expect(bundleCmd?.description()).toContain('bundle');
  });

  it('should have all subcommand', () => {
    const subcommands = generateCommand.commands;
    const allCmd = subcommands.find(cmd => cmd.name() === 'all');
    expect(allCmd).toBeDefined();
    expect(allCmd?.description()).toContain('all');
  });

  it('validators subcommand should have output option', () => {
    const subcommands = generateCommand.commands;
    const validatorsCmd = subcommands.find(cmd => cmd.name() === 'validators');
    const options = validatorsCmd?.options;
    const outputOption = options?.find(opt => opt.long === '--output');
    expect(outputOption).toBeDefined();
  });

  it('validators subcommand should have watch option', () => {
    const subcommands = generateCommand.commands;
    const validatorsCmd = subcommands.find(cmd => cmd.name() === 'validators');
    const options = validatorsCmd?.options;
    const watchOption = options?.find(opt => opt.long === '--watch');
    expect(watchOption).toBeDefined();
  });

  it('validators subcommand should have incremental option', () => {
    const subcommands = generateCommand.commands;
    const validatorsCmd = subcommands.find(cmd => cmd.name() === 'validators');
    const options = validatorsCmd?.options;
    const incrementalOption = options?.find(opt => opt.long === '--incremental');
    expect(incrementalOption).toBeDefined();
  });

  it('validators subcommand should have format option', () => {
    const subcommands = generateCommand.commands;
    const validatorsCmd = subcommands.find(cmd => cmd.name() === 'validators');
    const options = validatorsCmd?.options;
    const formatOption = options?.find(opt => opt.long === '--no-format');
    expect(formatOption).toBeDefined();
  });

  it('all subcommand should have all options', () => {
    const subcommands = generateCommand.commands;
    const allCmd = subcommands.find(cmd => cmd.name() === 'all');
    const options = allCmd?.options;
    
    expect(options?.find(opt => opt.long === '--output')).toBeDefined();
    expect(options?.find(opt => opt.long === '--watch')).toBeDefined();
    expect(options?.find(opt => opt.long === '--incremental')).toBeDefined();
    expect(options?.find(opt => opt.long === '--no-format')).toBeDefined();
  });

  it('types subcommand should have watch option', () => {
    const subcommands = generateCommand.commands;
    const typesCmd = subcommands.find(cmd => cmd.name() === 'types');
    const options = typesCmd?.options;
    const watchOption = options?.find(opt => opt.long === '--watch');
    expect(watchOption).toBeDefined();
  });

  it('sdk subcommand should have watch option', () => {
    const subcommands = generateCommand.commands;
    const sdkCmd = subcommands.find(cmd => cmd.name() === 'sdk');
    const options = sdkCmd?.options;
    const watchOption = options?.find(opt => opt.long === '--watch');
    expect(watchOption).toBeDefined();
  });

  it('bundle subcommand should not have watch option', () => {
    const subcommands = generateCommand.commands;
    const bundleCmd = subcommands.find(cmd => cmd.name() === 'bundle');
    const options = bundleCmd?.options;
    const watchOption = options?.find(opt => opt.long === '--watch');
    expect(watchOption).toBeUndefined();
  });
});
