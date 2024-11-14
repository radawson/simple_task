// src/services/socket.service.js
import { Server } from 'socket.io';
import Logger from '../core/Logger.js';
import { verifyTokenPayload } from '../middleware/jwt.middleware.js';

class SocketService {
    constructor(server, config) {
        this.logger = Logger.getInstance();
        this.activeUsers = new Map(); // userId -> Set<socketId>
        this.roomSubscriptions = new Map(); // roomId -> Set<userId>
        
        this.io = new Server(server, {
            path: '/socket',
            pingTimeout: 60000,
            pingInterval: 25000,
            cors: {
                origin: config.server.cors.origins,
                credentials: true
            },
            transports: ['websocket'],
            secure: true,
            cookie: {
                secure: true
            }
        });

        this.setupMiddleware();
        this.setupHandlers();
    }

    async setupMiddleware() {
        // Auth middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication required'));
                }

                const decoded = await verifyTokenPayload(token);
                socket.user = decoded; // Store user info in socket
                
                // Track user's socket connection
                this.addUserSocket(decoded.id, socket.id);
                
                next();
            } catch (error) {
                this.logger.error('Socket authentication failed:', error);
                next(new Error('Authentication failed'));
            }
        });
    }

    setupHandlers() {
        this.io.on('connection', (socket) => {
            this.logger.info(`New socket connection: ${socket.id}`, {
                userId: socket.user.id,
                username: socket.user.username
            });

            // Room management
            socket.on('subscribe', (rooms) => this.handleSubscribe(socket, rooms));
            socket.on('unsubscribe', (rooms) => this.handleUnsubscribe(socket, rooms));

            // Entity-specific rooms
            socket.on('join:task', (taskId) => this.joinEntityRoom(socket, 'task', taskId));
            socket.on('leave:task', (taskId) => this.leaveEntityRoom(socket, 'task', taskId));
            socket.on('join:event', (eventId) => this.joinEntityRoom(socket, 'event', eventId));
            socket.on('leave:event', (eventId) => this.leaveEntityRoom(socket, 'event', eventId));
            socket.on('join:note', (noteId) => this.joinEntityRoom(socket, 'note', noteId));
            socket.on('leave:note', (noteId) => this.leaveEntityRoom(socket, 'note', noteId));

            // User presence
            socket.on('presence:online', () => this.handlePresence(socket, 'online'));
            socket.on('presence:away', () => this.handlePresence(socket, 'away'));
            socket.on('presence:busy', () => this.handlePresence(socket, 'busy'));

            // Real-time collaboration
            socket.on('entity:typing', (data) => this.handleTyping(socket, data));
            socket.on('entity:focus', (data) => this.handleFocus(socket, data));
            socket.on('entity:blur', (data) => this.handleBlur(socket, data));

            // Disconnect handling
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    // User and Socket Management
    addUserSocket(userId, socketId) {
        if (!this.activeUsers.has(userId)) {
            this.activeUsers.set(userId, new Set());
        }
        this.activeUsers.get(userId).add(socketId);
    }

    removeUserSocket(userId, socketId) {
        const userSockets = this.activeUsers.get(userId);
        if (userSockets) {
            userSockets.delete(socketId);
            if (userSockets.size === 0) {
                this.activeUsers.delete(userId);
                this.handleUserOffline(userId);
            }
        }
    }

    // Room Management
    async handleSubscribe(socket, rooms) {
        if (!Array.isArray(rooms)) rooms = [rooms];
        
        for (const room of rooms) {
            await socket.join(room);
            if (!this.roomSubscriptions.has(room)) {
                this.roomSubscriptions.set(room, new Set());
            }
            this.roomSubscriptions.get(room).add(socket.user.id);
            
            this.logger.debug(`User ${socket.user.username} subscribed to ${room}`);
        }
    }

    async handleUnsubscribe(socket, rooms) {
        if (!Array.isArray(rooms)) rooms = [rooms];
        
        for (const room of rooms) {
            await socket.leave(room);
            this.roomSubscriptions.get(room)?.delete(socket.user.id);
            
            this.logger.debug(`User ${socket.user.username} unsubscribed from ${room}`);
        }
    }

    // Entity Room Management
    async joinEntityRoom(socket, type, id) {
        const room = `${type}:${id}`;
        await this.handleSubscribe(socket, room);
        
        // Notify others in the room
        socket.to(room).emit('user:joined', {
            entityType: type,
            entityId: id,
            user: {
                id: socket.user.id,
                username: socket.user.username
            }
        });
    }

    async leaveEntityRoom(socket, type, id) {
        const room = `${type}:${id}`;
        await this.handleUnsubscribe(socket, room);
    }

    // Presence Management
    handlePresence(socket, status) {
        const presence = {
            userId: socket.user.id,
            username: socket.user.username,
            status,
            timestamp: new Date().toISOString()
        };

        // Broadcast to relevant rooms
        socket.broadcast.emit('presence:update', presence);
        this.logger.debug(`User ${socket.user.username} status: ${status}`);
    }

    handleUserOffline(userId) {
        this.io.emit('presence:offline', { userId });
    }

    // Real-time Collaboration Handlers
    handleTyping(socket, { entityType, entityId }) {
        const room = `${entityType}:${entityId}`;
        socket.to(room).emit('user:typing', {
            entityType,
            entityId,
            user: {
                id: socket.user.id,
                username: socket.user.username
            }
        });
    }

    handleFocus(socket, { entityType, entityId }) {
        const room = `${entityType}:${entityId}`;
        socket.to(room).emit('user:focus', {
            entityType,
            entityId,
            user: {
                id: socket.user.id,
                username: socket.user.username
            }
        });
    }

    handleBlur(socket, { entityType, entityId }) {
        const room = `${entityType}:${entityId}`;
        socket.to(room).emit('user:blur', {
            entityType,
            entityId,
            user: {
                id: socket.user.id,
                username: socket.user.username
            }
        });
    }

    // Disconnect Handler
    handleDisconnect(socket) {
        this.logger.info(`Socket disconnected: ${socket.id}`, {
            userId: socket.user?.id,
            username: socket.user?.username
        });
        
        if (socket.user) {
            this.removeUserSocket(socket.user.id, socket.id);
        }
    }

    // Public API for sending notifications
    notifyUser(userId, event, data) {
        const userSockets = this.activeUsers.get(userId);
        if (userSockets) {
            this.io.to([...userSockets]).emit(event, {
                ...data,
                timestamp: new Date().toISOString()
            });
        }
    }

    notifyRoom(room, event, data) {
        this.io.to(room).emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    broadcastEntity(entityType, entityId, action, data) {
        const room = `${entityType}:${entityId}`;
        this.notifyRoom(room, `${entityType}:${action}`, {
            ...data,
            entityId,
            entityType
        });
    }
}

export { SocketService };
export default SocketService;