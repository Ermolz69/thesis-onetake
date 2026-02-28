# OneTake — Core API (Backend)

ASP.NET Core Web API: REST for the frontend, gRPC clients to Analytics Ingest and Recommendations services. Clean Architecture (Domain, Application, Infrastructure, WebApi).

---

## Stack

- **.NET** (net10.0)
- **PostgreSQL** (Entity Framework Core, Npgsql)
- **JWT** authentication
- **gRPC** clients: Analytics Ingest, Reco (see `OneTake.Infrastructure/Grpc`)
- **File storage:** local `wwwroot/media` (configurable)

---

## Project layout

| Project | Role |
|--------|------|
| **OneTake.Domain** | Entities, enums (User, Post, MediaObject, Visibility, etc.) |
| **OneTake.Application** | DTOs, interfaces (IUnitOfWork, IPostService, IFileStorage, IUploadSessionStore, IAnalyticsIngestClient, IRecommendationsClient), services, Result/ApiError |
| **OneTake.Infrastructure** | EF DbContext, repositories, file storage, upload session store (temp files), gRPC clients, JWT/BCrypt |
| **OneTake.WebApi** | Controllers, middleware, Swagger |
| **OneTake.Logging** | Logging integration |
| **OneTake.GrpcContracts** | C# generated from `contracts/proto` (analytics, reco) |

---

## API overview

All under `/api`; auth endpoints public, rest use `Authorization: Bearer <token>` unless noted.

| Area | Endpoints |
|------|-----------|
| **Auth** | `POST /api/auth/register`, `POST /api/auth/login` |
| **Users** | `GET /api/users/{id}`, `PUT /api/users/me/profile` (auth) |
| **Posts** | `GET /api/posts` (list, filter by tag/author, cursor), `GET /api/posts/{id}`, `POST /api/posts` (multipart: file + ContentText, Tags, Visibility), `DELETE /api/posts/{id}`, `POST/DELETE /api/posts/{id}/like`, `GET /api/posts/feed/recommended?limit=` |
| **Comments** | `GET /api/posts/{postId}/comments`, `POST /api/posts/{postId}/comments` |
| **Uploads** (chunk) | `POST /api/uploads/init`, `PUT /api/uploads/{uploadId}/parts/{partIndex}` (body: binary), `GET /api/uploads/{uploadId}/status`, `POST /api/uploads/{uploadId}/finalize` |
| **Analytics** | `POST /api/analytics/events` (body: eventName, propsJson?, entityType?, entityId?) — forwards to Analytics Ingest (auth) |
| **Admin** | `GET /api/admin/users`, `PUT /api/admin/users/{id}/role` (auth + role) |

Posts support **Visibility** (Public/Unlisted). List endpoints return only Public; `GET /api/posts/{id}` returns any by id (for Unlisted share links).

---

## Configuration

- **Connection string:** `ConnectionStrings:DefaultConnection` (PostgreSQL).
- **JWT:** `Jwt:Secret`, `Jwt:Issuer`, `Jwt:Audience`, `Jwt:ExpirationInMinutes` (and optional refresh cookie settings).
- **Web root / uploads:** `WebRootPath` (default `wwwroot`). Upload session temp: `UploadSessionStore:BasePath` (optional).
- **appsettings.***`.json`:** Only `appsettings.json` is intended for repo; override with `appsettings.Development.json` or environment (not committed). Secrets in user secrets or env.

---

## Run

```bash
dotnet run --project OneTake.WebApi
```

**Database (PostgreSQL)**

Migrations are in `OneTake.Infrastructure/Migrations`. From the backend solution directory (`OneTake-back-end`):

- **Apply migrations** (create or update tables on the database):
  ```bash
  dotnet ef database update --project OneTake.Infrastructure --startup-project OneTake.WebApi
  ```
- **Add a new migration** after changing entities/DbContext:
  ```bash
  dotnet ef migrations add <MigrationName> --project OneTake.Infrastructure --startup-project OneTake.WebApi
  ```

**Verify on a clean DB:** Drop/create the database (or use an empty one), run `database update`, then start Core and open `/swagger`; register, login, and call a few endpoints to confirm schema is correct.

---

## Tests and coverage

From the backend directory (`OneTake-back-end`):

- **Unit tests (61):**
  ```bash
  dotnet test tests/OneTake.UnitTests/OneTake.UnitTests.csproj -c Release
  ```
- **Integration tests (27):** use InMemory DB and test auth; require no external DB.
  ```bash
  dotnet test tests/OneTake.IntegrationTests/OneTake.IntegrationTests.csproj -c Release
  ```
- **Coverage (Coverlet):** run both with coverage and inspect reports in `TestResults/`:
  ```bash
  dotnet test tests/OneTake.UnitTests/OneTake.UnitTests.csproj -c Release --collect "XPlat Code Coverage" --results-directory ./TestResults/Unit --settings coverlet.runsettings
  dotnet test tests/OneTake.IntegrationTests/OneTake.IntegrationTests.csproj -c Release --collect "XPlat Code Coverage" --results-directory ./TestResults/Integration --settings coverlet.runsettings
  ```
  Reports: `TestResults/**/coverage.cobertura.xml` (and `coverage.opencover.xml`). CI uploads these as artifacts. Target: meaningfully above ~18% line coverage (aim 40–60%+ with both projects).

---

## gRPC outbound

- **Analytics Ingest:** `TrackEvent` — called fire-and-forget from Post view, CreatePost, upload finalize, and when frontend sends events via `POST /api/analytics/events`.
- **Reco:** `GetRecommendations` — used by `GET /api/posts/feed/recommended`. Configure gRPC addresses (e.g. in appsettings or env) for Analytics and Reco services.
