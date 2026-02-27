# OneTake Frontend

React + Vite application built with Feature-Sliced Design (FSD) architecture.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling with design tokens
- **React Router** - Routing
- **Zustand** - State management
- **Axios** - HTTP client

## Project Structure (FSD)

```
src/
  app/              # Application initialization
    providers/      # Global providers (router, store, theme)
    styles/         # Global styles
    index.tsx       # App entry point
  
  pages/            # Application pages
    home/
    posts/
    post-details/
    auth/
  
  widgets/          # Composite UI blocks
    layout/         # Layout components (header, footer)
    posts-list/     # Posts list widget
  
  features/         # Business features
    auth-by-email/
    posts-search/
    posts-filter/
  
  entities/         # Business entities
    post/           # Post entity (types, API, model, UI)
    user/           # User entity
  
  shared/           # Shared resources
    api/            # HTTP client, types, interceptors
    config/         # Configuration (routes, API, theme, storage, env)
    lib/            # Utilities (clsx, helpers)
    ui/             # Reusable UI components
    assets/         # Static assets
    styles/         # Shared styles
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:5213
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Configuration

### Routes

All routes are defined in `src/shared/config/routes.ts`:

```typescript
export const routes = {
  home: '/',
  posts: '/posts',
  postDetails: (id: string) => `/posts/${id}`,
  auth: {
    login: '/auth/login',
  },
}
```

### API Endpoints

API configuration is in `src/shared/config/api.ts`:

```typescript
export const api = {
  baseURL: env.apiBaseUrl,
  endpoints: {
    products: {  // Note: backend uses /api/posts endpoint
      list: '/api/posts',
      details: (id: string) => `/api/posts/${id}`,
    },
  },
}
```

### Theme & Design Tokens

Design tokens are defined in:
- `src/app/styles/globals.css` - CSS variables
- `tailwind.config.js` - Tailwind configuration
- `src/shared/config/theme.ts` - TypeScript theme object

To change colors, modify CSS variables in `globals.css`:

```css
:root {
  --color-primary: #3b82f6;
  --color-bg-primary: #ffffff;
  /* ... */
}
```

### Storage Keys

Storage keys are centralized in `src/shared/config/storage.ts`:

```typescript
export const storageKeys = {
  auth: {
    token: 'auth_token',
    user: 'auth_user',
  },
  theme: 'theme',
}
```

## Import Rules

### Absolute Imports Only

Use aliases for all imports:

```typescript
// ✅ Good
import { Button } from '@/shared/ui'
import { usePostStore } from '@/entities/post'
import { routes } from '@/shared/config'

// ❌ Bad
import { Button } from '../../../shared/ui'
import { usePostStore } from '../../entities/post'
```

### Available Aliases

- `@/app/*` - Application layer
- `@/pages/*` - Pages
- `@/widgets/*` - Widgets
- `@/features/*` - Features
- `@/entities/*` - Entities
- `@/shared/*` - Shared resources
- `@/*` - Shortcut to `src/*`

## FSD Rules

1. **Layers can only import from lower layers:**
   - `app` → can import from all layers
   - `pages` → can import from `widgets`, `features`, `entities`, `shared`
   - `widgets` → can import from `features`, `entities`, `shared`
   - `features` → can import from `entities`, `shared`
   - `entities` → can import from `shared` only
   - `shared` → cannot import from other layers

2. **Public API through index.ts:**
   - Each slice exports its public API through `index.ts`
   - Only export what other layers need

3. **No circular dependencies:**
   - Features cannot import from other features
   - Entities cannot import from other entities

## UI Components

Reusable components are in `src/shared/ui/`:

- `Button` - Button with variants (primary, secondary, outline, ghost)
- `Input` - Text input with validation
- `Card` - Content card
- `Modal` - Modal dialog
- `Loader` - Loading spinner
- `Badge` - Badge/tag component
- `Tabs` - Tab navigation
- `Pagination` - Pagination controls

All components use Tailwind CSS and design tokens.

## State Management

State is managed using Zustand stores in entity/model files:

```typescript
// entities/post/model.ts
export const usePostStore = create<PostState>((set) => ({
  posts: [],
  fetchPosts: async () => { /* ... */ },
}))
```

## API Layer

HTTP client is configured in `src/shared/api/http.ts`:

- Automatic token injection from localStorage
- Error handling with ProblemDetails support
- Type-safe requests/responses

## Theming

Theme switching is available through `ThemeProvider`:

```typescript
const { theme, toggleTheme } = useTheme()
```

Themes are defined via CSS variables and can be switched between light/dark modes.

## Development Guidelines

1. **TypeScript everywhere** - No JavaScript files
2. **Absolute imports only** - Use aliases, no relative paths
3. **Design tokens** - Use CSS variables, no hardcoded colors
4. **FSD compliance** - Follow layer import rules
5. **Index exports** - Export public API through index.ts
6. **Reusable components** - Put shared UI in `shared/ui`

## License

MIT
