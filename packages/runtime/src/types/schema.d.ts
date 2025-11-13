export interface StateSchema {
    [key: string]: 'string' | 'number' | 'boolean' | 'object' | 'array';
}
export interface ModuleSchema {
    [moduleName: string]: {
        [method: string]: {
            params?: Record<string, string>;
            returns?: string;
        };
    };
}
export interface TypeSchema {
    state?: StateSchema;
    modules?: ModuleSchema;
    refs?: {
        sessionId?: string;
        userId?: string;
        tenantId?: string;
        [key: string]: string | undefined;
    };
}
export declare function generateTypes(schema: TypeSchema): string;
