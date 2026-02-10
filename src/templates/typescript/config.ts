import { ProjectConfig } from './index';

export function generatePackageJson(config: ProjectConfig): string {
  const dependencies: Record<string, string> = {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "fastmcp": "^1.0.0",
    "zod": "^3.22.4",
    "dotenv": "^16.3.1"
  };

  const devDependencies: Record<string, string> = {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "eslint": "^8.56.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1"
  };

  if (config.includeObservability) {
    dependencies["prom-client"] = "^15.1.0";
    dependencies["winston"] = "^3.11.0";
  }

  if (config.includeSecurity) {
    dependencies["axios"] = "^1.6.2";
  }

  return JSON.stringify({
    "name": config.name,
    "version": "1.0.0",
    "description": config.description,
    "main": "dist/server.js",
    "type": "module",
    "scripts": {
      "build": "tsc",
      "start": "node dist/server.js",
      "dev": "tsx watch src/server.ts",
      "test": "jest",
      "lint": "eslint src/**/*.ts",
      "archestra:register": "node scripts/register-with-archestra.js",
      "archestra:validate": "node scripts/validate-security.js"
    },
    "keywords": ["mcp", "archestra", "ai", "server"],
    "author": config.author,
    "license": "MIT",
    "dependencies": dependencies,
    "devDependencies": devDependencies,
    "engines": {
      "node": ">=18.0.0"
    },
    "mcp": {
      "serverType": "stdio",
      "archestraCompatible": true,
      "securityLevel": config.includeSecurity ? "quarantine" : "standard",
      "observability": config.includeObservability
    }
  }, null, 2);
}

export function generateTsConfig(): string {
  return JSON.stringify({
    "compilerOptions": {
      "target": "ES2022",
      "module": "Node16",
      "lib": ["ES2022"],
      "moduleResolution": "Node16",
      "outDir": "./dist",
      "rootDir": "./src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true,
      "declaration": true,
      "declarationMap": true,
      "sourceMap": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "tests"]
  }, null, 2);
}
