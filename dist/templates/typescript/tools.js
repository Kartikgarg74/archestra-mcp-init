"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExampleTool = generateExampleTool;
exports.generateApiTool = generateApiTool;
exports.generateFileTool = generateFileTool;
exports.generateDatabaseTool = generateDatabaseTool;
exports.generateIndexFile = generateIndexFile;
function generateExampleTool(config) {
    return `/**
 * Example Tool Implementation
 *
 * This demonstrates how to implement a tool that follows Archestra patterns:
 * - Input validation
 * - Structured error handling
 * - Observable execution
 */

export interface ToolInput {
  input: string;
  options?: {
    format?: 'json' | 'text';
    maxLength?: number;
  };
}

export interface ToolOutput {
  result: string;
  metadata: {
    processedAt: string;
    inputLength: number;
    outputLength: number;
  };
}

export async function exampleTool(input: string, options?: ToolInput['options']): Promise<ToolOutput> {
  // Simulate processing
  const processed = input.toUpperCase();
  const truncated = options?.maxLength
    ? processed.substring(0, options.maxLength)
    : processed;

  return {
    result: truncated,
    metadata: {
      processedAt: new Date().toISOString(),
      inputLength: input.length,
      outputLength: truncated.length
    }
  };
}
`;
}
function generateApiTool(config) {
    const securityImport = config.includeSecurity
        ? `import { securityLayer } from '../security/archestraSecurity.js';`
        : '';
    const observabilityImport = config.includeObservability
        ? `import { recordToolCall } from '../observability/metrics.js';
import { logger } from '../observability/logger.js';`
        : '';
    const securityCheck = config.includeSecurity
        ? `// Validate URL to prevent SSRF
  const urlCheck = await securityLayer.sanitizeInput(url);
  if (!urlCheck.safe) {
    ${config.includeObservability ? `logger.warn('URL failed security validation');` : ''}
    throw new Error('Invalid URL: ' + urlCheck.reason);
  }
  const safeUrl = urlCheck.data;`
        : '  const safeUrl = url;';
    const observabilityStart = config.includeObservability
        ? `const startTime = Date.now();
  logger.info(\`Making API call to: \${url}\`);`
        : '';
    const observabilityEnd = config.includeObservability
        ? `const duration = Date.now() - startTime;
  recordToolCall('api_call', duration, true);
  logger.info(\`API call completed in \${duration}ms\`);`
        : '';
    return `/**
 * API Call Tool
 *
 * Makes HTTP requests to external APIs with Archestra security validation.
 */

import { z } from 'zod';
${securityImport}
${observabilityImport}

const ApiInputSchema = z.object({
  url: z.string().url().describe('API endpoint URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET').describe('HTTP method'),
  headers: z.record(z.string()).optional().describe('Request headers'),
  body: z.string().optional().describe('Request body (JSON string)'),
  timeout: z.number().default(30000).describe('Request timeout in ms')
});

export type ApiInput = z.infer<typeof ApiInputSchema>;

export interface ApiOutput {
  status: number;
  data: any;
  headers: Record<string, string>;
  duration: number;
}

export async function apiCallTool(input: ApiInput): Promise<ApiOutput> {
  const { url, method, headers = {}, body, timeout } = input;

  ${observabilityStart}

  ${securityCheck}

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(safeUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body || undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseData = await response.json().catch(() => null);

    ${observabilityEnd}

    return {
      status: response.status,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries()),
      duration: 0
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw new Error(\`API call failed: \${error.message}\`);
  }
}

export const apiToolSchema = {
  name: 'api_call',
  description: 'Make HTTP requests to external APIs with security validation',
  parameters: ApiInputSchema
};
`;
}
function generateFileTool(config) {
    const securityImport = config.includeSecurity
        ? `import { securityLayer } from '../security/archestraSecurity.js';`
        : '';
    const observabilityImport = config.includeObservability
        ? `import { recordToolCall } from '../observability/metrics.js';
import { logger } from '../observability/logger.js';`
        : '';
    const securityCheck = config.includeSecurity
        ? `// Validate file path to prevent directory traversal
  const pathCheck = await securityLayer.sanitizeInput(filePath);
  if (!pathCheck.safe || pathCheck.data?.includes('..')) {
    ${config.includeObservability ? `logger.warn('File path failed security validation');` : ''}
    throw new Error('Invalid file path: ' + (pathCheck.reason || 'Directory traversal detected'));
  }
  const safePath = pathCheck.data;`
        : '  const safePath = filePath;';
    const observabilityStart = config.includeObservability
        ? `const startTime = Date.now();
  logger.info(\`Reading file: \${filePath}\`);`
        : '';
    const observabilityEnd = config.includeObservability
        ? `const duration = Date.now() - startTime;
  recordToolCall('file_read', duration, true);
  logger.info(\`File read completed in \${duration}ms\`);`
        : '';
    return `/**
 * File Operations Tool
 *
 * Read and write files with Archestra security validation.
 */

import { z } from 'zod';
import { promises as fs } from 'fs';
import { resolve, dirname } from 'path';
${securityImport}
${observabilityImport}

const ReadFileSchema = z.object({
  filePath: z.string().describe('Path to the file'),
  encoding: z.enum(['utf8', 'base64']).default('utf8').describe('File encoding')
});

const WriteFileSchema = z.object({
  filePath: z.string().describe('Path to the file'),
  content: z.string().describe('Content to write'),
  encoding: z.enum(['utf8', 'base64']).default('utf8').describe('File encoding')
});

export type ReadFileInput = z.infer<typeof ReadFileSchema>;
export type WriteFileInput = z.infer<typeof WriteFileSchema>;

export async function readFileTool(input: ReadFileInput): Promise<{ content: string; size: number }> {
  const { filePath, encoding } = input;

  ${observabilityStart}

  ${securityCheck}

  try {
    const resolvedPath = resolve(safePath);
    const content = await fs.readFile(resolvedPath, encoding as BufferEncoding);

    ${observabilityEnd}

    return {
      content,
      size: Buffer.byteLength(content, encoding as BufferEncoding)
    };
  } catch (error) {
    throw new Error(\`Failed to read file: \${error.message}\`);
  }
}

export async function writeFileTool(input: WriteFileInput): Promise<{ success: boolean; size: number }> {
  const { filePath, content, encoding } = input;

  ${observabilityStart.replace('Reading', 'Writing')}

  ${securityCheck}

  try {
    const resolvedPath = resolve(safePath);
    await fs.mkdir(dirname(resolvedPath), { recursive: true });
    await fs.writeFile(resolvedPath, content, encoding as BufferEncoding);

    ${observabilityEnd.replace('file_read', 'file_write')}

    return {
      success: true,
      size: Buffer.byteLength(content, encoding as BufferEncoding)
    };
  } catch (error) {
    throw new Error(\`Failed to write file: \${error.message}\`);
  }
}

export const fileToolsSchema = {
  read: {
    name: 'file_read',
    description: 'Read file contents with security validation',
    parameters: ReadFileSchema
  },
  write: {
    name: 'file_write',
    description: 'Write content to file with security validation',
    parameters: WriteFileSchema
  }
};
`;
}
function generateDatabaseTool(config) {
    const observabilityImport = config.includeObservability
        ? `import { recordToolCall } from '../observability/metrics.js';
import { logger } from '../observability/logger.js';`
        : '';
    const observabilityStart = config.includeObservability
        ? `const startTime = Date.now();
  logger.info(\`Executing database query\`);`
        : '';
    const observabilityEnd = config.includeObservability
        ? `const duration = Date.now() - startTime;
  recordToolCall('database_query', duration, true);
  logger.info(\`Query completed in \${duration}ms\`);`
        : '';
    return `/**
 * Database Query Tool (Template)
 *
 * Execute database queries with parameterization and validation.
 * NOTE: Install your database driver (pg, mysql2, etc.) and configure connection.
 */

import { z } from 'zod';
${observabilityImport}

// TODO: Install and import your database driver
// import { Pool } from 'pg';

const QuerySchema = z.object({
  query: z.string().describe('SQL query (use parameterized queries)'),
  params: z.array(z.any()).optional().describe('Query parameters'),
  timeout: z.number().default(30000).describe('Query timeout in ms')
});

export type QueryInput = z.infer<typeof QuerySchema>;

export interface QueryOutput {
  rows: any[];
  rowCount: number;
  duration: number;
}

// TODO: Configure your database connection
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL
// });

export async function databaseQueryTool(input: QueryInput): Promise<QueryOutput> {
  const { query, params = [], timeout } = input;

  ${observabilityStart}

  // Validate query type (prevent destructive operations if needed)
  const forbiddenKeywords = ['DROP', 'TRUNCATE', 'DELETE FROM'];
  const upperQuery = query.toUpperCase();

  for (const keyword of forbiddenKeywords) {
    if (upperQuery.includes(keyword)) {
      throw new Error(\`Query contains forbidden keyword: \${keyword}\`);
    }
  }

  try {
    // TODO: Implement actual database query
    // const client = await pool.connect();
    // const result = await client.query({ text: query, values: params, query_timeout: timeout });
    // client.release();

    // Placeholder implementation
    const result = {
      rows: [],
      rowCount: 0
    };

    ${observabilityEnd}

    return {
      rows: result.rows,
      rowCount: result.rowCount,
      duration: 0
    };
  } catch (error) {
    throw new Error(\`Database query failed: \${error.message}\`);
  }
}

export const databaseToolSchema = {
  name: 'database_query',
  description: 'Execute database queries with validation (configure connection first)',
  parameters: QuerySchema
};
`;
}
function generateIndexFile(config) {
    const exports = [`export { exampleTool } from './exampleTool.js';`];
    if (config.includeSecurity || config.includeObservability) {
        exports.push(`export { apiCallTool, apiToolSchema } from './apiTool.js';`);
        exports.push(`export { readFileTool, writeFileTool, fileToolsSchema } from './fileTool.js';`);
        exports.push(`export { databaseQueryTool, databaseToolSchema } from './databaseTool.js';`);
    }
    return exports.join('\n');
}
