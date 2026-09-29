# Claude instructions — monorepo boilerplate

pnpm monorepo with a SolidJS frontend, a Fastify API, and a shared package.

## How to approach work here (chain of thought)

This repo is full of constraints that invalidate otherwise-reasonable designs — TypeBox is
stripped from the client bundle, Vite cannot import the shared package, Storybook reads story
tags by static analysis. None of them are visible from the file you are about to edit. Reasoning
from memory here produces work that typechecks, lints, and is wrong.

So think in this order, and make the thinking visible in your response:

**1. Name the dimensions before touching code.** `TODO.md` holds the project's `FLOWS` — the
ordered list of concerns for writing a component and for writing a feature (functional edge
cases → UX → Opquast → a11y → UI → styling edge cases → performance → SEO → … → implementation
→ documentation). Walk the flow that matches the task and say which dimensions apply and which
you are consciously skipping. Skipping is fine; skipping silently is not.

**2. Verify every load-bearing assumption before designing on it.** An assumption is
load-bearing if a different answer would change the design. Check it, in rough order of cost:

- read the installed types — `apps/*/node_modules/<pkg>/**/*.d.ts` is the ground truth for the
  version actually installed, not what the docs say about the latest
- write a throwaway probe, run it, then revert it — a scratch plugin, a scratch story, a
  five-line `.mjs`. Put it where the package's dependencies resolve, and delete it after
- run the real thing and inspect the real output — the built bundle, `index.json`, the
  endpoint, the serialised SSR payload

**3. State the design and name the constraint that forced it.** If a constraint ruled out the
obvious approach, say so in one line. That sentence is usually the most valuable thing in the
whole response, and it is what should end up in the docs.

**4. Ask only when the answer changes the work.** Where the server gets flag values from, or
whether the client polls, changes the architecture — ask. Naming, file placement, and which
helper to reuse do not — decide, and mention what you decided.

**5. Implement, then prove the mechanism engaged.** Not that it compiles — that it *works*.
`pnpm check` cannot see that a define was replaced, a tag reached the sidebar, or a watcher
fired. Two real examples from this repo, both of which passed every check while doing nothing:

- a Storybook story tag set by a helper (`edgeCase(story)` returning `{ ...story, tags }`) —
  runtime-correct, but the CSF indexer reads `tags` statically, so `index.json` reported zero
  tagged stories and the sidebar filter never appeared
- a config group without `default: {}` — `Value.Default` returns `{}` and every flag inside it
  vanishes, with no error anywhere

In both cases the check that caught it was looking at the artifact, not the source.

**6. Report gaps explicitly.** If part of the scope is unfinished, blocked, or deliberately
left out, say which part and why. Do not let a green check stand in for a claim you did not
verify, and do not describe an unverified path as working.

## Apps and packages

| Path | Purpose |
|---|---|
| `apps/fe` | SolidJS frontend with SolidStart (SSR) |
| `apps/api` | Fastify 5 REST API with Swagger/OpenAPI |
| `packages/shared` | Shared route contracts, TypeBox schemas, entity types |

`apps/fe/src/views/` splits `components/` (design-system-style primitives with their own visual
identity — `AppButton`, `Image`, `LocaleSwitcher`) from `containers/` (components whose job is
behavior/orchestration rather than a look of their own — `DataBoundary`, `ErrorState` and
everything under it, `NotFound`), as siblings of `layouts/` and `pages/`. The split is about what
a component *is for*, not who imports it: `ErrorState`'s pages are visually presentational, but
they stay under `containers/` because they're one cohesive error-handling feature built around
`ErrorState`'s dispatch logic, not a general-purpose reusable primitive — pulling `ErrorLayout`
out to `components/` while leaving the dispatcher in `containers/` would fragment that feature
for no benefit. When adding a component, ask whether it has a visual identity of its own outside
of any specific data/error flow — if yes, `components/`; if it exists to orchestrate other
components based on app state, `containers/`.

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
- **`@/*` resolves to `apps/fe/src/*`** — configured in both `vite.config.ts` (`resolve.alias`) and
  `tsconfig.json` (`compilerOptions.paths`); update both together if it ever changes, since Vite
  and `tsc --noEmit` resolve it independently. Use `@/...` for any import crossing two or more
  `../` segments (into `common/`, `assets/`, a different `views/` subtree, etc.), including from
  `.storybook/*` files reaching into `src/`. Keep `./sibling` and a single `../parent` as relative
  — those are co-located files that move together, and forcing the alias on them adds noise
  without solving anything. `.storybook/*` importing `.storybook/*` stays relative too: `@` only
  maps into `src/`, so a story-side import of `.storybook/decorators` has no alias to use.
- **`createApiCall(route)`** for GET requests — call at module level in the route file, export the result, use with `createAsync` in components and `preload` in the route definition. No locale — GET routes are locale-agnostic.
- **Never call `fetch` directly in app code** — always go through `createApiCall` / `createMutation`,
  so the call gets URL building, locale headers, perf timing, `apiError` logging and the dev-mode
  response check. Let the thrown `ApiError` propagate to a `DataBoundary` rather than hand-rolling
  `fetch` to sidestep it.
- **`createMutation(route)`** for POST/PUT/DELETE — call inside a component (it's a hook that reads locale from `useI18n`), returns a typed async function for use in event handlers.
- **TypeBox is stripped from the client bundle** — `vite-plugins/strip-typebox.ts` replaces `@sinclair/typebox` with a no-op Proxy in the `client` Vite environment. Do not rely on TypeBox runtime behavior in browser code.
- **Response envelope** from `@repo/shared`: `{ data: T[], meta: { total, isOk } }` for lists, `{ data: T }` for singles.
- **Styles**: Vanilla Extract `.css.ts` files only. No inline styles, no CSS modules, no Tailwind.
- **i18n**: all user-visible strings go through `useI18n()` → `t()`. No hardcoded strings in components.

## Node APIs

**Prefer the promise-based API over the sync one.** `node:fs/promises` over `node:fs` sync calls,
`promisify(exec)` over `execSync`, `await` over `*Sync` generally. A sync call blocks the whole
event loop: in `apps/api` that stalls every in-flight request, and in a Vite plugin it stalls the
dev server.

```ts
// ✗
import { readFileSync } from 'node:fs';
const raw = JSON.parse(readFileSync(path, 'utf8'));

// ✓
import { readFile } from 'node:fs/promises';
const raw = JSON.parse(await readFile(path, 'utf8'));
```

If that makes a factory async, make it async and `await` it at the call site — `apps/api/src/server.ts`
is already top-level `await`, and Vite plugin hooks accept async handlers.

Two things this rule does *not* cover:

- **Callback/event APIs are already non-blocking.** `fs.watch` is an EventEmitter, not a sync
  call; `fs/promises.watch` is an async iterator that needs an `AbortController` to stop. Keep
  the EventEmitter form where you want a `close()` handle.
- **Bootstrap that must fail before anything starts.** Env validation in
  `apps/api/src/common/env.ts` runs at module load and calls `process.exit(1)`; there is nothing
  to block yet. Sync is fine there, and so is `console.error`.

## Guarding against accidental re-render churn

Solid updates the DOM in place; the classic way to lose that is to make a whole subtree
re-create itself. It is a nasty class of bug because the code type-checks, lints clean, and renders
the right thing — it is only slow.

**What lint catches** (`.oxlintrc.json`, all `error`):

| rule | catches |
|---|---|
| `solid/reactivity` | reading a prop or signal outside a tracked scope; use `untrack` when reading once is deliberate |
| `solid/no-destructure` | destructuring component props, which drops reactivity |
| `solid/prefer-for` | `array.map()` in JSX — recreates every element on change; use `<For>` |
| `solid/no-accessor-as-prop` | passing an accessor where a value is expected |
| `solid/no-write-in-pure-computation` | writing a signal from a memo or render |
| `solid/no-module-scope-reactive-primitive` | `createSignal` at module scope |

Warnings never block a commit — `oxlint` exits 0 on them and `--deny-warnings` is not set, so the
husky `pre-commit` hook only stops on errors. Use `pnpm lint:strict` when you want warnings to fail.

`solid/no-single-arg-create-effect` is deliberately **off**: it describes the Solid 2 API, and on
solid-js 1.9 the second argument to `createEffect` is the initial value, so following it would
introduce a bug.

**What lint cannot catch, and the guard that does.** A render-callback prop typed as
`(value: T) => JSX.Element` rebuilds its subtree on every change. Lint sees nothing wrong — this
was measured at one mount plus one cleanup per change, with the DOM node replaced. So any prop that
renders reactive data must be typed `RenderProp<T>` (`src/common/types.ts`), which hands the
consumer an accessor and makes the value form a compile error at every call site. That type is the
guard; lint is not.

**Measuring it in Storybook.** `.storybook/preview.tsx` instruments every story, so any play
function can assert that an interaction rebuilt nothing:

```ts
import { renderStats, resetRenderStats } from '../../../.storybook/render-stats';

play: async ({ canvas, userEvent }) => {
  await canvas.findByTestId('out');   // let it mount first
  resetRenderStats();
  await userEvent.click(canvas.getByRole('button', { name: 'next' }));
  expect(renderStats().domRemoved).toBe(0);
},
```

`owners` counts reactive owners created, `domAdded` / `domRemoved` count node churn. On a correctly
reactive component all three stay **0** across data changes; the same component taking a value
instead of an accessor measured 3/3/3 over three changes.

**Reading the numbers.** The overlay zeroes itself once the story stops mutating the DOM, so a
story you just opened reads `0 / 0` and anything above zero happened *after* it settled. It shows
`settling…` until then. It re-arms when the **story** changes, not when args change: `beforeEach`
runs on every control tweak, so zeroing there would wipe the measurement for the change you are
making. Counts therefore accumulate while you play with controls — two swaps read `+2 / -2`.

They count *creations*, so a navigation is not zero: Home → News is `+2 / -2` — one for the page's
root element swapping, one for `DataBoundary`'s pending `<p>` being replaced by the loaded `<ol>`.
An article is the same. Pages with no async data are `+1 / -1`. The trail of recent events
(`+div -div +ol -p`) makes a count explain itself. Churn is the number climbing when *nothing*
navigated or changed.

**To see it rather than assert it**, flip **Render stats** in the Storybook toolbar. That adds a
counter in the bottom-right corner, outlines each element red as it is created, turns the counter's
border red once anything has been removed, and logs `[render-stats] rebuilt N node(s): …` with the
tag names. Off by default, so stories, snapshots and the a11y tree are untouched. `__renderStats.get()`
also works in the browser console.

Four things to know if you extend it. The self-zeroing happens only while the overlay is on and
only on a story change — play functions call `resetRenderStats()` themselves, and a timer zeroing
their baseline mid-measurement would make those assertions flaky. It observes `context.canvasElement`, re-bound per story,
rather than `document.body` — the body includes Storybook's addon DOM (the a11y vision-filter
**SVG**, the highlight root), which otherwise gets counted as the story rendering; that element is
`#storybook-root` in the Storybook iframe and an anonymous div in the vitest runner, so it has to
be passed in rather than looked up. Owners tagged `$DEVCOMP` are not distinguishable here, so there
is no per-component count — `owners` plus `domRemoved` is the signal. And painting the overlay
writes `textContent`, which the observer sees, so the paint is scheduled on a frame and
de-duplicated; painting straight from the observer callback hangs the tab.

## Comments

Comment the *why*, never the *what*, and only when the why is not already visible. The default
is no comment.

Write one when:

- the code looks wrong, redundant or over-complicated but is deliberate
- deleting it would invite a "cleanup" that reintroduces a bug
- a value, an ordering, or a branch encodes a decision the reader cannot infer

Do not write one to restate the code, to label structure (`// helpers`, `// --- state ---`), to
narrate history or intent, or to repeat what the type, the name, or this file already says.

**One or two lines.** If the explanation needs a paragraph it does not belong in the source —
put it in `CLAUDE.md` or an agent doc and leave the comment as a pointer. Prefer a clearer name
or a smaller function over a comment explaining a confusing one.

```ts
// ✗ restates the code
// Fetch the config and merge it with the defaults
const merged = mergeClientConfig(response.data);

// ✓ explains what the code cannot
// Clean before Check: Check accepts unknown properties.
const candidate = Value.Clean(schema, Value.Default(schema, input));
```

## Storybook (`apps/fe`)

- Stories sit next to the component: `ComponentName.stories.tsx`
- Set `parameters.msw.handlers` on any story that triggers a network call
- Use `withPageLayout()` for page stories, `withAppProviders()` for component stories
- Handler factories live in `apps/fe/.storybook/mocks/handlers/` — reuse them across stories.
  `allHandlers` (from `mocks/handlers/index.ts`) is every endpoint on its happy path. They live
  under `.storybook/`, not `src/`, because nothing outside Storybook and `.stories.tsx` files
  imports them — there's no dev-mode "run the app against mocks" path in this repo
- `App/Full Application` renders the real router and route tree on mocks, with locale, page and
  feature flags as **controls**. Keep that set to app-wide concerns; page-specific interactions
  belong in that page's own stories. Two constraints if you extend it: Storybook updates a story
  in place instead of remounting, so the render wraps `FullApp` in a keyed `<Show>` to force a
  remount, and `FullApp` clears the `query` cache — `revalidate()` alone does not make a live
  `createAsync` re-request, so a flag change would otherwise be served the cached config
- In `play`, make the first query `await canvas.findBy*` — page content sits behind
  `RootLayout`'s `<Suspense>` and is absent on the first tick
- If `play` needs `expect`, import it from `storybook/test`, **never `vitest`**. The
  `vitest`-sourced `expect` only initializes its matcher runtime inside the actual vitest worker —
  Storybook's own dev server renders the story module directly in the browser, without that init,
  so the module-level import alone crashes every story in the file with
  `Cannot read properties of undefined (reading 'customEqualityTesters')`, even stories with no
  `play` function. `storybook/test` re-exports a self-contained `expect` that works in both places
- Nothing in the suite currently exercises navigation: no story clicks a link, so in-app routing,
  the list/article mock agreement, and `LocaleSwitcher`'s hrefs are unverified
- Run the stories as tests with `pnpm --filter fe vitest --project=storybook --run`
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

**Dev-only response validation.** `apiFetch` checks every response against the route's
`response[status]` schema and logs `api.response.invalid` with the failing paths when it diverges.
It is observational only — no `Convert`, `Default` or `Clean`, so the payload the app receives is
identical to production and a bad field shows up as a log rather than a silently repaired value.
It is not awaited (loading TypeBox would otherwise sit on the response path) and the whole branch
is behind an inline `import.meta.env.DEV`, which is what lets the production build drop it —
`strip-typebox.ts` leaves no `Value` there. Keep the guard inline and the import dynamic.

**`apps/api`** has no custom logger — use Fastify's built-in one (`app.log`, `request.log`), not `console.*`. The exception is bootstrap code that runs before the Fastify instance exists, such as env validation in `src/common/env.ts`, where `console.error` is correct.

## Error pages and data boundaries

Every error the app can surface has its own component under
`views/containers/ErrorState/errors/` (`Error401`, `Error429`, `ErrorOffline`, …). They are pure
presentation and all defer to `ErrorLayout` for the chrome, so a status can grow its own copy or
actions without touching the others.

- **`ErrorState`** is the dispatcher: it maps a kind to its component and owns the SSR response
  status. Pass `keepStatus` when the failure is a region inside an otherwise healthy page.
- **`ErrorLayout`** is sized by its container, never the viewport — it is an inline-size container
  and the status code scales with `cqi`, so the same component works as a full page or a narrow
  panel. Do not add viewport units or fixed positioning to it.
- **`SupportPrompt`** is identical on every error page. The send button is deliberately a no-op
  for now; it records `support.logs.send` so the intent shows up in the session log, and
  `logger.export()` is what it should eventually call.
- **`DataBoundary`** wraps any region that reads async data: `ErrorBoundary` outside `Suspense`
  (so it also catches failures thrown while suspended), turning a thrown `ApiError` into the
  matching page via `errorKindOf`.

**Adding an error kind:** add copy to `pages.errors` in all three locales, add the kind to
`ERROR_KINDS`, add the component, and register it in `errors/index.ts`. `ERROR_KINDS` is
`satisfies`-checked against the translations and the registry is a total `Record`, so missing
either half is a type error rather than a runtime blank.

`notFoundRoute` (`path: '*'`) is the catch-all and **must stay last** in `appRoutes`.

**Image component:** `views/components/Image/` wraps `<img>` with mandatory `alt`/`width`/`height`
and a fallback for load failures — see `views/components/Image/AGENTS.md` for the constraints
that shaped it (why there's no inline `aspect-ratio`, why SSR can never show the fallback, why
`preload` is one prop).

**Timed loading indicator:** `views/containers/TimedReveal/` is pure "nothing → loading →
taking-longer-than-usual" timing orchestration with no look of its own; `views/components/TimedLoader/`
is the concrete spinner-and-copy skin built on it, used by `DataBoundary`'s pending state. See
`views/components/TimedLoader/AGENTS.md` for the Nielsen/UX-research grounding behind the default
thresholds, why there's no fake progress bar, and a Storybook-testing gotcha (waiting on
`findByRole('status')` races the real timers, since that region mounts before either stage does).

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

**Every dynamic segment needs a `matchFilters` entry.** A bare `:id` matches any string, so
`/news/abc` reaches the page, `Number('abc')` becomes `NaN`, and the request goes out as
`/hackernews/item/NaN` — which the API rejects with a 400 that crashes SSR from the route's
`preload`. Constrain the parameter and invalid URLs fall through to the catch-all 404 instead,
without ever reaching the API:

```ts
export const articlePageRoute = defineRoute({
  path: '/news/:id',
  component: ArticlePage,
  matchFilters: { id: /^\d+$/ },
  preload: ({ params }) => void getArticle({ params: { id: Number(params.id) } }),
});
```

A filter is a `RegExp`, a string array of allowed values (as `/:locale?` uses), or a predicate.
Adding a parameterised route without one is a bug, not a style preference.

**Do not set the response status from a `Show`/`Suspense` fallback.** SSR renders and throws away a
first pass while resources are pending, and a status set in that pass still sticks — a fallback
marking 404 makes *every* successful page 404. Set it once the answer is known (in the `createAsync`
body) with `markResponseStatus` from `common/libs/http/response-status`, and pass `keepStatus` to
any `ErrorState` rendered as a fallback.

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

## Runtime client configuration and feature flags

Runtime config is served by `GET /config/client` and read through `useConfig()` / `useFeature()`.
`packages/shared/src/entities/client-config.ts` is the single source of truth for the shape, the
fallback defaults, and the OpenAPI output. The values a build ships are passed in from
`apps/fe/vite.config.ts` via `defineClientConfiguration({ … })`.

**Four layers, lowest precedence first:**

1. **Schema defaults** — the `default` on each field in `ClientConfigEntity`. The fallback for
   anything the build-time configuration omits.
2. **Build-time configuration** — `defineClientConfiguration({ … })` in `apps/fe/vite.config.ts`,
   validated against the schema and baked into the bundle as `__CLIENT_CONFIG_DEFAULTS__`. An
   invalid value fails the build, the same contract `validate-env.ts` applies to env variables.
3. **`apps/api/client-config.json`** — overlaid by the API. Path from `CLIENT_CONFIG_PATH`; the
   file is watched, so flipping a flag needs no restart or redeploy.
4. **The response** — overlaid on the baked configuration by the client.

Fetched **once per page load**; under SSR the result is serialised into the HTML payload, so
there is no flash of defaults and no second request. A flag flip reaches an open tab on its next
full page load — there is no polling.

Three constraints worth knowing before you touch any of it:

- Every field needs a `default`, and **every nested group needs `default: {}`** — `Value.Default`
  only recurses into objects that already exist, so a group without one resolves to `{}` and
  every flag inside it silently goes missing whenever the build config omits it.
- **Never validate config in browser code.** `strip-typebox.ts` swaps `@sinclair/typebox` for a
  no-op Proxy in the `client` environment. Node-only helpers live in `@repo/shared/node`, kept
  out of the `@repo/shared` barrel on purpose.
- **Config never breaks the app.** A failed fetch falls back to the baked defaults; the API keeps
  the last known-good config when the file is unreadable or invalid. Preserve both fallbacks.

Use the `feature-flags` agent (`.claude/agents/feature-flags.md`) to add, remove or audit a flag
— it has the full checklist, the remaining gotchas, and the verification recipes (`pnpm check`
cannot tell you a flag actually works).

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
5. Add an MSW handler in `apps/fe/.storybook/mocks/handlers/<domain>.ts`, and add it to
   `allHandlers` in `mocks/handlers/index.ts` if every page needs it

**Report an expected failure as data, not as a rejection.** Use `createSafeApiCall`, which resolves
to `ApiResult<T>` — `{ ok: true, data }` or `{ ok: false, status, payload }`. `status` is `null`
when the request never got a response; `payload` is whatever body the server sent with the failure
(parsed JSON, raw text, or `undefined` when empty) and is also on `ApiError.payload`. Pass the
result to `DataBoundary`, which owns all three states:

```tsx
const article = createAsync(() => getArticle({ params: { id: Number(params.id) } }));

<DataBoundary result={article()}>{(res) => <Article story={res().data} />}</DataBoundary>
```

The reason is not style. A rejection that crosses the SSR boundary is serialised into the hydration
payload and replayed in the browser, where nothing can catch it — so the browser reports
`Uncaught (in promise) ApiError` even though `apiFetch` logged it and an `ErrorBoundary` rendered
the right page. Resolving instead means there is no rejection to report, in dev or prod, with no
suppression hacks. `createApiCall` still exists for calls whose failure genuinely is exceptional;
its `ApiError` reaches `DataBoundary`'s `ErrorBoundary`, at the cost of that console entry.

**The children callback receives an accessor — read it inside the JSX, never destructure it.**
Taking the value instead makes Solid re-run the callback on every new result and tear down the
whole subtree: measured at one mount plus one cleanup per data change, with the DOM node replaced,
which on the news list means rebuilding all 30 rows on each refetch. With the accessor the subtree
is created once and only the changed text updates.

The failure `payload` is carried for the app to act on, not displayed: it is server text and would
bypass i18n. Nothing logs it either, since an error body can echo submitted values.

`DataBoundary` also only renders the error page once a definitive result exists, which is what makes
it safe for that page to set the SSR response status — see the note on discarded render passes in
[Route structure](#route-structure).

Dynamic segments also need a `matchFilters` entry — see [Route structure](#route-structure).

If a schema introduces a new `format`, register a validator in
`apps/fe/src/common/libs/fetch/validate-response.ts`. TypeBox ships none, and an unregistered
format makes every response using it report `Unknown format` as a divergence.

If the endpoint's response should be runtime-configurable rather than fixed, see
[Runtime client configuration and feature flags](#runtime-client-configuration-and-feature-flags).

## Proposing documentation for agents

At the end of any non-trivial task, **suggest what should be documented for future agents** —
then stop. Propose; do not silently write docs that were not asked for. A short list at the end
of your response is the right format:

```
Worth documenting:
- <what> → <where> — <why it is not obvious from the code>
```

**Propose an item when it is a constraint or failure mode that cost you a retry**, and a future
agent would hit it the same way. Specifically:

- an approach that looks correct, passes `pnpm check`, and silently does nothing
- a library behaviour that contradicts the obvious reading of its API (`Value.Check` ignoring
  unknown keys; `Value.Default` not recursing into absent objects)
- an invariant that a plausible future edit would quietly break (re-exporting `@repo/shared/node`
  from the barrel; replacing the merge guard with a spread)
- a verification recipe that is the only way to see whether something actually worked
- a decision the user made that the code cannot express — why once-per-page-load and not polling

**Do not propose** what the code already states, what git history records, what the library's own
docs cover, or anything specific to the single task you just did. "Added a config endpoint" is
not documentation. "The config endpoint's response is cleaned before validation because
`Value.Check` accepts unknown properties" is.

**Where it belongs:**

| Destination | For | Keep it |
|---|---|---|
| `CLAUDE.md` | rules that apply across tasks; anything an agent must know *before* choosing an approach | terse — a few lines and a pointer |
| `.claude/agents/<name>.md` | the deep workflow for one concern: checklists, verification recipes, gotchas | as long as it needs to be |
| a code comment | why *this* line is the way it is, where the reason is invisible locally | one or two sentences |

Keep `CLAUDE.md` scannable. If a section grows past roughly forty lines, move the detail into an
agent doc and leave a one-line pointer — that is why `Logging`, `Storybook` and `Accessibility`
are short sections here and full documents under `.claude/agents/`.

When you do get asked to write the docs, write down the thing that was hard to find out, not a
description of the feature. Step 3 of [How to approach work here](#how-to-approach-work-here-chain-of-thought)
— the constraint that forced the design — is almost always the sentence worth keeping.
