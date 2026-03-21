# Backend CI Quality Gates

Backend CI now enforces the following automated checks on every push and pull request:

- `build`: restore, build, and `dotnet format --verify-no-changes`
- `unit-tests`: runs `OneTake.UnitTests`, collects Coverlet output, publishes TRX + Cobertura artifacts, and enforces a minimum line coverage gate of `20%`
- `integration-tests`: runs `OneTake.IntegrationTests`, collects Coverlet output, publishes TRX + Cobertura artifacts, and enforces a minimum line coverage gate of `40%`

These thresholds are intentionally pragmatic relative to the current baseline and are applied per test project rather than across the whole solution, so low-value infrastructure or generated code does not dominate the gate.

Artifacts produced by CI:

- `unit-test-results`
- `unit-coverage`
- `integration-test-results`
- `integration-coverage`

The workflow summary also includes a compact backend coverage table for quick inspection after each run.

Local reproduction commands remain unchanged:

```bash
dotnet test tests/OneTake.UnitTests/OneTake.UnitTests.csproj -c Release
dotnet test tests/OneTake.IntegrationTests/OneTake.IntegrationTests.csproj -c Release
dotnet test tests/OneTake.UnitTests/OneTake.UnitTests.csproj -c Release --collect "XPlat Code Coverage" --results-directory ./TestResults/Unit --settings coverlet.runsettings
dotnet test tests/OneTake.IntegrationTests/OneTake.IntegrationTests.csproj -c Release --collect "XPlat Code Coverage" --results-directory ./TestResults/Integration --settings coverlet.runsettings
```
