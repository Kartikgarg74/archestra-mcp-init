# Archestra Integration Guide

## 🏗️ Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   MCP Client    │────▶│  Archestra       │────▶│  Your MCP       │
│   (Claude, etc) │     │  Security Layer  │     │  Server         │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Observability   │
                        │  (Prometheus)    │
                        └──────────────────┘
```

## 🔐 Security Integration

Your server includes the Archestra Security Layer with:

### Dual LLM Quarantine Pattern

1. **Input Sanitization**: All inputs pass through security validation
2. **Output Validation**: Responses checked for data exfiltration
3. **Audit Logging**: All security events logged for compliance

### Configuration

```typescript
const securityLayer = new ArchestraSecurityLayer({
  quarantineMode: true,
  auditLogEnabled: true,
  maxInputLength: 10000,
  blockedPatterns: [
    /ignore previous/i,
    /system override/i
  ]
});
```

### Usage in Tools

```typescript
execute: async (args) => {
  const sanitized = await securityLayer.sanitizeInput(args.input);
  if (!sanitized.safe) {
    throw new Error(`Security violation: ${sanitized.reason}`);
  }
  const result = await process(sanitized.data);
  const validated = await securityLayer.validateOutput(result);
  return validated.data;
}
```

## 📊 Observability Integration

Your server exposes Prometheus metrics compatible with Archestra's monitoring stack.

### Available Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `mcp_tool_calls_total` | Counter | Total tool calls by name/status |
| `mcp_tool_call_duration_seconds` | Histogram | Tool execution latency |
| `mcp_security_events_total` | Counter | Security events by type |
| `mcp_active_connections` | Gauge | Current active connections |

### Archestra Dashboard

1. Metrics endpoint: `http://your-server:9090/metrics`
2. Health check: `http://your-server:9090/health`

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 9090
CMD ["node", "dist/server.js"]
```

### Register with Archestra

```bash
curl -X POST https://api.archestra.ai/v1/registry/servers \
  -H "Authorization: Bearer $ARCHESTRA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-ts-full",
    "version": "1.0.0",
    "security": {
      "quarantineMode": true,
      "auditEnabled": true
    },
    "observability": {
      "metricsEndpoint": "http://localhost:9090/metrics"
    }
  }'
```

## 🔍 Best Practices

1. Always validate inputs through security layer
2. Log security events for compliance auditing
3. Monitor metrics for cost optimization
4. Version your tools for backward compatibility
5. Use structured logging for observability

## 📚 Resources

- [Archestra Documentation](https://archestra.ai/docs)
- [MCP Specification](https://modelcontextprotocol.io)
