/**
 * API Call Tool
 *
 * Makes HTTP requests to external APIs with Archestra security validation.
 */

import { z } from 'zod';
import { securityLayer } from '../security/archestraSecurity.js';
import { recordToolCall } from '../observability/metrics.js';
import { logger } from '../observability/logger.js';

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

  const startTime = Date.now();
  logger.info(`Making API call to: ${url}`);

  // Validate URL to prevent SSRF
  const urlCheck = await securityLayer.sanitizeInput(url);
  if (!urlCheck.safe) {
    logger.warn('URL failed security validation');
    throw new Error('Invalid URL: ' + urlCheck.reason);
  }
  const safeUrl = urlCheck.data;

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

    const duration = Date.now() - startTime;
  recordToolCall('api_call', duration, true);
  logger.info(`API call completed in ${duration}ms`);

    return {
      status: response.status,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries()),
      duration: 0
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw new Error(`API call failed: ${error.message}`);
  }
}

export const apiToolSchema = {
  name: 'api_call',
  description: 'Make HTTP requests to external APIs with security validation',
  parameters: ApiInputSchema
};
