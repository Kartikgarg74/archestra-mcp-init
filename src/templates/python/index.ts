import path from 'path';
import { writeFile } from '../../utils/fileGenerator';
import { generatePyProjectToml, generateRequirements } from './config';
import { generatePythonServer } from './server';
import { generatePythonExampleTool } from './tools';
import { generatePythonSecurityModule } from './security';
import { generatePythonMetricsModule, generatePythonLoggerModule } from './observability';
import { generatePythonReadme, generatePythonGitignore, generatePythonEnvExample } from './docs';

export interface PythonProjectConfig {
  name: string;
  description: string;
  author: string;
  includeObservability: boolean;
  includeSecurity: boolean;
}

export async function generatePythonProject(projectPath: string, config: PythonProjectConfig) {
  const dirs = ['src', 'src/tools', 'src/security', 'src/observability', 'tests'];

  for (const dir of dirs) {
    await writeFile(path.join(projectPath, dir, '__init__.py'), '');
  }

  await writeFile(path.join(projectPath, 'pyproject.toml'), generatePyProjectToml(config));
  await writeFile(path.join(projectPath, 'requirements.txt'), generateRequirements(config));
  await writeFile(path.join(projectPath, 'src/server.py'), generatePythonServer(config));
  await writeFile(path.join(projectPath, 'src/tools/example_tool.py'), generatePythonExampleTool(config));

  if (config.includeSecurity) {
    await writeFile(
      path.join(projectPath, 'src/security/archestra_security.py'),
      generatePythonSecurityModule()
    );
  }

  if (config.includeObservability) {
    await writeFile(
      path.join(projectPath, 'src/observability/metrics.py'),
      generatePythonMetricsModule()
    );
    await writeFile(
      path.join(projectPath, 'src/observability/logger.py'),
      generatePythonLoggerModule()
    );
  }

  await writeFile(path.join(projectPath, 'README.md'), generatePythonReadme(config));
  await writeFile(path.join(projectPath, '.gitignore'), generatePythonGitignore());
  await writeFile(path.join(projectPath, '.env.example'), generatePythonEnvExample());
}
