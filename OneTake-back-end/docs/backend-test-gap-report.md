# Backend Test Gap Report

## Audit summary

Coverage snapshots from the current Coverlet run:

- unit suite line-rate: `24.53%`
- integration suite line-rate: `46.00%`
- strongest business-critical service classes in unit coverage:
  - `PostService`, `AuthService`, `UserService`, `CommentService`, `NotificationService`, `AdminService`, `FollowService`: `100%` line-rate in the unit report
- strongest controller coverage in integration coverage:
  - `AuthController`, `CommentsController`, `NotificationsController`, `UploadsController`, `AdminController`, `UsersController`: `100%` line-rate in the integration report
  - `PostsController`: `93.8%`
  - `AnalyticsController`: `88.2%`

Remaining low-coverage namespaces are mostly infrastructure and generated or low-value support areas rather than the service/controller paths prioritized in this pass.

Current backend tests were strongest at basic service happy paths and smoke-level controller checks, but weaker in the places most likely to regress product behavior:

- `OneTake.Application.Services.PostService`
  - Missing duplicate-like no-op coverage, media deletion side effects, notification behavior, and default audio/visibility branches.
- `OneTake.Application.Services.AuthService`
  - Missing refresh-token lifecycle branches: expired, revoked, reused, missing-user, and revoke no-op scenarios.
- `OneTake.Application.Services.UserService`
  - Missing `viewerId` follow-state behavior and persistence assertions on profile updates.
- `OneTake.Application.Services.CommentService`
  - Missing notification side effects and explicit owner/post-owner/non-owner delete matrix coverage.
- `OneTake.Application.Services.NotificationService`
  - Missing pagination cursor assertions and mark-all persistence behavior.
- `OneTake.Application.Services.AdminService`
  - Missing persistence assertions for role updates.
- `OneTake.Application.Services.FollowService`
  - Missing unfollow no-op behavior, follow persistence assertions, and feed cursor coverage.

Integration tests were also biased toward endpoint reachability and status codes. They had limited multi-step business flows, limited authorization matrix coverage, and only minimal persistence-oriented verification.

## Prioritized additions

This pass focused on the highest-value gaps first:

- expanded unit tests around refresh-token lifecycle, side effects, permission checks, and no-op branches
- added multi-step integration flows for auth, posts interactions, and chunked upload finalize flow
- added explicit authorization matrix coverage for anonymous, non-owner, owner, admin, and public/unlisted visibility behavior
- added following-feed authorization coverage
- added persistence and query integration coverage for:
  - post cursor pagination stability, duplicate-free continuation, invalid cursor fallback, and empty-after-last-page behavior
  - author and tag filtering with explicit public vs unlisted visibility assertions
  - following-feed inclusion and newest-first ordering for followed vs unfollowed authors
  - like, unlike, comment, notification, and delete flows with direct database-state verification
  - profile query behavior for follower counts and viewer-specific follow state
- exposed and fixed two real backend issues while adding those tests:
  - repository cursor pagination could repeat items because cursor comparison depended on provider-specific `DateTime` behavior
  - post deletion relied on database cascade behavior for reactions, which left orphaned likes under the in-memory integration provider

## Remaining deferred gaps

The next strongest coverage wins would be:

- deterministic recommended-feed tests with a stubbed recommendations client
- persistence-focused checks for cascade behavior under a relational provider in addition to the in-memory test host
- analytics fire-and-forget assertions via injectable fake clients instead of status-code-only controller checks
- search persistence coverage under the current in-memory integration host, because `EF.Functions.ILike` is provider-specific and not supported there
