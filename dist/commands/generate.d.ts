interface GenerateOptions {
    name?: string;
    language?: string;
    directory?: string;
    skipInstall?: boolean;
}
export declare function generateCommand(options: GenerateOptions): Promise<void>;
export {};
