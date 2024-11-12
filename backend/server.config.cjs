// server.config.cjs
const path = require('path');

module.exports = {
  apps: [{
    name: 'backend',
    script: './server.js',
    cwd: path.resolve(__dirname),
    env: {
      NODE_ENV: 'production'
    },
    // Load environment variables from the system
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: path.resolve(__dirname, 'logs/pm2/error.log'),
    out_file: path.resolve(__dirname, 'logs/pm2/out.log'),
    log_file: path.resolve(__dirname, 'logs/pm2/combined.log'),
    merge_logs: true,
    time: true,
    watch: false,
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    // Add startup checks
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 5000,
    // Add explicit paths for logs directory
    node_args: [
      '--experimental-modules',
      '--es-module-specifier-resolution=node'
    ],
    // Ensure directories exist
    pre_start: `mkdir -p ${path.resolve(__dirname, 'logs/pm2')}`
  }]
};