# OneTake — Frontend

React 19 + Vite + TypeScript. FSD-like structure (app, pages, widgets, features, entities, shared). Zustand for global state; Axios for HTTP.

---

## Stack

- **React 19**, **React Router 7**
- **Vite** (Rolldown)
- **TypeScript**
- **Zustand** (e.g. post store)
- **Axios** (shared API client with auth header)
- **Tailwind CSS** (theme tokens: `fg-primary`, `bg-primary`, etc.)

---

## Structure

| Layer | Role |
|-------|------|
| **app/** | Providers (router, theme), entry |
| **pages/** | Route-level components: home, posts, post-details, record, auth |
| **widgets/** | Composite UI: layout, record-wizard, recommended-feed, posts-list |
| **features/** | User actions: auth-by-email, recording-studio, chunk-upload, analytics-track, watch-analytics, posts-filter, posts-search |
| **entities/** | Domain data: post (api, model, types, ui/PostCard), upload (api, types) |
| **shared/** | Config (routes, api, env, storage), UI (Button, Input, Card, Badge, Loader, etc.), API (http, types) |

Public API of a slice: re-export via `index.ts`; types in `types.ts`, API in `api.ts`, UI in `ui/`.

---

## Routes

| Path | Page |
|------|------|
| `/` | Home (CTA, recommended feed) |
| `/posts` | Posts list (filter, search, pagination) |
| `/record` | Recording Studio → chunk upload → publish |
| `/posts/:id` | Post details (video/audio, like, comments) |
| `/auth/login` | Login / register |

---

## Implemented features

- **Auth:** Login/register (JWT stored in storage); auth header on API requests.
- **Posts:** List, details, like, create (single-file or via record flow). Visibility (Public/Unlisted) in create forms.
- **Recording Studio:** Screen/camera/both, start/pause/stop, preview, retake, simple trim; then hand-off to upload step.
- **Chunk upload:** Init → upload parts with progress/retry → finalize; entity `upload`, feature `chunk-upload` (useChunkUpload, ChunkUploadForm, UploadProgress).
- **Analytics:** `analytics-track` (trackEvent), used in recording (record_start/record_stop), chunk upload (upload_*), and `watch-analytics` (useWatchTrack on post-details video).
- **Recommended:** `entities/post` `getRecommended(limit)`; widget `recommended-feed` on home.

---

## Config

- **API base URL:** `VITE_API_BASE_URL` (default `http://localhost:5213`). See `src/shared/config/env.ts` and `src/vite-env.d.ts` for Vite env types.

---

## Scripts

```bash
npm install
npm run dev          # dev server
npm run build        # tsc + vite build
npm run preview      # preview production build
npm run lint         # ESLint
npm run format:check # Prettier check (CI)
```

Build output: `dist/`. Lock file (`package-lock.json` or `pnpm-lock.yaml`) is committed for reproducible installs.
