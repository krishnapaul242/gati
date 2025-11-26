# Hybrid Cloud Observability

Mix and match providers based on your needs and budget.

## Strategy

- **Metrics**: Prometheus (self-hosted, cost-effective)
- **Tracing**: Jaeger (open-source, powerful)
- **Error Tracking**: Sentry (specialized, excellent UX)

## Why Hybrid?

### Cost Optimization
- Prometheus for high-volume metrics (free)
- Jaeger for detailed traces (self-hosted)
- Sentry only for errors (low volume, high value)

### Best-of-Breed
- Use the best tool for each concern
- Avoid vendor lock-in
- Optimize for your specific needs

## Configuration

```typescript
const observability = {
  metrics: new PrometheusAdapter({ serviceName: 'app' }),
  tracing: new JaegerAdapter({ serviceName: 'app' }),
  logging: new SentryAdapter({ dsn: process.env.SENTRY_DSN }),
};
```

## Use Cases

### Startup (Cost-Conscious)
- Prometheus + Jaeger + Sentry free tier
- Total cost: ~$0-26/month

### Scale-Up (Performance-Focused)
- Prometheus + Datadog APM + Sentry
- Best tracing, cost-effective metrics

### Enterprise (Compliance-Required)
- CloudWatch + X-Ray + Sentry
- AWS-native, audit-ready

## Trade-offs

| Approach | Cost | Features | Complexity |
|----------|------|----------|------------|
| All AWS | $$$ | Good | Low |
| All Datadog | $$$$ | Excellent | Low |
| Self-Hosted | $ | Good | High |
| Hybrid | $$ | Excellent | Medium |

## Getting Started

```bash
# Set up Prometheus + Jaeger
docker-compose up -d

# Configure Sentry
export SENTRY_DSN=your-dsn

# Start app
pnpm start
```
