import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { writeFile } from '../utils/fileGenerator';

interface AddToolOptions {
  name?: string;
  template?: string;
  language?: string;
}

interface ToolTemplate {
  name: string;
  description: string;
  fileName: (name: string) => string;
  generate: (config: any) => string;
}

interface ToolTemplates {
  typescript: Record<string, ToolTemplate>;
  python: Record<string, ToolTemplate>;
}

const TOOL_TEMPLATES: ToolTemplates = {
  typescript: {
    'api-call': {
      name: 'API Call',
      description: 'Make HTTP requests to external APIs',
      fileName: (name: string) => `${name}Tool.ts`,
      generate: generateTypeScriptApiTool
    },
    'file-operation': {
      name: 'File Operation',
      description: 'Read and write files securely',
      fileName: (name: string) => `${name}Tool.ts`,
      generate: generateTypeScriptFileTool
    },
    'database-query': {
      name: 'Database Query',
      description: 'Execute SQL queries with validation',
      fileName: (name: string) => `${name}Tool.ts`,
      generate: generateTypeScriptDatabaseTool
    },
    'custom': {
      name: 'Custom Tool',
      description: 'Blank tool template',
      fileName: (name: string) => `${name}Tool.ts`,
      generate: generateTypeScriptCustomTool
    }
  },
  python: {
    'api-call': {
      name: 'API Call',
      description: 'Make HTTP requests to external APIs',
      fileName: (name: string) => `${name}_tool.py`,
      generate: generatePythonApiTool
    },
    'file-operation': {
      name: 'File Operation',
      description: 'Read and write files securely',
      fileName: (name: string) => `${name}_tool.py`,
      generate: generatePythonFileTool
    },
    'database-query': {
      name: 'Database Query',
      description: 'Execute SQL queries with validation',
      fileName: (name: string) => `${name}_tool.py`,
      generate: generatePythonDatabaseTool
    },
    'custom': {
      name: 'Custom Tool',
      description: 'Blank tool template',
      fileName: (name: string) => `${name}_tool.py`,
      generate: generatePythonCustomTool
    }
  }
};

export async function addToolCommand(options: AddToolOptions) {
  console.log(chalk.blue('\n🔧 Archestra Tool Builder\n'));

  // Detect project type and language
  const projectInfo = await detectProject();

  if (!projectInfo) {
    console.log(chalk.red('\n❌ Not an Archestra MCP project. Run this from a project root.\n'));
    return;
  }

  const templateChoices = Object.entries(TOOL_TEMPLATES[projectInfo.language]).map(([key, val]) => ({
    name: `${val.name} - ${val.description}`,
    value: key
  }));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'toolName',
      message: 'Tool name (camelCase):',
      default: options.name,
      when: !options.name,
      validate: (input: string) => {
        if (!input) return 'Tool name is required';
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

  const templateKey = toolConfig.template as string;
  const templateConfig = TOOL_TEMPLATES[projectInfo.language][templateKey];

  if (!templateConfig) {
    console.log(chalk.red(`\n❌ Unknown template: ${toolConfig.template}\n`));
    return;
  }

  const fileName = templateConfig.fileName(toolConfig.name);
  const filePath = path.join(projectInfo.toolsDir, fileName);

  // Check if file exists
  if (await fs.pathExists(filePath)) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: `Tool file ${fileName} exists. Overwrite?`,
      default: false
    }]);

    if (!overwrite) {
      console.log(chalk.yellow('\n⚠️  Aborted.\n'));
      return;
    }
  }

  console.log(chalk.blue(`\n📝 Creating tool: ${toolConfig.name}`));

  try {
    const content = templateConfig.generate(toolConfig);
    await writeFile(filePath, content);

    // Update server registration (simplified - just log instructions)
    console.log(chalk.green(`\n✅ Tool created: ${filePath}`));
    console.log(chalk.blue('\nNext steps:'));
    console.log(chalk.white(`  1. Review and customize the tool in ${fileName}`));
    console.log(chalk.white('  2. Register the tool in src/server.ts:'));
    console.log(chalk.gray(`
     mcp.addTool({
       name: '${toSnakeCase(toolConfig.name)}',
       description: '${toolConfig.description}',
       parameters: z.object({...}),
       execute: async (args) => {
         return await ${toolConfig.name}Tool(args);
       }
     });`));
    console.log(chalk.white('  3. Run your server and test the tool\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Error creating tool:'), error);
    process.exit(1);
  }
}

async function detectProject(): Promise<{
  language: 'typescript' | 'python';
  toolsDir: string;
  hasSecurity: boolean;
  hasObservability: boolean;
} | null> {
  const cwd = process.cwd();

  // Check for TypeScript
  if (await fs.pathExists(path.join(cwd, 'package.json'))) {
    const pkg = await fs.readJson(path.join(cwd, 'package.json'));
    if (pkg.mcp?.archestraCompatible) {
      return {
        language: 'typescript',
        toolsDir: path.join(cwd, 'src', 'tools'),
        hasSecurity: pkg.mcp?.securityLevel === 'quarantine',
        hasObservability: pkg.mcp?.observability === true
      };
    }
  }

  // Check for Python
  if (await fs.pathExists(path.join(cwd, 'pyproject.toml'))) {
    const pyproject = await fs.readFile(path.join(cwd, 'pyproject.toml'), 'utf8');
    if (pyproject.includes('archestra') || pyproject.includes('fastmcp')) {
      const hasSecurity = await fs.pathExists(path.join(cwd, 'src', 'security'));
      const hasObservability = await fs.pathExists(path.join(cwd, 'src', 'observability'));

      return {
        language: 'python',
        toolsDir: path.join(cwd, 'src', 'tools'),
        hasSecurity,
        hasObservability
      };
    }
  }

  return null;
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
}

// Tool generators (simplified versions)
function generateTypeScriptApiTool(config: any): string {
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

function generateTypeScriptFileTool(config: any): string {
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

function generateTypeScriptDatabaseTool(config: any): string {
  return `import { z } from 'zod';
${config.includeObservability ? `import { recordToolCall } from '../observability/metrics.js';` : ''}

export async function ${config.name}Tool(input: { query: string; params?: any[] }) {
  // TODO: Implement database query
  return { rows: [], rowCount: 0 };
}
`;
}

function generateTypeScriptCustomTool(config: any): string {
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

function generatePythonApiTool(config: any): string {
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

function generatePythonFileTool(config: any): string {
  return `from typing import Dict, Any
${config.includeSecurity ? 'from src.security.archestra_security import security_layer' : ''}

async def ${config.name}_tool(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """${config.description}"""
    # TODO: Implement file operation
    return {"success": True}
`;
}

function generatePythonDatabaseTool(config: any): string {
  return `from typing import Dict, Any, List
${config.includeObservability ? 'from src.observability.metrics import record_tool_call' : ''}

async def ${config.name}_tool(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """${config.description}"""
    # TODO: Implement database query
    return {"rows": [], "row_count": 0}
`;
}

function generatePythonCustomTool(config: any): string {
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
