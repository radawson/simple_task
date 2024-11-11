// pm2 environmental config
module.exports = {
    apps: [{
      name: 'backend',
      script: './src/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 9180
      },
      watch: false,
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G'
    }]
  }
