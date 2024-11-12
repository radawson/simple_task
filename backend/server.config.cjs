// server.config.cjs
// PM2 configuration file for the backend service
module.exports = {
  apps: [{
    name: 'backend',
    script: './server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 9180
    },
    watch: false,
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G'
  }]
};
