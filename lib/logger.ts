/**
 * Centralized logger. No external monitoring service is wired in yet — this
 * gives every call site a single, structured place to log through, so that
 * hooking up a real service (Sentry, Logtail, etc.) later is a one-line
 * change here instead of a grep-and-replace across the codebase.
 *
 * To connect a real error-tracking service: call `setErrorSink(fn)` once at
 * app startup (e.g. in a client-side provider) with a function that forwards
 * to that service's SDK. Until that's done, `error()` calls only console.log
 * + the local ring buffer below — nothing is silently dropped, but nothing
 * leaves the browser either.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  timestamp: string
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

// LOG_LEVEL filters what reaches the console; everything still goes into the
// ring buffer regardless, so support/debugging can inspect it after the fact.
const configuredLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug')

const STORAGE_KEY = 'vialii_logs'
const MAX_BUFFERED_LOGS = 200

type ErrorSink = (entry: LogEntry) => void
let errorSink: ErrorSink | null = null

/** Registers a callback that receives every error()-level entry. Call once at app startup. */
export function setErrorSink(sink: ErrorSink) {
  errorSink = sink
}

function shouldPrint(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[configuredLevel]
}

function persist(entry: LogEntry) {
  if (typeof window === 'undefined') return
  try {
    const existing: LogEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, entry].slice(-MAX_BUFFERED_LOGS)))
  } catch {
    // Storage full/unavailable/private-mode — logging must never throw.
  }
}

function write(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = { level, message, context, timestamp: new Date().toISOString() }

  if (shouldPrint(level)) {
    const consoleMethod = level === 'debug' ? 'log' : level
    console[consoleMethod](`[${entry.timestamp}] ${message}`, context ?? '')
  }

  persist(entry)

  if (level === 'error' && errorSink) {
    try {
      errorSink(entry)
    } catch {
      // A broken sink must not take down the caller that triggered the log.
    }
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => write('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => write('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => write('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => write('error', message, context),
}

/** Reads the buffered client-side logs (e.g. for a "copy diagnostics" support action). */
export function getRecentLogs(): LogEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}
