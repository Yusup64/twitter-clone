import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(userId: string) {
    if (this.socket) return;

    this.socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: {
        userId,
      },
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('tweet:created', (data) => {
      this.emit('tweet:created', data);
    });

    this.socket.on('tweet:liked', (data) => {
      this.emit('tweet:liked', data);
    });

    this.socket.on('tweet:retweeted', (data) => {
      this.emit('tweet:retweeted', data);
    });

    this.socket.on('tweet:commented', (data) => {
      this.emit('tweet:commented', data);
    });

    this.socket.on('user:followed', (data) => {
      this.emit('user:followed', data);
    });
  }

  subscribe(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }
}

export const wsService = new WebSocketService();
