const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

class Server {
    constructor(config) {
        this.config = config;
        this.app = express();
        this.logger = require('./Logger').getInstance();

        // Debug config structure
        this.logger.debug('Full config:', JSON.stringify({
            security: this.config.security,
            cors: this.config.cors
        }, null, 2));

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
        const corsOptions = {
            origin: (origin, callback) => {
                if (!origin || this.config.cors.origins.includes(origin)) {
                    this.logger.debug(`CORS request accepted from: ${origin || 'Same-Origin'}`);
                    callback(null, true);
                } else {
                    this.logger.warn(`CORS request rejected from: ${origin}`);
                    callback(new Error(`CORS rejected for origin: ${origin}`));
                }
            },
            credentials: this.config.cors.credentials
        };
        this.app.use(cors(corsOptions));
        this.logger.debug(`CORS configured with origins: ${JSON.stringify(this.config.cors.origins)}`);

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
        const routes = require('../routes');
        this.app.use('/api', routes);
        this.logger.info('API routes mounted successfully');
    }

    async setupErrorHandling() {
        const { errorHandler, notFound } = require('../middleware/error.middleware');

        // Handle 404s
        this.app.use(notFound);

        // Central error handler
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
            const { createServers } = require('../config/server.config');
            this.servers = await createServers(this.app, this.config);
    
            if (this.servers.https) {
                const SocketService = require('../services/socket.service');
                const ChatService = require('../services/chat.service');  // Add import
                
                this.socketService = new SocketService(this.servers.https, this.config);
                
                // Only initialize chat if configured
                if (this.config.chat?.enabled) {
                    this.chatService = new ChatService(this.servers.https, this.config);
                    this.logger.info('Chat service initialized');
                }
                
                this.logger.info(`HTTPS/WSS server listening on port ${this.config.sslPort}`);
            }
    
            return this.servers;
        } catch (error) {
            this.logger.error(`Failed to start server: ${error.message}`);
            throw error;
        }
    }

    async stop() {
        this.logger.info('Initiating server shutdown...');

        try {
            await Promise.all(
                Object.entries(this.servers).map(([type, server]) => {
                    return new Promise((resolve) => {
                        server.close(() => {
                            this.logger.info(`${type.toUpperCase()} server closed`);
                            resolve();
                        });
                    });
                })
            );
            this.logger.info('Server shutdown completed');
        } catch (error) {
            this.logger.error(`Error during server shutdown: ${error.message}`, {
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = Server;