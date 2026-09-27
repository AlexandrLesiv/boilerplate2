# Claude instructions — monorepo boilerplate

pnpm monorepo with a SolidJS frontend, a Fastify API, and a shared package.

## Apps and packages

| Path | Purpose |
|---|---|
| `apps/fe` | SolidJS frontend with SolidStart (SSR) |
| `apps/api` | Fastify 5 REST API with Swagger/OpenAPI |
| `packages/shared` | Shared route contracts, TypeBox schemas, entity types |

## Stack

**Frontend (`apps/fe`)**
- SolidJS + SolidStart (`ssr: true`)
- Vite 8 / Rolldown — custom plugins in `apps/fe/vite-plugins/`
- Vanilla Extract for styles, LightningCSS transformer
- TypeScript 7 with `verbatimModuleSyntax` — always `import type` for type-only imports
- oxlint + oxfmt for lint and format
- Storybook 10 (CSF 3.0) with `storybook-solidjs-vite`
- MSW 2 + faker for mocking in Storybook and tests

**Backend (`apps/api`)**
- Fastify 5 + `@fastify/type-provider-typebox`
- TypeBox schemas drive both runtime validation and OpenAPI output
- `@fastify/swagger` + `@fastify/swagger-ui` — OpenAPI spec at `/docs/json`, UI at `/docs`
- dotenv for config (`PORT` in `.env`)

**Shared (`packages/shared`)**
- `defineSharedApiRoute` — single source of truth for URL + method + schema
- `defineEntity`, `defineListResponse`, `defineResponse` — TypeBox schema helpers
- `ok()`, `okList()` — response envelope helpers
- Frontend and backend both consume from here; TypeBox is stripped from the client bundle

## Key conventions

- **Arrow functions everywhere** — use `const fn = () => {}` for all functions. Named `function` declarations are not used in this codebase; oxlint enforces `prefer-arrow-callback` and `arrow-body-style`.
- **Exact version pinning** — no `^` or `~` in any `package.json`. Run `pnpm --filter fe lint:versions` to check.
- **`createApiCall(route)`** for all frontend API calls — takes a `SharedApiRoute` from `@repo/shared`, returns a fully typed async function. Never hand-write fetch URLs in components.
- **TypeBox is stripped from the client bundle** — `vite-plugins/strip-typebox.ts` replaces `@sinclair/typebox` with a no-op Proxy in the `client` Vite environment. Do not rely on TypeBox runtime behavior in browser code.
- **Response envelope** from `@repo/shared`: `{ data: T[], meta: { total, isOk } }` for lists, `{ data: T }` for singles.
- **Styles**: Vanilla Extract `.css.ts` files only. No inline styles, no CSS modules, no Tailwind.
- **i18n**: all user-visible strings go through `useI18n()` → `t()`. No hardcoded strings in components.

## Storybook (`apps/fe`)

- Stories sit next to the component: `ComponentName.stories.tsx`
- Set `parameters.msw.handlers` on any story that triggers a network call
- Use `withPageLayout()` for page stories, `withAppProviders()` for component stories
- Handler factories live in `src/mocks/handlers/` — reuse them across stories
- See `.claude/agents/story-writer.md` for the required story set per component type
- See `.claude/agents/storybook-a11y.md` for the a11y review process

## Accessibility

A11y is not a post-hoc audit — it is part of authoring. Before writing any interactive component:

1. **Pick the right element first.** Use `<button>` for actions, `<a href>` for navigation, `<form onSubmit>` for forms. Avoid `<div onClick>`.
2. **Name every interactive element.** Visible text, `aria-label`, or `<label for>`. Placeholders do not count as labels.
3. **Plan keyboard interaction.** Tab to focus, Enter/Space to activate, Escape to dismiss. Custom widgets (tabs, comboboxes) need arrow-key support.
4. **Communicate dynamic state.** `role="alert"` for errors that appear, `aria-expanded` + `aria-controls` for disclosures, `aria-busy` for loading regions.

Use the `storybook-a11y` agent (`.claude/agents/storybook-a11y.md`) in two ways:
- **Before writing**: ask it for the a11y design checklist for the component you're about to build
- **After writing**: ask it to audit the component + stories and fix violations

Once violations are resolved, promote stories to `a11y: { test: 'error' }` in their parameters — this turns the Storybook a11y addon from a warning into a failing test.

The `storybook-a11y` agent uses the Playwright MCP browser to snapshot the ARIA tree and verify keyboard navigation in the live Storybook. Make sure Storybook is running before invoking it in audit mode.

## Running locally

```sh
# From repo root
pnpm install

# Frontend (port 3000)
pnpm --filter fe dev

# API (port 8000, configure in apps/api/.env)
pnpm --filter api dev

# Storybook
pnpm --filter fe storybook

# Type check all
pnpm --filter fe typecheck && pnpm --filter @repo/shared typecheck
```

## SEO requirements

Every routable page **must** define both meta and structured data in its `route.ts` file via `defineRoute`. Omitting either is a bug.

**Meta** (in `info.meta`):
- `title` — required, concise, matches page content
- `description` — required for all public pages, 120–160 characters
- `robots` — set to `'noindex'` for auth-gated or utility pages (e.g. `/login`)

**Structured data** (JSON-LD, in `info.meta` → `schema`):
- Use `defineJsonLd` from `apps/fe/src/common/libs/router` — never write raw `{ '@context': ... }` objects
- Choose the most specific schema.org `@type` for the page content — e.g. `Article`, `CollectionPage`, `WebSite`, `BreadcrumbList`
- TypeScript (via `schema-dts`) will reject invalid property names and values — fix errors rather than casting
- The script tag is injected into `<head>` automatically via `MetaProvider`; nothing extra needed in the component

Example:
```ts
import { defineJsonLd, defineRoute } from '../../../common/libs/router';

export const exampleRoute = defineRoute({
  path: '/example',
  component: ExamplePage,
  info: {
    meta: (_, t) => ({
      title: t.pages.example.title,
      description: t.pages.example.description,
      schema: defineJsonLd({
        '@type': 'WebPage',
        name: t.pages.example.title,
        description: t.pages.example.description,
      }),
    }),
  },
});
```

## Adding a new API endpoint

1. Define the shared route in `packages/shared/src/routes/<domain>.ts` using `defineSharedApiRoute`
2. Export it from `packages/shared/src/index.ts`
3. Attach the handler in `apps/api/src/routes/<domain>/index.ts`
4. Call it on the frontend with `createApiCall(route)` from `apps/fe/src/common/libs/api`
5. Add an MSW handler in `apps/fe/src/mocks/handlers/<domain>.ts`
