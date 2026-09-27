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

- **Arrow functions everywhere** — use `const fn = () => {}` for all functions. `.oxlintrc.json` at the repo root sets `prefer-arrow-callback` and `arrow-body-style` to `error`, and oxlint finds that config by searching upward, so it applies from any workspace. Be aware of the gap: those rules only catch function *expressions* passed as callbacks and redundant arrow bodies — a top-level `function foo() {}` declaration is **not** flagged. That is why `common/libs/stores/root.ts`, `common/libs/router/index.ts` and the `*.stories.tsx` helpers still pass lint; follow the convention in new code rather than copying them.
- **Exact version pinning** — no `^` or `~` in any `package.json`. Run `pnpm lint:versions` from the repo root; it checks every workspace plus the root.
- **`createApiCall(route)`** for GET requests — call at module level in the route file, export the result, use with `createAsync` in components and `preload` in the route definition. No locale — GET routes are locale-agnostic.
- **`createMutation(route)`** for POST/PUT/DELETE — call inside a component (it's a hook that reads locale from `useI18n`), returns a typed async function for use in event handlers.
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

## Logging

**Never call `console.*` in app code — always use the custom logger.** `console` output vanishes when the tab closes. The logger persists to IndexedDB (`app-logs`), buffers and flushes in batches, tags every entry with a session id and URL, captures `window.onerror` and `unhandledrejection`, and can export a session as JSON. `.oxlintrc.json` sets `no-console` to `warn` with only `warn`/`error` allowed, so a stray `console.log` surfaces a warning but does not fail `pnpm lint` — treat the rule as binding anyway. `apps/fe/src` currently has zero `console.*` calls outside the logger itself (which carries an explicit disable comment) — keep it that way.

How to get a logger:
- **Inside components** — `const logger = useLogger();` from `src/common/libs/logger`. Provided via `LoggerContext` in `AppProvider.tsx`.
- **Outside components** (module scope, api helpers, stores) — import the `logger` singleton from the same module.
- Never import `logger/db.ts` directly; it is the storage layer, not the API.

Pick the method by intent, not just severity — each one sets a different `LogCategory`, which is what makes logs filterable:

| Method | Category | Use for |
|---|---|---|
| `event(name, data)` | `user-action` | deliberate user actions — submit, toggle, open |
| `navigation(to)` | `navigation` | route changes |
| `apiError(method, url, status, msg)` | `api` | failed requests (already wired into `common/libs/fetch`) |
| `perf(name, durationMs, data)` | `performance` | timings |
| `error` / `warn` / `info` / `log` | `custom` | everything else |

Rules:
- **Message names are dotted, stable identifiers**, not prose: `login.submit`, `login.failed`, `app.start`. They are grep keys. Never interpolate values into the name — put them in `data`.
- **Never log secrets or PII** — no passwords, tokens, or raw emails. Log shape instead: `logger.event('login.submit', { hasEmail: !!email() })`.
- `data` is a `Record<string, unknown>` and gets structured-cloned into IDB, so keep it plain and serialisable.
- The logger never throws — IDB failures are dropped silently. Do not wrap log calls in `try`/`catch`.
- Under SSR the same import is a plain console passthrough (no IDB, no buffering), so it is safe to call from isomorphic code.
- In dev, read logs from the browser console: `window.__logger.read()`, `.flush()`, `.clear()`, `.export()`.

Use the `logger` agent (`.claude/agents/logger.md`) when adding a feature that needs observability or auditing a component for missing log calls.

**`apps/api`** has no custom logger — use Fastify's built-in one (`app.log`, `request.log`), not `console.*`. The exception is bootstrap code that runs before the Fastify instance exists, such as env validation in `src/common/env.ts`, where `console.error` is correct.

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

# Type check all workspaces that define a typecheck script (apps/fe, apps/api)
pnpm -r typecheck

# Everything: typecheck + lint + format check + version pinning
pnpm check
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

## Route structure

Routes are defined as siblings under the locale layout route (`/:locale?`), not as nested children. **Do not add `children` to a route that has its own `component`** — in SolidJS Router v1, doing so turns the component into a layout that requires `<Outlet>`, and navigating to the parent path exact will not render the component content.

**Trailing slashes**: exactly one URL form is valid — the slash-free one. `src/middleware.ts` 301-redirects any path ending in `/` (root excepted) to the slash-free form, preserving the query string. Do not author links with trailing slashes, and keep `canonical`/`hreflang` hrefs slash-free so they agree with the redirect target.

Use full paths for "sub-pages":
```ts
// ✓ siblings with full paths
children: [rootRoute, newsRoute, articlePageRoute, loginRoute]
// where newsRoute.path = '/news' and articlePageRoute.path = '/news/:id'

// ✗ nested children — breaks navigation to /news
newsRoute = defineRoute({ path: '/news', component: NewsPage, children: [articleRoute] })
```

## IndexedDB stores

IDB stores are created via `createIdbStore` in `apps/fe/src/common/libs/idb/index.ts`. Every store has a version number. When you change the schema, you **must** bump the version and write a migration — otherwise the upgrade transaction is aborted and you get an unhandled rejection.

**Rules:**
- Bump `IDB_STORE_VERSION` whenever you add/remove/rename an object store, add/remove an index, or change the type of an indexed field.
- The `upgrade` callback receives `(db, oldVersion)`. Use `oldVersion` to apply only the migrations needed:
  ```ts
  const getDb = createIdbStore<MyDB>('my-store', VERSION, (db, oldVersion) => {
    if (oldVersion < 1) {
      db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
    }
    if (oldVersion < 2) {
      // drop and recreate when indexed field type changes
      db.deleteObjectStore('items');
      const store = db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
      store.createIndex('timestamp', 'timestamp');
    }
  });
  ```
- Never call `createObjectStore` unconditionally — it throws if the store already exists, aborting the transaction.
- Deleting and recreating a store is the right migration when an indexed field's type changes (e.g. `number` → `string`), because IDB index comparisons are type-sensitive.
- IDB timestamps are stored as ISO 8601 strings (`new Date().toISOString()`), not Unix timestamps. ISO strings sort correctly as strings so IDB range queries still work.

## Adding a new environment variable

**Frontend (`apps/fe`):**
1. Add the variable to `apps/fe/vite-plugins/validate-env.ts` in `EnvSchema`
2. Add a declaration in `apps/fe/src/env.d.ts` under `ImportMetaEnv` (non-optional `string`)
3. Add it to `apps/fe/.env.example` with a description comment and a sensible default

**Backend (`apps/api`):**
1. Add the variable to `apps/api/src/common/env.ts` in `EnvSchema`
2. Add it to `apps/api/.env.example` with a description comment and a sensible default

Never add env variables in only one place — schema, type declaration, and example file must all be updated together.

## Adding a new API endpoint

1. Define the shared route in `packages/shared/src/routes/<domain>.ts` using `defineSharedApiRoute`
2. Export it from `packages/shared/src/index.ts`
3. Attach the handler in `apps/api/src/routes/<domain>/index.ts`
4. Call it on the frontend with `createApiCall(route)` from `apps/fe/src/common/libs/api`
5. Add an MSW handler in `apps/fe/src/mocks/handlers/<domain>.ts`
