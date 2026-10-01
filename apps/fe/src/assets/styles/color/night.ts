import { defineColorTheme } from './app-theme';

export const nightColorTheme = defineColorTheme({
  // Was `#60a5fa` — a lighter blue chosen for visual harmony against this theme's dark `surface`,
  // but white text on it measured only 2.54:1, badly under WCAG AA's 4.5:1. Same verified value as
  // the base theme now (`#2563eb`, white text 5.17:1) rather than a separate darker shade tuned
  // just for this theme: darker options (e.g. `#1e40af`) pass contrast fine but read as *less*
  // visually distinct against this dark `surface` (verified: 1.68:1 vs this value's 2.83:1), the
  // opposite of what a lighter-blue-for-dark-mode choice was trying to achieve in the first place.
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryContrast: '#ffffff',
  // Independent of `primary`/`primaryHover` — see `base.ts`'s comment on this same key. This
  // theme's value is its *old* `primary` (#60a5fa), which was never the problem: it already
  // passed as text-on-`surface` (5.75:1) and didn't need to change just because `primary` did.
  linkText: '#60a5fa',
  surface: '#1e293b',
  surfaceHover: '#334155',
  border: '#475569',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  error: '#f87171',
  success: '#4ade80',
});
