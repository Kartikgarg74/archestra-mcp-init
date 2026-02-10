/**
 * Archestra Observability - Metrics
 *
 * Prometheus-compatible metrics for monitoring MCP server performance
 */

import client from 'prom-client';
import http from 'http';
import url from 'url';

// Create registry
export const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom MCP metrics
export const toolCallCounter = new client.Counter({
  name: 'mcp_tool_calls_total',
  help: 'Total number of tool calls',
  labelNames: ['tool_name', 'status'],
  registers: [register]
});

export const toolCallDuration = new client.Histogram({
  name: 'mcp_tool_call_duration_seconds',
  help: 'Duration of tool calls',
  labelNames: ['tool_name'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

export const activeConnections = new client.Gauge({
  name: 'mcp_active_connections',
  help: 'Number of active MCP connections',
  registers: [register]
});

export const securityEvents = new client.Counter({
  name: 'mcp_security_events_total',
  help: 'Security-related events',
  labelNames: ['event_type', 'severity'],
  registers: [register]
});

// Metrics server
export const metricsServer = http.createServer(async (req, res) => {
  const route = url.parse(req.url).pathname;

  if (route === '/metrics') {
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
  } else if (route === '/health') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'healthy',
      metrics: true,
      timestamp: new Date().toISOString()
    }));
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
});

// Helper functions
export function recordToolCall(
  toolName: string,
  durationMs: number,
  success: boolean
): void {
  const status = success ? 'success' : 'failure';
  toolCallCounter.inc({ tool_name: toolName, status });
  toolCallDuration.observe({ tool_name: toolName }, durationMs / 1000);
}

export function recordSecurityEvent(
  eventType: string,
  severity: 'low' | 'medium' | 'high'
): void {
  securityEvents.inc({ event_type: eventType, severity });
}

export function incrementActiveConnections(): void {
  activeConnections.inc();
}

export function decrementActiveConnections(): void {
  activeConnections.dec();
}
