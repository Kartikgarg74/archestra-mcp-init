#!/usr/bin/env python3
import os
import asyncio
from datetime import datetime
from typing import Any, Dict, Optional
from dotenv import load_dotenv
from fastmcp import FastMCP
from pydantic import BaseModel, Field
from src.security.archestra_security import ArchestraSecurityLayer, security_layer
from src.observability.metrics import start_metrics_server, record_tool_call
from src.observability.logger import logger
from src.tools.example_tool import example_tool

load_dotenv()

mcp = FastMCP(
    name="test-py-docker",
    version="1.0.0",
    description="An Archestra-native MCP server"
)

security_layer = ArchestraSecurityLayer(
    quarantine_mode=True,
    audit_log_enabled=True
)

start_metrics_server(port=9090)


@mcp.tool()
async def example_tool_endpoint(input: str, format: str = "json") -> Dict[str, Any]:
    """An example tool demonstrating Archestra patterns."""
    start_time = datetime.now()
    logger.info(f"Executing example_tool: {input[:50]}...")

    sanitized = await security_layer.sanitize_input(input)
    if not sanitized["safe"]:
        logger.warning("Security validation failed")
        raise ValueError(f"Security violation: {sanitized['reason']}")

    data = sanitized["data"]

    result = await example_tool(data, format)

    duration = (datetime.now() - start_time).total_seconds()
    record_tool_call("example_tool", duration, True)
    logger.info(f"Completed in {duration:.3f}s")
    return result

@mcp.tool()
async def health_check() -> Dict[str, Any]:
    """Check server health."""
    return {
        "status": "healthy",
        "archestraCompatible": True,
        "securityLayer": "active",
        "metricsEnabled": True,
        "timestamp": datetime.now().isoformat()
    }

def main():
    logger.info("test-py-docker started")
    mcp.run()

if __name__ == "__main__":
    main()
