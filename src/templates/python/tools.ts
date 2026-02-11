import { PythonProjectConfig } from './index';

export function generatePythonExampleTool(config: PythonProjectConfig): string {
  return `"""
Example Tool Implementation
"""

from typing import Dict, Any, Optional
from datetime import datetime

async def example_tool(input_data: str, format: str = "json") -> Dict[str, Any]:
    """
    Process input data and return formatted result.
    """
    processed = input_data.upper()

    return {
        "result": processed,
        "metadata": {
            "processed_at": datetime.now().isoformat(),
            "input_length": len(input_data),
            "output_length": len(processed),
            "format": format
        }
    }

async def data_enrichment_tool(data: Dict[str, Any]) -> Dict[str, Any]:
    """Enrich data with additional context."""
    data["_enriched"] = True
    data["_enriched_at"] = datetime.now().isoformat()
    return data

async def analysis_tool(query: str) -> Dict[str, Any]:
    """Analyze a query and return insights."""
    return {
        "analyzed": True,
        "query": query,
        "insights": [],
        "timestamp": datetime.now().isoformat()
    }
`;
}

export function generatePythonApiTool(config: PythonProjectConfig): string {
  const securityImport = config.includeSecurity
    ? 'from src.security.archestra_security import security_layer'
    : '';
  const observabilityImport = config.includeObservability
    ? 'from src.observability.metrics import record_tool_call\nfrom src.observability.logger import logger'
    : '';

  const securityCheck = config.includeSecurity
    ? `    # Validate URL to prevent SSRF
    url_check = await security_layer.sanitize_input(str(url))
    if not url_check["safe"]:
        ${config.includeObservability ? 'logger.warning("URL failed security validation")' : 'print("Security validation failed")'}
        raise ValueError(f"Invalid URL: {url_check.get('reason')}")
    safe_url = url_check["data"]`
    : '    safe_url = str(url)';

  const observabilityStart = config.includeObservability
    ? `    start_time = datetime.now()
    logger.info(f"Making API call to: {url}")`
    : '';

  const observabilityEnd = config.includeObservability
    ? `    duration = (datetime.now() - start_time).total_seconds()
    record_tool_call("api_call", duration, True)
    logger.info(f"API call completed in {duration:.3f}s")`
    : '';

  return `"""
API Call Tool

Makes HTTP requests to external APIs with Archestra security validation.
"""

import aiohttp
from typing import Dict, Any, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field
${securityImport}
${observabilityImport}

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

${observabilityStart}

${securityCheck}

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

${observabilityEnd}

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
`;
}

export function generatePythonFileTool(config: PythonProjectConfig): string {
  const securityImport = config.includeSecurity
    ? 'from src.security.archestra_security import security_layer'
    : '';
  const observabilityImport = config.includeObservability
    ? 'from src.observability.metrics import record_tool_call\nfrom src.observability.logger import logger'
    : '';

  const securityCheckRead = config.includeSecurity
    ? `    # Validate file path to prevent directory traversal
    path_check = await security_layer.sanitize_input(file_path)
    if not path_check["safe"] or ".." in path_check["data"]:
        ${config.includeObservability ? 'logger.warning("File path failed security validation")' : 'print("Security validation failed")'}
        raise ValueError(f"Invalid file path: {path_check.get('reason', 'Directory traversal detected')}")
    safe_path = path_check["data"]`
    : '    safe_path = file_path';

  const observabilityStart = config.includeObservability
    ? `    start_time = datetime.now()
    logger.info(f"Reading file: {file_path}")`
    : '';

  const observabilityEnd = config.includeObservability
    ? `    duration = (datetime.now() - start_time).total_seconds()
    record_tool_call("file_read", duration, True)
    logger.info(f"File read completed in {duration:.3f}s")`
    : '';

  return `"""
File Operations Tool

Read and write files with Archestra security validation.
"""

import os
import base64
from pathlib import Path
from typing import Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field
${securityImport}
${observabilityImport}

class ReadFileInput(BaseModel):
    file_path: str = Field(..., description="Path to the file")
    encoding: Literal["utf8", "base64"] = Field(default="utf8", description="File encoding")

class WriteFileInput(BaseModel):
    file_path: str = Field(..., description="Path to the file")
    content: str = Field(..., description="Content to write")
    encoding: Literal["utf8", "base64"] = Field(default="utf8", description="File encoding")

async def read_file_tool(input_data: ReadFileInput) -> Dict[str, Any]:
    """Read file with security validation."""
    file_path = input_data.file_path
    encoding = input_data.encoding

${observabilityStart}

${securityCheckRead}

    try:
        path = Path(safe_path)

        if not path.exists():
            raise FileNotFoundError(f"File not found: {safe_path}")

        mode = "rb" if encoding == "base64" else "r"
        with open(path, mode) as f:
            content = f.read()

        if encoding == "base64" and isinstance(content, bytes):
            content = base64.b64encode(content).decode("utf8")

        file_size = path.stat().st_size

${observabilityEnd}

        return {
            "content": content,
            "size": file_size,
            "encoding": encoding
        }
    except Exception as e:
        raise ValueError(f"Failed to read file: {str(e)}")

async def write_file_tool(input_data: WriteFileInput) -> Dict[str, Any]:
    """Write file with security validation."""
    file_path = input_data.file_path
    content = input_data.content
    encoding = input_data.encoding

${observabilityStart.replace("Reading", "Writing").replace("file_read", "file_write")}

${securityCheckRead.replace("file_path", "file_path")}

    try:
        path = Path(safe_path)

        # Create parent directories
        path.parent.mkdir(parents=True, exist_ok=True)

        mode = "wb" if encoding == "base64" else "w"

        if encoding == "base64":
            content_bytes = base64.b64decode(content)
            with open(path, mode) as f:
                f.write(content_bytes)
        else:
            with open(path, mode, encoding="utf8") as f:
                f.write(content)

        file_size = path.stat().st_size

${observabilityEnd.replace("file_read", "file_write")}

        return {
            "success": True,
            "size": file_size,
            "path": str(path.absolute())
        }
    except Exception as e:
        raise ValueError(f"Failed to write file: {str(e)}")

file_tools_schema = {
    "read": {
        "name": "file_read",
        "description": "Read file contents with security validation"
    },
    "write": {
        "name": "file_write",
        "description": "Write content to file with security validation"
    }
}
`;
}

export function generatePythonDatabaseTool(config: PythonProjectConfig): string {
  const observabilityImport = config.includeObservability
    ? 'from src.observability.metrics import record_tool_call\nfrom src.observability.logger import logger'
    : '';

  const observabilityStart = config.includeObservability
    ? `    start_time = datetime.now()
    logger.info("Executing database query")`
    : '';

  const observabilityEnd = config.includeObservability
    ? `    duration = (datetime.now() - start_time).total_seconds()
    record_tool_call("database_query", duration, True)
    logger.info(f"Query completed in {duration:.3f}s")`
    : '';

  return `"""
Database Query Tool (Template)

Execute database queries with parameterization and validation.
NOTE: Install your database driver (psycopg2, pymysql, etc.) and configure connection.
"""

from typing import Dict, Any, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field
${observabilityImport}

# TODO: Install and import your database driver
# import asyncpg

class QueryInput(BaseModel):
    query: str = Field(..., description="SQL query (use parameterized queries)")
    params: Optional[List[Any]] = Field(default=None, description="Query parameters")
    timeout: int = Field(default=30, description="Query timeout in seconds")

class QueryOutput(BaseModel):
    rows: List[Dict[str, Any]]
    row_count: int
    duration: float

# TODO: Configure your database connection
# DATABASE_URL = os.getenv("DATABASE_URL")
# pool = None

# async def init_db():
#     global pool
#     pool = await asyncpg.create_pool(DATABASE_URL)

async def database_query_tool(input_data: QueryInput) -> Dict[str, Any]:
    """Execute database query with validation."""
    query = input_data.query
    params = input_data.params or []
    timeout = input_data.timeout

${observabilityStart}

    # Validate query type (prevent destructive operations if needed)
    forbidden_keywords = ["DROP", "TRUNCATE", "DELETE FROM"]
    upper_query = query.upper()

    for keyword in forbidden_keywords:
        if keyword in upper_query:
            raise ValueError(f"Query contains forbidden keyword: {keyword}")

    try:
        # TODO: Implement actual database query
        # async with pool.acquire() as conn:
        #     result = await conn.fetch(query, *params, timeout=timeout)

        # Placeholder implementation
        result = []

${observabilityEnd}

        return {
            "rows": [dict(row) for row in result] if result else [],
            "row_count": len(result),
            "duration": 0.0
        }
    except Exception as e:
        raise ValueError(f"Database query failed: {str(e)}")

database_tool_schema = {
    "name": "database_query",
    "description": "Execute database queries with validation (configure connection first)"
}
`;
}

export function generatePythonToolsInit(config: PythonProjectConfig): string {
  const imports = ['from .example_tool import example_tool, data_enrichment_tool, analysis_tool'];
  const all_exports = [
    '"example_tool"',
    '"data_enrichment_tool"',
    '"analysis_tool"'
  ];

  if (config.includeSecurity || config.includeObservability) {
    imports.push('from .api_tool import api_call_tool, api_tool_schema');
    imports.push('from .file_tool import read_file_tool, write_file_tool, file_tools_schema');
    imports.push('from .database_tool import database_query_tool, database_tool_schema');

    all_exports.push(
      '"api_call_tool"',
      '"api_tool_schema"',
      '"read_file_tool"',
      '"write_file_tool"',
      '"file_tools_schema"',
      '"database_query_tool"',
      '"database_tool_schema"'
    );
  }

  return `${imports.join('\n')}

__all__ = [${all_exports.join(', ')}]
`;
}
