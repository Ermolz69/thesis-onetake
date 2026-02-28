# Contracts — Shared gRPC protos

This folder holds **protocol buffer** definitions used by both the C# Core and the Python Analytics/Reco services. Keep a single source of truth here to avoid type drift.

---

## Layout

```
contracts/
  proto/
    analytics/v1/
      analytics.proto   # AnalyticsIngest.TrackEvent
    reco/v1/
      reco.proto        # RecoService.GetRecommendations
```

---

## Usage

- **C#:** `OneTake-back-end/OneTake.GrpcContracts` is generated from these protos (e.g. via Grpc.Tools in the build). Namespace: `OneTake.GrpcContracts.Analytics.V1`, `OneTake.GrpcContracts.Reco.V1`.
- **Python:** `OneTakeAnalytics/libs/onetake_proto` is generated (e.g. via `grpcio_tools`). Import from `reco.v1`, `analytics.v1` (or the generated package name in use).

Regenerate after changing any `.proto` file so that Core and Python stay in sync. Do not commit generated code under other repos if it is derived solely from this folder; each consumer (C# GrpcContracts, Python onetake_proto) manages its own generated output.
