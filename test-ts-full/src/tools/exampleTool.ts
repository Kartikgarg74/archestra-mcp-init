/**
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
