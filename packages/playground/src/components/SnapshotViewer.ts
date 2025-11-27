/**
 * @module playground/components/SnapshotViewer
 * @description Displays LocalContext snapshot data
 */

import type { SnapshotToken } from '@gati-framework/runtime';

/**
 * Viewer configuration
 */
export interface ViewerConfig {
  maxDepth: number;
  expandedByDefault: boolean;
  syntaxHighlight: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ViewerConfig = {
  maxDepth: 5,
  expandedByDefault: false,
  syntaxHighlight: true,
};

/**
 * Snapshot viewer
 */
export class SnapshotViewer {
  private container: HTMLElement;
  private config: ViewerConfig;
  private snapshot: SnapshotToken | null = null;

  constructor(container: HTMLElement, config?: Partial<ViewerConfig>) {
    this.container = container;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Render snapshot
   */
  render(snapshot: SnapshotToken): void {
    this.snapshot = snapshot;
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'snapshot-viewer';
    wrapper.style.cssText = 'font-family: monospace; padding: 16px; background: #1a1f3a; color: #e0e0e0; border-radius: 8px; overflow: auto;';

    // Metadata
    const meta = this.renderMetadata(snapshot);
    wrapper.appendChild(meta);

    // State
    const state = this.renderSection('State', snapshot.state);
    wrapper.appendChild(state);

    // Hooks
    const hooks = this.renderSection('Hooks', {
      lastHookIndex: snapshot.lastHookIndex,
      phase: snapshot.phase,
      outstandingPromises: snapshot.outstandingPromises.length,
    });
    wrapper.appendChild(hooks);

    this.container.appendChild(wrapper);
  }

  /**
   * Render metadata section
   */
  private renderMetadata(snapshot: SnapshotToken): HTMLElement {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #2a3050;';
    
    section.innerHTML = `
      <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #8b93ff;">Snapshot Metadata</div>
      <div style="font-size: 12px; line-height: 1.6;">
        <div><span style="color: #667eea;">Request ID:</span> ${snapshot.requestId}</div>
        <div><span style="color: #667eea;">Trace ID:</span> ${snapshot.traceId}</div>
        <div><span style="color: #667eea;">Client ID:</span> ${snapshot.clientId}</div>
        <div><span style="color: #667eea;">Timestamp:</span> ${new Date(snapshot.timestamp).toISOString()}</div>
      </div>
    `;

    return section;
  }

  /**
   * Render data section
   */
  private renderSection(title: string, data: any): HTMLElement {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom: 16px;';

    const header = document.createElement('div');
    header.style.cssText = 'font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #8b93ff; cursor: pointer;';
    header.textContent = `▼ ${title}`;

    const content = document.createElement('pre');
    content.style.cssText = 'font-size: 12px; line-height: 1.6; margin: 0; padding: 8px; background: #252b4d; border-radius: 4px; overflow-x: auto;';
    content.textContent = JSON.stringify(data, null, 2);

    if (this.config.syntaxHighlight) {
      this.applySyntaxHighlight(content);
    }

    header.onclick = () => {
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? 'block' : 'none';
      header.textContent = `${isHidden ? '▼' : '▶'} ${title}`;
    };

    if (!this.config.expandedByDefault) {
      content.style.display = 'none';
      header.textContent = `▶ ${title}`;
    }

    section.appendChild(header);
    section.appendChild(content);
    return section;
  }

  /**
   * Apply syntax highlighting
   */
  private applySyntaxHighlight(element: HTMLElement): void {
    const text = element.textContent || '';
    const highlighted = text
      .replace(/"([^"]+)":/g, '<span style="color: #8b93ff;">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span style="color: #22c55e;">"$1"</span>')
      .replace(/: (\d+)/g, ': <span style="color: #f59e0b;">$1</span>')
      .replace(/: (true|false|null)/g, ': <span style="color: #ec4899;">$1</span>');
    
    element.innerHTML = highlighted;
  }

  /**
   * Export snapshot as JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.snapshot, null, 2);
  }

  /**
   * Search snapshot
   */
  search(query: string): boolean {
    if (!this.snapshot) return false;
    const json = JSON.stringify(this.snapshot).toLowerCase();
    return json.includes(query.toLowerCase());
  }
}

/**
 * Create viewer instance
 */
export function createSnapshotViewer(
  container: HTMLElement,
  config?: Partial<ViewerConfig>
): SnapshotViewer {
  return new SnapshotViewer(container, config);
}
