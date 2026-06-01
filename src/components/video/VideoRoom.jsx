import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from "react-i18next";
import { 
  DailyProvider, 
  useLocalSessionId, 
  useParticipantIds, 
  useVideoTrack, 
  useAudioTrack,
  useDaily,
  useDailyEvent,
  useScreenShare
} from '@daily-co/daily-react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp, Sparkles, LayoutGrid, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { generateText } from "@/lib/cloudflareAI";
import { useToast } from "@/components/ui/use-toast";

// Inner component that actually uses the Daily hooks
function VideoRoomInner({ roomUrl, onLeave, isPipMode, togglePipMode }) {
  const { t } = useTranslation();
  const daily = useDaily();
  const localSessionId = useLocalSessionId();
  const participantIds = useParticipantIds();
  const { screens, isSharingScreen, startScreenShare, stopScreenShare } = useScreenShare();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  useDailyEvent('left-meeting', () => {
    onLeave();
  });

  const toggleAudio = () => {
    if (!daily) return;
    const newMutedState = !isMuted;
    daily.setLocalAudio(!newMutedState); // false means muted
    setIsMuted(newMutedState);
  };

  const toggleVideo = () => {
    if (!daily) return;
    const newVideoOffState = !isVideoOff;
    daily.setLocalVideo(!newVideoOffState); // false means video off
    setIsVideoOff(newVideoOffState);
  };

  const toggleScreenShare = () => {
    if (isSharingScreen) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  const leaveCall = () => {
    if (!daily) return;
    daily.leave();
  };

  const handleAiAssist = async () => {
    setIsAiLoading(true);
    toast({ title: "Orbit Meeting AI", description: "Generating meeting summary via Cloudflare AI..." });
    try {
      const messages = [
        { role: 'system', content: 'You are an AI meeting assistant. Summarize the following mock meeting transcription into 3 bullet points.' },
        { role: 'user', content: 'John: We need to finalize the quarterly report by Friday. Jane: I have the numbers ready, just need to format the charts. John: Great, lets review it Thursday morning. Jane: Sounds good.' }
      ];
      const response = await generateText(messages);
      toast({ title: "Meeting Summary", description: response || "Meeting concluded without action items." });
    } catch (err) {
      console.error(err);
      toast({ title: "AI Error", description: "Failed to connect to Cloudflare AI.", variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-xl overflow-hidden relative border border-border shadow-sm group">
      {/* PiP Toggle Button */}
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={togglePipMode}
        className="absolute top-2 right-2 z-50 rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {isPipMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
      </Button>

      {/* Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr overflow-y-auto bg-muted/30">
        {screens.map(screen => (
          <ScreenShareTile key={screen.screenId} screen={screen} />
        ))}
        {participantIds.map(id => (
          <ParticipantTile key={id} id={id} isLocal={id === localSessionId} />
        ))}
        {participantIds.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 rounded-full border-[3px] border-primary/30 border-t-primary animate-spin"></div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className={`bg-card border-t border-border flex items-center justify-center z-10 transition-all ${isPipMode ? 'h-12 px-2 gap-2' : 'h-20 px-6 gap-4'}`}>
        <Button 
          onClick={toggleAudio}
          variant={isMuted ? "destructive" : "secondary"}
          size="icon"
          className={`${isPipMode ? 'w-8 h-8' : 'w-12 h-12'} rounded-full`}
        >
          {isMuted ? <MicOff className={isPipMode ? "w-3 h-3" : "w-5 h-5"} /> : <Mic className={isPipMode ? "w-3 h-3" : "w-5 h-5"} />}
        </Button>
        <Button 
          onClick={toggleVideo}
          variant={isVideoOff ? "destructive" : "secondary"}
          size="icon"
          className={`${isPipMode ? 'w-8 h-8' : 'w-12 h-12'} rounded-full`}
        >
          {isVideoOff ? <VideoOff className={isPipMode ? "w-3 h-3" : "w-5 h-5"} /> : <Video className={isPipMode ? "w-3 h-3" : "w-5 h-5"} />}
        </Button>
        {!isPipMode && (
          <>
            <Button 
              onClick={toggleScreenShare}
              variant={isSharingScreen ? "default" : "secondary"}
              size="icon"
              className="w-12 h-12 rounded-full hidden sm:flex"
            >
              <MonitorUp className="w-5 h-5" />
            </Button>
            <Button 
              variant="secondary"
              onClick={handleAiAssist}
              disabled={isAiLoading}
              className="h-12 px-6 rounded-full font-semibold gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Sparkles className="w-4 h-4" /> {isAiLoading ? "Processing..." : "AI Assistant"}
            </Button>
          </>
        )}
        <Button 
          onClick={leaveCall}
          variant="destructive"
          className={`${isPipMode ? 'h-8 w-8 p-0' : 'h-12 px-8 ml-4'} rounded-full font-bold flex items-center justify-center`}
        >
          {isPipMode ? <PhoneOff className="w-3 h-3" /> : <><PhoneOff className="w-5 h-5 mr-2" /> Leave</>}
        </Button>
      </div>
    </div>
  );
}

function ScreenShareTile({ screen }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (screen.screenVideo?.track && videoRef.current) {
      videoRef.current.srcObject = new MediaStream([screen.screenVideo.track]);
    }
  }, [screen.screenVideo?.track]);

  useEffect(() => {
    if (!screen.local && screen.screenAudio?.track && audioRef.current) {
      audioRef.current.srcObject = new MediaStream([screen.screenAudio.track]);
    }
  }, [screen.screenAudio?.track, screen.local]);

  return (
    <div className="relative bg-slate-800 rounded-lg overflow-hidden group shadow-lg flex items-center justify-center md:col-span-2 lg:col-span-3">
      {screen.screenVideo?.state === 'playable' ? (
        <video 
          ref={videoRef}
          autoPlay 
          muted={screen.local} 
          playsInline 
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center">
          <MonitorUp className="w-8 h-8 text-slate-400" />
        </div>
      )}
      
      {!screen.local && <audio ref={audioRef} autoPlay playsInline />}
      
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-md flex items-center gap-2">
        <span className="text-white text-xs font-medium">{screen.local ? "Your Screen" : "Shared Screen"}</span>
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
export default function VideoRoom({ roomUrl, token, onLeave, isPipMode, togglePipMode }) {
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
      <VideoRoomInner roomUrl={roomUrl} onLeave={onLeave} isPipMode={isPipMode} togglePipMode={togglePipMode} />
    </DailyProvider>
  );
}
