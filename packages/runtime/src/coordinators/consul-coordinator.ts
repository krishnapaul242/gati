/**
 * @module runtime/coordinators/consul-coordinator
 * @description Consul-based lifecycle coordinator for service discovery and health management
 */

import type { LifecycleCoordinator, HealthStatus } from '../types/context.js';

/**
 * Consul configuration
 */
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

/**
 * Consul-based lifecycle coordinator
 */
export class ConsulCoordinator implements LifecycleCoordinator {
  private config: ConsulConfig;
  private shutdownHandlers: Array<() => Promise<void>> = [];

  constructor(config: ConsulConfig) {
    this.config = config;
  }

  /**
   * Register service with Consul
   */
  async register(): Promise<void> {
    const serviceDefinition = {
      ID: this.config.serviceId,
      Name: this.config.serviceName,
      Port: this.config.servicePort,
      Tags: this.config.tags || [],
      Check: {
        HTTP: `http://localhost:${this.config.servicePort}${this.config.healthCheckPath}`,
        Interval: this.config.healthCheckInterval,
        Timeout: '10s',
        DeregisterCriticalServiceAfter: '30s',
      },
    };

    try {
      const response = await fetch(`http://${this.config.host}:${this.config.port}/v1/agent/service/register`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceDefinition),
      });

      if (!response.ok) {
        throw new Error(`Failed to register service: ${response.statusText}`);
      }

      console.log(`✅ Service registered with Consul: ${this.config.serviceId}`);
    } catch (error) {
      console.error('❌ Failed to register with Consul:', error);
      throw error;
    }
  }

  /**
   * Deregister service from Consul
   */
  async deregister(): Promise<void> {
    try {
      const response = await fetch(`http://${this.config.host}:${this.config.port}/v1/agent/service/deregister/${this.config.serviceId}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error(`Failed to deregister service: ${response.statusText}`);
      }

      console.log(`✅ Service deregistered from Consul: ${this.config.serviceId}`);
    } catch (error) {
      console.error('❌ Failed to deregister from Consul:', error);
    }
  }

  /**
   * Report health status to Consul
   */
  async reportHealth(status: HealthStatus): Promise<void> {
    const checkStatus = status.status === 'healthy' ? 'pass' : 
                       status.status === 'degraded' ? 'warn' : 'fail';
    
    try {
      const response = await fetch(`http://${this.config.host}:${this.config.port}/v1/agent/check/update/service:${this.config.serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Status: checkStatus,
          Output: JSON.stringify(status.checks),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update health check: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Failed to report health to Consul:', error);
    }
  }

  /**
   * Listen for coordinated shutdown signals
   */
  onCoordinatedShutdown(fn: () => Promise<void>): void {
    this.shutdownHandlers.push(fn);
    
    process.on('SIGTERM', async () => {
      console.log('📡 Received coordinated shutdown signal (SIGTERM)');
      for (const handler of this.shutdownHandlers) {
        try {
          await handler();
        } catch (error) {
          console.error('Coordinated shutdown handler failed:', error);
        }
      }
    });

    process.on('SIGINT', async () => {
      console.log('📡 Received shutdown signal (SIGINT)');
      for (const handler of this.shutdownHandlers) {
        try {
          await handler();
        } catch (error) {
          console.error('Shutdown handler failed:', error);
        }
      }
      process.exit(0);
    });
  }
}