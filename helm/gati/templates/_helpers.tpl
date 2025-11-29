{{/*
Multi-zone pod anti-affinity
*/}}
{{- define "gati.multiZoneAffinity" -}}
{{- if .Values.multiZone.enabled }}
podAntiAffinity:
  preferredDuringSchedulingIgnoredDuringExecution:
  - weight: 100
    podAffinityTerm:
      labelSelector:
        matchLabels:
          app.kubernetes.io/name: {{ .name }}
          app.kubernetes.io/component: {{ .component }}
      topologyKey: topology.kubernetes.io/zone
{{- end }}
{{- end }}

{{/*
Multi-zone topology spread constraints
*/}}
{{- define "gati.topologySpreadConstraints" -}}
{{- if .Values.multiZone.enabled }}
topologySpreadConstraints:
- maxSkew: 1
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: ScheduleAnyway
  labelSelector:
    matchLabels:
      app.kubernetes.io/name: {{ .name }}
      app.kubernetes.io/component: {{ .component }}
{{- end }}
{{- end }}
