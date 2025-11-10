/**
 * @module cloud-aws/networking
 * @description AWS Load Balancer and networking configuration
 */

import {
  ElasticLoadBalancingV2Client,
  CreateLoadBalancerCommand,
  DeleteLoadBalancerCommand,
  DescribeLoadBalancersCommand,
  CreateTargetGroupCommand,
  CreateListenerCommand,
  ModifyTargetGroupCommand,
  type LoadBalancer,
  type TargetGroup,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import type {
  LoadBalancerConfig,
  LoadBalancerInfo,
} from '@gati-framework/core/cloud-provider';

/**
 * AWS Application Load Balancer manager
 */
export class AWSLoadBalancer {
  private client: ElasticLoadBalancingV2Client;
  private region: string;

  constructor(region: string = 'us-east-1') {
    this.region = region;
    this.client = new ElasticLoadBalancingV2Client({ region });
  }

  /**
   * Create Application Load Balancer
   */
  async createLoadBalancer(config: LoadBalancerConfig): Promise<LoadBalancerInfo> {
    const name = `gati-alb-${Date.now()}`;

    // Create load balancer
    const createLBCommand = new CreateLoadBalancerCommand({
      Name: name,
      Subnets: [], // Will be filled from VPC config
      Scheme: config.scheme,
      Type: config.type === 'application' ? 'application' : 'network',
      IpAddressType: 'ipv4',
      Tags: [
        {
          Key: 'ManagedBy',
          Value: 'Gati',
        },
      ],
    });

    const lbResponse = await this.client.send(createLBCommand);
    const loadBalancer = lbResponse.LoadBalancers![0];

    // Create target group
    const targetGroup = await this.createTargetGroup(name, config);

    // Create listener
    await this.createListener(loadBalancer, targetGroup, config);

    return {
      name: loadBalancer.LoadBalancerName!,
      endpoint: loadBalancer.DNSName!,
      status: loadBalancer.State?.Code || 'unknown',
    };
  }

  /**
   * Create target group for load balancer
   */
  private async createTargetGroup(
    name: string,
    config: LoadBalancerConfig
  ): Promise<TargetGroup> {
    const createTGCommand = new CreateTargetGroupCommand({
      Name: `${name}-tg`,
      Protocol: config.healthCheck?.protocol || 'HTTP',
      Port: config.targetPort,
      VpcId: '', // Will be filled from VPC config
      TargetType: 'ip',
      HealthCheckEnabled: true,
      HealthCheckPath: config.healthCheck?.path || '/health',
      HealthCheckProtocol: config.healthCheck?.protocol || 'HTTP',
      HealthCheckIntervalSeconds: config.healthCheck?.intervalSeconds || 30,
      HealthCheckTimeoutSeconds: config.healthCheck?.timeoutSeconds || 5,
      HealthyThresholdCount: config.healthCheck?.healthyThreshold || 2,
      UnhealthyThresholdCount: config.healthCheck?.unhealthyThreshold || 2,
    });

    const tgResponse = await this.client.send(createTGCommand);
    return tgResponse.TargetGroups![0];
  }

  /**
   * Create listener for load balancer
   */
  private async createListener(
    loadBalancer: LoadBalancer,
    targetGroup: TargetGroup,
    config: LoadBalancerConfig
  ): Promise<void> {
    const createListenerCommand = new CreateListenerCommand({
      LoadBalancerArn: loadBalancer.LoadBalancerArn,
      Protocol: config.ssl ? 'HTTPS' : 'HTTP',
      Port: config.ssl ? 443 : 80,
      DefaultActions: [
        {
          Type: 'forward',
          TargetGroupArn: targetGroup.TargetGroupArn,
        },
      ],
      Certificates: config.ssl?.certificateId
        ? [{ CertificateArn: config.ssl.certificateId }]
        : undefined,
      SslPolicy: config.ssl?.sslPolicy || 'ELBSecurityPolicy-2016-08',
    });

    await this.client.send(createListenerCommand);

    // Create HTTP to HTTPS redirect if configured
    if (config.ssl?.redirectHttp) {
      const redirectListenerCommand = new CreateListenerCommand({
        LoadBalancerArn: loadBalancer.LoadBalancerArn,
        Protocol: 'HTTP',
        Port: 80,
        DefaultActions: [
          {
            Type: 'redirect',
            RedirectConfig: {
              Protocol: 'HTTPS',
              Port: '443',
              StatusCode: 'HTTP_301',
            },
          },
        ],
      });

      await this.client.send(redirectListenerCommand);
    }
  }

  /**
   * Delete load balancer
   */
  async deleteLoadBalancer(name: string): Promise<void> {
    // Get load balancer ARN
    const describeLBCommand = new DescribeLoadBalancersCommand({
      Names: [name],
    });

    const lbResponse = await this.client.send(describeLBCommand);
    const loadBalancer = lbResponse.LoadBalancers![0];

    // Delete load balancer
    const deleteLBCommand = new DeleteLoadBalancerCommand({
      LoadBalancerArn: loadBalancer.LoadBalancerArn,
    });

    await this.client.send(deleteLBCommand);
  }

  /**
   * Get load balancer information
   */
  async getLoadBalancer(name: string): Promise<LoadBalancerInfo> {
    const describeLBCommand = new DescribeLoadBalancersCommand({
      Names: [name],
    });

    const response = await this.client.send(describeLBCommand);
    const loadBalancer = response.LoadBalancers![0];

    return {
      name: loadBalancer.LoadBalancerName!,
      endpoint: loadBalancer.DNSName!,
      status: loadBalancer.State?.Code || 'unknown',
    };
  }
}
