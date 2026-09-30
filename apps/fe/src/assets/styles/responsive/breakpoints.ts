export const MIN_SUPPORTED_VIEWPORT = 320;
export const MAX_SUPPORTED_VIEWPORT = 1920;

export const responsiveBreakPoints = {
  xsm: 0,
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  xxl: '1400px',
} as const;

/**
 * An exclusive upper-bound media query, e.g. `belowBreakpoint('sm')` for "narrower than sm start".
 * Computed as a plain pixel number, not `calc(${responsiveBreakPoints[name]} - 1px)` — vanilla-
 * extract's media-query validator rejects `calc()` inside a feature value outright (a build-time
 * error), even though a real browser accepts it fine in a plain stylesheet.
 */
export const belowBreakpoint = (name: Exclude<keyof typeof responsiveBreakPoints, 'xsm'>): string =>
  `(max-width: ${Number.parseInt(responsiveBreakPoints[name], 10) - 1}px)`;
