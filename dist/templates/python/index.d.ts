export interface PythonProjectConfig {
    name: string;
    description: string;
    author: string;
    includeObservability: boolean;
    includeSecurity: boolean;
}
export declare function generatePythonProject(projectPath: string, config: PythonProjectConfig): Promise<void>;
