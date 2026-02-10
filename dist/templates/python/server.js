"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePythonServer = generatePythonServer;
function generatePythonServer(config) {
    const imports = buildPythonImports(config);
    const initCode = buildPythonInit(config);
    const tools = buildPythonTools(config);
    return `${imports}

${initCode}

${tools}

def main():
    ${config.includeObservability ? `logger.info("${config.name} started")` : `print("${config.name} started")`}
    mcp.run()

if __name__ == "__main__":
    main()
`;
}
function buildPythonImports(config) {
    const lines = [
        '#!/usr/bin/env python3',
        'import os',
        'import asyncio',
        'from datetime import datetime',
        'from typing import Any, Dict, Optional',
        'from dotenv import load_dotenv',
        'from fastmcp import FastMCP',
        'from pydantic import BaseModel, Field'
    ];
    if (config.includeSecurity) {
        lines.push('from src.security.archestra_security import ArchestraSecurityLayer, security_layer');
    }
    if (config.includeObservability) {
        lines.push('from src.observability.metrics import start_metrics_server, record_tool_call');
        lines.push('from src.observability.logger import logger');
    }
    lines.push('from src.tools.example_tool import example_tool');
    lines.push('');
    lines.push('load_dotenv()');
    return lines.join('\n');
}
function buildPythonInit(config) {
    const lines = [
        `mcp = FastMCP(`,
        `    name="${config.name}",`,
        `    version="1.0.0",`,
        `    description="${config.description}"`,
        `)`
    ];
    if (config.includeSecurity) {
        lines.push('');
        lines.push('security_layer = ArchestraSecurityLayer(');
        lines.push('    quarantine_mode=True,');
        lines.push('    audit_log_enabled=True');
        lines.push(')');
    }
    if (config.includeObservability) {
        lines.push('');
        lines.push('start_metrics_server(port=9090)');
    }
    return lines.join('\n');
}
function buildPythonTools(config) {
    const lines = [
        '',
        '@mcp.tool()',
        'async def example_tool_endpoint(input: str, format: str = "json") -> Dict[str, Any]:',
        '    """An example tool demonstrating Archestra patterns."""'
    ];
    if (config.includeObservability) {
        lines.push('    start_time = datetime.now()');
        lines.push('    logger.info(f"Executing example_tool: {input[:50]}...")');
    }
    if (config.includeSecurity) {
        lines.push('');
        lines.push('    sanitized = await security_layer.sanitize_input(input)');
        lines.push('    if not sanitized["safe"]:');
        if (config.includeObservability) {
            lines.push('        logger.warning("Security validation failed")');
        }
        lines.push('        raise ValueError(f"Security violation: {sanitized[\'reason\']}")');
        lines.push('');
        lines.push('    data = sanitized["data"]');
    }
    else {
        lines.push('    data = input');
    }
    lines.push('');
    lines.push('    result = await example_tool(data, format)');
    lines.push('');
    if (config.includeObservability) {
        lines.push('    duration = (datetime.now() - start_time).total_seconds()');
        lines.push('    record_tool_call("example_tool", duration, True)');
        lines.push('    logger.info(f"Completed in {duration:.3f}s")');
    }
    lines.push('    return result');
    lines.push('');
    lines.push('@mcp.tool()');
    lines.push('async def health_check() -> Dict[str, Any]:');
    lines.push('    """Check server health."""');
    lines.push('    return {');
    lines.push('        "status": "healthy",');
    lines.push('        "archestraCompatible": True,');
    if (config.includeSecurity)
        lines.push('        "securityLayer": "active",');
    if (config.includeObservability)
        lines.push('        "metricsEnabled": True,');
    lines.push('        "timestamp": datetime.now().isoformat()');
    lines.push('    }');
    return lines.join('\n');
}
