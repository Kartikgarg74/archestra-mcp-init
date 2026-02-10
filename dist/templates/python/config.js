"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePyProjectToml = generatePyProjectToml;
exports.generateRequirements = generateRequirements;
function generatePyProjectToml(config) {
    const deps = [
        'fastmcp>=1.0.0',
        'pydantic>=2.0.0',
        'python-dotenv>=1.0.0'
    ];
    if (config.includeObservability) {
        deps.push('prometheus-client>=0.19.0', 'structlog>=24.1.0');
    }
    if (config.includeSecurity) {
        deps.push('requests>=2.31.0');
    }
    return `[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "${config.name}"
version = "1.0.0"
description = "${config.description}"
readme = "README.md"
requires-python = ">=3.9"
license = {text = "MIT"}
authors = [{name = "${config.author || 'Anonymous'}"}]
keywords = ["mcp", "archestra", "ai"]

dependencies = [
${deps.map(d => `    "${d}"`).join(',\n')}
]

[project.optional-dependencies]
dev = ["pytest>=7.4.0", "pytest-asyncio>=0.21.0", "black>=23.0.0", "mypy>=1.7.0"]

[project.scripts]
${config.name} = "src.server:main"

[tool.setuptools]
package-dir = {"" = "src"}
`;
}
function generateRequirements(config) {
    const lines = [
        'fastmcp>=1.0.0',
        'pydantic>=2.0.0',
        'python-dotenv>=1.0.0'
    ];
    if (config.includeObservability) {
        lines.push('prometheus-client>=0.19.0', 'structlog>=24.1.0');
    }
    if (config.includeSecurity) {
        lines.push('requests>=2.31.0');
    }
    lines.push('', '# Development', 'pytest>=7.4.0', 'black>=23.0.0', 'mypy>=1.7.0');
    return lines.join('\n');
}
