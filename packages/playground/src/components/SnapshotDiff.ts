/**
 * @module playground/components/SnapshotDiff
 * @description Side-by-side snapshot comparison
 */

import type { SnapshotToken, SnapshotDiff as DiffResult } from '@gati-framework/runtime';

/**
 * Diff view mode
 */
export type DiffViewMode = 'split' | 'unified';

/**
 * Diff configuration
 */
export interface DiffConfig {
  viewMode: DiffViewMode;
  showUnchanged: boolean;
  contextLines: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: DiffConfig = {
  viewMode: 'split',
  showUnchanged: false,
  contextLines: 3,
};

/**
 * Snapshot diff viewer
 */
export class SnapshotDiff {
  private container: HTMLElement;
  private config: DiffConfig;

  constructor(container: HTMLElement, config?: Partial<DiffConfig>) {
    this.container = container;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Render diff
   */
  render(diff: DiffResult, from: SnapshotToken, to: SnapshotToken): void {
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'snapshot-diff';
    wrapper.style.cssText = 'font-family: monospace; padding: 16px; background: #1a1f3a; color: #e0e0e0; border-radius: 8px;';

    // Header
    const header = this.renderHeader(from, to);
    wrapper.appendChild(header);

    // Diff content
    const content = this.config.viewMode === 'split'
      ? this.renderSplitView(diff, from, to)
      : this.renderUnifiedView(diff, from, to);
    wrapper.appendChild(content);

    // Stats
    const stats = this.renderStats(diff);
    wrapper.appendChild(stats);

    this.container.appendChild(wrapper);
  }

  /**
   * Render header
   */
  private renderHeader(from: SnapshotToken, to: SnapshotToken): HTMLElement {
    const header = document.createElement('div');
    header.style.cssText = 'margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #2a3050;';
    
    const timeDiff = to.timestamp - from.timestamp;
    header.innerHTML = `
      <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #8b93ff;">Snapshot Comparison</div>
      <div style="font-size: 12px; display: flex; gap: 24px;">
        <div><span style="color: #ef4444;">From:</span> ${from.traceId}</div>
        <div><span style="color: #22c55e;">To:</span> ${to.traceId}</div>
        <div><span style="color: #667eea;">Time Δ:</span> ${timeDiff}ms</div>
      </div>
    `;

    return header;
  }

  /**
   * Render split view
   */
  private renderSplitView(diff: DiffResult, from: SnapshotToken, to: SnapshotToken): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;';

    const leftPanel = document.createElement('div');
    leftPanel.style.cssText = 'background: #252b4d; padding: 12px; border-radius: 4px; overflow: auto;';
    leftPanel.innerHTML = `<div style="color: #ef4444; font-weight: bold; margin-bottom: 8px;">Before</div>`;
    
    const leftContent = document.createElement('pre');
    leftContent.style.cssText = 'margin: 0; font-size: 12px; line-height: 1.6;';
    leftContent.textContent = JSON.stringify(from.state, null, 2);
    leftPanel.appendChild(leftContent);

    const rightPanel = document.createElement('div');
    rightPanel.style.cssText = 'background: #252b4d; padding: 12px; border-radius: 4px; overflow: auto;';
    rightPanel.innerHTML = `<div style="color: #22c55e; font-weight: bold; margin-bottom: 8px;">After</div>`;
    
    const rightContent = document.createElement('pre');
    rightContent.style.cssText = 'margin: 0; font-size: 12px; line-height: 1.6;';
    rightContent.textContent = JSON.stringify(to.state, null, 2);
    rightPanel.appendChild(rightContent);

    container.appendChild(leftPanel);
    container.appendChild(rightPanel);

    return container;
  }

  /**
   * Render unified view
   */
  private renderUnifiedView(diff: DiffResult, from: SnapshotToken, to: SnapshotToken): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = 'background: #252b4d; padding: 12px; border-radius: 4px; margin-bottom: 16px; overflow: auto;';

    const content = document.createElement('div');
    content.style.cssText = 'font-size: 12px; line-height: 1.6;';

    diff.operations.forEach(op => {
      const line = document.createElement('div');
      line.style.cssText = 'padding: 2px 4px; margin: 1px 0;';

      if (op.op === 'add') {
        line.style.background = 'rgba(34, 197, 94, 0.2)';
        line.style.color = '#22c55e';
        line.textContent = `+ ${op.path}: ${JSON.stringify(op.newValue)}`;
      } else if (op.op === 'remove') {
        line.style.background = 'rgba(239, 68, 68, 0.2)';
        line.style.color = '#ef4444';
        line.textContent = `- ${op.path}: ${JSON.stringify(op.oldValue)}`;
      } else if (op.op === 'replace') {
        line.style.background = 'rgba(245, 158, 11, 0.2)';
        line.style.color = '#f59e0b';
        line.textContent = `~ ${op.path}: ${JSON.stringify(op.oldValue)} → ${JSON.stringify(op.newValue)}`;
      }

      content.appendChild(line);
    });

    container.appendChild(content);
    return container;
  }

  /**
   * Render stats
   */
  private renderStats(diff: DiffResult): HTMLElement {
    const stats = document.createElement('div');
    stats.style.cssText = 'font-size: 12px; padding: 12px; background: #252b4d; border-radius: 4px;';

    const added = diff.operations.filter(op => op.op === 'add').length;
    const removed = diff.operations.filter(op => op.op === 'remove').length;
    const modified = diff.operations.filter(op => op.op === 'replace').length;

    stats.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #8b93ff;">Changes Summary</div>
      <div style="display: flex; gap: 16px;">
        <div><span style="color: #22c55e;">+${added}</span> added</div>
        <div><span style="color: #ef4444;">-${removed}</span> removed</div>
        <div><span style="color: #f59e0b;">~${modified}</span> modified</div>
      </div>
    `;

    return stats;
  }

  /**
   * Toggle view mode
   */
  setViewMode(mode: DiffViewMode): void {
    this.config.viewMode = mode;
  }
}

/**
 * Create diff viewer instance
 */
export function createSnapshotDiff(
  container: HTMLElement,
  config?: Partial<DiffConfig>
): SnapshotDiff {
  return new SnapshotDiff(container, config);
}
