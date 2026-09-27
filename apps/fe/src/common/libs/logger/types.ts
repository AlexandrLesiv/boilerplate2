export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogCategory = 'navigation' | 'user-action' | 'api' | 'error' | 'performance' | 'custom';

export interface LogEntry {
  id?: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  url: string;
}
