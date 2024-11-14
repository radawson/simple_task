// server.config.cjs
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const env = dotenv.config().parsed;

// Create PM2 config with environment variables
module.exports = {
  apps: [{
    name: 'backend',
    script: './server.js',
    cwd: path.resolve(__dirname),
    env_development: {
      ...env,
      NODE_ENV: 'development',
      FORCE_DB_SYNC: 'true',
      DB_TYPE: 'sqlite',
      PORT: '9179',
      SPORT: '9180'
    },
    env_production: {
      ...env,  // Spread all environment variables from .env
      NODE_ENV: 'production',
      // Ensure critical variables are set
      DB_TYPE: env.DB_TYPE || 'postgres',
      DB_HOST: env.DB_HOST || '127.0.0.1',
      DB_PORT: env.DB_PORT || '5432',
      DB_NAME: env.DB_NAME || 'stasks',
      DB_USER: env.DB_USER || 'stasks',
      PORT: env.PORT || '9179',
      SPORT: env.SPORT || '9180'
    },
    watch: false,
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    error_file: './logs/pm2/error.log',
    out_file: './logs/pm2/out.log',
    merge_logs: true,
    time: true,
    // Add startup checks
    wait_ready: true,
    listen_timeout: 3000,
    kill_timeout: 5000,
    node_args: [
      '--experimental-modules',
      '--es-module-specifier-resolution=node'
    ]
  }]
};