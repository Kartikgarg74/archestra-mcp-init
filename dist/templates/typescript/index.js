"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTypeScriptProject = generateTypeScriptProject;
const path_1 = __importDefault(require("path"));
const fileGenerator_1 = require("../../utils/fileGenerator");
const config_1 = require("./config");
const server_1 = require("./server");
const tools_1 = require("./tools");
const security_1 = require("./security");
const observability_1 = require("./observability");
const docs_1 = require("./docs");
const cicd_1 = require("./cicd");
const docker_1 = require("./docker");
async function generateTypeScriptProject(projectPath, config) {
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
        await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, dir, '.gitkeep'), '');
    }
    // Generate config files
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'package.json'), (0, config_1.generatePackageJson)(config));
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'tsconfig.json'), (0, config_1.generateTsConfig)());
    // Generate source files
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'src/server.ts'), (0, server_1.generateServerFile)(config));
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'src/tools/exampleTool.ts'), (0, tools_1.generateExampleTool)(config));
    // Generate CI/CD workflows
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, '.github/workflows/ci.yml'), (0, cicd_1.generateGitHubActionsCI)());
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, '.github/workflows/cd.yml'), (0, cicd_1.generateGitHubActionsCD)());
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, '.github/workflows/release.yml'), (0, cicd_1.generateGitHubActionsRelease)());
    // Generate Docker files
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'Dockerfile'), (0, docker_1.generateDockerfile)(config));
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'docker-compose.yml'), (0, docker_1.generateDockerCompose)(config));
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, '.dockerignore'), (0, docker_1.generateDockerIgnore)());
    if (config.includeObservability) {
        await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'prometheus.yml'), (0, docker_1.generatePrometheusConfig)());
    }
    // Generate optional modules
    if (config.includeSecurity) {
        await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'src/security/archestraSecurity.ts'), (0, security_1.generateSecurityModule)());
    }
    if (config.includeObservability) {
        await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'src/observability/metrics.ts'), (0, observability_1.generateMetricsModule)());
        await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'src/observability/logger.ts'), (0, observability_1.generateLoggerModule)());
    }
    // Generate documentation
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'README.md'), (0, docs_1.generateReadme)(config));
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'ARCHESTRA.md'), (0, docs_1.generateArchestraGuide)(config));
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, '.gitignore'), (0, docs_1.generateGitignore)());
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, '.env.example'), (0, docs_1.generateEnvExample)());
}
