import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from "react-i18next";
import { 
  DailyProvider, 
  useLocalSessionId, 
  useParticipantIds, 
  useVideoTrack, 
  useAudioTrack,
  useDaily,
  useDailyEvent
} from '@daily-co/daily-react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp, Sparkles, LayoutGrid } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Inner component that actually uses the Daily hooks
function VideoRoomInner({ roomUrl, onLeave }) {
  const { t } = useTranslation();
  const daily = useDaily();
  const localSessionId = useLocalSessionId();
  const participantIds = useParticipantIds();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  useDailyEvent('left-meeting', () => {
    onLeave();
  });

  const toggleAudio = () => {
    if (!daily) return;
    daily.setLocalAudio(!isMuted);
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (!daily) return;
    daily.setLocalVideo(!isVideoOff);
    setIsVideoOff(!isVideoOff);
  };

  const toggleScreenShare = () => {
    if (!daily) return;
    if (isScreenSharing) {
      daily.stopScreenShare();
    } else {
      daily.startScreenShare();
    }
    setIsScreenSharing(!isScreenSharing);
  };

  const leaveCall = () => {
    if (!daily) return;
    daily.leave();
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-xl overflow-hidden relative">
      {/* Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr overflow-y-auto">
        {participantIds.map(id => (
          <ParticipantTile key={id} id={id} isLocal={id === localSessionId} />
        ))}
        {participantIds.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 rounded-full border-[3px] border-blue-500/30 border-t-blue-500 animate-spin"></div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4 px-6 z-10">
        <Button 
          onClick={toggleAudio}
          variant={isMuted ? "destructive" : "secondary"}
          size="icon"
          className="w-12 h-12 rounded-full"
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>
        <Button 
          onClick={toggleVideo}
          variant={isVideoOff ? "destructive" : "secondary"}
          size="icon"
          className="w-12 h-12 rounded-full"
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </Button>
        <Button 
          onClick={toggleScreenShare}
          variant={isScreenSharing ? "default" : "secondary"}
          size="icon"
          className="w-12 h-12 rounded-full hidden sm:flex"
        >
          <MonitorUp className="w-5 h-5" />
        </Button>
        <Button 
          variant="secondary"
          className="h-12 px-6 rounded-full font-semibold gap-2 hover:bg-blue-600 hover:text-white transition-colors"
        >
          <Sparkles className="w-4 h-4" /> AI Assistant
        </Button>
        <Button 
          onClick={leaveCall}
          variant="destructive"
          className="h-12 px-8 rounded-full font-bold ml-4"
        >
          <PhoneOff className="w-5 h-5 mr-2" /> Leave
        </Button>
      </div>
    </div>
  );
}

function ParticipantTile({ id, isLocal }) {
  const videoState = useVideoTrack(id);
  const audioState = useAudioTrack(id);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (videoState?.track && videoRef.current) {
      videoRef.current.srcObject = new MediaStream([videoState.track]);
    }
  }, [videoState?.track]);

  useEffect(() => {
    if (!isLocal && audioState?.track && audioRef.current) {
      audioRef.current.srcObject = new MediaStream([audioState.track]);
    }
  }, [audioState?.track, isLocal]);

  return (
    <div className="relative bg-slate-800 rounded-lg overflow-hidden group shadow-lg flex items-center justify-center">
      {videoState?.state === 'playable' ? (
        <video 
          ref={videoRef}
          autoPlay 
          muted={isLocal} 
          playsInline 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center">
          <span className="text-2xl text-slate-400 font-bold">U</span>
        </div>
      )}
      
      {!isLocal && <audio ref={audioRef} autoPlay playsInline />}
      
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-md flex items-center gap-2">
        <span className="text-white text-xs font-medium">{isLocal ? "You" : "Participant"}</span>
        {audioState?.state !== 'playable' && <MicOff className="w-3 h-3 text-red-500" />}
      </div>
    </div>
  );
}

// Wrapper to initialize Daily provider
export default function VideoRoom({ roomUrl, token, onLeave }) {
  const [daily, setDaily] = useState(null);

  useEffect(() => {
    if (!roomUrl) return;
    import('@daily-co/daily-js').then((DailyIframe) => {
      const newDaily = DailyIframe.default.createCallObject();
      setDaily(newDaily);
      newDaily.join({ url: roomUrl, token });
    });

    return () => {
      if (daily) {
        daily.destroy();
      }
    };
  }, [roomUrl, token]);

  if (!daily || !roomUrl) {
    return (
      <div className="flex flex-col h-full bg-slate-950 rounded-xl items-center justify-center">
        <div className="w-12 h-12 rounded-full border-[3px] border-blue-500/30 border-t-blue-500 animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">Connecting to secure video server...</p>
      </div>
    );
  }

  return (
    <DailyProvider callObject={daily}>
      <VideoRoomInner roomUrl={roomUrl} onLeave={onLeave} />
    </DailyProvider>
  );
}
