import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import dotenv from 'dotenv';
import { ArchestraSecurityLayer } from './security/archestraSecurity.js';
import { metricsServer, recordToolCall } from './observability/metrics.js';
import { logger } from './observability/logger.js';
import { exampleTool } from './tools/exampleTool.js';

dotenv.config();

// Initialize FastMCP server
const mcp = new FastMCP({
  name: 'test-ts-server',
  version: '1.0.0',
  description: 'An Archestra-native MCP server'
});

// Initialize Archestra security layer
const securityLayer = new ArchestraSecurityLayer({
  quarantineMode: true,
  auditLogEnabled: true
});

// Start metrics server
metricsServer.listen(9090, () => {
  logger.info('Metrics server listening on port 9090');
});


// Register tools
mcp.addTool({
  name: 'example_tool',
  description: 'An example tool demonstrating Archestra patterns',
  parameters: z.object({
    input: z.string().describe('Input data to process')
  }),
  execute: async (args) => {
    const startTime = Date.now();
    logger.info(`Executing example_tool with input: ${args.input.substring(0, 50)}...`);
    // Archestra security: Validate input through quarantine
    const sanitizedInput = await securityLayer.sanitizeInput(args.input);
    if (!sanitizedInput.safe) {
      logger.warn('Input failed security validation');
      throw new Error('Input failed security validation: ' + sanitizedInput.reason);
    }
    // Execute business logic
    const result = await exampleTool(sanitizedInput.data);
    // Record metrics
    const duration = Date.now() - startTime;
    recordToolCall('example_tool', duration, true);
    logger.info(`example_tool completed in ${duration}ms`);
    return result;
  }
});

// Health check endpoint (for Archestra orchestration)
mcp.addTool({
  name: 'health_check',
  description: 'Check server health and Archestra compatibility',
  parameters: z.object({}),
  execute: async () => {
    return {
      status: 'healthy',
      archestraCompatible: true,
      securityLayer: 'active',
      metricsEnabled: true,
      timestamp: new Date().toISOString()
    };
  }
});

// Start server
mcp.start();
logger.info('test-ts-server started and registered with Archestra patterns');
