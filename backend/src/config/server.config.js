const https = require('https');
const http = require('http');
const fs = require('fs');

const createServers = async (app, config) => {
  const servers = {};
  
  // HTTPS Server
  const httpsOptions = {
    key: fs.readFileSync(config.sslKey),
    cert: fs.readFileSync(config.sslCert),
  };
  
  servers.https = https.createServer(httpsOptions, app)
    .listen(config.sslPort);

  // HTTP Server (development only)
  if (process.env.NODE_ENV === 'development') {
    servers.http = http.createServer(app)
      .listen(config.port);
  }

  return servers;
};

module.exports = { createServers };