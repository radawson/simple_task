const WebSocket = require('ws');
const logger = require('./logger'); // Import the logger if needed

let wss;

// Initialize WebSocket server
function initWebSocket(server) {
    let port = 9180;
    wss = new WebSocket.Server({ server });
    logger.debug('WebSocket server initializing...');

    wss.on('listening', () => {
        logger.info(`WebSocket server running on port ${port}`);
    });

    wss.on('connection', (ws) => {
        logger.info(`New WebSocket connection established on port ${port}`);

        ws.on('close', () => {
            logger.info('WebSocket connection closed.');
        });

        ws.on('error', (error) => {
            logger.error('WebSocket error:', error);
        });
    });

}

// Notify all clients that a file is available
function notifyFileAvailable(filename, size,  username, domain) {
    if (!wss) {
        logger.warn('WebSocket server is not initialized.');
        return;
    }

    const message = JSON.stringify({
        type: 'file',
        filename,
        size,
        username,
        domain,
    });

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

module.exports = {
    initWebSocket,
    notifyFileAvailable,
};
