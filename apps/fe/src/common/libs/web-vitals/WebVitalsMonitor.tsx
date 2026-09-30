import type { Component } from 'solid-js';
import { onMount } from 'solid-js';

import type { Metric } from 'web-vitals';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

import { useLogger } from '../logger';

/**
 * Renderless — registers all five Core Web Vitals once, client-side, via `onMount`. A component
 * rather than a plain function called from `AppProvider`'s body so mounting/unmounting it follows
 * the same JSX lifecycle as everything else `AppProvider` renders, and so it can use `useLogger()`
 * — it is itself rendered inside `LoggerContext.Provider` (as `AppProvider`'s child, not the
 * component defining that provider), which is what makes the hook valid here. The module-scope
 * `logger` singleton stays reserved for genuinely non-component call sites (`common/libs/fetch`,
 * `common/libs/config`) that have no reactive owner to read context from at all.
 *
 * Each metric reports on its own schedule, not all at page load: CLS and LCP finalize once
 * visibility changes to hidden or on unload (so this logs multiple entries per page visit by
 * design — `metric.id` is what a later consumer would group them by), FCP and TTFB report early
 * in the page lifecycle, and INP only reports once the user has actually interacted with the
 * page. Absence of an `inp` entry for a visit with no interaction is expected, not a bug.
 */
export const WebVitalsMonitor: Component = () => {
  const logger = useLogger();

  // `metric.value` is each metric's own unit — a unitless layout-shift score for CLS, a
  // millisecond timing for the rest — `perf`'s second parameter is reused for it regardless,
  // since it's still the number this event exists to report.
  const report = (metric: Metric): void => {
    logger.perf(`web-vitals.${metric.name.toLowerCase()}`, metric.value, {
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    });
  };

  onMount(() => {
    onCLS(report);
    onLCP(report);
    onINP(report);
    onFCP(report);
    onTTFB(report);
  });

  return null;
};
