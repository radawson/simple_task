// server.config.cjs
module.exports = {
  apps: [{
    name: 'backend',
    script: './server.js',
    env: {
      NODE_ENV: 'production'
    },
    // Load environment variables from the system
    env_production: {
      NODE_ENV: 'production'
    },
    watch: false,
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    // Add error handling
    error_file: './logs/pm2/error.log',
    out_file: './logs/pm2/out.log',
    time: true,
    // Add environment variable validation
    wait_ready: true,
    listen_timeout: 10000,
  }]
};