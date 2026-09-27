export type LogLevel = 'log' | 'info' | 'warn' | 'error';

export interface Logger {
  log(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
  event(name: string, data?: Record<string, unknown>): void;
  perf(name: string, durationMs: number, data?: Record<string, unknown>): void;
  apiError(method: string, url: string, status: number, message?: string): void;
  navigation(to: string): void;
}

export type LogCategory = 'navigation' | 'user-action' | 'api' | 'error' | 'performance' | 'custom';

export interface LogEntry {
  id?: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
  sessionId: string;
  url: string;
}
