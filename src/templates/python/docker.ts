export function generatePythonDockerfile(config: { includeObservability: boolean }): string {
  const exposePort = config.includeObservability ? 'EXPOSE 9090\n' : '';
  const healthPort = config.includeObservability ? '9090' : '8000';

  return `FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.11-slim AS production

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /root/.local /root/.local

COPY src/ ./src/
COPY pyproject.toml .

ENV PATH=/root/.local/bin:$PATH

RUN groupadd -r python && useradd -r -g python python && chown -R python:python /app
USER python

${exposePort}HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:${healthPort}/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["python", "-m", "src.server"]
`;
}

export function generatePythonDockerCompose(config: { includeObservability: boolean; includeSecurity: boolean }): string {
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
      - ENVIRONMENT=production
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

export function generatePythonDockerIgnore(): string {
  return `__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
.pytest_cache/
.coverage
htmlcov/
.tox/
.nox/
.hypothesis/
.venv
pip-log.txt
pip-delete-this-directory.txt
*.log
logs/
.git
.gitignore
README.md
.env
.env.local
.env.*.local
.vscode/
.idea/
*.swp
*.swo
Dockerfile
.dockerignore
docker-compose.yml
.github/
tests/
`;
}

export function generatePythonPrometheusConfig(): string {
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
