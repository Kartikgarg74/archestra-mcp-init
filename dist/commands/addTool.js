"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToolCommand = addToolCommand;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const fileGenerator_1 = require("../utils/fileGenerator");
const TOOL_TEMPLATES = {
    typescript: {
        'api-call': {
            name: 'API Call',
            description: 'Make HTTP requests to external APIs',
            fileName: (name) => `${name}Tool.ts`,
            generate: generateTypeScriptApiTool
        },
        'file-operation': {
            name: 'File Operation',
            description: 'Read and write files securely',
            fileName: (name) => `${name}Tool.ts`,
            generate: generateTypeScriptFileTool
        },
        'database-query': {
            name: 'Database Query',
            description: 'Execute SQL queries with validation',
            fileName: (name) => `${name}Tool.ts`,
            generate: generateTypeScriptDatabaseTool
        },
        'custom': {
            name: 'Custom Tool',
            description: 'Blank tool template',
            fileName: (name) => `${name}Tool.ts`,
            generate: generateTypeScriptCustomTool
        }
    },
    python: {
        'api-call': {
            name: 'API Call',
            description: 'Make HTTP requests to external APIs',
            fileName: (name) => `${name}_tool.py`,
            generate: generatePythonApiTool
        },
        'file-operation': {
            name: 'File Operation',
            description: 'Read and write files securely',
            fileName: (name) => `${name}_tool.py`,
            generate: generatePythonFileTool
        },
        'database-query': {
            name: 'Database Query',
            description: 'Execute SQL queries with validation',
            fileName: (name) => `${name}_tool.py`,
            generate: generatePythonDatabaseTool
        },
        'custom': {
            name: 'Custom Tool',
            description: 'Blank tool template',
            fileName: (name) => `${name}_tool.py`,
            generate: generatePythonCustomTool
        }
    }
};
async function addToolCommand(options) {
    console.log(chalk_1.default.blue('\n🔧 Archestra Tool Builder\n'));
    // Detect project type and language
    const projectInfo = await detectProject();
    if (!projectInfo) {
        console.log(chalk_1.default.red('\n❌ Not an Archestra MCP project. Run this from a project root.\n'));
        return;
    }
    const templateChoices = Object.entries(TOOL_TEMPLATES[projectInfo.language]).map(([key, val]) => ({
        name: `${val.name} - ${val.description}`,
        value: key
    }));
    const answers = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'toolName',
            message: 'Tool name (camelCase):',
            default: options.name,
            when: !options.name,
            validate: (input) => {
                if (!input)
                    return 'Tool name is required';
                if (!/^[a-z][a-zA-Z0-9]*$/.test(input)) {
                    return 'Tool name must be camelCase (e.g., searchDatabase)';
                }
                return true;
            }
        },
        {
            type: 'list',
            name: 'template',
            message: 'Choose tool template:',
            choices: templateChoices,
            when: !options.template
        },
        {
            type: 'input',
            name: 'description',
            message: 'Tool description:',
            default: 'A custom MCP tool'
        }
    ]);
    const toolConfig = {
        name: options.name || answers.toolName,
        template: options.template || answers.template,
        description: answers.description,
        language: projectInfo.language,
        includeSecurity: projectInfo.hasSecurity,
        includeObservability: projectInfo.hasObservability
    };
    const templateKey = toolConfig.template;
    const templateConfig = TOOL_TEMPLATES[projectInfo.language][templateKey];
    if (!templateConfig) {
        console.log(chalk_1.default.red(`\n❌ Unknown template: ${toolConfig.template}\n`));
        return;
    }
    const fileName = templateConfig.fileName(toolConfig.name);
    const filePath = path_1.default.join(projectInfo.toolsDir, fileName);
    // Check if file exists
    if (await fs_extra_1.default.pathExists(filePath)) {
        const { overwrite } = await inquirer_1.default.prompt([{
                type: 'confirm',
                name: 'overwrite',
                message: `Tool file ${fileName} exists. Overwrite?`,
                default: false
            }]);
        if (!overwrite) {
            console.log(chalk_1.default.yellow('\n⚠️  Aborted.\n'));
            return;
        }
    }
    console.log(chalk_1.default.blue(`\n📝 Creating tool: ${toolConfig.name}`));
    try {
        const content = templateConfig.generate(toolConfig);
        await (0, fileGenerator_1.writeFile)(filePath, content);
        // Update server registration (simplified - just log instructions)
        console.log(chalk_1.default.green(`\n✅ Tool created: ${filePath}`));
        console.log(chalk_1.default.blue('\nNext steps:'));
        console.log(chalk_1.default.white(`  1. Review and customize the tool in ${fileName}`));
        console.log(chalk_1.default.white('  2. Register the tool in src/server.ts:'));
        console.log(chalk_1.default.gray(`
     mcp.addTool({
       name: '${toSnakeCase(toolConfig.name)}',
       description: '${toolConfig.description}',
       parameters: z.object({...}),
       execute: async (args) => {
         return await ${toolConfig.name}Tool(args);
       }
     });`));
        console.log(chalk_1.default.white('  3. Run your server and test the tool\n'));
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Error creating tool:'), error);
        process.exit(1);
    }
}
async function detectProject() {
    const cwd = process.cwd();
    // Check for TypeScript
    if (await fs_extra_1.default.pathExists(path_1.default.join(cwd, 'package.json'))) {
        const pkg = await fs_extra_1.default.readJson(path_1.default.join(cwd, 'package.json'));
        if (pkg.mcp?.archestraCompatible) {
            return {
                language: 'typescript',
                toolsDir: path_1.default.join(cwd, 'src', 'tools'),
                hasSecurity: pkg.mcp?.securityLevel === 'quarantine',
                hasObservability: pkg.mcp?.observability === true
            };
        }
    }
    // Check for Python
    if (await fs_extra_1.default.pathExists(path_1.default.join(cwd, 'pyproject.toml'))) {
        const pyproject = await fs_extra_1.default.readFile(path_1.default.join(cwd, 'pyproject.toml'), 'utf8');
        if (pyproject.includes('archestra') || pyproject.includes('fastmcp')) {
            const hasSecurity = await fs_extra_1.default.pathExists(path_1.default.join(cwd, 'src', 'security'));
            const hasObservability = await fs_extra_1.default.pathExists(path_1.default.join(cwd, 'src', 'observability'));
            return {
                language: 'python',
                toolsDir: path_1.default.join(cwd, 'src', 'tools'),
                hasSecurity,
                hasObservability
            };
        }
    }
    return null;
}
function toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
}
// Tool generators (simplified versions)
function generateTypeScriptApiTool(config) {
    return `import { z } from 'zod';
${config.includeSecurity ? `import { securityLayer } from '../security/archestraSecurity.js';` : ''}
${config.includeObservability ? `import { recordToolCall } from '../observability/metrics.js';
import { logger } from '../observability/logger.js';` : ''}

export async function ${config.name}Tool(input: { url: string; method?: string }) {
  ${config.includeObservability ? 'const startTime = Date.now();' : ''}

  ${config.includeSecurity ? `const check = await securityLayer.sanitizeInput(input.url);
  if (!check.safe) throw new Error('Invalid URL');` : ''}

  // TODO: Implement API call logic

  ${config.includeObservability ? `recordToolCall('${toSnakeCase(config.name)}', Date.now() - startTime, true);` : ''}

  return { success: true };
}
`;
}
function generateTypeScriptFileTool(config) {
    return `import { z } from 'zod';
import { promises as fs } from 'fs';
${config.includeSecurity ? `import { securityLayer } from '../security/archestraSecurity.js';` : ''}
${config.includeObservability ? `import { recordToolCall } from '../observability/metrics.js';` : ''}

export async function ${config.name}Tool(input: { filePath: string; content?: string }) {
  // TODO: Implement file operation
  return { success: true };
}
`;
}
function generateTypeScriptDatabaseTool(config) {
    return `import { z } from 'zod';
${config.includeObservability ? `import { recordToolCall } from '../observability/metrics.js';` : ''}

export async function ${config.name}Tool(input: { query: string; params?: any[] }) {
  // TODO: Implement database query
  return { rows: [], rowCount: 0 };
}
`;
}
function generateTypeScriptCustomTool(config) {
    return `import { z } from 'zod';
${config.includeSecurity ? `import { securityLayer } from '../security/archestraSecurity.js';` : ''}
${config.includeObservability ? `import { recordToolCall } from '../observability/metrics.js';
import { logger } from '../observability/logger.js';` : ''}

/**
 * ${config.description}
 */
export async function ${config.name}Tool(input: any) {
  ${config.includeObservability ? 'const startTime = Date.now();' : ''}

  // TODO: Implement your tool logic

  ${config.includeObservability ? `recordToolCall('${toSnakeCase(config.name)}', Date.now() - startTime, true);` : ''}

  return { result: 'success' };
}
`;
}
function generatePythonApiTool(config) {
    return `import aiohttp
from typing import Dict, Any
${config.includeSecurity ? 'from src.security.archestra_security import security_layer' : ''}
${config.includeObservability ? 'from src.observability.metrics import record_tool_call' : ''}

async def ${config.name}_tool(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """${config.description}"""
    ${config.includeObservability ? 'import time\n    start_time = time.time()' : ''}

    url = input_data.get("url")

    ${config.includeSecurity ? `check = await security_layer.sanitize_input(str(url))
    if not check["safe"]:
        raise ValueError("Invalid URL")` : ''}

    # TODO: Implement API call logic

    ${config.includeObservability ? 'record_tool_call("' + toSnakeCase(config.name) + '", time.time() - start_time, True)' : ''}

    return {"success": True}
`;
}
function generatePythonFileTool(config) {
    return `from typing import Dict, Any
${config.includeSecurity ? 'from src.security.archestra_security import security_layer' : ''}

async def ${config.name}_tool(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """${config.description}"""
    # TODO: Implement file operation
    return {"success": True}
`;
}
function generatePythonDatabaseTool(config) {
    return `from typing import Dict, Any, List
${config.includeObservability ? 'from src.observability.metrics import record_tool_call' : ''}

async def ${config.name}_tool(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """${config.description}"""
    # TODO: Implement database query
    return {"rows": [], "row_count": 0}
`;
}
function generatePythonCustomTool(config) {
    return `from typing import Dict, Any
${config.includeSecurity ? 'from src.security.archestra_security import security_layer' : ''}
${config.includeObservability ? 'from src.observability.metrics import record_tool_call' : ''}

async def ${config.name}_tool(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    ${config.description}
    """
    ${config.includeObservability ? 'import time\n    start_time = time.time()' : ''}

    # TODO: Implement your tool logic

    ${config.includeObservability ? 'record_tool_call("' + toSnakeCase(config.name) + '", time.time() - start_time, True)' : ''}

    return {"result": "success"}
`;
}
