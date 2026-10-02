# Abbr

Wraps the native `<abbr>` element with a required `title` — the WCAG technique (H28, success
criterion 3.1.4 Abbreviations) for exposing an abbreviation's expansion. `title` is required, not
optional: an `<abbr>` with no `title` is indistinguishable from plain text to assistive tech, so
there's no valid case for omitting it here.

No companion `aria-label`. `title` alone is the correct exposure — pairing it with an `aria-label`
carrying the same text risks a double announcement in some screen-reader/browser combinations,
for no added information.

**Known gap, not fixed here**: `title` is effectively hover/mouse-only — there's no touch
equivalent, and announcing it varies across screen-reader/browser pairs (notably inconsistent on
mobile Safari + VoiceOver). This is still the WCAG-recommended technique and clears 3.1.4 as the
baseline; a page that needs the expansion to be unconditionally visible, not hover-dependent,
should spell it out in running text instead — that's a page-content decision `Abbr` itself can't
make generically.

The dotted underline is authored here, not inherited from the browser — Firefox dropped the
default UA styling for `abbr[title]`, so without it the element is visually identical to plain
text and the `title` affordance is undiscoverable.
