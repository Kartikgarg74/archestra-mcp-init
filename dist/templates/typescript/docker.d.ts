export declare function generateDockerfile(config: {
    includeObservability: boolean;
}): string;
export declare function generateDockerCompose(config: {
    includeObservability: boolean;
    includeSecurity: boolean;
}): string;
export declare function generateDockerIgnore(): string;
export declare function generatePrometheusConfig(): string;
