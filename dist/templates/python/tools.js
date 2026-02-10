"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePythonExampleTool = generatePythonExampleTool;
function generatePythonExampleTool(config) {
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
`;
}
