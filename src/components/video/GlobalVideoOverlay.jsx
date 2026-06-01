import React from 'react';
import { useLocation } from 'react-router-dom';
import { useVideo } from '@/lib/VideoContext';
import VideoRoom from './VideoRoom';

export default function GlobalVideoOverlay() {
  const { activeRoomUrl, isPipMode, leaveRoom, togglePipMode } = useVideo();
  const location = useLocation();

  if (!activeRoomUrl) return null;

  const isBoard = location.pathname === '/board';
  const effectivePipMode = isPipMode || !isBoard;

  return (
    <div 
      className={`transition-all duration-300 z-40 ${
        effectivePipMode 
          ? 'fixed bottom-6 right-6 w-[360px] h-[240px] shadow-2xl rounded-xl overflow-hidden' 
          : 'absolute inset-0 bg-background'
      }`}
    >
      <VideoRoom 
        roomUrl={activeRoomUrl} 
        onLeave={leaveRoom} 
        isPipMode={effectivePipMode} 
        togglePipMode={togglePipMode} 
      />
    </div>
  );
}
