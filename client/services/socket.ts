import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants/api';

let socket: Socket | null = null;

export const socketService = {
  connect(token: string): Socket {
    if (socket?.connected) return socket;

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('🟢 Socket connected:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.error('🔴 Socket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason);
    });

    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket(): Socket | null {
    return socket;
  },

  emit(event: string, data: any, ack?: (res: any) => void) {
    if (!socket?.connected) {
      console.warn('Socket not connected, cannot emit:', event);
      return;
    }
    if (ack) {
      socket.emit(event, data, ack);
    } else {
      socket.emit(event, data);
    }
  },

  on(event: string, handler: (...args: any[]) => void) {
    socket?.on(event, handler);
  },

  off(event: string, handler?: (...args: any[]) => void) {
    socket?.off(event, handler);
  },
};
