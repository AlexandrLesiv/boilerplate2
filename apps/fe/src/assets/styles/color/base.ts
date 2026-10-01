import { defineColorTheme } from './app-theme';

export const baseColorTheme = defineColorTheme({
  // Was `#3b82f6` — white text on it measured 3.68:1, under WCAG AA's 4.5:1 for normal text.
  // `#2563eb` (ex-`primaryHover`) passes at 5.17:1 and reads as a better-distinguished button
  // against this theme's light `surface` than any darker shade would. Found live via `Link`'s
  // `a11y: { test: 'error' }` story, the first thing in this app to actually enforce button-text
  // contrast — `AppButton` had carried this since before `Link` existed. See `Link/AGENTS.md`.
  primary: '#2563eb',
  // One step darker than `primary`, same as before — white text on it measures 6.70:1.
  primaryHover: '#1d4ed8',
  primaryContrast: '#ffffff',
  // Independent of `primary`/`primaryHover` on purpose — those are tuned for white text on top of
  // them (a button background); this is tuned for use *as* text directly on `surface` (a link).
  // `primary` happens to equal this in this theme now, but that's incidental, not a reason to
  // derive one from the other — the night theme's equivalent pair isn't equal. Verified
  // independently: 4.94:1 against this theme's `surface` (#f8fafc).
  linkText: '#2563eb',
  surface: '#f8fafc',
  surfaceHover: '#f1f5f9',
  border: '#e2e8f0',
  text: '#1e293b',
  textSecondary: '#64748b',
  error: '#ef4444',
  success: '#22c55e',
});
