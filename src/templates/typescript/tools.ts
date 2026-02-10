import { ProjectConfig } from './index';

export function generateExampleTool(config: ProjectConfig): string {
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

export async function exampleTool(
  input: string,
  options?: ToolInput['options']
): Promise<ToolOutput> {
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

// Additional tool examples for your implementation:

export async function dataEnrichmentTool(
  data: Record<string, any>
): Promise<any> {
  // Implement your data enrichment logic
  return { enriched: true, data };
}

export async function analysisTool(query: string): Promise<any> {
  // Implement your analysis logic
  return { analyzed: true, query };
}
`;
}
