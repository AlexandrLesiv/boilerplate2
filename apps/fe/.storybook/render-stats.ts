import { DEV } from 'solid-js';

export interface RenderStats {
  /**
   * Reactive owners created. A component or computation being created bumps this; a component that
   * merely updates does not. Climbing while you interact means something is being rebuilt.
   */
  owners: number;
  /** Nodes added to / removed from the document. Removals after mount mean a subtree was rebuilt. */
  domAdded: number;
  domRemoved: number;
}

interface RenderStatsApi {
  get: () => RenderStats;
  /** Zero the counters — call before the interaction you want to measure. */
  reset: () => void;
  /**
   * Show or hide the on-screen counter and the flash on newly created elements. `storyId` starts a
   * fresh measurement only when it changes, so changing a control keeps the running count instead
   * of wiping the thing you were measuring.
   */
  setOverlay: (enabled: boolean, storyId?: string) => void;
}

declare global {
  interface Window {
    __renderStats?: RenderStatsApi;
  }
}

const OVERLAY_ID = 'sb-render-stats';
const FLASH_CLASS = 'sb-render-flash';
const FLASH_MS = 500;
/** How long the DOM must be still before the counters are zeroed and measuring begins. */
const QUIET_MS = 400;

const counts: RenderStats = { owners: 0, domAdded: 0, domRemoved: 0 };

let hooksInstalled = false;
let observer: MutationObserver | null = null;
let overlay: HTMLElement | null = null;
let verbose = false;
let armed = false;
let lastMutationAt = 0;
let armTimer: number | undefined;
let sessionStoryId: string | undefined;

/** Last few add/remove events, so a count like "+2" explains itself. */
const trail: string[] = [];
const TRAIL_MAX = 8;

const describe = (node: Node): string =>
  node instanceof Element ? node.tagName.toLowerCase() : node.nodeType === 3 ? '#text' : `#${node.nodeType}`;

const remember = (entry: string) => {
  trail.push(entry);
  if (trail.length > TRAIL_MAX) trail.shift();
};

/** The overlay must not measure or decorate itself. */
const isOurs = (node: Node): boolean =>
  node instanceof Element && (node.id === OVERLAY_ID || node.closest(`#${OVERLAY_ID}`) !== null);

const injectStyles = () => {
  if (document.getElementById(`${OVERLAY_ID}-style`)) return;
  const style = document.createElement('style');
  style.id = `${OVERLAY_ID}-style`;
  style.textContent = `
    @keyframes ${FLASH_CLASS}-fade {
      from { outline-color: rgba(239, 68, 68, 0.9); background-color: rgba(239, 68, 68, 0.12); }
      to   { outline-color: rgba(239, 68, 68, 0);   background-color: rgba(239, 68, 68, 0); }
    }
    .${FLASH_CLASS} {
      outline: 2px solid rgba(239, 68, 68, 0.9);
      outline-offset: -2px;
      animation: ${FLASH_CLASS}-fade ${FLASH_MS}ms ease-out forwards;
    }
    #${OVERLAY_ID} {
      position: fixed;
      right: 8px;
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
    #${OVERLAY_ID}[data-churn='true'] { box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.9); }
  `;
  document.head.append(style);
};

let paintScheduled = false;
let painted = '';

/**
 * Scheduled and de-duplicated, because painting writes `textContent` — itself a mutation the
 * observer sees. Painting straight from the observer callback feeds back into it and hangs the tab.
 */
const schedulePaint = () => {
  if (!overlay || paintScheduled) return;
  paintScheduled = true;
  requestAnimationFrame(() => {
    paintScheduled = false;
    if (!overlay) return;
    if (!armed) {
      const text = 'renders · settling…';
      if (text === painted) return;
      painted = text;
      overlay.dataset['churn'] = 'false';
      overlay.textContent = text;
      return;
    }
    const recent = trail.length > 0 ? `\n${trail.join(' ')}` : '';
    const text = `renders · owners ${counts.owners}\ndom +${counts.domAdded} / -${counts.domRemoved}${recent}`;
    if (text === painted) return;
    painted = text;
    overlay.dataset['churn'] = String(counts.domRemoved > 0);
    overlay.textContent = text;
  });
};

const flash = (node: Node) => {
  if (!(node instanceof Element) || isOurs(node)) return;
  node.classList.add(FLASH_CLASS);
  window.setTimeout(() => node.classList.remove(FLASH_CLASS), FLASH_MS);
};

/**
 * Counts reactive-owner creation and DOM churn for the current story, and can show both on screen.
 *
 * Solid never re-runs a component, so there is no render count to read. What is observable is
 * *creation*: a subtree torn down and rebuilt on every data change shows up as climbing `owners`
 * and non-zero `domRemoved`, while a correctly reactive one updates in place and stays flat.
 *
 * Reads `DEV.hooks`, which only exists in a dev build — that is all Storybook ever runs. Everything
 * is wrapped so a failure here can never take a story down.
 */
export const installRenderStats = (root?: Element): void => {
  if (typeof window === 'undefined') return;

  try {
    const hooks = DEV?.hooks;
    if (hooks && !hooksInstalled) {
      hooksInstalled = true;
      const previous = hooks.afterCreateOwner;
      hooks.afterCreateOwner = (owner) => {
        previous?.(owner);
        counts.owners += 1;
        schedulePaint();
      };
    }

    // Scoped to the story's own canvas, so Storybook's addon DOM — the a11y vision-filter SVG,
    // the highlight root — is not counted as the story rendering. `context.canvasElement` is
    // `#storybook-root` in the Storybook iframe and an anonymous div in the vitest runner, which
    // is why the root is passed in rather than looked up here. Re-bound per story.
    observer?.disconnect();
    observer = new MutationObserver((records) => {
      for (const record of records) {
        if (isOurs(record.target)) continue;
        for (const node of record.addedNodes) {
          if (isOurs(node)) continue;
          counts.domAdded += 1;
          if (overlay) {
            flash(node);
            remember(`+${describe(node)}`);
          }
        }
        const removed: string[] = [];
        for (const node of record.removedNodes) {
          if (isOurs(node)) continue;
          counts.domRemoved += 1;
          if (overlay) remember(`-${describe(node)}`);
          if (node instanceof Element) removed.push(node.tagName.toLowerCase());
        }
        if (verbose && removed.length > 0) {
          // Warn, not log: a removal after mount means a subtree was rebuilt rather than updated.
          // eslint-disable-next-line no-console
          console.warn(`[render-stats] rebuilt ${removed.length} node(s): ${removed.join(', ')}`, {
            parent: record.target instanceof Element ? record.target.tagName.toLowerCase() : 'unknown',
            totals: { ...counts },
          });
        }
      }
      lastMutationAt = Date.now();
      if (overlay && !armed) scheduleArm();
      schedulePaint();
    });
    observer.observe(root ?? document.body, { childList: true, subtree: true });

    window.__renderStats = {
      get: () => ({ ...counts }),
      reset: () => {
        armed = true;
        window.clearTimeout(armTimer);
        counts.owners = 0;
        counts.domAdded = 0;
        counts.domRemoved = 0;
        trail.length = 0;
        painted = '';
        schedulePaint();
      },
      setOverlay: (enabled, storyId) => {
        verbose = enabled;

        if (!enabled) {
          window.clearTimeout(armTimer);
          overlay?.remove();
          overlay = null;
          armed = true;
          sessionStoryId = undefined;
          return;
        }

        if (!overlay) {
          injectStyles();
          overlay = document.createElement('div');
          overlay.id = OVERLAY_ID;
          // Out of the a11y tree: this is instrumentation, not content.
          overlay.setAttribute('aria-hidden', 'true');
          document.body.append(overlay);
        }

        // Only on a story change. The overlay element survives a story switch, so restarting has to
        // be explicit — but `beforeEach` also runs on every args change, and restarting there would
        // wipe the count for the control change you are trying to measure.
        if (storyId !== sessionStoryId) {
          sessionStoryId = storyId;
          window.clearTimeout(armTimer);
          armed = false;
          counts.owners = 0;
          counts.domAdded = 0;
          counts.domRemoved = 0;
          trail.length = 0;
          painted = '';
          lastMutationAt = Date.now();
          scheduleArm();
        }
        schedulePaint();
      },
    };
  } catch {
    // Instrumentation is a convenience; never let it fail a story.
  }
};

/**
 * Zeroes the counters once the story stops mutating the DOM, so the overlay measures what happens
 * *after* the story settled rather than the cost of mounting it. A freshly opened story therefore
 * reads 0, and anything above 0 is something that happened since.
 *
 * Only while the overlay is on: play functions call `resetRenderStats()` themselves, and a timer
 * zeroing their baseline mid-measurement would make those assertions flaky.
 */
const scheduleArm = () => {
  if (!overlay) return;
  window.clearTimeout(armTimer);
  armTimer = window.setTimeout(() => {
    if (Date.now() - lastMutationAt < QUIET_MS) {
      scheduleArm();
      return;
    }
    armed = true;
    counts.owners = 0;
    counts.domAdded = 0;
    counts.domRemoved = 0;
    trail.length = 0;
    painted = '';
    schedulePaint();
  }, QUIET_MS);
};

/** For use inside `play`: zero the counters, run the interaction, then read them. */
export const renderStats = (): RenderStats => window.__renderStats?.get() ?? { owners: 0, domAdded: 0, domRemoved: 0 };

export const resetRenderStats = (): void => window.__renderStats?.reset();

export const setRenderStatsOverlay = (enabled: boolean, storyId?: string): void =>
  window.__renderStats?.setOverlay(enabled, storyId);
