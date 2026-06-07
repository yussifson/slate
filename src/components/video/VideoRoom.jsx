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
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, MonitorUp, Sparkles, LayoutGrid, Maximize2, Minimize2, ExternalLink, MessageSquare, Send, X } from 'lucide-react';
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
  const [joined, setJoined] = useState(false);
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [aiResponse, setAiResponse] = useState(null);

  useDailyEvent('joined-meeting', () => {
    setJoined(true);
  });

  useDailyEvent('left-meeting', () => {
    setJoined(false);
    onLeave();
  });

  useDailyEvent('error', (ev) => {
    console.error('Daily error:', ev);
    toast({
      title: 'Video connection error',
      description: ev?.errorMsg || 'Could not connect to the meeting room.',
      variant: 'destructive',
    });
  });

  const ensureJoined = () => {
    if (joined && daily) return true;
    toast({
      title: 'Connecting…',
      description: 'Wait until the call has connected before using camera or mic.',
    });
    return false;
  };

  const toggleAudio = async () => {
    if (!ensureJoined()) return;
    const newMutedState = !isMuted;
    try {
      await daily.setLocalAudio(!newMutedState);
      setIsMuted(newMutedState);
    } catch (err) {
      console.error(err);
      toast({ title: 'Microphone error', description: err?.message || 'Could not access microphone.', variant: 'destructive' });
    }
  };

  const toggleVideo = async () => {
    if (!ensureJoined()) return;
    const newVideoOffState = !isVideoOff;
    try {
      await daily.setLocalVideo(!newVideoOffState);
      setIsVideoOff(newVideoOffState);
    } catch (err) {
      console.error(err);
      toast({ title: 'Camera error', description: err?.message || 'Could not access camera.', variant: 'destructive' });
    }
  };

  const toggleScreenShare = async () => {
    if (!ensureJoined()) return;
    try {
      if (isSharingScreen) {
        await stopScreenShare();
      } else {
        await startScreenShare();
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Screen share failed', description: err?.message || 'Could not share screen.', variant: 'destructive' });
    }
  };

  const leaveCall = () => {
    if (!daily) return;
    daily.leave();
  };

  const handleAiAssist = async () => {
    setIsAiLoading(true);
    setAiResponse(null);
    toast({ title: "Orbit Meeting AI", description: "Generating meeting summary via Cloudflare AI..." });
    try {
      const messages = [
        { role: 'system', content: 'You are an AI meeting assistant. Summarize the following mock meeting transcription into 3 bullet points.' },
        { role: 'user', content: 'John: We need to finalize the quarterly report by Friday. Jane: I have the numbers ready, just need to format the charts. John: Great, lets review it Thursday morning. Jane: Sounds good.' }
      ];
      const response = await generateText(messages);
      setAiResponse(response || "Meeting concluded without action items.");
    } catch (err) {
      console.error(err);
      toast({ title: "AI Error", description: "Failed to connect to Cloudflare AI.", variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  };

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);

  // Handle incoming Daily text messages
  useDailyEvent('app-message', (ev) => {
    if (ev.data && ev.data.type === 'chat') {
      setChatMessages(prev => [...prev, { from: ev.fromId, name: ev.data.name, text: ev.data.text, time: new Date() }]);
    }
  });

  const sendChatMessage = () => {
    if (!chatInput.trim() || !daily) return;
    const msg = { type: 'chat', text: chatInput.trim(), name: 'Me' };
    daily.sendAppMessage(msg, '*');
    setChatMessages(prev => [...prev, { from: 'local', name: 'Me', text: chatInput.trim(), time: new Date() }]);
    setChatInput("");
  };

  return (
    <div className="flex h-full bg-background rounded-xl overflow-hidden relative border border-border shadow-sm group">
      
      {/* Video Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* AI Response Overlay */}
        {aiResponse && (
          <div className="absolute top-4 left-4 right-4 z-40 bg-card/95 backdrop-blur-md border border-border p-4 rounded-xl shadow-2xl animate-in fade-in max-h-[80%] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
              <h3 className="font-bold flex items-center gap-2 text-primary"><Sparkles className="w-4 h-4"/> AI Meeting Notes</h3>
              <Button variant="ghost" size="sm" onClick={() => setAiResponse(null)} className="h-6 px-2 text-xs">Close</Button>
            </div>
            <div className="text-sm prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\n/g, '<br/>') }} />
          </div>
        )}

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
        {(() => {
          const allParticipants = localSessionId ? [localSessionId, ...participantIds] : participantIds;
          return allParticipants.map(id => (
            <ParticipantTile key={id} id={id} isLocal={id === localSessionId} />
          )).concat(allParticipants.length === 0 ? (
            <div key="loader" className="absolute inset-0 flex items-center justify-center">
               <div className="w-12 h-12 rounded-full border-[3px] border-primary/30 border-t-primary animate-spin"></div>
            </div>
          ) : []);
        })()}
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div className="w-80 border-l border-border bg-card flex flex-col shrink-0 animate-in slide-in-from-right">
          <div className="h-14 border-b border-border flex items-center justify-between px-4">
            <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Meeting Chat</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowChat(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.from === 'local' ? 'items-end' : 'items-start'}`}>
                <span className="text-[11px] text-muted-foreground mb-1">{msg.name}</span>
                <div className={`px-3 py-2 rounded-xl max-w-[85%] text-sm ${msg.from === 'local' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatMessages.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm flex-col gap-2 opacity-50">
                <MessageSquare className="w-8 h-8" />
                <p>No messages yet.</p>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <input 
              type="text" 
              placeholder="Send a message..." 
              className="flex-1 bg-muted/50 rounded-full px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
            />
            <Button size="icon" className="rounded-full shrink-0" onClick={sendChatMessage} disabled={!chatInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
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
          {isVideoOff ? <VideoOff className={isPipMode ? "w-3 h-3" : "w-5 h-5"} /> : <VideoIcon className={isPipMode ? "w-3 h-3" : "w-5 h-5"} />}
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
              onClick={() => setShowChat(!showChat)}
              variant={showChat ? "default" : "secondary"}
              size="icon"
              className="w-12 h-12 rounded-full hidden sm:flex relative"
            >
              <MessageSquare className="w-5 h-5" />
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
  
  if (roomUrl && (roomUrl.includes('meet.jit.si') || roomUrl.includes('meet.ffmuc.net') || roomUrl.includes('jitsi'))) {
    return (
      <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950 rounded-xl relative overflow-hidden items-center justify-center text-foreground border border-border">
        <div className="absolute top-0 right-0 z-50 p-2 flex gap-2">
           <Button variant="destructive" size="sm" onClick={onLeave} className="rounded-full h-8 px-4 font-semibold opacity-80 hover:opacity-100 shadow-sm">
             <PhoneOff className="w-4 h-4 mr-2" /> End Session
           </Button>
        </div>
        
        <div className="flex flex-col items-center max-w-md text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-border shadow-xl">
           <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-100 dark:border-emerald-800">
             <VideoIcon className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
           </div>
           <h2 className="text-2xl font-bold mb-3 text-slate-800 dark:text-white tracking-tight">Secure Video Meeting</h2>
           <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-sm max-w-sm">
             To ensure maximum performance and bypass browser limits, your enterprise video call will open in a new secure window.
           </p>
           
           <div className="flex flex-col gap-3 w-full">
             <Button 
               size="lg" 
               className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-[15px] rounded-xl shadow-md hover:shadow-lg transition-all"
               onClick={() => window.open(roomUrl, '_blank')}
             >
               Launch Meeting
               <ExternalLink className="w-5 h-5 ml-2 opacity-80" />
             </Button>
             <Button variant="ghost" className="text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl h-11" onClick={() => {
                navigator.clipboard.writeText(roomUrl);
                toast({ description: "Meeting link copied to clipboard!" });
             }}>
               Copy Link
             </Button>
           </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!roomUrl) return;
    let callObject = null;
    let cancelled = false;

    import('@daily-co/daily-js').then((DailyIframe) => {
      if (cancelled) return;
      callObject = DailyIframe.default.createCallObject();
      const joinOpts = { url: roomUrl };
      if (typeof token === 'string' && token.length > 0) {
        joinOpts.token = token;
      }
      callObject
        .join(joinOpts)
        .catch((err) => console.error('Daily join failed:', err));
      setDaily(callObject);
    });

    return () => {
      cancelled = true;
      if (callObject) {
        callObject.leave().catch(() => {});
        callObject.destroy();
      }
      setDaily(null);
    };
  }, [roomUrl, token]);

  if (!daily || !roomUrl) {
    return (
      <div className="flex flex-col h-full bg-slate-950 rounded-xl items-center justify-center">
        <div className="w-12 h-12 rounded-full border-[3px] border-emerald-500/30 border-t-primary animate-spin mb-4"></div>
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
