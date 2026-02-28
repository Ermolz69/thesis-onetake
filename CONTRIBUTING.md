# Contributing to OneTake

This document describes the project's conventions for errors, API design, comments, and code style.

## Error handling

- **Result type:** Application services return `Result<T>` or `Result` from `OneTake.Application.Common.Results`. Success and failure are represented explicitly; controllers never depend on exceptions for business-rule failures.
- **API errors:** Failures are mapped to HTTP responses via `ProblemDetails` (and `ValidationProblemDetails` where applicable). Use the extension `ToActionResult(traceId, requestPath, method)` on `Result` / `ApiError` in controllers.
- **Unhandled exceptions:** `ExceptionToProblemDetailsMiddleware` catches unhandled exceptions and returns a consistent problem-details response (500 or the status from `ApiException`). Do not rely on this for normal validation or not-found cases; use `Result` and return the appropriate error from the service layer.

## API and controllers

- Controllers return **DTOs only**. Domain entities must not be serialized or leaked in API responses. Map entities to DTOs in the application layer (services) or in controller code when necessary.
- Pass `CancellationToken cancellationToken = default` into all async actions and forward it to service and repository calls so that request cancellation is respected.

## Comments

- **Use comments for:** public API documentation (XML docs where useful), non-obvious behavior, security-sensitive logic, and `TODO(#issue-id)` for tracked follow-ups.
- **Avoid:** comments that restate what the code does; prefer clear naming and small functions instead.

## Code style

- **Explicit types:** Prefer explicit types over `var` in production code. Exceptions: anonymous types; optionally `var list = new List<T>()`. See backend `.editorconfig` for analyzer settings.
- **Naming:** Use clear, consistent names; avoid abbreviations unless widely accepted (e.g. `id`, `url`). Request/response DTOs use `*Request` / `*Dto` / `*Response` as appropriate.
- **CancellationToken:** Async methods that perform I/O or call other async APIs should accept and forward `CancellationToken`.

### Backend (C#)

- Formatting and many style rules are enforced by **.editorconfig** in `OneTake-back-end/`. Run `dotnet format OneTake-back-end.slnx --verify-no-changes` before pushing; CI runs this as well.
- Use **DataAnnotations** on request DTOs for validation; the API returns validation errors as `ValidationProblemDetails`.

### Frontend

- Use **ESLint** and **Prettier**; run `npm run lint` and `npm run format:check` before pushing. CI runs these when the frontend is present in the repo.
- Use path alias **`@/`** for imports under `src/`; avoid relative parent paths (`../`, `../../`) so `no-restricted-imports` can stay enforced.
- **Loading and errors:** Prefer a single pattern per feature: either a store (e.g. Zustand) that holds `loading` / `error` and exposes them, or a shared hook. Use the shared **`ErrorMessage`** component (or a single agreed block/toast strategy) to display API errors so UX is consistent.
- **Types:** Use **`interface`** for API contracts and component props; use **`type`** for unions and aliases. Do not use **`any`** (ESLint reports it as an error).

## Environment and secrets

- Do **not** commit `.env` files or files containing secrets (API keys, DB passwords, JWT secrets). Use `.env.example` as a template and keep it committed without real values.
- Backend: only `appsettings.json` is in the repo; use `appsettings.Development.json` (gitignored), user secrets, or environment variables for local overrides.
- Frontend: `VITE_*` vars; `.env` is gitignored except `.env.example`.

## Checklist before submitting

- [ ] Backend: `dotnet format` passes, tests pass (unit + integration from `OneTake-back-end/`).
- [ ] Frontend: `npm run lint` and `npm run format:check` pass.
- [ ] No domain entities exposed in API responses; use DTOs.
- [ ] New async code passes and forwards `CancellationToken` where applicable.
- [ ] No secrets or `.env` with real values committed.
