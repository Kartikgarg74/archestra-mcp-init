import path from 'path';
import { writeFile } from '../../utils/fileGenerator';
import { generatePackageJson, generateTsConfig } from './config';
import { generateServerFile } from './server';
import { generateExampleTool } from './tools';
import { generateSecurityModule } from './security';
import { generateMetricsModule, generateLoggerModule } from './observability';
import { generateReadme, generateArchestraGuide, generateGitignore, generateEnvExample } from './docs';

export interface ProjectConfig {
  name: string;
  description: string;
  author: string;
  includeObservability: boolean;
  includeSecurity: boolean;
}

export async function generateTypeScriptProject(projectPath: string, config: ProjectConfig) {
  // Create directory structure
  const dirs = [
    'src',
    'src/tools',
    'src/security',
    'src/observability',
    'tests',
    'scripts'
  ];

  for (const dir of dirs) {
    await writeFile(path.join(projectPath, dir, '.gitkeep'), '');
  }

  // Generate config files
  await writeFile(path.join(projectPath, 'package.json'), generatePackageJson(config));
  await writeFile(path.join(projectPath, 'tsconfig.json'), generateTsConfig());

  // Generate source files
  await writeFile(path.join(projectPath, 'src/server.ts'), generateServerFile(config));
  await writeFile(path.join(projectPath, 'src/tools/exampleTool.ts'), generateExampleTool(config));

  // Generate optional modules
  if (config.includeSecurity) {
    await writeFile(
      path.join(projectPath, 'src/security/archestraSecurity.ts'),
      generateSecurityModule()
    );
  }

  if (config.includeObservability) {
    await writeFile(
      path.join(projectPath, 'src/observability/metrics.ts'),
      generateMetricsModule()
    );
    await writeFile(
      path.join(projectPath, 'src/observability/logger.ts'),
      generateLoggerModule()
    );
  }

  // Generate documentation
  await writeFile(path.join(projectPath, 'README.md'), generateReadme(config));
  await writeFile(path.join(projectPath, 'ARCHESTRA.md'), generateArchestraGuide(config));
  await writeFile(path.join(projectPath, '.gitignore'), generateGitignore());
  await writeFile(path.join(projectPath, '.env.example'), generateEnvExample());
}
