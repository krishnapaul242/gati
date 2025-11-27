/**
 * @module playground/components/RequestFlowDiagram
 * @description Visualizes request pipeline stages as a flow diagram
 */

import type { RequestTrace, TraceStage } from '@gati-framework/runtime';

/**
 * Diagram configuration
 */
export interface DiagramConfig {
  width: number;
  height: number;
  stageWidth: number;
  stageHeight: number;
  stageGap: number;
  colors: {
    ingress: string;
    'route-manager': string;
    lcc: string;
    handler: string;
    module: string;
    error: string;
  };
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: DiagramConfig = {
  width: 800,
  height: 400,
  stageWidth: 120,
  stageHeight: 60,
  stageGap: 40,
  colors: {
    ingress: '#3b82f6',
    'route-manager': '#8b5cf6',
    lcc: '#ec4899',
    handler: '#22c55e',
    module: '#f59e0b',
    error: '#ef4444',
  },
};

/**
 * Request flow diagram renderer
 */
export class RequestFlowDiagram {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: DiagramConfig;
  private trace: RequestTrace | null = null;

  constructor(canvas: HTMLCanvasElement, config?: Partial<DiagramConfig>) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupCanvas();
  }

  /**
   * Setup canvas dimensions
   */
  private setupCanvas(): void {
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    this.canvas.style.width = `${this.config.width}px`;
    this.canvas.style.height = `${this.config.height}px`;
  }

  /**
   * Render trace
   */
  render(trace: RequestTrace): void {
    this.trace = trace;
    this.clear();
    
    if (!trace.stages || trace.stages.length === 0) {
      this.renderEmpty();
      return;
    }

    this.renderStages(trace.stages);
    this.renderConnections(trace.stages);
    this.renderTimings(trace);
  }

  /**
   * Clear canvas
   */
  private clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Render empty state
   */
  private renderEmpty(): void {
    this.ctx.fillStyle = '#6b7280';
    this.ctx.font = '14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('No trace data', this.canvas.width / 2, this.canvas.height / 2);
  }

  /**
   * Render stages
   */
  private renderStages(stages: TraceStage[], level = 0, offsetX = 50): number {
    let x = offsetX;
    const y = 100 + level * 100;

    for (const stage of stages) {
      this.renderStage(stage, x, y);
      x += this.config.stageWidth + this.config.stageGap;

      if (stage.children && stage.children.length > 0) {
        x = this.renderStages(stage.children, level + 1, x);
      }
    }

    return x;
  }

  /**
   * Render single stage
   */
  private renderStage(stage: TraceStage, x: number, y: number): void {
    const { stageWidth, stageHeight, colors } = this.config;
    const color = colors[stage.name] || '#6b7280';
    const hasError = this.trace?.status === 'error';

    // Box
    this.ctx.fillStyle = hasError ? colors.error : color;
    this.ctx.fillRect(x, y, stageWidth, stageHeight);

    // Border
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, stageWidth, stageHeight);

    // Label
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(stage.name, x + stageWidth / 2, y + stageHeight / 2 - 5);

    // Duration
    if (stage.endTime) {
      const duration = stage.endTime - stage.startTime;
      this.ctx.font = '10px sans-serif';
      this.ctx.fillText(`${duration}ms`, x + stageWidth / 2, y + stageHeight / 2 + 10);
    }
  }

  /**
   * Render connections between stages
   */
  private renderConnections(stages: TraceStage[], level = 0, offsetX = 50): void {
    const y = 100 + level * 100 + this.config.stageHeight / 2;
    let x = offsetX + this.config.stageWidth;

    for (let i = 0; i < stages.length - 1; i++) {
      this.ctx.strokeStyle = '#667eea';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + this.config.stageGap, y);
      this.ctx.stroke();

      // Arrow
      this.ctx.beginPath();
      this.ctx.moveTo(x + this.config.stageGap - 5, y - 5);
      this.ctx.lineTo(x + this.config.stageGap, y);
      this.ctx.lineTo(x + this.config.stageGap - 5, y + 5);
      this.ctx.stroke();

      x += this.config.stageWidth + this.config.stageGap;
    }
  }

  /**
   * Render timing information
   */
  private renderTimings(trace: RequestTrace): void {
    this.ctx.fillStyle = '#e0e0e0';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'left';
    
    const info = [
      `Status: ${trace.status}`,
      `Duration: ${trace.duration}ms`,
      `Stages: ${trace.stages.length}`,
    ];

    info.forEach((text, i) => {
      this.ctx.fillText(text, 10, 20 + i * 20);
    });
  }

  /**
   * Export as image
   */
  toDataURL(): string {
    return this.canvas.toDataURL('image/png');
  }
}

/**
 * Create diagram instance
 */
export function createRequestFlowDiagram(
  canvas: HTMLCanvasElement,
  config?: Partial<DiagramConfig>
): RequestFlowDiagram {
  return new RequestFlowDiagram(canvas, config);
}
