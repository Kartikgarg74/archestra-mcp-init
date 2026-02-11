export function generateGitHubActionsCI(): string {
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
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v4

    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Build
      run: npm run build

    - name: Run tests
      run: npm run test

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Run Archestra security validation
      run: npm run archestra:validate

    - name: Check for vulnerabilities
      run: npm audit --audit-level=moderate

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

export function generateGitHubActionsCD(): string {
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

export function generateGitHubActionsRelease(): string {
  return `name: Release

on:
  push:
    tags: [ 'v*' ]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Create Release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: \${{ github.ref }}
        release_name: Release \${{ github.ref }}
        draft: false
        prerelease: false
`;
}
