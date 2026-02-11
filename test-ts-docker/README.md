# test-ts-docker

An Archestra-native MCP server

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## 📁 Project Structure

```
test-ts-docker/
├── src/
│   ├── server.ts              # Main MCP server entry point
│   ├── tools/                 # MCP tool implementations
│   │   └── exampleTool.ts     # Example tool template
│   ├── security/              # Archestra security layer
│   │   └── archestraSecurity.ts
│   └── observability/         # Metrics and logging
│       ├── metrics.ts         # Prometheus metrics
│       └── logger.ts          # Structured logging
├── tests/                     # Test files
├── dist/                      # Compiled output
└── package.json
```

## 🔧 Available Scripts

- `npm run build` - Compile TypeScript
- `npm run dev` - Run with hot reload
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run archestra:validate` - Validate security configuration
- `npm run archestra:register` - Register with Archestra (see ARCHestra.md)

## 🛡️ Archestra Integration

This server includes **Archestra's Dual LLM Quarantine** security patterns:

- Input sanitization against prompt injection
- Output validation for data exfiltration prevention
- Audit logging for compliance
- Non-probabilistic security checks

See [ARCHestra.md](./ARCHestRA.md) for detailed integration guide.

## 📊 Observability

Prometheus metrics exposed on `:9090/metrics`:

- `mcp_tool_calls_total` - Tool call count by name and status
- `mcp_tool_call_duration_seconds` - Tool execution latency
- `mcp_security_events_total` - Security events
- `mcp_active_connections` - Active MCP connections

Health check: `:9090/health`

## 📝 Adding New Tools

1. Create a new file in `src/tools/`
2. Implement your tool logic
3. Register in `src/server.ts`:

```typescript
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
```

## 🔗 MCP Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "test-ts-docker": {
      "command": "node",
      "args": ["test-ts-docker/dist/server.js"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## 📄 License

MIT
