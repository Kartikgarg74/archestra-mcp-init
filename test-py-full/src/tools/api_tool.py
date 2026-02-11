"""
API Call Tool

Makes HTTP requests to external APIs with Archestra security validation.
"""

import aiohttp
from typing import Dict, Any, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field
from src.security.archestra_security import security_layer
from src.observability.metrics import record_tool_call
from src.observability.logger import logger

class ApiInput(BaseModel):
    url: str = Field(..., description="API endpoint URL")
    method: Literal["GET", "POST", "PUT", "DELETE"] = Field(default="GET", description="HTTP method")
    headers: Optional[Dict[str, str]] = Field(default=None, description="Request headers")
    body: Optional[str] = Field(default=None, description="Request body (JSON string)")
    timeout: int = Field(default=30, description="Request timeout in seconds")

class ApiOutput(BaseModel):
    status: int
    data: Any
    headers: Dict[str, str]
    duration: float

async def api_call_tool(input_data: ApiInput) -> Dict[str, Any]:
    """Make HTTP request with security validation."""
    url = input_data.url
    method = input_data.method
    headers = input_data.headers or {}
    body = input_data.body
    timeout = input_data.timeout

    start_time = datetime.now()
    logger.info(f"Making API call to: {url}")

    # Validate URL to prevent SSRF
    url_check = await security_layer.sanitize_input(str(url))
    if not url_check["safe"]:
        logger.warning("URL failed security validation")
        raise ValueError(f"Invalid URL: {url_check.get('reason')}")
    safe_url = url_check["data"]

    async with aiohttp.ClientSession() as session:
        try:
            async with session.request(
                method=method,
                url=safe_url,
                headers={"Content-Type": "application/json", **headers},
                data=body,
                timeout=aiohttp.ClientTimeout(total=timeout)
            ) as response:
                data = await response.json()

    duration = (datetime.now() - start_time).total_seconds()
    record_tool_call("api_call", duration, True)
    logger.info(f"API call completed in {duration:.3f}s")

                return {
                    "status": response.status,
                    "data": data,
                    "headers": dict(response.headers),
                    "duration": 0.0
                }
        except Exception as e:
            raise ValueError(f"API call failed: {str(e)}")

# Schema for MCP registration
api_tool_schema = {
    "name": "api_call",
    "description": "Make HTTP requests to external APIs with security validation"
}
