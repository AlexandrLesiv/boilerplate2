import type { LogCategory, LogEntry, LogLevel } from './types';
import { dbAppend, dbClear, dbRead, dbTrim } from './db';

export type { LogEntry, LogLevel, LogCategory } from './types';

const FLUSH_INTERVAL_MS = 10_000;
const FLUSH_BUFFER_SIZE = 100;

let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = sessionStorage.getItem('log:session') ?? crypto.randomUUID();
    sessionStorage.setItem('log:session', sessionId);
  }
  return sessionId;
}

const buffer: Omit<LogEntry, 'id'>[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flush(): Promise<void> {
  if (!buffer.length) return;
  const batch = buffer.splice(0);
  try {
    await dbAppend(batch);
  } catch {
    // Logger must never crash the app — silently drop on IDB failure
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_INTERVAL_MS);
}

function push(level: LogLevel, category: LogCategory, message: string, data?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return; // SSR guard
  buffer.push({
    level,
    category,
    message,
    data,
    timestamp: Date.now(),
    sessionId: getSessionId(),
    url: location.href,
  });
  if (buffer.length >= FLUSH_BUFFER_SIZE) void flush();
  else scheduleFlush();
}

export const logger = {
  /** Only emits in dev mode — stripped from prod builds. */
  debug: (message: string, data?: Record<string, unknown>) => {
    if (import.meta.env.DEV) push('debug', 'custom', message, data);
  },
  info: (message: string, data?: Record<string, unknown>) => push('info', 'custom', message, data),
  warn: (message: string, data?: Record<string, unknown>) => push('warn', 'custom', message, data),
  error: (message: string, data?: Record<string, unknown>) => push('error', 'custom', message, data),
  /** Track a user action (click, submit, toggle…). */
  event: (name: string, data?: Record<string, unknown>) => push('info', 'user-action', name, data),
  /** Track a measured duration. `name` should be a stable identifier like "api.topStories". */
  perf: (name: string, durationMs: number, data?: Record<string, unknown>) =>
    push('info', 'performance', name, { ...data, durationMs }),
  /** Called automatically by the API helpers — not usually needed in components. */
  apiError: (method: string, url: string, status: number, message?: string) =>
    push('error', 'api', `${method} ${url} → ${status}`, { method, url, status, message }),
};

/**
 * Call once in entry-client.tsx. Sets up global error capture, flush-on-hide,
 * IDB trim, and the dev-only window.__logger console helpers.
 */
export function initLogger(): void {
  // Flush buffer when tab is hidden or the page is being unloaded
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
  window.addEventListener('pagehide', () => void flush());

  // Capture uncaught JS errors and unhandled promise rejections
  window.addEventListener('error', (e) => {
    push('error', 'error', e.message, {
      filename: e.filename,
      line: e.lineno,
      col: e.colno,
      stack: (e.error as Error | undefined)?.stack,
    });
  });
  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const reason = e.reason instanceof Error ? e.reason.message : String(e.reason);
    push('error', 'error', `Unhandled rejection: ${reason}`, {
      stack: e.reason instanceof Error ? (e.reason as Error).stack : undefined,
    });
  });

  // Trim old entries once per session (async, non-blocking)
  void dbTrim();

  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>)['__logger'] = {
      read: (opts?: { limit?: number; since?: number }) => dbRead(opts),
      clear: () => dbClear(),
      flush: () => flush(),
      export: async () => {
        const entries = await dbRead();
        const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
        const a = Object.assign(document.createElement('a'), {
          href: URL.createObjectURL(blob),
          download: `logs-${new Date().toISOString()}.json`,
        });
        a.click();
        URL.revokeObjectURL(a.href);
      },
    };
    console.info('[logger] ready — window.__logger.read() | .clear() | .export()');
  }
}
