//src/config/types.ts
export interface DatabaseConfig {
    type: 'sqlite' | 'postgres';
    host?: string;
    port?: number;
    database: string;
    username?: string;
    password?: string;
    ssl?: boolean;
  }
  
  export interface LoggerConfig {
    level: string;
    directory: string;
    maxFiles: string;
    format: string;
  }
  
  export interface ServerConfig {
    port: number;
    sslPort: number;
    sslKey: string;
    sslCert: string;
    cors: {
      origins: string[];
      credentials: boolean;
    };
  }
  
  export interface Config {
    env: string;
    serverUid: string;
    database: DatabaseConfig;
    logger: LoggerConfig;
    server: ServerConfig;
  }