export declare function generatePythonDockerfile(config: {
    includeObservability: boolean;
}): string;
export declare function generatePythonDockerCompose(config: {
    includeObservability: boolean;
    includeSecurity: boolean;
}): string;
export declare function generatePythonDockerIgnore(): string;
export declare function generatePythonPrometheusConfig(): string;
