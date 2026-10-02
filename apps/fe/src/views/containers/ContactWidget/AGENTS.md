# ContactWidget

The ecommerce "chat with us" / "ask a seller" floating action button, generalized: this app has
no seller/product domain, so the copy is domain-neutral ("Ask a question") rather than assuming
one. Rendered once by `RootLayout`, visible on every page, same placement model as `LoginDialog`.

## It's a scripted chat, not a form — and not a real backend

There is no support backend in this app, and building one (a WebSocket/polling endpoint, a real
responder) wasn't in scope. `ContactChat` is a real chat *interface* — message bubbles, a `role="log"`
region, a typing indicator, an input that stays put while the log scrolls — wired to a scripted,
frontend-only responder: every sent message gets the next reply from a small rotating pool
(`common.contact.commonReplies`, three generic acknowledgements) after a fixed `REPLY_DELAY_MS`
(500ms) "typing" delay. It is not content-aware — it never reads what the user typed beyond
logging its length — so it can't misfire in a locale-unsafe way (a keyword-matching responder
tuned to English words would silently stop working for the `ru`/`ua` locales). If a real backend
chat ever gets built, replace `handleSubmit`'s `setTimeout` branch with whatever the real
transport is (WebSocket message handler, polling response, SSE) — the message list, bubble
rendering, and log semantics don't need to change.

**Earlier version was a contact form**, not a chat (email + message fields, a `SupportPrompt`-style
no-op submit). Replaced after direct feedback that "ask a seller" implies a real-time back-and-forth,
not a one-shot message — same no-backend constraint, different interaction shape.

## `role="log"`, not a generic container

ARIA's `log` role is specifically for "a type of live region where new information is added in a
meaningful order and old information may disappear" — this is the one ARIA role actually built for
a chat transcript, as opposed to `role="status"`/`alert` (one-shot announcements) or a plain `<div>`
(nothing announced to assistive tech at all). New messages and the typing indicator are both inside
it, so both are picked up by the same live region.

## Typing indicator: visually decorative, separately announced

The three pulsing dots are `aria-hidden="true"` — same "icon is decorative, hidden span carries the
meaning" split `Link/AGENTS.md` already established — paired with a `visuallyHidden` text node
("Agent is typing…") inside the same `<Show>`, so a screen reader announces the state change via
the `role="log"` region picking up the new text node, not by trying to describe pulsing circles.

## Reuses `Dialog`'s `getAnchorElement`

The dialog grows from the floating button instead of popping from the screen center — the exact
mechanism built for `LoginDialog` (see `Dialog/AGENTS.md`, "Anchoring the open/close pivot to a
trigger element"). No new animation code needed; this is the second real consumer, proving that
feature out beyond its original single use.

## Placement in `RootLayout`: last child, not first

Rendered after `<main>`, not before it, inside `appShell`. It's `position: fixed`, so where it
sits in the DOM doesn't affect its visual position — but it does affect tab order. Placing it
before `<main>` would put a page-wide floating button ahead of every page's actual content in
keyboard tab order, on every page; placing it last means Tab reaches it only after the page's own
content, same reasoning a "back to top" or chat-widget button typically sits at the end of the
DOM in practice.

## Mobile: hidden behind an open dialog for free

No extra code needed — `RootLayout`'s `appShell` already hides its entire subtree below `sm`
whenever any `dialog[open]` exists anywhere inside it (`views/layouts/styles.css.ts`, built for
`Dialog`'s own mobile full-screen takeover). This widget is just another descendant of that same
subtree, so it disappears along with the header/nav while `LoginDialog` or its own dialog is open
on mobile, with no widget-specific rule to write or maintain.

## Bubble colors are reused, verified pairs — not new ones

The user's own message bubble uses `primary`/`primaryContrast` — the exact pair `Link/AGENTS.md`
already verified AA-safe (5.17:1) when `AppButton`'s primary variant needed the same fix. The
agent's bubble uses `surfaceHover`/`text`, both already used elsewhere as a text-bearing surface.
An earlier pass used `themeVars.color.success` as the (now-removed) form's success-message color
without checking it as *text* contrast — axe's `color-contrast` rule caught it at 2.17:1 against
`surface`, well under AA's 4.5:1 floor. `success` was only ever verified as a *background* color
(`OfflineStatus`'s reconnected banner, white text on top of it) — the exact "don't assume a value
that passes one contrast pair passes another" lesson `Link/AGENTS.md` already documents for
`primary`/`primaryHover`/`linkText`. Don't reach for `color.success` as a *text* color anywhere
without independently verifying it against whatever it'll sit on.
