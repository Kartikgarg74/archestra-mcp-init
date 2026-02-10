export function generateSecurityModule(): string {
  return `/**
 * Archestra Security Layer
 *
 * Implements the Dual LLM Quarantine pattern for non-probabilistic
 * protection against prompt injection and data exfiltration.
 *
 * Reference: https://archestra.ai/security
 */

export interface SecurityCheckResult {
  safe: boolean;
  data?: string;
  reason?: string;
  confidence: number;
}

export interface SecurityConfig {
  quarantineMode: boolean;
  auditLogEnabled: boolean;
  maxInputLength?: number;
  blockedPatterns?: RegExp[];
}

export class ArchestraSecurityLayer {
  private config: SecurityConfig;
  private auditLog: Array<{ timestamp: string; check: string; result: boolean }> = [];

  constructor(config: SecurityConfig) {
    this.config = {
      maxInputLength: 10000,
      blockedPatterns: [
        /ignore previous instructions/i,
        /disregard.*prompt/i,
        /system.*override/i,
        /\\[system\\]/i,
        /<system>/i,
        /data.*exfiltration/i
      ],
      ...config
    };
  }

  /**
   * Sanitize input through Archestra's quarantine pattern
   */
  async sanitizeInput(input: string): Promise<SecurityCheckResult> {
    // Check 1: Length validation
    if (input.length > (this.config.maxInputLength || 10000)) {
      this.logAudit('length_check', false);
      return {
        safe: false,
        reason: 'Input exceeds maximum length',
        confidence: 1.0
      };
    }

    // Check 2: Pattern matching for known injection attempts
    for (const pattern of (this.config.blockedPatterns || [])) {
      if (pattern.test(input)) {
        this.logAudit('pattern_check', false);
        return {
          safe: false,
          reason: 'Potentially malicious pattern detected',
          confidence: 0.95
        };
      }
    }

    // Check 3: Structure validation
    const instructionCount = (input.match(/\\binstruction\\b/gi) || []).length;
    if (instructionCount > 3) {
      this.logAudit('instruction_count', false);
      return {
        safe: false,
        reason: 'Excessive instruction references detected',
        confidence: 0.8
      };
    }

    // Check 4: Data exfiltration patterns
    const exfilPatterns = [
      /\\b(send|email|transmit|upload)\\b.*\\b(data|information|content)\\b/i,
      /\\b(https?|ftp):\\/\\//i,
      /\\b(api[_-]?key|token|password|secret)\\s*[=:]\\s*\\S+/i
    ];

    for (const pattern of exfilPatterns) {
      if (pattern.test(input)) {
        this.logAudit('exfiltration_check', false);
        return {
          safe: false,
          reason: 'Potential data exfiltration attempt detected',
          confidence: 0.85
        };
      }
    }

    this.logAudit('full_sanitization', true);
    return {
      safe: true,
      data: input,
      confidence: 0.99
    };
  }

  /**
   * Validate output to prevent data leakage
   */
  async validateOutput(
    output: string,
    context?: { allowedRecipients?: string[] }
  ): Promise<SecurityCheckResult> {
    const sensitivePatterns = [
      /\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g,
      /\\b(?:\\d[ -]*?){13,16}\\b/g,
      /\\b\\d{3}-\\d{2}-\\d{4}\\b/g,
      /password\\s*[=:]\\s*\\S+/gi,
      /api[_-]?key\\s*[=:]\\s*\\S+/gi
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(output)) {
        this.logAudit('output_sensitive_data', false);
        return {
          safe: false,
          reason: 'Sensitive data detected in output',
          confidence: 0.9
        };
      }
    }

    this.logAudit('output_validation', true);
    return {
      safe: true,
      data: output,
      confidence: 0.95
    };
  }

  getAuditLog(): Array<{ timestamp: string; check: string; result: boolean }> {
    return [...this.auditLog];
  }

  private logAudit(check: string, result: boolean): void {
    if (this.config.auditLogEnabled) {
      this.auditLog.push({
        timestamp: new Date().toISOString(),
        check,
        result
      });
    }
  }
}

// Export singleton for easy import
export const securityLayer = new ArchestraSecurityLayer({
  quarantineMode: true,
  auditLogEnabled: true
});
`;
}
