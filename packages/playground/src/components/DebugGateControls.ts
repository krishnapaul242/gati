/**
 * @module playground/components/DebugGateControls
 * @description Debug gate management UI
 */

import type { DebugGate, StageName } from '@gati-framework/runtime';

/**
 * Gate event callback
 */
export type GateEventCallback = (event: GateEvent) => void;

/**
 * Gate event
 */
export interface GateEvent {
  type: 'create' | 'remove' | 'release' | 'step';
  gateId?: string;
  traceId?: string;
  stage?: StageName;
  condition?: string;
}

/**
 * Debug gate controls
 */
export class DebugGateControls {
  private container: HTMLElement;
  private gates: Map<string, DebugGate> = new Map();
  private callbacks: GateEventCallback[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  /**
   * Add event listener
   */
  on(callback: GateEventCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Emit event
   */
  private emit(event: GateEvent): void {
    this.callbacks.forEach(cb => cb(event));
  }

  /**
   * Update gates
   */
  updateGates(gates: DebugGate[]): void {
    this.gates.clear();
    gates.forEach(gate => this.gates.set(gate.id, gate));
    this.renderGateList();
  }

  /**
   * Render controls
   */
  private render(): void {
    this.container.innerHTML = '';
    this.container.style.cssText = 'font-family: sans-serif; padding: 16px; background: #1a1f3a; color: #e0e0e0; border-radius: 8px;';

    const wrapper = document.createElement('div');

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'font-size: 14px; font-weight: bold; margin-bottom: 16px; color: #8b93ff;';
    header.textContent = '🐛 Debug Gates';
    wrapper.appendChild(header);

    // Create gate form
    const form = this.renderCreateForm();
    wrapper.appendChild(form);

    // Gate list
    const list = document.createElement('div');
    list.id = 'gate-list';
    list.style.cssText = 'margin-top: 16px;';
    wrapper.appendChild(list);

    this.container.appendChild(wrapper);
    this.renderGateList();
  }

  /**
   * Render create gate form
   */
  private renderCreateForm(): HTMLElement {
    const form = document.createElement('div');
    form.style.cssText = 'background: #252b4d; padding: 12px; border-radius: 4px; margin-bottom: 16px;';

    form.innerHTML = `
      <div style="margin-bottom: 8px;">
        <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #8b93ff;">Trace ID</label>
        <input type="text" id="gate-trace-id" placeholder="trace_..." style="width: 100%; padding: 6px; background: #1a1f3a; border: 1px solid #3a405d; border-radius: 4px; color: #e0e0e0; font-size: 12px;">
      </div>
      <div style="margin-bottom: 8px;">
        <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #8b93ff;">Stage</label>
        <select id="gate-stage" style="width: 100%; padding: 6px; background: #1a1f3a; border: 1px solid #3a405d; border-radius: 4px; color: #e0e0e0; font-size: 12px;">
          <option value="ingress">Ingress</option>
          <option value="route-manager">Route Manager</option>
          <option value="lcc">LCC</option>
          <option value="handler">Handler</option>
          <option value="module">Module</option>
        </select>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #8b93ff;">Condition (optional)</label>
        <input type="text" id="gate-condition" placeholder="e.g., userId === '123'" style="width: 100%; padding: 6px; background: #1a1f3a; border: 1px solid #3a405d; border-radius: 4px; color: #e0e0e0; font-size: 12px;">
      </div>
      <button id="create-gate-btn" style="width: 100%; padding: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 4px; color: white; font-weight: 600; cursor: pointer; font-size: 12px;">
        Create Gate
      </button>
    `;

    const btn = form.querySelector('#create-gate-btn') as HTMLButtonElement;
    btn.onclick = () => this.handleCreateGate();

    return form;
  }

  /**
   * Handle create gate
   */
  private handleCreateGate(): void {
    const traceId = (document.getElementById('gate-trace-id') as HTMLInputElement).value;
    const stage = (document.getElementById('gate-stage') as HTMLSelectElement).value as StageName;
    const condition = (document.getElementById('gate-condition') as HTMLInputElement).value;

    if (!traceId) {
      alert('Trace ID required');
      return;
    }

    this.emit({
      type: 'create',
      traceId,
      stage,
      condition: condition || undefined,
    });

    // Clear form
    (document.getElementById('gate-trace-id') as HTMLInputElement).value = '';
    (document.getElementById('gate-condition') as HTMLInputElement).value = '';
  }

  /**
   * Render gate list
   */
  private renderGateList(): void {
    const list = document.getElementById('gate-list');
    if (!list) return;

    list.innerHTML = '';

    if (this.gates.size === 0) {
      list.innerHTML = '<div style="font-size: 12px; color: #6b7280; text-align: center; padding: 16px;">No active gates</div>';
      return;
    }

    this.gates.forEach(gate => {
      const item = this.renderGateItem(gate);
      list.appendChild(item);
    });
  }

  /**
   * Render gate item
   */
  private renderGateItem(gate: DebugGate): HTMLElement {
    const item = document.createElement('div');
    item.style.cssText = 'background: #252b4d; padding: 12px; border-radius: 4px; margin-bottom: 8px; border-left: 3px solid';
    
    const statusColors = {
      active: '#3b82f6',
      triggered: '#f59e0b',
      released: '#22c55e',
    };
    item.style.borderLeftColor = statusColors[gate.status];

    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';
    header.innerHTML = `
      <div style="font-size: 12px; font-weight: bold; color: #e0e0e0;">${gate.stage}</div>
      <div style="font-size: 10px; padding: 2px 6px; background: ${statusColors[gate.status]}; border-radius: 3px; color: white;">${gate.status}</div>
    `;
    item.appendChild(header);

    const info = document.createElement('div');
    info.style.cssText = 'font-size: 11px; color: #9ca3af; margin-bottom: 8px;';
    info.innerHTML = `
      <div>Trace: ${gate.traceId}</div>
      ${gate.condition ? `<div>Condition: ${gate.condition}</div>` : ''}
    `;
    item.appendChild(info);

    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 8px;';

    if (gate.status === 'triggered') {
      const releaseBtn = this.createButton('Resume', '#22c55e', () => {
        this.emit({ type: 'release', gateId: gate.id });
      });
      const stepBtn = this.createButton('Step', '#f59e0b', () => {
        this.emit({ type: 'step', gateId: gate.id });
      });
      actions.appendChild(releaseBtn);
      actions.appendChild(stepBtn);
    }

    const removeBtn = this.createButton('Remove', '#ef4444', () => {
      this.emit({ type: 'remove', gateId: gate.id });
    });
    actions.appendChild(removeBtn);

    item.appendChild(actions);
    return item;
  }

  /**
   * Create button
   */
  private createButton(text: string, color: string, onClick: () => void): HTMLElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `flex: 1; padding: 6px; background: ${color}; border: none; border-radius: 4px; color: white; font-size: 11px; font-weight: 600; cursor: pointer;`;
    btn.onclick = onClick;
    return btn;
  }
}

/**
 * Create controls instance
 */
export function createDebugGateControls(container: HTMLElement): DebugGateControls {
  return new DebugGateControls(container);
}
