import React, { useState, useEffect } from 'react';
import SocketService from '../../services/socket';

const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(SocketService.isConnected);
    };

    // Check initially
    checkConnection();

    // Set up interval to check connection
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isConnected) {
    return (
      <div className="connection-status connected">
        <span className="pulse-dot"></span>
        Live
      </div>
    );
  }

  return (
    <div className="connection-status disconnected">
      🔌 Offline
    </div>
  );
};

export default ConnectionStatus;