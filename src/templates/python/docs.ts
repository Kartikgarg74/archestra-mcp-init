import { PythonProjectConfig } from './index';

export function generatePythonReadme(config: PythonProjectConfig): string {
  return `# ${config.name}

${config.description}

## 🚀 Quick Start

\`\`\`bash
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
python src/server.py
\`\`\`

${config.includeSecurity ? `
## 🛡️ Security
Includes Archestra's Dual LLM Quarantine pattern for prompt injection protection.
` : ''}

${config.includeObservability ? `
## 📊 Observability
Prometheus metrics on :9090/metrics
` : ''}

## 📄 License
MIT
`;
}

export function generatePythonGitignore(): string {
  return `__pycache__/
*.py[cod]
*.egg-info/
venv/
.env
.DS_Store
`;
}

export function generatePythonEnvExample(): string {
  return `ENVIRONMENT=development
LOG_LEVEL=info
ARCHESTRA_API_KEY=your_key_here
METRICS_PORT=9090
SECURITY_QUARANTINE_MODE=true
`;
}
