interface AddToolOptions {
    name?: string;
    template?: string;
    language?: string;
}
export declare function addToolCommand(options: AddToolOptions): Promise<void>;
export {};
