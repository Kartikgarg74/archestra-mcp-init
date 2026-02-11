export function generateDockerfile(config: { includeObservability: boolean }): string {
  const exposePort = config.includeObservability ? 'EXPOSE 9090\n' : '';
  const healthPort = config.includeObservability ? '9090' : '3000';

  return `FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

${exposePort}HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:${healthPort}/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
`;
}

export function generateDockerCompose(config: { includeObservability: boolean; includeSecurity: boolean }): string {
  const ports = config.includeObservability ? `ports:
      - "\${METRICS_PORT:-9090}:9090"
    ` : '';

  const envVars = [];
  if (config.includeObservability) {
    envVars.push('      - METRICS_PORT=9090');
    envVars.push('      - PROMETHEUS_ENABLED=true');
  }
  if (config.includeSecurity) {
    envVars.push('      - SECURITY_QUARANTINE_MODE=true');
    envVars.push('      - SECURITY_AUDIT_ENABLED=true');
  }

  const envVarsStr = envVars.join('\n');

  const prometheusService = config.includeObservability ? `  # prometheus:
  #   image: prom/prometheus:latest
  #   container_name: prometheus
  #   ports:
  #     - "9091:9090"
  #   volumes:
  #     - ./prometheus.yml:/etc/prometheus/prometheus.yml
  #   networks:
  #     - mcp-network
` : '';

  return `version: '3.8'

services:
  mcp-server:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    image: \${MCP_SERVER_IMAGE:-mcp-server:latest}
    container_name: mcp-server
    restart: unless-stopped
    ${ports}environment:
      - NODE_ENV=production
      - LOG_LEVEL=\${LOG_LEVEL:-info}
      - MCP_SERVER_NAME=\${MCP_SERVER_NAME:-mcp-server}
      - MCP_SERVER_VERSION=\${MCP_SERVER_VERSION:-1.0.0}
${envVarsStr}
      - ARCHESTRA_API_KEY=\${ARCHESTRA_API_KEY}
      - ARCHESTRA_REGISTRY_URL=\${ARCHESTRA_REGISTRY_URL:-https://api.archestra.ai}
    volumes:
      - ./logs:/app/logs
    networks:
      - mcp-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M

${prometheusService}networks:
  mcp-network:
    driver: bridge

volumes:
  logs:
    driver: local
`;
}

export function generateDockerIgnore(): string {
  return `node_modules/
npm-debug.log
Dockerfile
.dockerignore
.git
.gitignore
README.md
.env
.env.local
.env.*.local
coverage/
.nyc_output/
.vscode/
.idea/
*.log
logs/
dist/
tests/
.github/
`;
}

export function generatePrometheusConfig(): string {
  return `global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'mcp-server'
    static_configs:
      - targets: ['mcp-server:9090']
    metrics_path: /metrics
`;
}
