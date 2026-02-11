import aiohttp
from typing import Dict, Any
from src.security.archestra_security import security_layer
from src.observability.metrics import record_tool_call

async def fetchData_tool(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """A custom MCP tool"""
    import time
    start_time = time.time()

    url = input_data.get("url")

    check = await security_layer.sanitize_input(str(url))
    if not check["safe"]:
        raise ValueError("Invalid URL")

    # TODO: Implement API call logic

    record_tool_call("fetch_data", time.time() - start_time, True)

    return {"success": True}
