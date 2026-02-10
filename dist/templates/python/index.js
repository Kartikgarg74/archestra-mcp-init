"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePythonProject = generatePythonProject;
const path_1 = __importDefault(require("path"));
const fileGenerator_1 = require("../../utils/fileGenerator");
const config_1 = require("./config");
const server_1 = require("./server");
const tools_1 = require("./tools");
const security_1 = require("./security");
const observability_1 = require("./observability");
const docs_1 = require("./docs");
async function generatePythonProject(projectPath, config) {
    const dirs = ['src', 'src/tools', 'src/security', 'src/observability', 'tests'];
    for (const dir of dirs) {
        await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, dir, '__init__.py'), '');
    }
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'pyproject.toml'), (0, config_1.generatePyProjectToml)(config));
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'requirements.txt'), (0, config_1.generateRequirements)(config));
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'src/server.py'), (0, server_1.generatePythonServer)(config));
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'src/tools/example_tool.py'), (0, tools_1.generatePythonExampleTool)(config));
    if (config.includeSecurity) {
        await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'src/security/archestra_security.py'), (0, security_1.generatePythonSecurityModule)());
    }
    if (config.includeObservability) {
        await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'src/observability/metrics.py'), (0, observability_1.generatePythonMetricsModule)());
        await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'src/observability/logger.py'), (0, observability_1.generatePythonLoggerModule)());
    }
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, 'README.md'), (0, docs_1.generatePythonReadme)(config));
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, '.gitignore'), (0, docs_1.generatePythonGitignore)());
    await (0, fileGenerator_1.writeFile)(path_1.default.join(projectPath, '.env.example'), (0, docs_1.generatePythonEnvExample)());
}
