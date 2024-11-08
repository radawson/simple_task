const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initWebSocket } = require('../services/websocket');

class Server {
  constructor(config) {
    this.config = config;
    this.app = express();
    this.logger = require('./Logger').getInstance();
  }

  async setupMiddleware() {
    // Logging
    this.app.use(morgan('combined', { stream: this.logger.stream }));
    
    // CORS
    const corsOptions = {
      origin: (origin, callback) => {
        if (!origin || this.config.cors.origins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: this.config.cors.credentials
    };
    this.app.use(cors(corsOptions));

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  async setupRoutes() {
    const routes = require('../routes');
    this.app.use('/api', routes);
  }

  async setupErrorHandling() {
    this.app.use((err, req, res, next) => {
      this.logger.error(err.stack);
      res.status(500).send('Something broke!');
    });
  }

  async initialize() {
    await this.setupMiddleware();
    await this.setupRoutes();
    await this.setupErrorHandling();
    return this;
  }

  async start() {
    const { createServers } = require('../config/server.config');
    this.servers = await createServers(this.app, this.config);
    
    // Initialize WebSocket for both servers if they exist
    if (this.servers.https) {
      initWebSocket(this.servers.https);
    }
    if (this.servers.http) {
      initWebSocket(this.servers.http);
    }
    
    return this.servers;
  }

  async stop() {
    Object.values(this.servers).forEach(server => {
      server.close();
    });
  }
}

module.exports = Server;