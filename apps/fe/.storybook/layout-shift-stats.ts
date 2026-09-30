export interface LayoutShiftStats {
  /** Sum of `entry.value` for every shift attributable to a node inside the story's canvas. */
  score: number;
  /**
   * Same sum, but excluding shifts the browser flags `hadRecentInput` — the filter the real CLS
   * metric applies before scoring. Kept as a second field rather than applied to `score` by
   * default: this tool exists specifically to catch shifts *caused by* an interaction (a click
   * that reveals content and pushes everything below it), which real CLS deliberately excludes
   * on the theory that a shift right after input was probably intentional. Read this field
   * instead of `score` if what you actually want is "would this count against real CLS."
   */
  scoreExcludingRecentInput: number;
  /** Number of layout-shift entries counted, regardless of `hadRecentInput`. */
  shiftCount: number;
}

interface LayoutShiftStatsApi {
  get: () => LayoutShiftStats;
  /** Zero the counters — call before the interaction you want to measure. */
  reset: () => void;
  /** Show or hide the on-screen readout. `storyId` starts a fresh measurement only when it
   * changes, matching `render-stats.ts`'s reasoning: a control tweak shouldn't wipe the count. */
  setOverlay: (enabled: boolean, storyId?: string) => void;
}

declare global {
  interface Window {
    __layoutShiftStats?: LayoutShiftStatsApi;
  }
}

// The Layout Instability API is Chromium-only and isn't in TypeScript's bundled DOM lib —
// hand-declared here the same way the `web-vitals` package declares its own copy of these.
interface LayoutShiftAttribution {
  node?: Node;
  previousRect: DOMRectReadOnly;
  currentRect: DOMRectReadOnly;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources: LayoutShiftAttribution[];
}

const OVERLAY_ID = 'sb-layout-shift-stats';

const counts: LayoutShiftStats = { score: 0, scoreExcludingRecentInput: 0, shiftCount: 0 };

let observer: PerformanceObserver | null = null;
let overlay: HTMLElement | null = null;
let verbose = false;
let sessionStoryId: string | undefined;
let scopeRoot: Element | null = null;

/** Last few shifts, so a score like "0.0312" explains itself. */
const trail: string[] = [];
const TRAIL_MAX = 8;

const isSupported = (): boolean =>
  typeof PerformanceObserver !== 'undefined' &&
  (PerformanceObserver.supportedEntryTypes?.includes('layout-shift') ?? false);

const describeShift = (entry: LayoutShiftEntry): string => {
  const source = entry.sources.find((s) => s.node instanceof Element);
  const tag = source?.node instanceof Element ? source.node.tagName.toLowerCase() : 'unattributed';
  const deltaY = source ? Math.round(source.currentRect.top - source.previousRect.top) : 0;
  return `${tag} Δy${deltaY >= 0 ? '+' : ''}${deltaY} (${entry.value.toFixed(4)})`;
};

const remember = (entry: string) => {
  trail.push(entry);
  if (trail.length > TRAIL_MAX) trail.shift();
};

const injectStyles = () => {
  if (document.getElementById(`${OVERLAY_ID}-style`)) return;
  const style = document.createElement('style');
  style.id = `${OVERLAY_ID}-style`;
  style.textContent = `
    #${OVERLAY_ID} {
      position: fixed;
      left: 8px;
      bottom: 8px;
      z-index: 2147483647;
      padding: 6px 8px;
      border-radius: 6px;
      background: rgba(15, 23, 42, 0.88);
      color: #e2e8f0;
      font: 11px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
      white-space: pre;
      pointer-events: none;
      user-select: none;
    }
    #${OVERLAY_ID}[data-shifted='true'] { box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.9); }
  `;
  document.head.append(style);
};

let paintScheduled = false;
let painted = '';

/** Scheduled and de-duplicated for the same reason as `render-stats.ts`: painting writes
 * `textContent`, and this tool's own observer ignores its own overlay anyway (it isn't inside
 * `scopeRoot`), but batching avoids painting once per entry in a multi-entry callback. */
const schedulePaint = () => {
  if (!overlay || paintScheduled) return;
  paintScheduled = true;
  requestAnimationFrame(() => {
    paintScheduled = false;
    if (!overlay) return;
    const recent = trail.length > 0 ? `\n${trail.join('\n')}` : '';
    const text = `layout shift · score ${counts.score.toFixed(4)} (${counts.shiftCount})${recent}`;
    if (text === painted) return;
    painted = text;
    overlay.dataset['shifted'] = String(counts.shiftCount > 0);
    overlay.textContent = text;
  });
};

const resetCounts = () => {
  counts.score = 0;
  counts.scoreExcludingRecentInput = 0;
  counts.shiftCount = 0;
  trail.length = 0;
  painted = '';
  schedulePaint();
};

/**
 * Scores layout shifts attributable to nodes inside `root` for the current story, via the native
 * Layout Instability API, and can show the running total on screen.
 *
 * Not `buffered: true` — this repo's Storybook switches stories in place rather than reloading
 * the page (see `render-stats.ts`'s note on the same constraint), and the performance-entry
 * buffer is a single page-lifetime timeline, not scoped per observer. Buffering would replay
 * every previous story's shifts into this one's count. Re-installing (disconnecting the old
 * observer, creating a new one) on every story is what keeps counts story-scoped instead.
 *
 * Entries with no attributable source (an empty `sources` array, or one whose nodes were removed
 * before the browser could attribute them) are skipped rather than guessed at — they can't be
 * scoped to this story's canvas, so counting them would double as "layout shifted somewhere on
 * the page," not "this story caused a shift."
 */
export const installLayoutShiftStats = (root?: Element): void => {
  if (typeof window === 'undefined') return;

  try {
    if (!isSupported()) return;

    scopeRoot = root ?? document.body;

    observer?.disconnect();
    observer = new PerformanceObserver((list) => {
      for (const raw of list.getEntries()) {
        const entry = raw as LayoutShiftEntry;
        const attributed = entry.sources.some((source) => source.node && scopeRoot?.contains(source.node));
        if (!attributed) continue;

        counts.score += entry.value;
        counts.shiftCount += 1;
        if (!entry.hadRecentInput) counts.scoreExcludingRecentInput += entry.value;
        if (overlay) remember(describeShift(entry));
        if (verbose) {
          // eslint-disable-next-line no-console
          console.warn(
            `[layout-shift-stats] shift ${entry.value.toFixed(4)}, hadRecentInput: ${entry.hadRecentInput}`,
            {
              totals: { ...counts },
            }
          );
        }
      }
      schedulePaint();
    });
    observer.observe({ type: 'layout-shift' });

    window.__layoutShiftStats = {
      get: () => ({ ...counts }),
      reset: resetCounts,
      setOverlay: (enabled, storyId) => {
        verbose = enabled;

        if (!enabled) {
          overlay?.remove();
          overlay = null;
          sessionStoryId = undefined;
          return;
        }

        if (!overlay) {
          injectStyles();
          overlay = document.createElement('div');
          overlay.id = OVERLAY_ID;
          overlay.setAttribute('aria-hidden', 'true');
          document.body.append(overlay);
        }

        if (storyId !== sessionStoryId) {
          sessionStoryId = storyId;
          resetCounts();
        }
        schedulePaint();
      },
    };
  } catch {
    // Instrumentation is a convenience; never let it fail a story.
  }
};

/** For use inside `play`: zero the counters, run the interaction, then read them. */
export const layoutShiftStats = (): LayoutShiftStats =>
  window.__layoutShiftStats?.get() ?? { score: 0, scoreExcludingRecentInput: 0, shiftCount: 0 };

export const resetLayoutShiftStats = (): void => window.__layoutShiftStats?.reset();

export const setLayoutShiftStatsOverlay = (enabled: boolean, storyId?: string): void =>
  window.__layoutShiftStats?.setOverlay(enabled, storyId);
