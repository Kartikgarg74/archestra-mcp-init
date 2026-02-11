export function generatePythonGitHubActionsCI(): string {
  return `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.9', '3.10', '3.11', '3.12']

    steps:
    - uses: actions/checkout@v4

    - name: Set up Python \${{ matrix.python-version }}
      uses: actions/setup-python@v5
      with:
        python-version: \${{ matrix.python-version }}

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install -e ".[dev]"

    - name: Lint with black
      run: black --check src/

    - name: Type check with mypy
      run: mypy src/

    - name: Test with pytest
      run: pytest

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        pip install bandit safety

    - name: Run security linter (bandit)
      run: bandit -r src/

    - name: Check for vulnerable dependencies
      run: safety check -r requirements.txt

  docker-build:
    runs-on: ubuntu-latest
    needs: test
    steps:
    - uses: actions/checkout@v4

    - name: Build Docker image
      run: docker build -t mcp-server:\${{ github.sha }} .

    - name: Test Docker image
      run: |
        docker run -d --name test-server -p 9090:9090 mcp-server:\${{ github.sha }}
        sleep 5
        curl -f http://localhost:9090/health || exit 1
        docker stop test-server
`;
}

export function generatePythonGitHubActionsCD(): string {
  return `name: CD

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')

    steps:
    - uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Login to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: \${{ github.actor }}
        password: \${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ghcr.io/\${{ github.repository }}/mcp-server

    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: \${{ steps.meta.outputs.tags }}
        labels: \${{ steps.meta.outputs.labels }}

    - name: Register with Archestra
      run: |
        curl -X POST https://api.archestra.ai/v1/registry/servers \\
          -H "Authorization: Bearer \${{ secrets.ARCHESTRA_API_KEY }}" \\
          -H "Content-Type: application/json" \\
          -d '{
            "name": "\${{ github.event.repository.name }}",
            "version": "\${{ github.ref_name }}",
            "image": "ghcr.io/\${{ github.repository }}/mcp-server:\${{ github.ref_name }}",
            "security": { "quarantineMode": true }
          }'
`;
}

export function generatePythonGitHubActionsRelease(): string {
  return `name: Release

on:
  push:
    tags: [ 'v*' ]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'

    - name: Install build dependencies
      run: pip install build twine

    - name: Build package
      run: python -m build

    - name: Create Release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: \${{ github.ref }}
        release_name: Release \${{ github.ref }}
        draft: false
        prerelease: false

    - name: Publish to PyPI (optional)
      if: false  # Set to true and add PYPI_API_TOKEN secret to enable
      run: twine upload dist/*
      env:
        TWINE_USERNAME: __token__
        TWINE_PASSWORD: \${{ secrets.PYPI_API_TOKEN }}
`;
}
