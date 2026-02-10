/**
 * Archestra Observability - Structured Logging
 */

import winston from 'winston';

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

const archestraFormat = printf(({ level, message, timestamp, ...metadata }) => {
  return JSON.stringify({
    timestamp,
    level,
    message,
    service: process.env.MCP_SERVER_NAME || 'unknown',
    version: process.env.MCP_SERVER_VERSION || '1.0.0',
    ...metadata
  });
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: process.env.MCP_SERVER_NAME || 'mcp-server',
    environment: process.env.NODE_ENV || 'development'
  },
  format: combine(
    timestamp(),
    errors({ stack: true }),
    process.env.NODE_ENV === 'production' ? json() : archestraFormat
  ),
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV !== 'production'
        ? combine(colorize(), winston.format.simple())
        : undefined
    }),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' })
    ] : [])
  ],
  exitOnError: false
});

export const auditLogger = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.File({ filename: 'logs/audit.log' })
  ]
});

export function logToolExecution(
  toolName: string,
  input: any,
  output: any,
  duration: number
): void {
  logger.info('Tool execution completed', {
    tool: toolName,
    duration_ms: duration,
    input_size: JSON.stringify(input).length,
    output_size: JSON.stringify(output).length
  });
}

export function logSecurityEvent(event: string, details: any): void {
  auditLogger.info('Security event', {
    event_type: event,
    ...details,
    severity: details.severity || 'medium'
  });
}

export default logger;
