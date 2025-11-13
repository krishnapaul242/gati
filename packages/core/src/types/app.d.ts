export interface AppConfig {
    port?: number;
    host?: string;
    timeout?: number;
    logging?: boolean;
}
export interface GatiApp {
    listen(): Promise<void>;
    close(): Promise<void>;
}
