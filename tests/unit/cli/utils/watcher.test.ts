/**
 * @module tests/unit/cli/utils/watcher.test
 * @description Tests for file watcher utility
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { resolve } from 'path';
import { createWatcher, stopWatcher } from '../../../../src/cli/utils/watcher';
import type { FSWatcher } from 'chokidar';

describe('Watcher Utility', () => {
  const testDir = resolve(process.cwd(), 'test-watcher-temp');
  const watchers: FSWatcher[] = [];

  afterEach(async () => {
    // Clean up all watchers
    for (const watcher of watchers) {
      await stopWatcher(watcher);
    }
    watchers.length = 0;
  });

  it('should create a file watcher with correct configuration', () => {
    const callback = vi.fn();
    const watcher = createWatcher(
      testDir,
      {
        paths: ['**/*.txt'],
        verbose: false,
      },
      callback
    );

    expect(watcher).toBeDefined();
    expect(typeof watcher.on).toBe('function');
    expect(typeof watcher.close).toBe('function');
    watchers.push(watcher);
  });

  it('should stop a file watcher cleanly', async () => {
    const callback = vi.fn();
    const watcher = createWatcher(
      testDir,
      {
        paths: ['**/*.txt'],
        verbose: false,
      },
      callback
    );

    await stopWatcher(watcher);
    // Watcher should be stopped (no error should be thrown)
  });

  it('should call callback when file change event is emitted', async () => {
    const callback = vi.fn();
    const watcher = createWatcher(
      testDir,
      {
        paths: ['**/*.txt'],
        verbose: false,
        debounce: 100,
      },
      callback
    );
    watchers.push(watcher);

    // Wait for watcher to be ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Emit a change event directly on the watcher
    watcher.emit('change', resolve(testDir, 'test.txt'));

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(callback).toHaveBeenCalledWith(
      expect.stringContaining('test.txt'),
      'change'
    );
  });

  it('should call callback when file add event is emitted', async () => {
    const callback = vi.fn();
    const watcher = createWatcher(
      testDir,
      {
        paths: ['**/*.txt'],
        verbose: false,
        debounce: 100,
      },
      callback
    );
    watchers.push(watcher);

    // Wait for watcher to be ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Emit an add event
    watcher.emit('add', resolve(testDir, 'new-file.txt'));

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(callback).toHaveBeenCalledWith(
      expect.stringContaining('new-file.txt'),
      'add'
    );
  });

  it('should call callback when file unlink event is emitted', async () => {
    const callback = vi.fn();
    const watcher = createWatcher(
      testDir,
      {
        paths: ['**/*.txt'],
        verbose: false,
        debounce: 100,
      },
      callback
    );
    watchers.push(watcher);

    // Wait for watcher to be ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Emit an unlink event
    watcher.emit('unlink', resolve(testDir, 'deleted.txt'));

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(callback).toHaveBeenCalledWith(
      expect.stringContaining('deleted.txt'),
      'unlink'
    );
  });

  it('should debounce multiple rapid changes to the same file', async () => {
    const callback = vi.fn();
    const watcher = createWatcher(
      testDir,
      {
        paths: ['**/*.txt'],
        verbose: false,
        debounce: 300,
      },
      callback
    );
    watchers.push(watcher);

    // Wait for watcher to be ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    const testFile = resolve(testDir, 'test.txt');

    // Emit multiple rapid change events
    watcher.emit('change', testFile);
    await new Promise((resolve) => setTimeout(resolve, 50));
    watcher.emit('change', testFile);
    await new Promise((resolve) => setTimeout(resolve, 50));
    watcher.emit('change', testFile);

    // Wait for debounce to complete
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Should be called only once due to debouncing
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(testFile, 'change');
  });

  it('should handle errors in callback gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const callback = vi.fn().mockRejectedValue(new Error('Callback error'));
    
    const watcher = createWatcher(
      testDir,
      {
        paths: ['**/*.txt'],
        verbose: false,
        debounce: 100,
      },
      callback
    );
    watchers.push(watcher);

    // Wait for watcher to be ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Emit a change event
    watcher.emit('change', resolve(testDir, 'test.txt'));

    // Wait for debounce and error handling
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(callback).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error handling file change')
    );

    consoleErrorSpy.mockRestore();
  });
});
