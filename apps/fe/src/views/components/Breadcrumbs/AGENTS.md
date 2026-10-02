# Breadcrumbs

ARIA APG's breadcrumb pattern: `<nav aria-label="Breadcrumb">` wrapping an `<ol>`, trail items are
real `<A>` links, the current page is plain text with `aria-current="page"` and is never a link
(linking a page to itself is a dead click, not a shortcut). Separators are a decorative
`aria-hidden="true"` `<span>`, not CSS generated content — simpler, and avoids the inconsistent
history CSS-generated content has with screen readers actually respecting `content: none`-style
hiding.

## One list, two renderings

`BreadcrumbsProps.items` (`{ label, href }[]`) drives both the visible `<Breadcrumbs>` trail and
`defineBreadcrumbListSchema(items)`'s `BreadcrumbList` JSON-LD — same array, passed to both from
the page. Keeping them as one call site rather than building the schema independently is what
guarantees they can't drift (e.g. a trail edit that forgets to update the schema's `itemListElement`
alongside it). `href` is an app-relative path (e.g. `/news`) for `<A>`; the JSON-LD mapping is the
one place that wraps it with `absoluteUrl`, since schema.org's `item` must be fully qualified while
`<A href>` must not be (a fully-qualified `href` would be a real cross-origin-looking navigation,
not a same-app route).

## Why there's no `info.load` wiring into route `meta()`

`AppRouteInfo<TData>.load` exists in the type (`common/libs/router/index.ts`) but `RootLayout.tsx`'s
`routeMeta()` always calls `info.meta(undefined, i18n.t())` — `load`'s result is never read anywhere.
Confirmed by reading `RootLayout.tsx`, not assumed: every route's `meta()` receives `undefined` as
its first argument today, regardless of whether `load` is defined. This mattered here because the
article's breadcrumb trail needs the *article's own title*, which is only known after `getArticle`
resolves — the obvious-looking move is to add `info.load` to `articlePageRoute` and read it in
`meta()`. That would have typechecked and done nothing, silently falling back to `undefined` forever
(the exact "passed every check while doing nothing" failure mode `CLAUDE.md` calls out), because
nothing calls `load` to begin with.

Fixing `RootLayout` to actually call `load` would mean making `routeMeta()` async-aware inside a
`Suspense` boundary that currently assumes a synchronous `meta()` — a real, separate change, bigger
than this feature needs. `ArticlePage.tsx` already has the article's data via its own `createAsync`
inside `DataBoundary`'s resolved callback, so both the `<Breadcrumbs>` trail and the `<JsonLd>`
schema render directly from there instead, each a sibling `<JsonLd>` mount alongside the one
`RootLayout` renders from route `meta()` — confirmed safe because `JsonLd` (`common/libs/seo/JsonLd.tsx`)
keys each `<script>` tag with its own `createUniqueId()`, so multiple independent mounts (one from
`RootLayout`'s route-level schema, one from the page's own breadcrumb schema) coexist without
collision.

## Why the trail links have no component-owned class

A bare `<A href>` with no extra class already renders with the contrast-verified `linkText` color
and hover underline, straight from `global.css.ts`'s own bare-`<a>` rule (see `Link/AGENTS.md`'s
contrast investigation — same token, already proven AA-safe in both themes). `styles.list` sets
`font-size`/`color` once at the list level for the muted "secondary, small" look (matching `Text`'s
own verified-safe combination without depending on `Text` itself, which renders `p`/`span`, not
this mixed link/plain-text list) — the current-page `<span>` keeps that inherited color, and the
link gets its own `color` from the global rule, which wins over inheritance because it's set
directly on the element, not inherited. Reusing `AppButton`/`Link`'s `interactiveVariants.link`
instead was tried and dropped: it also sets `fontSize` directly on the element (from
`interactiveBase`), and overriding that from a second class defined in a different `.css.ts` module
would depend on which file's compiled output vanilla-extract happens to place later in the
stylesheet — not a constraint worth taking on for a look this simple.

## No margin — same "no margin" convention as `Text`/`Heading`

`Breadcrumbs` sets no top/bottom margin on itself. Each consuming page (`NewsPage`, `ArticlePage`)
applies its own `styles.breadcrumbs` (a plain `marginBottom`) via the `class` prop, same as every
other primitive in this app leaves spacing to its container (`Text/AGENTS.md`).

## Replaces `ArticlePage`'s old "back to news" link

The breadcrumb's "News" trail item serves the same purpose as the plain `<A href="../">` link that
used to sit below the article body — keeping both would be redundant. `pages.article.backToNews`
(all three locales) was removed along with it since nothing else referenced that key.

## Target size

WCAG 2.5.8 (enabled globally in axe-core's `target-size` rule — see `Dialog/AGENTS.md`) has an
explicit exception for links inline in a block of text. Verified via `test-run`, not assumed: the
breadcrumb trail links raise no `target-size` violation, unlike `AppButton`-based isolated controls
elsewhere in this app that needed explicit padding to clear 24×24px (`RootLayout.stories.tsx`'s
`HeaderTouchTargetsMeetMinimumSize`).
