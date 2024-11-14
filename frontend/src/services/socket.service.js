import { io } from 'socket.io-client';

class SocketClient {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect() {
        if (this.socket) return;

        this.socket = io({
            path: '/socket',
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('Socket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    }

    subscribeToDate(date) {
        if (!this.socket) this.connect();
        this.socket.emit('join:date', date);
    }

    unsubscribeFromDate(date) {
        if (this.socket) {
            this.socket.emit('leave:date', date);
        }
    }

    onTaskUpdate(callback) {
        this.socket?.on('task:update', callback);
    }

    onEventUpdate(callback) {
        this.socket?.on('event:update', callback);
    }

    onNoteUpdate(callback) {
        this.socket?.on('note:update', callback);
    }

    onDayUpdates(callback) {
        this.socket?.on('day:updates', callback);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketClient();