/**
 * File Operations Tool
 *
 * Read and write files with Archestra security validation.
 */

import { z } from 'zod';
import { promises as fs } from 'fs';
import { resolve, dirname } from 'path';
import { securityLayer } from '../security/archestraSecurity.js';
import { recordToolCall } from '../observability/metrics.js';
import { logger } from '../observability/logger.js';

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

  const startTime = Date.now();
  logger.info(`Reading file: ${filePath}`);

  // Validate file path to prevent directory traversal
  const pathCheck = await securityLayer.sanitizeInput(filePath);
  if (!pathCheck.safe || pathCheck.data?.includes('..')) {
    logger.warn('File path failed security validation');
    throw new Error('Invalid file path: ' + (pathCheck.reason || 'Directory traversal detected'));
  }
  const safePath = pathCheck.data;

  try {
    const resolvedPath = resolve(safePath);
    const content = await fs.readFile(resolvedPath, encoding as BufferEncoding);

    const duration = Date.now() - startTime;
  recordToolCall('file_read', duration, true);
  logger.info(`File read completed in ${duration}ms`);

    return {
      content,
      size: Buffer.byteLength(content, encoding as BufferEncoding)
    };
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

export async function writeFileTool(input: WriteFileInput): Promise<{ success: boolean; size: number }> {
  const { filePath, content, encoding } = input;

  const startTime = Date.now();
  logger.info(`Writing file: ${filePath}`);

  // Validate file path to prevent directory traversal
  const pathCheck = await securityLayer.sanitizeInput(filePath);
  if (!pathCheck.safe || pathCheck.data?.includes('..')) {
    logger.warn('File path failed security validation');
    throw new Error('Invalid file path: ' + (pathCheck.reason || 'Directory traversal detected'));
  }
  const safePath = pathCheck.data;

  try {
    const resolvedPath = resolve(safePath);
    await fs.mkdir(dirname(resolvedPath), { recursive: true });
    await fs.writeFile(resolvedPath, content, encoding as BufferEncoding);

    const duration = Date.now() - startTime;
  recordToolCall('file_write', duration, true);
  logger.info(`File read completed in ${duration}ms`);

    return {
      success: true,
      size: Buffer.byteLength(content, encoding as BufferEncoding)
    };
  } catch (error) {
    throw new Error(`Failed to write file: ${error.message}`);
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
