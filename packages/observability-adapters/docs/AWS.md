# AWS Adapters

## Installation

```bash
npm install @gati-framework/observability-adapters
npm install @aws-sdk/client-cloudwatch @aws-sdk/client-cloudwatch-logs aws-xray-sdk-core
```

## CloudWatch Metrics

```typescript
import { CloudWatchMetricsAdapter } from '@gati-framework/observability-adapters/aws';

const metrics = new CloudWatchMetricsAdapter({
  region: 'us-east-1',
  namespace: 'MyApp/Production',
});
```

## CloudWatch Logs

```typescript
import { CloudWatchLogsAdapter } from '@gati-framework/observability-adapters/aws';

const logger = new CloudWatchLogsAdapter({
  region: 'us-east-1',
  logGroupName: '/aws/gati/my-app',
  logStreamName: 'production',
});
```

## X-Ray

```typescript
import { XRayAdapter } from '@gati-framework/observability-adapters/aws';

const tracing = new XRayAdapter({
  serviceName: 'my-app',
  plugins: ['EC2Plugin', 'ECSPlugin'],
});
```

## Preset

```typescript
import { createAWSPreset } from '@gati-framework/observability-adapters/presets';

const observability = createAWSPreset({
  region: 'us-east-1',
  namespace: 'MyApp',
  logGroupName: '/aws/gati/my-app',
  logStreamName: 'production',
  serviceName: 'my-app',
});
```

## IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "cloudwatch:PutMetricData",
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "xray:PutTraceSegments"
    ],
    "Resource": "*"
  }]
}
```
