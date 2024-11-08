const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables from .env
const result = dotenv.config();
if (result.error) {
  throw result.error;
}

const { parsed: envs } = result;

// File path for the .env file
const envFilePath = path.resolve(__dirname, '.env');

// Helper function to generate a short UID
function generateUID(length = 8) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

// Ensure UID is set in the config
if (!envs.SERVER_UID) {
  // Generate a new UID
  const newUID = generateUID();

  // Add SERVER_UID to environment variables
  envs.SERVER_UID = newUID;

  // Persist the new UID to the .env file
  try {
    fs.appendFileSync(envFilePath, `\nSERVER_UID=${newUID}\n`);
    console.log(`Generated new SERVER_UID: ${newUID}`);
  } catch (error) {
    console.error('Failed to write SERVER_UID to .env file:', error);
  }
}

// Combine envs with direct references and custom logic
module.exports = {
  ...envs,  // Spread the parsed variables
  HOST: process.env.HOST || 'localhost',
  DB_TYPE: process.env.DB_TYPE || 'mongodb',  // Default to MongoDB
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 27017,
  DB_NAME: process.env.DB_NAME || 'test_db',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  SSL_KEY_PATH: process.env.SSL_KEY_PATH || '',   // Path to SSL key file
  SSL_CERT_PATH: process.env.SSL_CERT_PATH || '', // Path to SSL certificate file
  PORT: process.env.PORT || 3000,
  SPORT: process.env.SPORT || 3003,
  WS_PORT: process.env.WS_PORT || 3004,
  WSS_PORT: process.env.WSS_PORT || 3005,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  NODE_ENV: process.env.NODE_ENV || 'production',
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS || '*',
  STORAGE_PATH: process.env.STORAGE_PATH || './storage',
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret',
  SERVER_UID: process.env.SERVER_UID  || '5150',
};