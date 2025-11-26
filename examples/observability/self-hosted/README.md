# Self-Hosted Observability Stack

Zero-cost observability using open-source tools.

## Stack

- **Metrics**: Prometheus
- **Tracing**: Jaeger
- **Logging**: Loki
- **Visualization**: Grafana

## Quick Start

```bash
# Start all services
docker-compose up -d

# Start your application
pnpm start

# Access dashboards
# Grafana: http://localhost:3000
# Prometheus: http://localhost:9090
# Jaeger: http://localhost:16686
```

## Services

- **Prometheus** (port 9090): Metrics collection and storage
- **Jaeger** (port 16686): Distributed tracing
- **Loki** (port 3100): Log aggregation
- **Grafana** (port 3000): Unified visualization

## Configuration

Create `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'gati-app'
    static_configs:
      - targets: ['host.docker.internal:3000']
```

## Benefits

- ✅ No vendor lock-in
- ✅ Full data ownership
- ✅ Zero recurring costs
- ✅ Complete control over retention
- ✅ CNCF-backed projects

## Production Considerations

- Set up persistent volumes for data
- Configure retention policies
- Implement backup strategies
- Secure with authentication
- Scale horizontally as needed
