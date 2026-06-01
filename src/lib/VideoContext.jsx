import React, { createContext, useContext, useState } from 'react';

const VideoContext = createContext();

export function VideoProvider({ children }) {
  const [activeRoomUrl, setActiveRoomUrl] = useState(null);
  const [isPipMode, setIsPipMode] = useState(false);

  const joinRoom = (url) => {
    setActiveRoomUrl(url);
    setIsPipMode(false);
  };

  const leaveRoom = () => {
    setActiveRoomUrl(null);
    setIsPipMode(false);
  };

  const togglePipMode = () => {
    setIsPipMode((prev) => !prev);
  };

  return (
    <VideoContext.Provider value={{ activeRoomUrl, isPipMode, joinRoom, leaveRoom, togglePipMode }}>
      {children}
    </VideoContext.Provider>
  );
}

export function useVideo() {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
}
