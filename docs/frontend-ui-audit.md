# Frontend UI Audit

## Goal

This audit fixes the current visual contract before large-scale refactoring. It identifies what should be consistent across the app and what can remain page-specific.

## Global Findings

- Page shells are inconsistent: `auth`, `profile`, and `record` already use shared style constants, while `home`, `posts`, `post-details`, and `notifications` still rely on ad hoc `container mx-auto` patterns.
- Shared UI primitives exist, but visual decisions are split between component internals and page-level style constants. This makes the design language feel related but technically hard to control.
- Tokens in [`globals.css`](/E:/Academy%20of%20Mohyla/Course3_Stage2/thesis/onetake-front-end/src/app/styles/globals.css) were previously raw and low-level. Semantic intent was mostly encoded directly in Tailwind classes.
- `shared/ui/auth-styles.ts`, `profile-styles.ts`, and `record-styles.ts` are effectively recipe files, not primitive UI files.
- Cards and toolbars are close to a common pattern already, especially in `profile`, `posts`, and `post-details`.
- The player is functionally useful, but visually isolated from the rest of the product and missing some states.

## Screen Audit

### Auth

- Page shell: centered, single-card shell with decorative radial background.
- Cards: glass-like auth card with strong blur and elevated shadow.
- Form controls: custom auth input treatment with larger radius and stronger ring than regular inputs.
- Section spacing: good rhythm inside card, but this spacing model is not reused elsewhere.
- Headings: strong and consistent.
- Toolbar: back button acts as a local toolbar.
- Badges: not used.
- Player: not used.
- Hover/focus: auth fields and buttons have the most refined states in the app.
- Decision: keep unique centered shell, but move background/card/input treatment into official recipes instead of `auth-styles.ts`.

### Home

- Page shell: generic `container` layout with hero content and feature cards.
- Cards: uses generic `Card`, but typography and spacing differ from posts/profile sections.
- Form controls: not significant.
- Section spacing: hero and feed controls are visually separated, but not based on a shared shell recipe.
- Headings: large hero headline; secondary feed headline differs from other pages.
- Toolbar: feed toggle acts like lightweight tabs.
- Badges: not central.
- Player: appears inside `PostCard`.
- Hover/focus: depends on primitive internals.
- Decision: migrate to `ContentShell` and shared hero/toolbar recipes while preserving the homepage’s more promotional tone.

### Posts

- Page shell: generic `container` with title and widget stack.
- Cards: grid of `PostCard`, already close to a reusable media-card pattern.
- Form controls: search and filter area are feature-owned and need a common toolbar/form-field recipe.
- Section spacing: mostly consistent, but controlled locally.
- Headings: simple list heading.
- Toolbar: search + filter stack is a strong candidate for an official toolbar recipe.
- Badges: media and tag badges already exist.
- Player: inline player preview inside cards.
- Hover/focus: partly shared, partly ad hoc.
- Decision: make this the first major migration target for `ContentShell`, toolbar recipe, and media-card recipe.

### Post Details

- Page shell: generic `container`, two-column detail layout.
- Cards: media card is visually separate from metadata/comments column.
- Form controls: comment form uses generic input/button contract, but styling differs from auth.
- Section spacing: decent structural rhythm, but no official section-card recipe yet.
- Headings: post title is strong; comments section uses simpler heading.
- Toolbar: back button is separate from content rhythm.
- Badges: media type + tags are already consistent with domain expectations.
- Player: key experience point; should feel native to the shared design system.
- Hover/focus: mixed quality.
- Decision: move to `ContentShell`, section cards, and upgraded player system after posts/home.

### Profile

- Page shell: strongest structured page after auth; already has cover, header card, tabs, toolbar, empty state, posts grid.
- Cards: multiple profile-specific cards that are close to reusable section/media-card patterns.
- Form controls: sorting select is already a recipe-like control.
- Section spacing: good baseline for the future content shell rhythm.
- Headings: clear hierarchy.
- Toolbar: present and reusable.
- Badges: not central here.
- Player: media preview is simplified.
- Hover/focus: decent, but still uses raw slate/blue classes.
- Decision: treat this page as the main source for `sectionCard`, `toolbar`, `emptyState`, and media-card recipes.

### Record

- Page shell: closest to a dedicated studio layout.
- Cards: wizard steps reuse record-specific card classes.
- Form controls: mix of shared controls and recording-specific controls.
- Section spacing: already step-oriented, should become `StudioShell`.
- Headings: simple and clear.
- Toolbar: not primary; step flow is the main structural element.
- Badges: limited use.
- Player: preview/recording surfaces are central.
- Hover/focus: depends on underlying controls.
- Decision: preserve unique workflow, but formalize shell and step-card recipes while keeping record-specific behavior in widgets/features.

### Notifications

- Page shell: narrow content column with local header toolbar.
- Cards: notification items use generic `Card` with local unread treatment.
- Form controls: not central.
- Section spacing: compact and list-oriented.
- Headings: straightforward.
- Toolbar: page title + “mark all as read” should become a small toolbar recipe.
- Badges: unread state currently expressed with a left border, not badge.
- Player: not used.
- Hover/focus: list item hover exists but is local.
- Decision: migrate to `ContentShell` with narrow-width section pattern and shared interactive card treatment.

## What Must Be Consistent Everywhere

- Page shells: `CenteredShell`, `ContentShell`, `StudioShell`.
- Section width rhythm and vertical spacing.
- Section card surfaces, borders, radius, and elevation.
- Button/input/badge/tabs/modal/loader contracts.
- Typography roles for page title, subtitle, section title, muted text.
- Toolbar, empty state, and form-field recipes.
- Semantic hover, focus-visible, disabled, and error states.
- Semantic color usage only, with no raw colors in components.

## What Can Stay Unique Per Page

- Auth decorative background and isolated entry experience.
- Home hero presentation and promotional composition.
- Profile cover/header identity treatment.
- Record workflow and recording/studio affordances.
- Player overlay behavior, as long as it uses shared tokens and control recipes.

## Priority Migration Order

1. Tokens in [`globals.css`](/E:/Academy%20of%20Mohyla/Course3_Stage2/thesis/onetake-front-end/src/app/styles/globals.css) and semantic Tailwind API in [`tailwind.config.js`](/E:/Academy%20of%20Mohyla/Course3_Stage2/thesis/onetake-front-end/tailwind.config.js).
2. Recipes in [`src/shared/ui/recipes`](/E:/Academy%20of%20Mohyla/Course3_Stage2/thesis/onetake-front-end/src/shared/ui/recipes/index.ts).
3. Primitive contract pass for `Button`, `Card`, `Input`, `Badge`, `Tabs`, `Modal`, `Loader`.
4. Layout migration: home, posts, post-details, profile, auth, record.
5. Media-card unification.
6. Player system refactor.
