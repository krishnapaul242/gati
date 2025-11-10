/**
 * @module production-hardening/scaling
 * @description Auto-scaling configuration and tuning for optimal performance
 */

/**
 * Scaling metric types
 */
export type ScalingMetric = 'cpu' | 'memory' | 'requests' | 'custom';

/**
 * Scaling policy configuration
 */
export interface ScalingPolicy {
  /** Metric to scale on */
  metric: ScalingMetric;
  /** Target value for the metric */
  targetValue: number;
  /** Minimum replicas */
  minReplicas: number;
  /** Maximum replicas */
  maxReplicas: number;
  /** Scale-up cooldown period (seconds) */
  scaleUpCooldown?: number;
  /** Scale-down cooldown period (seconds) */
  scaleDownCooldown?: number;
  /** Custom metric query (for custom metrics) */
  customQuery?: string;
}

/**
 * Workload type for scaling optimization
 */
export type WorkloadType = 'web' | 'api' | 'batch' | 'stream' | 'custom';

/**
 * Auto-scaling optimizer
 */
export class AutoScalingOptimizer {
  /**
   * Get recommended scaling policy for workload type
   */
  getRecommendedPolicy(workloadType: WorkloadType): ScalingPolicy {
    const policies: Record<WorkloadType, ScalingPolicy> = {
      web: {
        metric: 'cpu',
        targetValue: 70,
        minReplicas: 2,
        maxReplicas: 10,
        scaleUpCooldown: 60,
        scaleDownCooldown: 300,
      },
      api: {
        metric: 'requests',
        targetValue: 1000,
        minReplicas: 3,
        maxReplicas: 20,
        scaleUpCooldown: 30,
        scaleDownCooldown: 180,
      },
      batch: {
        metric: 'cpu',
        targetValue: 80,
        minReplicas: 1,
        maxReplicas: 50,
        scaleUpCooldown: 120,
        scaleDownCooldown: 600,
      },
      stream: {
        metric: 'memory',
        targetValue: 75,
        minReplicas: 2,
        maxReplicas: 15,
        scaleUpCooldown: 45,
        scaleDownCooldown: 240,
      },
      custom: {
        metric: 'cpu',
        targetValue: 75,
        minReplicas: 2,
        maxReplicas: 10,
        scaleUpCooldown: 60,
        scaleDownCooldown: 300,
      },
    };

    return policies[workloadType];
  }

  /**
   * Generate HPA (Horizontal Pod Autoscaler) manifest
   */
  generateHPAManifest(
    appName: string,
    namespace: string,
    policy: ScalingPolicy
  ): string {
    const metricConfig = this.getMetricConfig(policy);

    return `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${appName}-hpa
  namespace: ${namespace}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${appName}
  minReplicas: ${policy.minReplicas}
  maxReplicas: ${policy.maxReplicas}
  metrics:
${metricConfig}
  behavior:
    scaleUp:
      stabilizationWindowSeconds: ${policy.scaleUpCooldown || 60}
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: ${policy.scaleDownCooldown || 300}
      policies:
      - type: Percent
        value: 50
        periodSeconds: 15
      - type: Pods
        value: 2
        periodSeconds: 15
      selectPolicy: Min
`;
  }

  /**
   * Get metric configuration for HPA
   */
  private getMetricConfig(policy: ScalingPolicy): string {
    switch (policy.metric) {
      case 'cpu':
        return `  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: ${policy.targetValue}`;

      case 'memory':
        return `  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: ${policy.targetValue}`;

      case 'requests':
        return `  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "${policy.targetValue}"`;

      case 'custom':
        return `  - type: External
    external:
      metric:
        name: custom_metric
        selector:
          matchLabels:
            query: "${policy.customQuery || ''}"
      target:
        type: AverageValue
        averageValue: "${policy.targetValue}"`;

      default:
        return '';
    }
  }

  /**
   * Calculate optimal replica count based on current metrics
   */
  calculateOptimalReplicas(
    currentReplicas: number,
    currentMetricValue: number,
    targetMetricValue: number,
    minReplicas: number,
    maxReplicas: number
  ): number {
    // Standard HPA algorithm: desiredReplicas = ceil[currentReplicas * (currentMetric / targetMetric)]
    const desiredReplicas = Math.ceil(
      currentReplicas * (currentMetricValue / targetMetricValue)
    );

    // Clamp to min/max bounds
    return Math.max(minReplicas, Math.min(maxReplicas, desiredReplicas));
  }

  /**
   * Validate scaling policy
   */
  validatePolicy(policy: ScalingPolicy): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (policy.minReplicas < 1) {
      errors.push('minReplicas must be at least 1');
    }

    if (policy.maxReplicas < policy.minReplicas) {
      errors.push('maxReplicas must be greater than or equal to minReplicas');
    }

    if (policy.targetValue <= 0 || policy.targetValue > 100) {
      if (policy.metric === 'cpu' || policy.metric === 'memory') {
        errors.push('targetValue for CPU/memory must be between 1 and 100');
      }
    }

    if (policy.metric === 'custom' && !policy.customQuery) {
      errors.push('customQuery is required for custom metrics');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get scaling recommendations based on current usage
   */
  getScalingRecommendations(currentMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    requestRate: number;
    currentReplicas: number;
  }): {
    recommendations: string[];
    suggestedPolicy?: ScalingPolicy;
  } {
    const recommendations: string[] = [];
    let suggestedPolicy: ScalingPolicy | undefined;

    // High CPU usage
    if (currentMetrics.cpuUsage > 80) {
      recommendations.push(
        'CPU usage is high. Consider scaling up or optimizing application code.'
      );
      suggestedPolicy = {
        metric: 'cpu',
        targetValue: 70,
        minReplicas: currentMetrics.currentReplicas,
        maxReplicas: currentMetrics.currentReplicas * 2,
      };
    }

    // High memory usage
    if (currentMetrics.memoryUsage > 85) {
      recommendations.push(
        'Memory usage is high. Consider scaling up or fixing memory leaks.'
      );
    }

    // High request rate
    if (currentMetrics.requestRate > 1000) {
      recommendations.push(
        'High request rate detected. Consider request-based autoscaling.'
      );
    }

    // Low resource usage
    if (
      currentMetrics.cpuUsage < 30 &&
      currentMetrics.memoryUsage < 30 &&
      currentMetrics.currentReplicas > 2
    ) {
      recommendations.push(
        'Resource usage is low. Consider scaling down to save costs.'
      );
    }

    return {
      recommendations,
      suggestedPolicy,
    };
  }
}
