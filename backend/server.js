const cors = require("cors");
const express = require("express");
const fs = require("fs");
const https = require("https");
const http = require("http");
const morgan = require("morgan");
const path = require('path');
const rfs = require("rotating-file-stream");
const config = require("./config");
const db = require('./database');
const { getLocalIp, getServerHostname, getAllCorsHosts } = require("./environment");
const { initWebSocket } = require('./websocket');
const logger = require('./logger');
const routes = require('./routes');

const { SSL_KEY_PATH, SSL_CERT_PATH, PORT, SPORT, LOG_LEVEL, CORS_ALLOWED_ORIGINS, STORAGE_PATH } = config;

const app = express();

// Set up request logging using morgan and winston
app.use(morgan('combined', { stream: logger.stream }));

// Add basic logging to show server startup
logger.info('Starting the server...');
logger.info(`Server started with log level: ${LOG_LEVEL}`);

// Read CORS configuration from `config`
const allowedOrigins = CORS_ALLOWED_ORIGINS ? CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : [];
logger.info(`Allowed CORS origins: ${JSON.stringify(allowedOrigins)}`);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`Blocked by CORS: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
};

// Apply CORS middleware globally
app.use(cors(corsOptions));
logger.info(`CORS configured with origins: ${JSON.stringify(allowedOrigins)}`);

// Manually add CORS headers for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // Send OK for preflight requests
  }
  next();
});

// Log configured origins for debugging
logger.info(`CORS configured with origins: ${JSON.stringify(allowedOrigins)}`);

// Logging HTTP requests using morgan and winston
app.use(morgan("combined", { stream: logger.stream }));
//CORS Debugging

// Middleware for parsing incoming requests
app.use(express.json());
logger.debug("Added middleware for parsing JSON requests.");

app.use(express.urlencoded({ extended: true }));
logger.debug("Added middleware for parsing URL-encoded requests.");

// Read SSL certificate and key from the provided file paths
let httpsOptions = {};
try {
  httpsOptions = {
    key: fs.readFileSync(SSL_KEY_PATH, 'utf8'),
    cert: fs.readFileSync(SSL_CERT_PATH, 'utf8'),
  };
  logger.info('Successfully read SSL certificates for HTTPS server.');
} catch (error) {
  logger.error('Failed to read SSL certificates:', error);
  process.exit(1);  // Exit if SSL setup fails
}

// Database Connection
db.connect()
  .then(() => {
    logger.info(`Successfully connected to ${process.env.DB_TYPE} database.`);
    if (db.mongoose) initialMongoRoles();  // Call MongoDB-specific initializations
  })
  .catch((err) => {
    logger.error("Database connection error: ", err);
    process.exit();
  });

// MongoDB-specific Role Initialization (if using MongoDB)
function initialMongoRoles() {
  const Role = require('./models/role.model');  // Load MongoDB Role model
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      Role.ROLES.forEach(roleName => {
        makeMongoRole(roleName);
      });
    }
  });
}

function makeMongoRole(name) {
  new (require('./models/role.model'))({ name })
    .save(err => {
      if (err) {
        logger.error("Error creating role: %s", err);
      } else {
        logger.info(`Added '${name}' to roles collection`);
      }
    });
}

// Initialize HTTPS and HTTP servers
const httpsServer = https.createServer(httpsOptions, app).listen(SPORT, () => {
  logger.info(`Server is running HTTPS on port ${SPORT}`);
});

// Use your routes
app.use('/api', routes);

// Initialize WebSocket for HTTPS server but DON'T call listen() here
initWebSocket(httpsServer);

// Optional: In dev mode, create HTTP server and call listen on it once
if (process.env.NODE_ENV === 'dev') {
  const httpServer = http.createServer(app);
  initWebSocket(httpServer); // Initialize WebSocket for HTTP server
  httpServer.listen(PORT, () => {
    logger.info(`Server is running HTTP on port ${PORT}`);
  });
}
