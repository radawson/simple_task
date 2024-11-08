const path = require('path');
const crypto = require('crypto');
const configSchema = require('./validation');

class Config {
  static #instance;
  #config;

  constructor() {
    if (Config.#instance) {
      return Config.#instance;
    }

    this.#config = this.#loadConfig();
    Object.freeze(this.#config);
    Config.#instance = this;
  }

  #loadConfig() {
    require('dotenv').config();

    const config = {
      env: process.env.NODE_ENV || 'development',
      serverUid: process.env.SERVER_UID || crypto.randomBytes(4).toString('hex'),
      database: {
        type: process.env.DB_TYPE || 'sqlite',
        database: process.env.DB_NAME || 'stasks',
        ...process.env.DB_TYPE === 'postgres' && {
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT),
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          ssl: process.env.DB_SSL === 'true'
        }
      },
      logger: {
        level: process.env.LOG_LEVEL || 'info',
        directory: path.join(__dirname, '../../logs'),
        maxFiles: '14d',
        format: process.env.LOG_FORMAT || 'json'
      },
      oidc: {
        enabled: process.env.ENABLE_SSO === 'true',
        issuerUrl: process.env.OIDC_ISSUER_URL,
        clientId: process.env.OIDC_CLIENT_ID,
        clientSecret: process.env.OIDC_CLIENT_SECRET,
        redirectUri: process.env.OIDC_REDIRECT_URI,
        postLogoutRedirectUri: process.env.OIDC_POST_LOGOUT_REDIRECT_URI,
        scope: process.env.OIDC_SCOPE || 'openid profile email',
        responseType: 'code',
        pkce: true,
        timeout: parseInt(process.env.OIDC_TIMEOUT) || 5000
      },
      security: {
        rateLimiting: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
          max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
        },
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
      },
      server: {
        port: parseInt(process.env.PORT) || 3000,
        sslPort: parseInt(process.env.SPORT) || 3003,
        sslKey: process.env.SSL_KEY_PATH,
        sslCert: process.env.SSL_CERT_PATH,
        cors: {
          origins: (process.env.CORS_ALLOWED_ORIGINS || '*').split(','),
          credentials: true
        }
      }
    };

    const { error } = configSchema.validate(config);
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }

    return config;
  }

  get() {
    return this.#config;
  }
}

module.exports = new Config().get();