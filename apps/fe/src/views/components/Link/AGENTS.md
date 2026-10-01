# Link

## Visual look is decoupled from the element — shared with `AppButton`

`Link` (a real `<a>`) and `AppButton` (a real `<button>`) both consume the same
`variant`/`interactiveBase`/`interactiveVariants` from `assets/styles/interactiveVariants.css.ts`.
Neither component owns that module. This is what makes both directions possible:

- `<AppButton variant="link">` — a real button, with real button semantics (no `href`, not in the
  tab order as a link, doesn't navigate), that's visually indistinguishable from inline link text.
  For a "Cancel" action sitting inside a sentence that still needs button behavior.
- `<Link variant="primary">` — a real anchor, with real navigation (`href`, opens in a new tab via
  `target`, etc.), that reads as a prominent call-to-action button.

Neither component infers one from the other — `variant` is always explicit, same reasoning as
`Heading`'s `as`: the thing that determines correct *behavior* (which tag renders) must never be
inferred from the thing that only determines *appearance*.

## `Link` renders a plain `<a>`, not `@solidjs/router`'s `<A>`

For internal routes that also want one of these variants, apply `interactiveVariants[variant]`
(and `interactiveBase`) to `<A>` directly yourself — they're plain exported classes, not locked
inside this component. `Link` exists for the case `<A>` doesn't cover: external links and anywhere
a plain anchor is already the right tag (this app's own `ArticlePage` already had exactly this
split before `Link` existed — `<A href="../">` for the internal "back to news" link,
`<a target="_blank" rel="noopener noreferrer">` for the outbound HN link). Trying to unify both
under one component's prop surface would mean merging `<A>`'s routing-specific props
(`end`, `activeClass`) with `<a>`'s own (`target`, `rel`, `download`) for no real benefit.

## Two real, pre-existing contrast bugs, found by turning this component's a11y check on

Both were already live in the app before `Link` existed — this component's
`a11y: { test: 'error' }` story is simply the first thing that ever actually checked.

**Bare link text.** The global `a` rule (`global.css.ts`) used `themeVars.color.primary` as link
text color. `primary` (`#3b82f6` at the time) measured 3.51:1 against `surface` as text — under
WCAG AA's 4.5:1 for normal-size text. Fixed by adding a dedicated `linkText` token
(`color/base.ts`/`color/night.ts`), verified independently per theme rather than reused from an
existing one — `primaryHover` happens to pass in the base theme but measured *worse* than
`primary` itself in the night theme (the two tokens don't move the same direction across themes),
so borrowing one for a second purpose isn't safe in general. `global.css.ts`'s bare `a` rule and
`interactiveVariants.css.ts`'s `link` variant both use `linkText` now.

**Every primary button, in both themes.** White `primaryContrast` text on `primary` measured
3.68:1 in the base theme and 2.54:1 in the night theme (worse — the night theme's lighter blue,
chosen for visual harmony against its dark `surface`, made text contrast worse, not better).
`AppButton` had carried this since before `Link` existed; `AppButton.stories.tsx` just never had
`a11y: { test: 'error' }` set, so nothing ever caught it. Fixed by darkening `primary` to a
verified-safe shade (`#2563eb`, white text 5.17:1) in both themes — the same value in both, rather
than a separate darker shade tuned per theme, because the darker alternatives that would also pass
(`#1e40af`, etc.) read as *less* visually distinct against the night theme's dark `surface`
(verified: 1.68:1 vs `#2563eb`'s 2.83:1) — exactly the opposite of what picking a lighter blue for
dark mode was trying to achieve in the first place.

If a future color change touches `primary`/`primaryHover`/`linkText` again: re-verify all three
contrast pairs this section found (text-on-surface for `linkText`, white-on-background for
`primary`, and the background-vs-surface visual-distinction check for dark mode specifically) —
don't assume a value that passes one of them passes the others.
