import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const normalizeOrigin = (value = '') => {
  if (!value) return '';
  return value.trim().replace(/\/api$/, '').replace(/\/+$/, '');
};

const getSocketOrigin = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return normalizeOrigin(envUrl);
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    if (hostname.endsWith('.vercel.app')) {
      return 'https://support-flow-backend1.vercel.app';
    }
    return normalizeOrigin(window.location.origin);
  }
  return '';
};

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let socketInstance = null;

    if (isAuthenticated && user) {
      const socketOrigin = getSocketOrigin();

      socketInstance = io(socketOrigin || window.location.origin, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling'],
        withCredentials: true
      });

      socketInstance.on('connect', () => {
        socketInstance.emit('join-user', user._id);

        if (user.role === 'admin') {
          socketInstance.emit('join-admin');
        } else if (user.role === 'worker') {
          socketInstance.emit('join-workers');
        }
      });

      setSocket(socketInstance);
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated, user?._id]);

  const joinTicketRoom = (ticketId) => {
    if (socket && ticketId) {
      socket.emit('join-ticket', ticketId);
    }
  };

  const leaveTicketRoom = (ticketId) => {
    if (socket && ticketId) {
      socket.emit('leave-ticket', ticketId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinTicketRoom, leaveTicketRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
