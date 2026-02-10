export function generatePythonMetricsModule(): string {
  return `"""
Archestra Observability - Metrics (Python)
"""

from prometheus_client import Counter, Histogram, Gauge, start_http_server
import threading

tool_call_counter = Counter(
    'mcp_tool_calls_total',
    'Total tool calls',
    ['tool_name', 'status']
)

tool_call_duration = Histogram(
    'mcp_tool_call_duration_seconds',
    'Tool call duration',
    ['tool_name'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0]
)

def start_metrics_server(port: int = 9090):
    """Start Prometheus metrics server."""
    def serve():
        start_http_server(port)

    thread = threading.Thread(target=serve, daemon=True)
    thread.start()

def record_tool_call(tool_name: str, duration: float, success: bool):
    """Record a tool call metric."""
    status = "success" if success else "failure"
    tool_call_counter.labels(tool_name=tool_name, status=status).inc()
    tool_call_duration.labels(tool_name=tool_name).observe(duration)
`;
}

export function generatePythonLoggerModule(): string {
  return `"""
Archestra Observability - Logging (Python)
"""

import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "service": "mcp-server"
        }
        return json.dumps(log_entry)

def setup_logging(level: str = "INFO"):
    logger = logging.getLogger("archestra_mcp")
    logger.setLevel(getattr(logging, level.upper()))

    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)

    return logger

logger = setup_logging()
`;
}
