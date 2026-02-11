"""
File Operations Tool

Read and write files with Archestra security validation.
"""

import os
import base64
from pathlib import Path
from typing import Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field
from src.security.archestra_security import security_layer
from src.observability.metrics import record_tool_call
from src.observability.logger import logger

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

    start_time = datetime.now()
    logger.info(f"Reading file: {file_path}")

    # Validate file path to prevent directory traversal
    path_check = await security_layer.sanitize_input(file_path)
    if not path_check["safe"] or ".." in path_check["data"]:
        logger.warning("File path failed security validation")
        raise ValueError(f"Invalid file path: {path_check.get('reason', 'Directory traversal detected')}")
    safe_path = path_check["data"]

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

    duration = (datetime.now() - start_time).total_seconds()
    record_tool_call("file_read", duration, True)
    logger.info(f"File read completed in {duration:.3f}s")

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

    start_time = datetime.now()
    logger.info(f"Writing file: {file_path}")

    # Validate file path to prevent directory traversal
    path_check = await security_layer.sanitize_input(file_path)
    if not path_check["safe"] or ".." in path_check["data"]:
        logger.warning("File path failed security validation")
        raise ValueError(f"Invalid file path: {path_check.get('reason', 'Directory traversal detected')}")
    safe_path = path_check["data"]

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

    duration = (datetime.now() - start_time).total_seconds()
    record_tool_call("file_write", duration, True)
    logger.info(f"File read completed in {duration:.3f}s")

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
