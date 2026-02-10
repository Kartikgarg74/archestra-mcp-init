"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateServerFile = generateServerFile;
function generateServerFile(config) {
    const imports = buildImports(config);
    const initCode = buildInitCode(config);
    const toolRegistration = buildToolRegistration(config);
    return `${imports}

${initCode}

${toolRegistration}

// Start server
mcp.start();
${config.includeObservability
        ? `logger.info('${config.name} started and registered with Archestra patterns');`
        : `console.log('${config.name} started');`}
`;
}
function buildImports(config) {
    const lines = [
        "import { FastMCP } from 'fastmcp';",
        "import { z } from 'zod';",
        "import dotenv from 'dotenv';"
    ];
    if (config.includeSecurity) {
        lines.push("import { ArchestraSecurityLayer } from './security/archestraSecurity.js';");
    }
    if (config.includeObservability) {
        lines.push("import { metricsServer, recordToolCall } from './observability/metrics.js';");
        lines.push("import { logger } from './observability/logger.js';");
    }
    lines.push("import { exampleTool } from './tools/exampleTool.js';");
    return lines.join('\n');
}
function buildInitCode(config) {
    const lines = [
        'dotenv.config();',
        '',
        '// Initialize FastMCP server',
        `const mcp = new FastMCP({`,
        `  name: '${config.name}',`,
        `  version: '1.0.0',`,
        `  description: '${config.description}'`,
        '});',
        ''
    ];
    if (config.includeSecurity) {
        lines.push('// Initialize Archestra security layer');
        lines.push('const securityLayer = new ArchestraSecurityLayer({');
        lines.push('  quarantineMode: true,');
        lines.push('  auditLogEnabled: true');
        lines.push('});');
        lines.push('');
    }
    if (config.includeObservability) {
        lines.push('// Start metrics server');
        lines.push('metricsServer.listen(9090, () => {');
        lines.push("  logger.info('Metrics server listening on port 9090');");
        lines.push('});');
        lines.push('');
    }
    return lines.join('\n');
}
function buildToolRegistration(config) {
    const lines = [
        '// Register tools',
        "mcp.addTool({",
        "  name: 'example_tool',",
        "  description: 'An example tool demonstrating Archestra patterns',",
        "  parameters: z.object({",
        "    input: z.string().describe('Input data to process')",
        "  }),",
        "  execute: async (args) => {"
    ];
    // Add observability start
    if (config.includeObservability) {
        lines.push("    const startTime = Date.now();");
        lines.push("    logger.info(`Executing example_tool with input: ${args.input.substring(0, 50)}...`);");
    }
    // Add security validation
    if (config.includeSecurity) {
        lines.push('    // Archestra security: Validate input through quarantine');
        lines.push('    const sanitizedInput = await securityLayer.sanitizeInput(args.input);');
        lines.push('    if (!sanitizedInput.safe) {');
        if (config.includeObservability) {
            lines.push("      logger.warn('Input failed security validation');");
        }
        lines.push("      throw new Error('Input failed security validation: ' + sanitizedInput.reason);");
        lines.push('    }');
    }
    // Execute business logic
    const inputVar = config.includeSecurity ? 'sanitizedInput.data' : 'args.input';
    lines.push('    // Execute business logic');
    lines.push(`    const result = await exampleTool(${inputVar});`);
    // Add observability end
    if (config.includeObservability) {
        lines.push('    // Record metrics');
        lines.push('    const duration = Date.now() - startTime;');
        lines.push("    recordToolCall('example_tool', duration, true);");
        lines.push("    logger.info(`example_tool completed in ${duration}ms`);");
    }
    lines.push('    return result;');
    lines.push('  }');
    lines.push('});');
    lines.push('');
    // Add health check
    lines.push("// Health check endpoint (for Archestra orchestration)");
    lines.push("mcp.addTool({");
    lines.push("  name: 'health_check',");
    lines.push("  description: 'Check server health and Archestra compatibility',");
    lines.push("  parameters: z.object({}),");
    lines.push("  execute: async () => {");
    lines.push("    return {");
    lines.push("      status: 'healthy',");
    lines.push("      archestraCompatible: true,");
    if (config.includeSecurity) {
        lines.push("      securityLayer: 'active',");
    }
    if (config.includeObservability) {
        lines.push("      metricsEnabled: true,");
    }
    lines.push("      timestamp: new Date().toISOString()");
    lines.push("    };");
    lines.push("  }");
    lines.push("});");
    return lines.join('\n');
}
