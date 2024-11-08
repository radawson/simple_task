const socketIO = require('socket.io');
const Logger = require('../core/Logger');

class SocketService {
    constructor(server, config) {
        this.logger = Logger.getInstance();
        this.io = socketIO(server, {
            path: '/socket',
            pingTimeout: 60000,
            pingInterval: 25000,
            cors: {
                origin: config.cors.origins,
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.setupHandlers();
    }

    setupHandlers() {
        this.io.on('connection', (socket) => {
            this.logger.info(`New socket connection: ${socket.id}`);

            socket.on('disconnect', () => {
                this.logger.info(`Socket disconnected: ${socket.id}`);
            });

            socket.on('error', (error) => {
                this.logger.error(`Socket error: ${error.message}`);
            });
        });
    }

    notifyFileAvailable(data) {
        this.io.emit('file:available', {
            type: 'file',
            ...data
        });
    }

    broadcastEvent(event, data) {
        this.io.emit(event, data);
    }
}

module.exports = SocketService;