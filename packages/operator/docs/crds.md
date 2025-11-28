# Custom Resource Definitions

## GatiHandler

Defines a Gati handler deployment.

```yaml
apiVersion: gati.dev/v1alpha1
kind: GatiHandler
metadata:
  name: user-handler
  namespace: default
spec:
  handlerPath: /api/users
  version: v1.0.0
  replicas: 2
  image: my-app:v1.0.0
  port: 3000
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi
  timescape:
    breaking: false
    routingWeight: 100
```

## GatiModule

Defines a Gati module deployment.

```yaml
apiVersion: gati.dev/v1alpha1
kind: GatiModule
metadata:
  name: db-module
  namespace: default
spec:
  moduleName: database
  moduleType: node
  runtime: node:20
  replicas: 1
  image: db-module:v1.0.0
  port: 50051
  capabilities:
    - network
    - storage
```

## GatiVersion

Defines version metadata for Timescape.

```yaml
apiVersion: gati.dev/v1alpha1
kind: GatiVersion
metadata:
  name: user-handler-v1
  namespace: default
spec:
  versionId: v1.0.0
  breaking: false
  routingWeight: 100
  deploymentName: handler-user-handler
  serviceName: handler-user-handler
```
