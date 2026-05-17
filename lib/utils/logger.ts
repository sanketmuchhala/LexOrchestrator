// Structured logger. Uses console.warn/console.error per repo convention.
// Never logs secret values. NODE_ENV-aware verbosity.

const isDev = process.env.NODE_ENV !== "production";

function formatMessage(level: string, module: string, message: string, meta?: Record<string, unknown>): string {
  const prefix = `[${module}]`;
  if (meta && Object.keys(meta).length > 0) {
    return `${prefix} ${message} ${JSON.stringify(meta)}`;
  }
  return `${prefix} ${message}`;
}

export const logger = {
  info(module: string, message: string, meta?: Record<string, unknown>): void {
    if (!isDev) return;
    console.warn(formatMessage("INFO", module, message, meta));
  },

  warn(module: string, message: string, meta?: Record<string, unknown>): void {
    console.warn(formatMessage("WARN", module, message, meta));
  },

  error(module: string, message: string, meta?: Record<string, unknown>): void {
    console.error(formatMessage("ERROR", module, message, meta));
  },
};
