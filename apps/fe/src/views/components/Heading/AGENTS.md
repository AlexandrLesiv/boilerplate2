# Heading

## `as` and `size` are deliberately decoupled — never infer one from the other

`as` (`h1`–`h6`) is the document-outline level; `size` (`xl`–`xs`) is the visual weight. `size`
defaults from `as` (`DEFAULT_SIZE_BY_LEVEL`) when omitted, purely for convenience at the common
call site — that default is the *only* place the two ever interact. Never add a shortcut that
derives `as` from `size`, or that skips to "the next level" automatically: `as` has to stay an
explicit, intentional choice at every call site, because it's the one thing search engines and
screen readers actually read as the page's outline. A page that needs an `<h2>` that doesn't look
like "the second-biggest text on the page" — or an `<h1>` that isn't the visually largest thing —
is exactly the case this exists for; see `Dialog.tsx`'s own title (`as="h2" size="md"`) for a real
example already in this codebase.

## Why `as` is required, with no default

A default (e.g. `'h2'`) would make it easy to drop a `Heading` into a page without ever deciding
what level it actually is — the most common way real pages end up with a broken or arbitrary
outline. Making the caller choose every time is the point, not an oversight.

## One real `<h1>`–`<h6>` tag, not `role="heading"` + `aria-level`

Rendered via `solid-js/web`'s `<Dynamic component={local.as} />`, which Solid supports for native
element tag name strings, not just components. This keeps the actual semantic element real — a
screen reader's heading navigation, a crawler's outline parsing, and `:focus`-related UA defaults
all come from the tag itself, not from an ARIA role bolted onto a `<div>`.

## Sizes are `rem`, not `px` — tracks the root font-size, not a breakpoint

Every `size` variant is a plain `rem` multiple of `themes.css.ts`'s `fontSizeNormal` token (and
therefore `html`'s own font-size), rather than a hardcoded pixel value — if that single root value
is ever revisited, the whole scale moves with it, with no separate per-heading rule to update.

This used to also mean the whole scale shrank on mobile, when `fontSizeNormal` itself dropped from
16px to 12px below the `sm` breakpoint — removed after checking real mobile-typography practice
(not assumed): smaller text on mobile is backwards from nearly every mobile-typography guideline,
confirmed against a reference site's own live computed styles (their mobile body text measured
barely smaller than desktop, never below ~20px — nowhere near a 25% cut). See `themes.css.ts`'s
own comment on `FONT_SIZE_NORMAL` for the full reasoning and why this also affected every
`rem`-based spacing value site-wide, not just text.

## A multi-`<h1>` dev check was considered and explicitly not built

Opquast recommends exactly one `<h1>` per page; WCAG has no success criterion that numerically
bans more than one (closest are 1.3.1 and 2.4.6, both about correctness/descriptiveness, not
count) — so this would have been a best-practice warning, not a spec violation. A Storybook-level
version was prototyped (scoped to `context.canvasElement`, since Storybook's own preview chrome
permanently injects two decoy `<h1>`s into every story's iframe — a hidden "No Preview" heading
and an empty `#error-message` heading, found live when an earlier `document.body`-scoped version
reported 3 h1s for a page with exactly one real one) and then deliberately removed — not because
the mechanism didn't work, but because it wasn't wanted. If this gets revisited, re-read this
section before re-scoping to `document.body`; that specific mistake is already made and fixed once.
