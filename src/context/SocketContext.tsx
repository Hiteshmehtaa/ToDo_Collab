import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SOCKET_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? window.location.origin : 'http://localhost:3001'
);
interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && user) {
      const newSocket = io(SOCKET_URL, {
        auth: {
          token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};