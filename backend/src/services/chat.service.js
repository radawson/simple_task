const socketIO = require('socket.io');
const admin = require('firebase-admin');
const Redis = require('ioredis');
const Logger = require('../core/Logger');

class ChatService {
  constructor(server, config) {
    this.logger = Logger.getInstance();
    this.redis = new Redis(config.redis);
    this.io = socketIO(server, {
      path: '/chat',
      pingTimeout: 60000,
      pingInterval: 25000,
      cors: {
        origin: config.cors.origins,
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupSocketHandlers();
    this.initializeFCM(config.fcm);
  }

  initializeFCM(config) {
    admin.initializeApp({
      credential: admin.credential.cert(config.serviceAccount),
      projectId: config.projectId
    });
    this.fcm = admin.messaging();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      this.logger.info(`New chat connection: ${socket.id}`);

      socket.on('join_room', async (roomId, userId) => {
        socket.join(roomId);
        await this.handleUserJoin(roomId, userId);
      });

      socket.on('message', async (data) => {
        await this.handleMessage(data);
      });

      socket.on('disconnect', () => {
        this.logger.info(`Chat disconnection: ${socket.id}`);
      });
    });
  }

  async handleMessage({ roomId, userId, message }) {
    // Store message in Redis
    await this.redis.lpush(`chat:${roomId}`, JSON.stringify({
      userId,
      message,
      timestamp: Date.now()
    }));

    // Broadcast to room
    this.io.to(roomId).emit('message', {
      userId,
      message,
      timestamp: Date.now()
    });

    // Send FCM to offline users
    const offlineUsers = await this.getOfflineUsers(roomId);
    if (offlineUsers.length > 0) {
      await this.sendFCMNotification(offlineUsers, {
        title: 'New Message',
        body: message.substring(0, 100)
      });
    }
  }

  async sendFCMNotification(userTokens, notification) {
    try {
      await this.fcm.sendMulticast({
        tokens: userTokens,
        notification
      });
    } catch (error) {
      this.logger.error(`FCM notification failed: ${error.message}`);
    }
  }
}

module.exports = ChatService;