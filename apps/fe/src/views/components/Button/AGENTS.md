# AppButton

## `loading` is a reusable prop, not a one-off on any single call site

Added when `ContactChat`'s Send button needed a busy state while waiting for the scripted reply.
The obvious shortcut — a local spinner + `disabled` just inside `ContactChat.tsx` — was rejected
in favor of putting it on `AppButton` itself, since "an action is in flight" is a generic button
concern, not a chat-specific one. Any future submit/mutation button should use this prop rather
than re-deriving the same disabled+spinner+`aria-busy` triplet locally.

`loading` combines with `disabled` rather than replacing it (`disabled={local.loading ||
local.disabled}`) — a button that's `disabled` for some other reason (a form validation failure)
must stay disabled once `loading` finishes, not spring back to enabled.

## `aria-busy[disabled]` needs its own opacity override

The shared `interactiveBase` style (`assets/styles/interactiveVariants.css.ts`) dims every
`:disabled` element to `opacity: 0.5`. Left alone, a loading button would get that same dimming —
wrong, since "temporarily busy" and "permanently unavailable" are different states that should
look different. The fix is a higher-specificity selector, `&:disabled[aria-busy="true"]`, that
resets opacity to `1` and swaps the cursor to `wait`. If `AppButton` ever grows another
`disabled`-but-not-actually-inert state, it belongs here, not as a one-off override at the call
site — this selector is the established place for "disabled for a reason the user should still
read as active."

## The spinner is `currentColor`-driven, not a fixed token

`AppButton` renders on visually opposite variants — `primary` (light text on a dark fill) and
`ghost` (dark text, no fill) among them. A spinner hardcoded to one theme token would be invisible
or wrong-contrast on at least one variant. Using `currentColor` for the moving arc and
`color-mix(in srgb, currentColor 30%, transparent)` for the dim ring means the spinner always
matches whatever text color the current variant already resolved to, with no per-variant
branching. Contrast this with `TimedLoader`'s own spinner, which legitimately hardcodes
`themeVars.color.primary` — that one only ever renders against `DataBoundary`'s fixed pending
background, so there's no second variant to stay correct against.

## A disabled submit button does not stop Enter from submitting the form

The gotcha that actually cost a bug: `ContactChat`'s Send button is `loading={typing()}`, which
sets `disabled` on the button — but the browser's implicit-submit-on-Enter inside the message
`<input>` fires the form's `submit` event directly, not a click on the disabled button, so
`disabled` on the button does **nothing** to stop a second submit while already waiting on a
reply. `ContactChat.tsx`'s `handleSubmit` guards against this explicitly at the top:

```ts
const handleSubmit = (event: SubmitEvent) => {
  event.preventDefault();
  if (typing()) return;
  // ...
};
```

Any other form whose submit button goes `loading` needs the same guard in its own submit handler
— disabling the button alone only blocks a pointer click on that specific element, never a
same-form Enter-key submit.
