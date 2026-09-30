import { createContext, useContext } from 'solid-js';

import { dbAppend, dbClear, dbRead, dbTrim } from './db';
import type { LogCategory, LogEntry, Logger, LogLevel } from './types';

export type { LogEntry, Logger, LogLevel, LogCategory } from './types';

export interface LoggerConfig {
  flushIntervalMs?: number;
  flushBufferSize?: number;
}

// ─── server logger ─────────────────────────────────────────────────────────
// Console passthrough only — no IDB, no window, no export.

/* eslint-disable no-console */
const serverLogger: Logger = {
  log: (message, data) => (data !== undefined ? console.log('[log]', message, data) : console.log('[log]', message)),
  info: (message, data) =>
    data !== undefined ? console.info('[info]', message, data) : console.info('[info]', message),
  warn: (message, data) =>
    data !== undefined ? console.warn('[warn]', message, data) : console.warn('[warn]', message),
  error: (message, data) =>
    data !== undefined ? console.error('[error]', message, data) : console.error('[error]', message),
  event: (name, data) => (data !== undefined ? console.info('[event]', name, data) : console.info('[event]', name)),
  perf: (name, durationMs, data) => console.debug('[perf]', name, { ...data, durationMs }),
  apiError: (method, url, status, message) => console.error('[api]', `${method} ${url} → ${status}`, message),
  navigation: (to) => console.debug('[nav]', to),
};
// ─── client logger ──────────────────────────────────────────────────────────
// IDB-backed with buffer, flush, global error capture, dev helpers.

let flushIntervalMs = 10_000;
let flushBufferSize = 100;
let sessionId: string | null = null;

const buffer: Omit<LogEntry, 'id'>[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const getSessionId = (): string => {
  if (!sessionId) {
    sessionId = sessionStorage.getItem('log:session') ?? crypto.randomUUID();
    sessionStorage.setItem('log:session', sessionId);
  }
  return sessionId;
};

const flush = async (): Promise<void> => {
  if (!buffer.length) return;
  const batch = buffer.splice(0);
  try {
    await dbAppend(batch);
  } catch {
    // Logger must never crash the app — silently drop on IDB failure
  }
};

const scheduleFlush = (): void => {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, flushIntervalMs);
};

const LEVEL_STYLE: Record<LogLevel, string> = {
  log: 'color:#6b7280',
  info: 'color:#3b82f6',
  warn: 'color:#f59e0b;font-weight:bold',
  error: 'color:#ef4444;font-weight:bold',
};

const push = (level: LogLevel, category: LogCategory, message: string, data?: Record<string, unknown>): void => {
  const timestamp = new Date().toISOString();

  if (import.meta.env.DEV) {
    const time = timestamp.slice(11, 23); // HH:mm:ss.mmm
    const style = LEVEL_STYLE[level];
    const label = `%c${time} [${category}] ${message}`;
    if (data !== undefined) {
      console.groupCollapsed(label, style);
      console.log(data);
      console.groupEnd();
    } else {
      const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
      fn(label, style);
    }
  }

  buffer.push({ level, category, message, data, timestamp, sessionId: getSessionId(), url: location.href });
  if (buffer.length >= flushBufferSize) void flush();
  else scheduleFlush();
};

const clientLogger: Logger = {
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

const exportLogs = async (opts?: { limit?: number; since?: number }): Promise<void> => {
  await flush();
  const entries = await dbRead(opts);
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `logs-${new Date().toISOString()}.json`,
  });
  a.click();
  URL.revokeObjectURL(url);
};

// ─── constructor — called from AppProvider ───────────────────────────────────

let clientInitialized = false;

export const createLogger = (config: LoggerConfig = {}): Logger => {
  if (import.meta.env.SSR) return serverLogger;

  flushIntervalMs = config.flushIntervalMs ?? 10_000;
  flushBufferSize = config.flushBufferSize ?? 100;

  if (!clientInitialized) {
    clientInitialized = true;

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

    clientLogger.info('app.start', {
      name: __APP_NAME__,
      version: __APP_VERSION__,
      gitHash: __GIT_HASH__,
    });

    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>)['__logger'] = {
        read: (opts?: { limit?: number; since?: number }) => dbRead(opts),
        clear: () => dbClear(),
        flush: () => flush(),
        export: (opts?: { limit?: number; since?: number }) => exportLogs(opts),
      };
    }
  }

  return clientLogger;
};

// ─── context (DI for components) ─────────────────────────────────────────────

export const LoggerContext = createContext<Logger>();

export const useLogger = (): Logger => {
  const ctx = useContext(LoggerContext);
  if (!ctx) throw new Error('useLogger must be used within LoggerContext.Provider');
  return ctx;
};
