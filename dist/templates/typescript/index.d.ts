export interface ProjectConfig {
    name: string;
    description: string;
    author: string;
    includeObservability: boolean;
    includeSecurity: boolean;
}
export declare function generateTypeScriptProject(projectPath: string, config: ProjectConfig): Promise<void>;
