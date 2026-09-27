import { createContext, useContext } from 'solid-js';

import type { LogCategory, LogEntry, Logger, LogLevel } from './types';
import { dbAppend, dbClear, dbRead, dbTrim } from './db';

export type { LogEntry, Logger, LogLevel, LogCategory } from './types';

// ─── buffer + flush ───────────────────────────────────────────────────────────

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

// ─── public logger singleton ──────────────────────────────────────────────────

export const logger: Logger = {
  log: (message, data) => push('log', 'custom', message, data),
  info: (message, data) => push('info', 'custom', message, data),
  warn: (message, data) => push('warn', 'custom', message, data),
  error: (message, data) => push('error', 'custom', message, data),
  event: (name, data) => push('info', 'user-action', name, data),
  perf: (name, durationMs, data) => push('info', 'performance', name, { ...data, durationMs }),
  apiError: (method, url, status, message) =>
    push('error', 'api', `${method} ${url} → ${status}`, { method, url, status, message }),
  navigation: (to) => push('info', 'navigation', 'navigate', { to }),
};

// ─── context (DI for components) ─────────────────────────────────────────────

export const LoggerContext = createContext<Logger>();

export const useLogger = (): Logger => {
  const ctx = useContext(LoggerContext);
  if (!ctx) throw new Error('useLogger must be used within LoggerContext.Provider');
  return ctx;
};

// ─── init (call once in entry-client.tsx) ─────────────────────────────────────

/**
 * Wires up global error capture, flush-on-hide, IDB trim, and dev helpers.
 * Must be called before mount() in entry-client.tsx.
 */
export function initLogger(): void {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
  window.addEventListener('pagehide', () => void flush());

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
