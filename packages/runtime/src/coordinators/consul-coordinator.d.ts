import type { LifecycleCoordinator, HealthStatus } from '../types/context.js';
export interface ConsulConfig {
    host: string;
    port: number;
    serviceName: string;
    serviceId: string;
    servicePort: number;
    healthCheckPath: string;
    healthCheckInterval: string;
    tags?: string[];
}
export declare class ConsulCoordinator implements LifecycleCoordinator {
    private config;
    private shutdownHandlers;
    constructor(config: ConsulConfig);
    register(): Promise<void>;
    deregister(): Promise<void>;
    reportHealth(status: HealthStatus): Promise<void>;
    onCoordinatedShutdown(fn: () => Promise<void>): void;
}
