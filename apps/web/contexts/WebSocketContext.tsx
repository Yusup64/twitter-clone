import React, { createContext, useContext, useEffect } from 'react';

import { wsService } from '@/services/websocket';
import { useAuthStore } from '@/stores/useAuthStore';

const WebSocketContext = createContext<typeof wsService>(wsService);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      wsService.connect(user.id);
    }

    return () => {
      wsService.disconnect();
    };
  }, [user]);

  return (
    <WebSocketContext.Provider value={wsService}>
      {children}
    </WebSocketContext.Provider>
  );
};
