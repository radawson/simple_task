//src/core/Server.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Logger from './Logger.js';
import { errorHandler, notFound } from '../middleware/error.middleware.js';

class Server {
    constructor(config) {
        if (!config || !config.server) {
            throw new Error('Server configuration is required');
        }

        this.config = config;
        this.app = express();
        this.logger = Logger.getInstance();

        // Debug config structure
        this.logger.debug('Server initialized with config:', {
            port: this.config.server.port,
            sslPort: this.config.server.sslPort,
            hasSSLKey: !!this.config.server.sslKey,
            hasSSLCert: !!this.config.server.sslCert,
            corsOrigins: this.config.server.cors?.origins || [],
            hasSecurityConfig: !!this.config.security
        });

        // Set default security config if not provided
        if (!this.config.security || !this.config.security.helmet) {
            this.logger.warn('Missing security.helmet configuration, using defaults');
            this.config.security = {
                ...this.config.security,
                helmet: {
                    contentSecurityPolicy: {
                        directives: {
                            defaultSrc: ["'self'"],
                            scriptSrc: ["'self'", "'unsafe-inline'"],
                            styleSrc: ["'self'", "'unsafe-inline'"],
                            imgSrc: ["'self'", "data:", "https:"],
                        }
                    }
                }
            };
        }
        // Configure proxy trust based on config
        if (config.server.proxy.trust !== undefined) {
            this.app.set('trust proxy', config.server.proxy.trust);
            this.logger.info('Proxy trust configured:', {
                trustSetting: config.server.proxy.trust,
                trustedIPs: config.server.proxy.proxyIPs
            });
        }

    }

    async loadTrustedCertificates(trustPath) {
        try {
            const files = await fs.readdir(trustPath);
            const certFiles = files.filter(file =>
                file.endsWith('.crt') ||
                file.endsWith('.pem') ||
                file.endsWith('.cer')
            );

            for (const certFile of certFiles) {
                try {
                    await certUtil.addTrustedRoot(join(trustPath, certFile));
                    this.logger.info(`Loaded trusted certificate: ${certFile}`);
                } catch (error) {
                    this.logger.warn(`Failed to load trusted certificate ${certFile}: ${error.message}`);
                }
            }

            this.logger.info(`Loaded ${certFiles.length} trusted certificates`);
        } catch (error) {
            this.logger.warn(`Failed to load trusted certificates from ${trustPath}: ${error.message}`);
        }
    }

    // Update setupMiddleware:
    async setupMiddleware() {
        this.logger.debug('Configuring middleware stack...');

        // Security middleware with fallback
        const helmetConfig = this.config.security?.helmet || {};
        this.logger.debug('Using helmet config:', JSON.stringify(helmetConfig));

        this.app.use(helmet(helmetConfig));
        this.logger.debug('Helmet security headers configured');

        const limiter = rateLimit(this.config.security.rateLimiting);
        this.app.use('/api', limiter);
        this.logger.debug('Rate limiting configured');

        // Morgan HTTP request logging
        this.app.use(morgan('combined', {
            stream: this.logger.stream,
            skip: (req) => req.url === '/health'  // Skip health check logging
        }));
        this.logger.debug('HTTP request logging configured');

        // CORS setup
        const { createCorsMiddleware } = await import('../config/cors.config.js');
        const corsOptions = createCorsMiddleware(this.config);
        this.app.use(cors(corsOptions));

        this.logger.debug('CORS configured:', {
            origins: this.config.server.cors.origins,
            credentials: this.config.server.cors.credentials
        });

        // Request parsing
        this.app.use(express.json({
            limit: '10mb',
            verify: (req, res, buf) => {
                req.rawBody = buf.toString();
            }
        }));
        this.app.use(express.urlencoded({ extended: true }));
        this.logger.debug('Request body parsers configured');
    }

    async setupRoutes() {
        this.logger.debug('Loading API routes...');

        try {
            // Only create socketService if we have HTTPS server
            if (this.servers?.https) {
                const { default: SocketService } = await import('../services/socket.service.js');
                this.socketService = new SocketService(this.servers.https, this.config);
                this.logger.info('WebSocket service initialized');
            } else {
                this.logger.warn('HTTPS server not available, WebSocket service disabled');
            }

            // Initialize routes with socket service
            const { default: createRouter } = await import('../routes/index.js');
            const router = createRouter(this.socketService);

            // Mount routes
            this.app.use('/', router);

            this.logger.info('API routes mounted successfully');
        } catch (error) {
            this.logger.error('Failed to setup routes:', error);
            throw error;
        }
    }

    async setupErrorHandling() {
        // Error handlers are already imported at the top
        this.app.use(notFound);
        this.app.use(errorHandler);
        this.logger.debug('Error handlers configured');
    }

    async initialize() {
        this.logger.info('Beginning server initialization...');

        try {
            await this.setupMiddleware();
            await this.setupRoutes();
            await this.setupErrorHandling();

            this.logger.info('Server initialization completed successfully');
            return this;
        } catch (error) {
            this.logger.error(`Server initialization failed: ${error.message}`, {
                stack: error.stack
            });
            throw error;
        }
    }

    async start() {
        this.logger.info('Starting server...');

        try {
            const { createServers } = await import('../config/server.config.js');
            this.servers = await createServers(this.app, {
                port: this.config.server.port,
                sslPort: this.config.server.sslPort,
                sslKey: this.config.server.sslKey,
                sslCert: this.config.server.sslCert
            });

            if (this.servers.https) {
                const { default: SocketService } = await import('../services/socket.service.js');
                this.socketService = new SocketService(this.servers.https, this.config);
                this.logger.info('WebSocket service initialized');

                if (this.config.chat?.enabled) {
                    const { default: ChatService } = await import('../services/chat.service.js');
                    this.chatService = new ChatService(this.servers.https, this.config);
                    this.logger.info('Chat service initialized');
                }

                this.logger.info(`HTTPS/WSS server listening on port ${this.config.server.sslPort}`);
            }

            return this.servers;
        } catch (error) {
            this.logger.error('Failed to start server:', {
                error: error.message,
                config: {
                    port: this.config.server?.port,
                    sslPort: this.config.server?.sslPort,
                    hasSSLKey: !!this.config.server?.sslKey,
                    hasSSLCert: !!this.config.server?.sslCert
                }
            });
            throw error;
        }
    }

    async stop() {
        if (!this.servers) {
            this.logger.warn('No servers to stop');
            return;
        }

        try {
            await Promise.all(
                Object.entries(this.servers).map(([type, server]) => {
                    return new Promise((resolve) => {
                        if (server && server.close) {
                            server.close(() => {
                                this.logger.info(`${type.toUpperCase()} server closed`);
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    });
                })
            );
        } catch (error) {
            this.logger.error(`Error during server shutdown: ${error.message}`);
        }
    }
}

export { Server };  // Named export for the class itself
export default Server;  // Default export for consistency with existing code