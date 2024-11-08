const { client, xml } = require('@xmpp/client');
const logger = require('./logger');  
const config = require('./config');

// XMPP connection configuration
const xmppClient = client({
  service: config.XMPP_SERVICE || 'xmpp://localhost:5222',  // Change to your actual XMPP server address and port
  domain: config.XMPP_DOMAIN || 'example.com',              // Update this to your XMPP domain (e.g., `blackhorse.info`)
  resource: config.XMPP_RESOURCE || 'backend',              // Set the resource string to identify this connection
  username: config.XMPP_USERNAME || 'backenduser',          // Replace with your backend's XMPP account username
  password: config.XMPP_PASSWORD || 'backendpassword',      // Replace with the backend's XMPP account password
});

// Event handlers for XMPP connection
xmppClient.on('online', (address) => {
  logger.info(`Connected to XMPP as ${address.toString()}`);
});

xmppClient.on('stanza', (stanza) => {
  if (stanza.is('message')) {
    // Handle incoming chat messages
    const from = stanza.attrs.from;
    const body = stanza.getChildText('body');
    logger.info(`Received message from ${from}: ${body}`);
  }
});

xmppClient.on('error', (err) => {
  logger.error(`XMPP Error: ${err.message}`);
});

// Connect to the XMPP server
xmppClient.start().catch((err) => logger.error(`Failed to start XMPP client: ${err.message}`));

module.exports = xmppClient;
