const socketIO = require('socket.io');
const Logger = require('../core/Logger');

class SocketService {
    constructor(server, config) {
        this.logger = Logger.getInstance();
        
        // Ensure we're using secure WebSocket
        this.io = socketIO(server, {
            path: '/socket',
            pingTimeout: 60000,
            pingInterval: 25000,
            cors: {
                origin: config.cors.origins,
                credentials: true
            },
            transports: ['websocket'],  // Prefer WebSocket only
            secure: true,  // Ensure secure connection
            cookie: {
                secure: true  // Only send cookie over HTTPS
            }
        });

        this.setupMiddleware();
        this.setupHandlers();
    }

    setupMiddleware() {
        // Add authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication required'));
                }

                // Verify token here using your JWT middleware
                // socket.user = decoded user information
                next();
            } catch (error) {
                this.logger.error('Socket authentication failed:', error);
                next(new Error('Authentication failed'));
            }
        });
    }

    setupHandlers() {
        this.io.on('connection', (socket) => {
            this.logger.info(`New secure socket connection: ${socket.id}`);

            // Handle room joining for date-specific updates
            socket.on('join:date', (date) => {
                if (!this.isValidDate(date)) {
                    socket.emit('error', { message: 'Invalid date format' });
                    return;
                }
                
                socket.join(`date:${date}`);
                this.logger.info(`Socket ${socket.id} joined date room: ${date}`);
            });

            socket.on('leave:date', (date) => {
                if (!this.isValidDate(date)) {
                    socket.emit('error', { message: 'Invalid date format' });
                    return;
                }
                
                socket.leave(`date:${date}`);
                this.logger.info(`Socket ${socket.id} left date room: ${date}`);
            });

            socket.on('disconnect', (reason) => {
                this.logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
            });

            socket.on('error', (error) => {
                this.logger.error(`Socket error: ${error.message}`);
            });
        });
    }

    isValidDate(date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        return dateRegex.test(date) && !isNaN(new Date(date).getTime());
    }

    notifyEventUpdate(date, eventData) {
        if (!this.isValidDate(date)) {
            this.logger.warn('Invalid date for event notification:', date);
            return;
        }

        this.io.to(`date:${date}`).emit('event:update', {
            timestamp: new Date().toISOString(),
            ...eventData
        });
    }

    broadcastEvent(event, data) {
        this.io.emit(event, {
            timestamp: new Date().toISOString(),
            ...data
        });
    }
}

module.exports = SocketService;