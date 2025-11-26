# AWS Production Observability Setup

Complete AWS-native observability stack using CloudWatch and X-Ray.

## Stack

- **Metrics**: CloudWatch Metrics
- **Tracing**: AWS X-Ray
- **Logging**: CloudWatch Logs

## Prerequisites

- AWS Account with appropriate IAM permissions
- AWS CLI configured
- X-Ray daemon running (for local testing)

## IAM Permissions Required

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

## Configuration

Set environment variables:

```bash
export AWS_REGION=us-east-1
export XRAY_DAEMON_ADDRESS=localhost:2000
```

## Running Locally

```bash
# Start X-Ray daemon
docker run --rm -p 2000:2000/udp amazon/aws-xray-daemon

# Start application
pnpm start
```

## Deployment

Deploy to EKS with X-Ray daemon sidecar:

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: app
        image: your-app
      - name: xray-daemon
        image: amazon/aws-xray-daemon
        ports:
        - containerPort: 2000
          protocol: UDP
```

## Cost Optimization

- Use metric filters to reduce CloudWatch costs
- Set appropriate log retention periods
- Use X-Ray sampling to reduce trace volume
