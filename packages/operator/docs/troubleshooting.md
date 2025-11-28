# Troubleshooting

## Operator Not Starting

**Check logs:**
```bash
kubectl logs -n gati-system deployment/gati-operator
```

**Common issues:**
- Missing RBAC permissions
- CRDs not installed
- Invalid kubeconfig

## Handler Not Deploying

**Check CRD status:**
```bash
kubectl get gatihandler -n default
kubectl describe gatihandler <name> -n default
```

**Common issues:**
- Invalid image reference
- Insufficient resources
- Missing namespace

## Scaling Not Working

**Check HPA:**
```bash
kubectl get hpa -n default
kubectl describe hpa <name> -n default
```

**Common issues:**
- Metrics server not installed
- Invalid resource requests
- CPU/memory metrics unavailable

## Version Not Decommissioning

**Check version status:**
```bash
kubectl get gativersion -n default
kubectl describe gativersion <name> -n default
```

**Common issues:**
- Traffic still flowing
- Grace period not elapsed
- In-flight requests detected

## Debug Mode

Enable debug logging:
```yaml
env:
  - name: LOG_LEVEL
    value: "debug"
```
