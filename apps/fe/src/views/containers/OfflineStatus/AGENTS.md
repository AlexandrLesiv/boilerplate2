# OfflineStatus

## `position: absolute`, not normal flow — real layout shift, not just a visual nuisance

The original version rendered as a plain block between `header` and `<main>`: zero height while
`state()` is `'online'`, then a padded `<p>` inserted the moment it goes `'offline'` or
`'reconnected'`. That insertion pushes `<main>` down — a real CLS-contributing layout shift (Web
Vitals), not something that only looks like one, and it fires on every connectivity change for
as long as the tab is open.

`OfflineStatus`'s outer `role="status"` div is `position: absolute; top: 100%; left: 0; right: 0`
(`styles.css.ts`'s `region`). Its containing block is `layouts/styles.css.ts`'s `.header`
(`position: relative`) — the same ancestor `MobileNav`'s panel anchors against (see
`MobileNav/AGENTS.md`) — so the banner overlays flush below the header instead of displacing it,
regardless of whether it's empty, showing the offline message, or showing the reconnected one.

`left`/`right: 0` resolve against `.header`'s padding box, which starts at its own border edge —
outside the header's own safe-area-aware padding — so `banner` carries its own
`calc(1rem + safeAreaLeft/Right)` padding rather than inheriting the header's, exactly like
MobileNav's `nav`. Without it, the message text could sit under a device notch on narrow screens.

## `zIndex: 30` — coordinating with MobileNav's panel, not picked at random

Both `OfflineStatus` and MobileNav's open panel anchor to the same box (`.header`, `top: 100%`),
so on a narrow viewport they can occupy the same screen region at the same time: mobile nav open,
connectivity changes. `OfflineStatus` is given the higher `zIndex` (30 vs. MobileNav's 20) so the
connectivity message stays legible on top rather than being hidden behind the nav panel — a
system status is treated as more urgent than a navigation affordance the user opened themselves.
Still below `SkipLinks`' `zIndex: 100`.

## Still always mounted, just invisible — not a new constraint, restated for this change

The outer `div` stays in the DOM at every connectivity state (see the component's own doc
comment) so screen readers pick up the text change inside an already-existing live region.
`position: absolute` doesn't change that — an empty, zero-height, absolutely positioned div is
exactly as inert as an empty static one, just without the flow participation.
