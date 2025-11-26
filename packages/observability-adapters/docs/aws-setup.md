# AWS Observability Setup Guide

Complete guide for setting up AWS CloudWatch and X-Ray with Gati.

## Prerequisites

- AWS Account
- AWS CLI configured
- IAM permissions for CloudWatch and X-Ray

## Quick Start

```bash
npm install @gati-framework/observability-adapters
npm install @aws-sdk/client-cloudwatch @aws-sdk/client-cloudwatch-logs aws-xray-sdk-core
```

```typescript
import { createAWSPreset } from '@gati-framework/observability-adapters/presets';

const observability = createAWSPreset({
  region: 'us-east-1',
  namespace: 'my-app',
  logGroupName: '/aws/gati/my-app',
  logStreamName: 'production',
  serviceName: 'my-app'
});
```

## IAM Permissions

### Required Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

### IAM Role for EKS

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: gati-app
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT_ID:role/gati-observability-role
```

## CloudWatch Metrics

### Configuration

```typescript
import { CloudWatchMetricsAdapter } from '@gati-framework/observability-adapters/aws';

const metrics = new CloudWatchMetricsAdapter({
  region: 'us-east-1',
  namespace: 'MyApp/Production',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  },
  // Optional: Use default dimensions
  defaultDimensions: {
    Environment: 'production',
    Service: 'api'
  }
});
```

### Usage

```typescript
// Counter
metrics.incrementCounter('ApiRequests', { Endpoint: '/users' });

// Gauge
metrics.setGauge('ActiveConnections', 42, { Instance: 'i-123' });

// Histogram (stored as CloudWatch distribution)
metrics.recordHistogram('RequestDuration', 123.45, { Endpoint: '/users' });
```

### Viewing Metrics

1. Open AWS Console → CloudWatch → Metrics
2. Select namespace: `MyApp/Production`
3. View metrics by dimension

### Creating Alarms

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name high-error-rate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name ErrorRate \
  --namespace MyApp/Production \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

## CloudWatch Logs

### Configuration

```typescript
import { CloudWatchLogsAdapter } from '@gati-framework/observability-adapters/aws';

const logger = new CloudWatchLogsAdapter({
  region: 'us-east-1',
  logGroupName: '/aws/gati/my-app',
  logStreamName: 'production',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  },
  // Optional: Batch settings
  batchSize: 100,
  flushInterval: 5000 // 5 seconds
});
```

### Usage

```typescript
logger.info('User logged in', { userId: '123', ip: '1.2.3.4' });
logger.error('Database error', { error: err.message, query: 'SELECT...' });
```

### Viewing Logs

1. Open AWS Console → CloudWatch → Log groups
2. Select log group: `/aws/gati/my-app`
3. Select log stream: `production`

### Log Insights Queries

```sql
-- Find errors in last hour
fields @timestamp, @message, error
| filter @message like /error/
| sort @timestamp desc
| limit 100

-- Request duration statistics
fields @timestamp, duration
| stats avg(duration), max(duration), min(duration) by bin(5m)

-- Top endpoints by request count
fields endpoint
| stats count() by endpoint
| sort count() desc
```

## AWS X-Ray

### Configuration

```typescript
import { XRayAdapter } from '@gati-framework/observability-adapters/aws';

const tracing = new XRayAdapter({
  serviceName: 'my-app',
  daemonAddress: 'localhost:2000',
  plugins: ['EC2Plugin', 'ECSPlugin'],
  // Optional: Sampling rules
  samplingRules: {
    version: 2,
    default: {
      fixed_target: 1,
      rate: 0.1
    }
  }
});
```

### X-Ray Daemon

#### Docker

```yaml
# docker-compose.yml
services:
  xray-daemon:
    image: amazon/aws-xray-daemon
    ports:
      - "2000:2000/udp"
    environment:
      - AWS_REGION=us-east-1
```

#### Kubernetes

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: xray-daemon
spec:
  selector:
    matchLabels:
      app: xray-daemon
  template:
    metadata:
      labels:
        app: xray-daemon
    spec:
      containers:
      - name: xray-daemon
        image: amazon/aws-xray-daemon
        ports:
        - containerPort: 2000
          protocol: UDP
```

### Usage

```typescript
await tracing.withSpan('database-query', async (span) => {
  span.setAttribute('db.system', 'postgresql');
  span.setAttribute('db.operation', 'SELECT');
  
  const result = await db.query('SELECT * FROM users');
  
  span.setAttribute('db.rows', result.length);
  span.setStatus('ok');
});
```

### Viewing Traces

1. Open AWS Console → X-Ray → Service map
2. View service dependencies and latencies
3. Click on service → View traces
4. Analyze individual trace details

### Service Map

X-Ray automatically creates a service map showing:
- Service dependencies
- Request rates
- Error rates
- Latency percentiles

## Cost Optimization

### CloudWatch Metrics

- **Free tier**: 10 custom metrics
- **Cost**: $0.30 per metric per month
- **Tip**: Use dimensions wisely to avoid metric explosion

### CloudWatch Logs

- **Free tier**: 5 GB ingestion
- **Cost**: $0.50 per GB ingested
- **Tip**: Set log retention policies

```bash
aws logs put-retention-policy \
  --log-group-name /aws/gati/my-app \
  --retention-in-days 7
```

### X-Ray

- **Free tier**: 100,000 traces per month
- **Cost**: $5.00 per 1 million traces
- **Tip**: Use sampling to reduce costs

```typescript
samplingRules: {
  default: {
    fixed_target: 1,  // Always trace 1 request per second
    rate: 0.05        // Then 5% of additional requests
  }
}
```

## Kubernetes Integration

### Complete Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gati-app
spec:
  template:
    spec:
      serviceAccountName: gati-app
      containers:
      - name: app
        image: my-app:latest
        env:
        - name: AWS_REGION
          value: us-east-1
        - name: XRAY_DAEMON_ADDRESS
          value: xray-daemon:2000
      - name: xray-daemon
        image: amazon/aws-xray-daemon
        ports:
        - containerPort: 2000
          protocol: UDP
```

## Troubleshooting

### Metrics not appearing

```bash
# Check IAM permissions
aws sts get-caller-identity

# Test metric submission
aws cloudwatch put-metric-data \
  --namespace Test \
  --metric-name TestMetric \
  --value 1
```

### Logs not being sent

```bash
# Check log group exists
aws logs describe-log-groups --log-group-name-prefix /aws/gati

# Create log group if missing
aws logs create-log-group --log-group-name /aws/gati/my-app
```

### X-Ray traces missing

```bash
# Check X-Ray daemon is running
curl http://localhost:2000

# Check IAM permissions
aws xray put-trace-segments --trace-segment-documents '[{"id":"test"}]'
```

## Best Practices

1. **Use IAM roles** instead of access keys in production
2. **Set log retention** to control costs
3. **Use sampling** for high-traffic applications
4. **Tag resources** for cost allocation
5. **Create alarms** for critical metrics
6. **Use Log Insights** for log analysis
7. **Monitor X-Ray service map** for dependencies

## See Also

- [Integration Guide](../../contracts/docs/integration-guide.md)
- [Datadog Setup](./datadog-setup.md)
- [Self-Hosted Setup](./self-hosted-setup.md)
