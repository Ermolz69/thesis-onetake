# Frontend Screen Migration Note

## Migrated Screens And Blocks

- Home feed: `pages/home`, `widgets/recommended-feed`
- Posts listing: `pages/posts`, `widgets/posts-list`, `features/posts-search`, `features/posts-filter`
- Post presentation: `entities/post/ui/PostCard`
- Post details: `pages/post-details`
- Notifications: `pages/notifications`
- Profile edit: `pages/profile-edit`
- Layout shell/header: `widgets/layout`
- Record/upload surfaces: `features/chunk-upload`, `features/recording-studio`, `pages/record-controls`

## What Was Standardized

- Content pages use shared `contentShell` and `contentContainer`
- Empty/loading/error states use shared primitives and recipes
- Buttons, inputs, badges, and cards now default to shared primitives
- Media/post cards follow one common surface and action rhythm
- Secondary form surfaces use semantic tokens instead of ad hoc utility mixes

## Intentionally Deferred

- `shared/ui/VideoPlayer` visual refactor is still deferred
- Existing known lint warnings around `react-hooks/set-state-in-effect` remain unchanged
