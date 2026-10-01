# Text

## No margin, in either direction — on purpose

`as="span"` must never carry block-level spacing that implies a paragraph break it isn't; `as="p"`
relies on its container's own layout (`gap`, etc.) rather than a margin convention of its own —
same approach `Dialog`'s `fieldGroup`/`form` already use. If a caller needs space around a `Text`,
that's the container's job, not something to add here as a default.

## `small` is `0.875rem` — checked against the real contrast values, not assumed

`textSecondary` on `surface` clears ~4.55:1 in the light theme (~5.71:1 in dark), verified against
the actual theme color hex values, not assumed — compliant for normal text (the ≥4.5:1 threshold,
not the ≥3:1 "large text" one) but with little margin in the light theme specifically. `secondary`
+ `small` together is the lowest-margin combination this design allows; shrinking `small` further
risks illegibility before it risks contrast compliance, since the ratio itself doesn't change with
size. Don't add a smaller size variant without re-checking contrast at that size's actual rendered
look, not just the numeric ratio.

## `as="p" | "span"` only — no `"div"`

Kept intentionally narrow to what's actually body copy. A flex/grid layout wrapper that happens to
also want secondary-colored, smaller text (e.g. a metadata row) is a layout concern first, not a
`Text` use case — see `views/pages/news/styles.css.ts`'s `meta` class, which stayed a plain styled
`<div>` rather than being forced through `Text`, specifically because it's a flex container first.
`rank` in that same file *did* migrate to `Text as="span"`, because it's genuinely just a styled
text run with no layout job of its own — that's the line: migrate when `Text`'s own tag options
fit without a fight, leave it alone when they don't.

## Three details from jakub.kr's "details that make interfaces feel better", applied selectively

Source: https://jakub.kr/writing/details-that-make-interfaces-feel-better (QUALITY.md's own UX
reading list). It names four text-rendering details; only some belong on `Text` specifically:

- **`text-wrap: pretty`** — on `base`, unconditionally. Avoids a lone short word stranded alone on
  a paragraph's *last* line. Pure progressive enhancement: unsupported engines ignore the
  declaration and wrap normally, so there's no fallback branch to write.
- **`text-wrap: balance`** — the article's sibling property, deliberately *not* added here.
  `balance` evens out line lengths across short, few-line text (titles), which is `Heading`'s job,
  not `Text`'s — and most engines cap how many lines it'll balance at all (it's expensive to
  compute for long, many-line content, which is exactly what `Text` renders). If `Heading` ever
  gets this, it's a separate change there, not a reason to add it here too.
- **`-webkit-font-smoothing: antialiased`** — deliberately *not* set on `Text`. The article itself
  recommends applying it app-wide; it lives on `html` in `global.css.ts` instead, since every piece
  of text — headings, buttons, links — benefits identically and scoping it to one component would
  leave the rest inconsistent for no reason.
- **`font-variant-numeric: tabular-nums`** — the `numeric` prop, opt-in rather than a default.
  Keeps digit widths uniform so numeric text doesn't visibly shift as its own digits change. The
  article flags that some fonts change *which glyphs* render for tabular digits, not just their
  width — checked against what this app actually ships: `global.css.ts`'s font stack names `Inter`
  first, but there's no `@font-face`/font-loading of any kind anywhere in `apps/fe` — `Inter` has
  never actually been the rendered font, every user is really seeing `system-ui`/`-apple-system`.
  The glyph-shape caveat is moot *today*, but re-check it against whatever font actually gets
  loaded if one ever is — don't assume the name in the font stack is the font being rendered.

## Guideline: constrain the *measure* (line length) on any page with continuous prose

`Text` renders body copy at whatever width its container gives it — on its own, a wide viewport
produces uncomfortably long lines (150+ characters isn't unusual on a desktop monitor with no
constraint at all, which is exactly what `ArticlePage` did before this was added: Storybook's own
demo stories happened to wrap their examples in a narrow `max-width` box for layout reasons, which
masked that the real page had no constraint of its own anywhere — not in `ArticlePage`, not in
`RootLayout`'s `main`, nowhere).

**The rule:** any page rendering continuous prose — not a form, not a short label, not a table
cell — constrains its own content container to `READABLE_MEASURE` (`assets/styles/themes.css.ts`,
`65ch`), the classic 45–75-characters-per-line typographic "measure." `ch` tracks character count
directly regardless of font-size, which a fixed `px`/`rem` width does not.

**Where it goes, concretely:**
1. Apply `maxWidth: READABLE_MEASURE` to the page's own outermost content container (not a nested
   wrapper around just the paragraphs) — see `views/pages/news/article/styles.css.ts`'s
   `container` class for the reference implementation. The whole column — title, body, images,
   metadata — shares one width; a full-width title sitting over a narrower paragraph block reads
   as broken, not intentional.
2. Import `READABLE_MEASURE` from `themes.css.ts` directly, the same cross-file plain-constant
   import `global.css.ts` and `login/styles.css.ts` already use — don't restate `'65ch'` as a
   second literal anywhere; one source, so a future global adjustment doesn't need hunting down
   every page that copied the number.
3. **Never on `Text`/`Heading` themselves.** Same reasoning as the no-margin rule above: plenty of
   real `Text` content (labels, captions, table cells, a `Heading` sitting in a narrow card) has
   no business being capped at prose width. Measure is a page-layout decision, not a typography-
   component default — components have no way to know whether their content is "the prose" or
   something else entirely.
4. Pair it with centering (`margin: 0 auto`) if the page doesn't already have another layout
   mechanism (a sidebar, a grid column) positioning the capped column — `ArticlePage` didn't need
   this, since it has no competing layout pulling the column to one side, but a page that does
   would look lopsided without it.

**Verify it, don't just trust the CSS compiles**: resize to a genuinely wide viewport (1600px+)
and confirm the content column actually stops growing — a `max-width` on the wrong element (a
nested div instead of the real outer container, or an element that isn't actually the width-
constraining ancestor) typechecks and lints clean while doing nothing visible.
