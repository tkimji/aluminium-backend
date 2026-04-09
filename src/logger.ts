import winston from 'winston';

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

export const logger = winston.createLogger({
  level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf((info: Record<string, unknown>) => {
      const lv = String(info.level ?? '');
      const message = String(info.message ?? '');
      const timestamp = info.timestamp != null ? String(info.timestamp) : '';
      const stack = info.stack != null ? String(info.stack) : '';
      const base = `${timestamp} [${lv}] ${message}`;
      return stack ? `${base}\n${stack}` : base;
    }),
  ),
  transports: [new winston.transports.Console()],
});
