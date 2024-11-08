const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initWebSocket } = require('../services/websocket');

class Server {
  constructor(config) {
    this.config = config;
    this.app = express();
    this.logger = require('./Logger').getInstance();
    this.logger.debug(`Initializing server with config: ${JSON.stringify(config)}`);
  }

  async setupMiddleware() {
    this.logger.debug('Configuring middleware stack...');

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
    this.logger.debug('Configuring error handlers...');

    // 404 handler
    this.app.use((req, res, next) => {
      this.logger.warn(`404 Not Found: ${req.method} ${req.url}`);
      res.status(404).json({ error: 'Resource not found' });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      this.logger.error(`Server error processing ${req.method} ${req.url}`, {
        error: err.message,
        stack: err.stack,
        body: req.body,
        params: req.params,
        query: req.query,
        ip: req.ip
      });
      res.status(500).json({ error: 'Internal server error' });
    });

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
        initWebSocket(this.servers.https);
        this.logger.info(`HTTPS server listening on port ${this.config.sslPort}`);
      }
      
      if (this.servers.http) {
        initWebSocket(this.servers.http);
        this.logger.info(`HTTP server listening on port ${this.config.port}`);
      }
      
      this.logger.info('Server started successfully');
      return this.servers;
    } catch (error) {
      this.logger.error(`Failed to start server: ${error.message}`, { 
        stack: error.stack 
      });
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