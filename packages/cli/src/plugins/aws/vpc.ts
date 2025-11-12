/**
 * @module plugins/aws/vpc
 * @description VPC and networking configuration for AWS EKS
 */

import type { VPCConfig } from './types';

/**
 * Generate CloudFormation template for VPC
 */
export function generateVPCTemplate(config: VPCConfig, clusterName: string): string {
  const template = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: `VPC for Gati EKS cluster: ${clusterName}`,
    
    Parameters: {
      ClusterName: {
        Type: 'String',
        Default: clusterName,
        Description: 'Name of the EKS cluster',
      },
    },
    
    Resources: {
      VPC: {
        Type: 'AWS::EC2::VPC',
        Properties: {
          CidrBlock: config.cidr,
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
          Tags: [
            { Key: 'Name', Value: `${clusterName}-vpc` },
            { Key: 'kubernetes.io/cluster/' + clusterName, Value: 'shared' },
          ],
        },
      },
      
      InternetGateway: {
        Type: 'AWS::EC2::InternetGateway',
        Properties: {
          Tags: [{ Key: 'Name', Value: `${clusterName}-igw` }],
        },
      },
      
      InternetGatewayAttachment: {
        Type: 'AWS::EC2::VPCGatewayAttachment',
        Properties: {
          InternetGatewayId: { Ref: 'InternetGateway' },
          VpcId: { Ref: 'VPC' },
        },
      },
      
      ...generateSubnetResources(config, clusterName),
      ...generateRouteTableResources(config, clusterName),
      ...(config.enableNat ? generateNATResources(config, clusterName) : {}),
    },
    
    Outputs: {
      VpcId: {
        Value: { Ref: 'VPC' },
        Export: { Name: `${clusterName}-VpcId` },
      },
      PublicSubnetIds: {
        Value: {
          'Fn::Join': [
            ',',
            config.publicSubnets.map((_, i) => ({ Ref: `PublicSubnet${i + 1}` })),
          ],
        },
        Export: { Name: `${clusterName}-PublicSubnetIds` },
      },
      PrivateSubnetIds: {
        Value: {
          'Fn::Join': [
            ',',
            config.privateSubnets.map((_, i) => ({ Ref: `PrivateSubnet${i + 1}` })),
          ],
        },
        Export: { Name: `${clusterName}-PrivateSubnetIds` },
      },
    },
  };
  
  return JSON.stringify(template, null, 2);
}

/**
 * Generate subnet resources
 */
function generateSubnetResources(config: VPCConfig, clusterName: string): Record<string, any> {
  const resources: Record<string, any> = {};
  
  // Public subnets
  config.publicSubnets.forEach((cidr, index) => {
    const subnetName = `PublicSubnet${index + 1}`;
    resources[subnetName] = {
      Type: 'AWS::EC2::Subnet',
      Properties: {
        VpcId: { Ref: 'VPC' },
        CidrBlock: cidr,
        AvailabilityZone: config.availabilityZones[index % config.availabilityZones.length],
        MapPublicIpOnLaunch: true,
        Tags: [
          { Key: 'Name', Value: `${clusterName}-public-${index + 1}` },
          { Key: 'kubernetes.io/role/elb', Value: '1' },
          { Key: 'kubernetes.io/cluster/' + clusterName, Value: 'shared' },
        ],
      },
    };
  });
  
  // Private subnets
  config.privateSubnets.forEach((cidr, index) => {
    const subnetName = `PrivateSubnet${index + 1}`;
    resources[subnetName] = {
      Type: 'AWS::EC2::Subnet',
      Properties: {
        VpcId: { Ref: 'VPC' },
        CidrBlock: cidr,
        AvailabilityZone: config.availabilityZones[index % config.availabilityZones.length],
        MapPublicIpOnLaunch: false,
        Tags: [
          { Key: 'Name', Value: `${clusterName}-private-${index + 1}` },
          { Key: 'kubernetes.io/role/internal-elb', Value: '1' },
          { Key: 'kubernetes.io/cluster/' + clusterName, Value: 'shared' },
        ],
      },
    };
  });
  
  return resources;
}

/**
 * Generate route table resources
 */
function generateRouteTableResources(config: VPCConfig, clusterName: string): Record<string, any> {
  const resources: Record<string, any> = {};
  
  // Public route table
  resources['PublicRouteTable'] = {
    Type: 'AWS::EC2::RouteTable',
    Properties: {
      VpcId: { Ref: 'VPC' },
      Tags: [{ Key: 'Name', Value: `${clusterName}-public-rt` }],
    },
  };
  
  resources['PublicRoute'] = {
    Type: 'AWS::EC2::Route',
    DependsOn: 'InternetGatewayAttachment',
    Properties: {
      RouteTableId: { Ref: 'PublicRouteTable' },
      DestinationCidrBlock: '0.0.0.0/0',
      GatewayId: { Ref: 'InternetGateway' },
    },
  };
  
  // Associate public subnets with public route table
  config.publicSubnets.forEach((_, index) => {
    resources[`PublicSubnetRouteTableAssociation${index + 1}`] = {
      Type: 'AWS::EC2::SubnetRouteTableAssociation',
      Properties: {
        RouteTableId: { Ref: 'PublicRouteTable' },
        SubnetId: { Ref: `PublicSubnet${index + 1}` },
      },
    };
  });
  
  // Private route tables (one per AZ if NAT enabled)
  if (config.enableNat) {
    config.privateSubnets.forEach((_, index) => {
      const rtName = `PrivateRouteTable${index + 1}`;
      resources[rtName] = {
        Type: 'AWS::EC2::RouteTable',
        Properties: {
          VpcId: { Ref: 'VPC' },
          Tags: [{ Key: 'Name', Value: `${clusterName}-private-rt-${index + 1}` }],
        },
      };
      
      resources[`PrivateRoute${index + 1}`] = {
        Type: 'AWS::EC2::Route',
        Properties: {
          RouteTableId: { Ref: rtName },
          DestinationCidrBlock: '0.0.0.0/0',
          NatGatewayId: { Ref: `NATGateway${index + 1}` },
        },
      };
      
      resources[`PrivateSubnetRouteTableAssociation${index + 1}`] = {
        Type: 'AWS::EC2::SubnetRouteTableAssociation',
        Properties: {
          RouteTableId: { Ref: rtName },
          SubnetId: { Ref: `PrivateSubnet${index + 1}` },
        },
      };
    });
  }
  
  return resources;
}

/**
 * Generate NAT gateway resources
 */
function generateNATResources(config: VPCConfig, clusterName: string): Record<string, any> {
  const resources: Record<string, any> = {};
  
  // Create NAT gateway for each public subnet
  config.publicSubnets.forEach((_, index) => {
    resources[`NATGatewayEIP${index + 1}`] = {
      Type: 'AWS::EC2::EIP',
      DependsOn: 'InternetGatewayAttachment',
      Properties: {
        Domain: 'vpc',
        Tags: [{ Key: 'Name', Value: `${clusterName}-nat-eip-${index + 1}` }],
      },
    };
    
    resources[`NATGateway${index + 1}`] = {
      Type: 'AWS::EC2::NATGateway',
      Properties: {
        AllocationId: { 'Fn::GetAtt': [`NATGatewayEIP${index + 1}`, 'AllocationId'] },
        SubnetId: { Ref: `PublicSubnet${index + 1}` },
        Tags: [{ Key: 'Name', Value: `${clusterName}-nat-${index + 1}` }],
      },
    };
  });
  
  return resources;
}

/**
 * Validate VPC configuration
 */
export function validateVPCConfig(config: VPCConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate CIDR block
  if (!isValidCIDR(config.cidr)) {
    errors.push(`Invalid VPC CIDR: ${config.cidr}`);
  }
  
  // Validate subnets
  if (config.publicSubnets.length === 0) {
    errors.push('At least one public subnet is required');
  }
  
  if (config.privateSubnets.length === 0) {
    errors.push('At least one private subnet is required');
  }
  
  // Validate availability zones
  if (config.availabilityZones.length < 2) {
    errors.push('At least two availability zones are required for high availability');
  }
  
  // Validate subnet CIDRs
  [...config.publicSubnets, ...config.privateSubnets].forEach((cidr) => {
    if (!isValidCIDR(cidr)) {
      errors.push(`Invalid subnet CIDR: ${cidr}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Simple CIDR validation
 */
function isValidCIDR(cidr: string): boolean {
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  return cidrRegex.test(cidr);
}

/**
 * Generate default VPC configuration
 */
export function getDefaultVPCConfig(region: string): VPCConfig {
  // Get availability zones for region (simplified - would query AWS in production)
  const azSuffixes = ['a', 'b', 'c'];
  const availabilityZones = azSuffixes.map((suffix) => `${region}${suffix}`);
  
  return {
    cidr: '10.0.0.0/16',
    availabilityZones: availabilityZones.slice(0, 2), // Use 2 AZs
    publicSubnets: [
      '10.0.1.0/24',
      '10.0.2.0/24',
    ],
    privateSubnets: [
      '10.0.10.0/24',
      '10.0.11.0/24',
    ],
    enableNat: true,
    enableFlowLogs: false,
  };
}
