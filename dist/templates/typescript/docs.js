"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReadme = generateReadme;
exports.generateArchestraGuide = generateArchestraGuide;
exports.generateGitignore = generateGitignore;
exports.generateEnvExample = generateEnvExample;
function generateReadme(config) {
    const securitySection = config.includeSecurity
        ? `This server includes **Archestra's Dual LLM Quarantine** security patterns:

- Input sanitization against prompt injection
- Output validation for data exfiltration prevention
- Audit logging for compliance
- Non-probabilistic security checks

See [ARCHestra.md](./ARCHestRA.md) for detailed integration guide.`
        : 'This server is Archestra-compatible. See [ARCHestra.md](./ARCHestRA.md) for security and observability integration options.';
    const observabilitySection = config.includeObservability
        ? `## 📊 Observability

Prometheus metrics exposed on \`:9090/metrics\`:

- \`mcp_tool_calls_total\` - Tool call count by name and status
- \`mcp_tool_call_duration_seconds\` - Tool execution latency
- \`mcp_security_events_total\` - Security events
- \`mcp_active_connections\` - Active MCP connections

Health check: \`:9090/health\``
        : '';
    return `# ${config.name}

${config.description}

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
\`\`\`

## 📁 Project Structure

\`\`\`
${config.name}/
├── src/
│   ├── server.ts              # Main MCP server entry point
│   ├── tools/                 # MCP tool implementations
│   │   └── exampleTool.ts     # Example tool template
${config.includeSecurity ? '│   ├── security/              # Archestra security layer\n│   │   └── archestraSecurity.ts\n' : ''}${config.includeObservability ? '│   └── observability/         # Metrics and logging\n│       ├── metrics.ts         # Prometheus metrics\n│       └── logger.ts          # Structured logging\n' : ''}├── tests/                     # Test files
├── dist/                      # Compiled output
└── package.json
\`\`\`

## 🔧 Available Scripts

- \`npm run build\` - Compile TypeScript
- \`npm run dev\` - Run with hot reload
- \`npm run test\` - Run tests
- \`npm run lint\` - Run ESLint
${config.includeSecurity ? '- \`npm run archestra:validate\` - Validate security configuration\n' : ''}- \`npm run archestra:register\` - Register with Archestra (see ARCHestra.md)

## 🛡️ Archestra Integration

${securitySection}

${observabilitySection}

## 📝 Adding New Tools

1. Create a new file in \`src/tools/\`
2. Implement your tool logic
3. Register in \`src/server.ts\`:

\`\`\`typescript
mcp.addTool({
  name: 'my_tool',
  description: 'What my tool does',
  parameters: z.object({
    param1: z.string()
  }),
  execute: async (args) => {
    // Your logic here
    return result;
  }
});
\`\`\`

## 🔗 MCP Configuration

Add to your MCP client configuration:

\`\`\`json
{
  "mcpServers": {
    "${config.name}": {
      "command": "node",
      "args": ["${config.name}/dist/server.js"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
\`\`\`

## 📄 License

MIT
`;
}
function generateArchestraGuide(config) {
    const securitySection = config.includeSecurity
        ? `Your server includes the Archestra Security Layer with:

### Dual LLM Quarantine Pattern

1. **Input Sanitization**: All inputs pass through security validation
2. **Output Validation**: Responses checked for data exfiltration
3. **Audit Logging**: All security events logged for compliance

### Configuration

\`\`\`typescript
const securityLayer = new ArchestraSecurityLayer({
  quarantineMode: true,
  auditLogEnabled: true,
  maxInputLength: 10000,
  blockedPatterns: [
    /ignore previous/i,
    /system override/i
  ]
});
\`\`\`

### Usage in Tools

\`\`\`typescript
execute: async (args) => {
  const sanitized = await securityLayer.sanitizeInput(args.input);
  if (!sanitized.safe) {
    throw new Error(\`Security violation: \${sanitized.reason}\`);
  }
  const result = await process(sanitized.data);
  const validated = await securityLayer.validateOutput(result);
  return validated.data;
}
\`\`\``
        : `To add Archestra security, install the security layer:

\`\`\`bash
npm install @archestra/security
\`\`\`

Then import and configure in your tools.`;
    const observabilitySection = config.includeObservability
        ? `Your server exposes Prometheus metrics compatible with Archestra's monitoring stack.

### Available Metrics

| Metric | Type | Description |
|--------|------|-------------|
| \`mcp_tool_calls_total\` | Counter | Total tool calls by name/status |
| \`mcp_tool_call_duration_seconds\` | Histogram | Tool execution latency |
| \`mcp_security_events_total\` | Counter | Security events by type |
| \`mcp_active_connections\` | Gauge | Current active connections |

### Archestra Dashboard

1. Metrics endpoint: \`http://your-server:9090/metrics\`
2. Health check: \`http://your-server:9090/health\``
        : 'To enable observability, see the metrics.ts and logger.ts templates.';
    return `# Archestra Integration Guide

## 🏗️ Architecture Overview

\`\`\`
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
\`\`\`

## 🔐 Security Integration

${securitySection}

## 📊 Observability Integration

${observabilitySection}

## 🚀 Deployment

### Docker

\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 9090
CMD ["node", "dist/server.js"]
\`\`\`

### Register with Archestra

\`\`\`bash
curl -X POST https://api.archestra.ai/v1/registry/servers \\
  -H "Authorization: Bearer $ARCHESTRA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "${config.name}",
    "version": "1.0.0",
    "security": {
      "quarantineMode": ${config.includeSecurity},
      "auditEnabled": true
    },
    "observability": {
      "metricsEndpoint": "http://localhost:9090/metrics"
    }
  }'
\`\`\`

## 🔍 Best Practices

1. Always validate inputs through security layer
2. Log security events for compliance auditing
3. Monitor metrics for cost optimization
4. Version your tools for backward compatibility
5. Use structured logging for observability

## 📚 Resources

- [Archestra Documentation](https://archestra.ai/docs)
- [MCP Specification](https://modelcontextprotocol.io)
`;
}
function generateGitignore() {
    return `# Dependencies
node_modules/
dist/
coverage/

# Logs
logs/
*.log

# Environment
.env
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store

# Build
*.tsbuildinfo
`;
}
function generateEnvExample() {
    return `# MCP Server Configuration
NODE_ENV=development
LOG_LEVEL=info
MCP_SERVER_NAME=my-archestra-server
MCP_SERVER_VERSION=1.0.0

# Archestra Integration
ARCHESTRA_API_KEY=your_api_key_here
ARCHESTRA_REGISTRY_URL=https://api.archestra.ai

# Observability
METRICS_PORT=9090
PROMETHEUS_ENABLED=true

# Security
SECURITY_QUARANTINE_MODE=true
SECURITY_AUDIT_ENABLED=true
MAX_INPUT_LENGTH=10000
`;
}
