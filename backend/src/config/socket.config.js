//src/config/socket.config.js
module.exports = {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
    },
    fcm: {
      serviceAccount: require('./firebase-service-account.json'),
      projectId: process.env.FIREBASE_PROJECT_ID
    },
    security: {
      allowedOrigins: process.env.ALLOWED_ORIGINS.split(','),
      maxMessageSize: 1024 * 1024, // 1MB
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      }
    }
  }