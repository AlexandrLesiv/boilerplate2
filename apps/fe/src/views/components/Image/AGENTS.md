# Image component

`Image.tsx` wraps `<img>` with mandatory `alt`/`width`/`height`, lazy loading and async decoding
by default, and a fallback that engages on the native `error` event.

- **No inline `aspect-ratio`, on purpose.** The repo's Styles convention (`CLAUDE.md`) rules out a
  per-instance inline style, and `width`/`height` are numeric props anyway (not build-time-known,
  so vanilla-extract can't precompute a class per ratio). Modern browsers already derive the box's
  aspect ratio from the `<img>`'s own `width`/`height` *attributes* once `height: auto` is set in
  CSS — no explicit `aspect-ratio` needed. That only works while the element stays in the DOM, so
  a failed image is hidden with `visibility: hidden` (keeps its box) rather than removed or
  `display: none`'d — the fallback overlays it, `position: absolute; inset: 0`, sized by that same
  box. Do not swap the `<img>` out of the tree on error; that loses the only thing giving the
  container its size.
- **The fallback state is unreachable during SSR.** A load failure is a client-only browser event
  — SSR always renders the success path, and the fallback appears only after hydration when
  `onError` actually fires. There is no way to pre-detect a broken URL without a server-side probe
  per image, which this component does not do.
- **`alt=""` (decorative) also silences the fallback.** A broken decorative image gets
  `aria-hidden` instead of `role="img"` + label — otherwise a decorative image that fails becomes
  *louder* to screen readers on failure than it was on success, which is backwards.
- **`preload` is one prop, not four.** Setting it flips `loading`, `decoding`, `fetchpriority` and
  adds an SSR `<Link rel="preload" as="image">` together, so a caller marking a hero image doesn't
  have to know all four levers exist or get one wrong. The `<Link>` is safe to render from inside
  the component (not just from route-level `info.meta`) specifically because `App.tsx` wraps
  `MetaProvider` in `DedupedMetaProvider`, which dedupes `link`/`script` tags by the id
  `@solidjs/meta` assigns internally — without that wrapper, a preload rendered under a `Suspense`
  that resuspends during SSR would double-push into `<head>`.
- **No responsive `srcset`/`<picture>` support.** There is no image transform pipeline (build step
  or CDN) anywhere in this repo yet — `src` is a single URL. Add format/width negotiation only once
  something actually produces the variants; building the API for it on faith would be guessing.

## Storybook gotcha specific to these stories

`Image.stories.tsx` is (as of writing) the only story file in the repo whose `play` function calls
`expect()`. It must import `expect` from `storybook/test`, never from `vitest` — see the
`## Storybook` section of the root `CLAUDE.md` for why (the `vitest`-sourced `expect` crashes the
plain Storybook UI preview with `customEqualityTesters` undefined, since Storybook renders the
story module without vitest's runtime init). If you add more `expect()` calls here, or copy this
story file as a template elsewhere, keep the import as `storybook/test`.
