import React, { useEffect, useState, useRef} from 'react';
import DailyIframe from '@daily-co/daily-js';
import { useTranslation} from "react-i18next";
import { 
 DailyProvider, 
 useLocalSessionId, 
 useParticipantIds, 
 useVideoTrack, 
 useAudioTrack,
 useDaily,
 useDailyEvent,
 useScreenShare,
 useParticipant,
 useActiveSpeakerId
} from '@daily-co/daily-react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, MonitorUp, Sparkles, LayoutGrid, Maximize2, Minimize2, ExternalLink, MessageSquare, Send, X, UserPlus, Mail} from 'lucide-react';
import { Button} from "@/components/ui/button";
import { generateText} from "@/lib/cloudflareAI";
import { useToast} from "@/components/ui/use-toast";
import { OrbitLoader } from "@/components/ui/orbit-loader";

// Inner component that actually uses the Daily hooks
function VideoRoomInner({ roomUrl, onLeave, isPipMode, togglePipMode}) {
 const { t} = useTranslation();
 const daily = useDaily();
 const localSessionId = useLocalSessionId();
 const participantIds = useParticipantIds();
 const { screens, isSharingScreen, startScreenShare, stopScreenShare} = useScreenShare();
 const localAudioTrack = useAudioTrack(localSessionId);
 const localVideoTrack = useVideoTrack(localSessionId);
 const activeSpeakerId = useActiveSpeakerId();
 
 const [joined, setJoined] = useState(daily ? daily.meetingState() === 'joined-meeting' : false);
 const isMuted = localAudioTrack?.state !== 'playable';
 const isVideoOff = localVideoTrack?.state !== 'playable';
 const { toast} = useToast();
 const [isAiLoading, setIsAiLoading] = useState(false);
 const [aiResponse, setAiResponse] = useState(null);
 const [transcriptData, setTranscriptData] = useState([]);
 const [showInvite, setShowInvite] = useState(false);
 const [inviteEmail, setInviteEmail] = useState("");

 const handleInvite = () => {
 if (!inviteEmail.trim()) return;
 
 navigator.clipboard.writeText(roomUrl);
 const subject = encodeURIComponent("You're invited to a secure video meeting");
 const body = encodeURIComponent(`Please join my active video meeting here:\n${roomUrl}\n\nNo account is required. When you click the link, just type your name to join!`);
 window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
 
 toast({ title: "Email Client Opened", description: `Link copied and drafted for ${inviteEmail}.`});
 setInviteEmail("");
 setShowInvite(false);
};

 useDailyEvent('joined-meeting', () => {
 setJoined(true);
});

 useDailyEvent('left-meeting', () => {
 setJoined(false);
 onLeave();
});

 useDailyEvent('participant-left', (ev) => {
    toast({
      title: "Participant Left",
      description: `${ev.participant.user_name || 'A participant'} left the meeting.`,
    });
  });

 useDailyEvent('error', (ev) => {
 console.error('Daily error:', ev);
 toast({
 title: 'Video connection error',
 description: ev?.errorMsg || 'Could not connect to the meeting room.',
 variant: 'destructive'});
});

 const ensureJoined = () => {
 if (daily && daily.meetingState() === 'joined-meeting') return true;
 toast({
 title: 'Connecting…',
 description: 'Wait until the call has connected before using camera or mic.'});
 return false;
};

 const toggleAudio = async () => {
 if (!ensureJoined()) return;
 try {
 await daily.setLocalAudio(isMuted);
} catch (err) {
 console.error(err);
 toast({ title: 'Microphone error', description: err?.message || 'Could not access microphone.', variant: 'destructive'});
}
};

 const toggleVideo = async () => {
 if (!ensureJoined()) return;
 try {
 await daily.setLocalVideo(isVideoOff);
} catch (err) {
 console.error(err);
 toast({ title: 'Camera error', description: err?.message || 'Could not access camera.', variant: 'destructive'});
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
 toast({ title: 'Screen share failed', description: err?.message || 'Could not share screen.', variant: 'destructive'});
}
};

 const leaveCall = () => {
 if (!daily) return;
 daily.leave();
};

 // --- REAL-TIME AI TRANSCRIPTION ---
 useEffect(() => {
 if (!joined || isMuted || !window.webkitSpeechRecognition) return;
 
 let recognition;
 try {
 const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
 recognition = new SpeechRecognition();
 recognition.continuous = true;
 recognition.interimResults = false;
 
 recognition.onresult = (event) => {
 const lastResult = event.results[event.results.length - 1];
 if (lastResult.isFinal) {
 const text = lastResult[0].transcript;
 const msg = { type: 'transcription', text, name: 'Me'};
 if (daily) daily.sendAppMessage(msg, '*');
 setTranscriptData(prev => [...prev, { name: 'Me', text}]);
}
};
 
 recognition.start();
} catch (e) {
 console.warn("Speech recognition error:", e);
}
 
 return () => {
 if (recognition) {
 try { recognition.stop();} catch (e) {}
}
};
}, [joined, isMuted, daily]);

 const handleAiAssist = async () => {
   if (transcriptData.length === 0) {
     setAiResponse("No meaningful conversation detected yet. Please make sure your microphone is unmuted and speak clearly to generate a meeting transcript.");
     return;
   }

   setIsAiLoading(true);
   setAiResponse(null);
   toast({ title: "Orbit Meeting AI", description: "Generating meeting summary and action items..."});
   try {
     const meetingContext = transcriptData.map(t => `${t.name}: ${t.text}`).join('\n');

     const messages = [
       { role: 'system', content: 'You are an AI meeting assistant. Summarize the following meeting transcript into concise bullet points, specifically extracting any "Action Items" or decisions made. Format elegantly using basic HTML (like <ul>, <li>, <strong>) but do not use markdown blocks.'},
       { role: 'user', content: meetingContext}
     ];
     let response = await generateText(messages);
     if (typeof response !== 'string') response = response.response || response.text || JSON.stringify(response);
     setAiResponse(response || "Meeting concluded without action items.");
   } catch (err) {
     console.error(err);
     toast({ title: "AI Error", description: "Failed to connect to AI backend.", variant: "destructive"});
   } finally {
     setIsAiLoading(false);
   }
 };

 const handleAiFollowUp = async () => {
   if (transcriptData.length === 0) {
     setAiResponse("Not enough transcript data to draft a follow-up email.");
     return;
   }

   setIsAiLoading(true);
   setAiResponse(null);
   toast({ title: "Orbit Meeting AI", description: "Drafting follow-up email..."});
   try {
     const meetingContext = transcriptData.map(t => `${t.name}: ${t.text}`).join('\n');

     const messages = [
       { role: 'system', content: 'You are an AI assistant. Draft a professional follow-up email to the participants based on the transcript. Include a summary and next steps. Use basic HTML formatting (like <p>, <strong>, <br>) without markdown blocks.'},
       { role: 'user', content: meetingContext}
     ];
     let response = await generateText(messages);
     if (typeof response !== 'string') response = response.response || response.text || JSON.stringify(response);
     setAiResponse(`<strong>Drafted Follow-Up Email:</strong><br/><br/>${response}`);
   } catch (err) {
     console.error(err);
     toast({ title: "AI Error", description: "Failed to connect to AI backend.", variant: "destructive"});
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
 setChatMessages(prev => [...prev, { from: ev.fromId, name: ev.data.name, text: ev.data.text, time: new Date()}]);
}
 if (ev.data && ev.data.type === 'transcription') {
 setTranscriptData(prev => [...prev, { name: 'Participant', text: ev.data.text}]);
}
});

 const sendChatMessage = () => {
 if (!chatInput.trim() || !daily) return;
 const msg = { type: 'chat', text: chatInput.trim(), name: 'Me'};
 daily.sendAppMessage(msg, '*');
 setChatMessages(prev => [...prev, { from: 'local', name: 'Me', text: chatInput.trim(), time: new Date()}]);
 setChatInput("");
};

 return (
 <div className="flex flex-col h-full bg-background rounded-xl overflow-hidden relative border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 group">
 
 {/* Main Layout Area */}
 <div className="flex-1 flex flex-row relative min-w-0 overflow-hidden">
 
 {/* Video Content Area */}
 <div className="flex-1 flex flex-col relative min-w-0">
 {/* AI Response Overlay */}
 {aiResponse && (
 <div className="absolute top-4 left-4 right-4 z-40 bg-card/95 backdrop-blur-md border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 rounded-xl animate-in fade-in max-h-[80%] overflow-y-auto hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex items-center justify-between mb-3 border-b border-primary/40 pb-2">
 <h3 className="font-semibold flex items-center gap-2 text-primary"><Sparkles className="w-4 h-4"/> AI Meeting Notes</h3>
 <Button variant="ghost" size="sm" onClick={() => setAiResponse(null)} className="h-6 px-2 text-xs tracking-[0.04em]">Close</Button>
 </div>
 <div className="text-sm prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\n/g, '<br/>')}} />
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
  {(() => {
    const allParticipants = [localSessionId, ...participantIds.filter(id => id !== localSessionId)].filter(Boolean);
    const mainSpeakerId = activeSpeakerId || (allParticipants.length > 1 ? allParticipants.find(id => id !== localSessionId) : localSessionId);
    const sidebarParticipants = allParticipants.filter(id => id !== mainSpeakerId);

    return (
      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden bg-muted/30">
        {/* Main Stage Area */}
        <div className="flex-[3] relative rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10 shadow-inner bg-slate-900">
          {screens.length > 0 ? (
            screens.map(screen => (
              <ScreenShareTile key={screen.screenId} screen={screen} className="w-full h-full absolute inset-0" />
            ))
          ) : mainSpeakerId ? (
            <ParticipantTile id={mainSpeakerId} isLocal={mainSpeakerId === localSessionId} className="w-full h-full absolute inset-0 !m-0 !border-0 !rounded-none" />
          ) : null}
        </div>
        {/* Participant Sidebar */}
        <div className="flex-1 lg:max-w-[320px] flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto min-h-[140px] lg:min-h-0 items-center lg:items-stretch content-start">
          {sidebarParticipants.map(id => (
            <ParticipantTile key={id} id={id} isLocal={id === localSessionId} className="w-64 min-w-[16rem] lg:w-full lg:min-w-0 shrink-0 m-0" />
          ))}
          {allParticipants.length === 0 && (
            <div key="loader" className="flex items-center justify-center w-full h-full text-slate-400">
              <OrbitLoader size="md" />
            </div>
          )}
        </div>
      </div>
    );
  })()}

 {/* Chat Sidebar */}
 {showChat && (
 <div className="w-80 border-l border-primary/40 bg-card flex flex-col shrink-0 animate-in slide-in-from-right hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="h-14 border-b border-primary/40 flex items-center justify-between px-4">
 <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Meeting Chat</h3>
 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowChat(false)}>
 <X className="w-4 h-4" />
 </Button>
 </div>
 <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
 {chatMessages.map((msg, idx) => (
 <div key={idx} className={`flex flex-col ${msg.from === 'local' ? 'items-end' : 'items-start'}`}>
 <span className="text-[11px] text-[#71717a] dark:text-gray-400 mb-1">{msg.name}</span>
 <div className={`px-3 py-2 rounded-xl max-w-[85%] text-sm ${msg.from === 'local' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'}`}>
 {msg.text}
 </div>
 </div>
 ))}
 {chatMessages.length === 0 && (
 <div className="flex-1 flex items-center justify-center text-[#71717a] dark:text-gray-400 text-sm flex-col gap-2 opacity-50">
 <MessageSquare className="w-8 h-8" />
 <p>No messages yet.</p>
 </div>
 )}
 </div>
 <div className="p-3 border-t border-primary/40 flex gap-2">
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
 </div>

 {/* Control Bar */}
 <div className={`bg-card border-t border-primary/40 flex items-center justify-center z-10 transition-all ${isPipMode ? 'h-12 px-2 gap-2' : 'h-20 px-6 gap-4'}`}>
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
 title="Chat"
 >
 <MessageSquare className="w-5 h-5" />
 </Button>
 <Button 
 onClick={() => setShowInvite(!showInvite)}
 variant={showInvite ? "default" : "secondary"}
 size="icon"
 className="w-12 h-12 rounded-full hidden sm:flex relative"
 title="Quick Connect / Invite"
 >
 <UserPlus className="w-5 h-5" />
 </Button>
 <Button 
  variant="secondary"
  onClick={handleAiAssist}
  disabled={isAiLoading}
  className="h-12 px-5 rounded-full font-semibold gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
 >
  <Sparkles className="w-4 h-4" /> {isAiLoading ? "Processing..." : "AI Notes"}
 </Button>
 <Button 
  variant="secondary"
  onClick={handleAiFollowUp}
  disabled={isAiLoading}
  className="h-12 px-5 rounded-full font-semibold gap-2 hover:bg-primary hover:text-primary-foreground transition-colors hidden lg:flex"
 >
  <Mail className="w-4 h-4" /> AI Follow-Up
 </Button>
 </>
 )}
 <Button 
 onClick={leaveCall}
 variant="destructive"
 className={`${isPipMode ? 'h-8 w-8 p-0' : 'h-12 px-8 ml-4'} rounded-full font-semibold flex items-center justify-center`}
 >
 {isPipMode ? <PhoneOff className="w-3 h-3" /> : <><PhoneOff className="w-5 h-5 mr-2" /> Leave</>}
 </Button>
 </div>
 
 {/* Invite Sidebar/Popup */}
 {showInvite && !isPipMode && (
 <div className="absolute bottom-24 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-6 w-[340px] bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl p-5 z-50 animate-in fade-in slide-in-from-bottom-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex items-center justify-between mb-3">
 <h3 className="font-semibold flex items-center gap-2"><UserPlus className="w-4 h-4 text-primary"/> Quick Connect</h3>
 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowInvite(false)}><X className="w-4 h-4" /></Button>
 </div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mb-4">Invite external clients or guests instantly to this call. No account required.</p>
 <div className="flex gap-2">
 <input 
 type="email" 
 placeholder="guest@email.com" 
 className="flex-1 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
 value={inviteEmail}
 onChange={(e) => setInviteEmail(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
 />
 <Button onClick={handleInvite} className="font-semibold ">Invite</Button>
 </div>
 </div>
 )}
 </div>
 );
}

function ScreenShareTile({ screen, className }) {
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
 <div className={`relative bg-slate-800 rounded-xl overflow-hidden group flex items-center justify-center ${className || ''}`}>
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
 
 <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
 <span className="text-white text-xs font-semibold tracking-wide">{screen.local ? "Your Screen" : "Shared Screen"}</span>
 </div>
 </div>
 );
}

const avatarColors = [
  'bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 
  'bg-violet-500', 'bg-fuchsia-500', 'bg-rose-500', 
  'bg-amber-500', 'bg-teal-500', 'bg-cyan-500'
];

function ParticipantTile({ id, isLocal, className }) {
 const videoState = useVideoTrack(id);
 const audioState = useAudioTrack(id);
 const participant = useParticipant(id);
 const videoRef = useRef(null);
 const audioRef = useRef(null);
 
 const displayName = participant?.user_name || (isLocal ? "You" : "Participant");
 const initials = displayName.substring(0, 2).toUpperCase();
 
 const avatarColor = React.useMemo(() => {
  let hash = 0;
  for (let i = 0; i < displayName.length; i++) {
   hash = displayName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
 }, [displayName]);

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
 <div className={`relative bg-slate-100 dark:bg-slate-800/50 rounded-2xl overflow-hidden group flex items-center justify-center aspect-video shadow-sm border border-slate-200 dark:border-white/10 ${className || 'w-full max-w-3xl min-w-[320px] m-2'}`}>
 {videoState?.state === 'playable' ? (
 <video 
 ref={videoRef}
 autoPlay 
 muted={isLocal} 
 playsInline 
 className="w-full h-full object-cover"
 />
 ) : (
 <div className={`w-24 h-24 ${avatarColor} rounded-full flex items-center justify-center shadow-lg`}>
 <span className="text-3xl text-white font-bold tracking-tight">{initials}</span>
 </div>
 )}
 
 {!isLocal && <audio ref={audioRef} autoPlay playsInline />}
 
  <div className={`absolute bottom-6 left-6 ${avatarColor} px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg ring-2 ring-white/20 dark:ring-black/20 backdrop-blur-md transition-all`}>
  <span className="text-white text-xs font-bold tracking-wide">{displayName}</span>
  {audioState?.state !== 'playable' && <MicOff className="w-3.5 h-3.5 text-white/90" />}
  </div>
 </div>
 );
}

// Wrapper to initialize Daily provider
export default function VideoRoom({ roomUrl, token, onLeave, isPipMode, togglePipMode, userName, initialAudio = true, initialVideo = true }) {
 const [daily, setDaily] = useState(null);
 // Keep a ref so the cleanup closure always has access to the latest callObject
 // without triggering re-renders on creation
 const callRef = useRef(null);

 useEffect(() => {
  if (!roomUrl) return;

  let cancelled = false;

  const initDaily = async () => {
   if (cancelled) return;

   // Destroy any pre-existing instance to prevent 'Duplicate DailyIframe instances' errors
   try {
    const existing = DailyIframe.getCallInstance();
    if (existing) {
     try { await existing.leave(); } catch (_) {}
     try { existing.destroy(); } catch (_) {}
    }
   } catch (_) {}

   // Also destroy our own tracked ref if it's still around
   if (callRef.current) {
    try { await callRef.current.leave(); } catch (_) {}
    try { callRef.current.destroy(); } catch (_) {}
    callRef.current = null;
   }

   if (cancelled) return;

   const callObject = DailyIframe.createCallObject();
   callRef.current = callObject;

   const joinOpts = { url: roomUrl, audioSource: initialAudio, videoSource: initialVideo };
   if (typeof token === 'string' && token.length > 0) {
    joinOpts.token = token;
   }
   if (typeof userName === 'string' && userName.trim().length > 0) {
    joinOpts.userName = userName.trim();
   }

   try {
    await callObject.startCamera();
    if (cancelled) return;
    await callObject.join(joinOpts);
   } catch (camErr) {
    console.warn('Camera/Mic permission denied or joining error.', camErr);
    if (cancelled) return;
    try { await callObject.join({ url: roomUrl, userName: joinOpts.userName, token: joinOpts.token }); } catch (e) { console.error(e); }
   }

   if (cancelled) return;
   setDaily(callObject);
  };

  initDaily().catch(console.error);

  return () => {
   cancelled = true;
   // Async cleanup: leave + destroy without blocking React
   const cleanup = async () => {
    const obj = callRef.current;
    if (obj) {
     callRef.current = null;
     try { await obj.leave(); } catch (_) {}
     try { obj.destroy(); } catch (_) {}
    }
   };
   cleanup();
   setDaily(null);
  };
 }, [roomUrl, token]);

  if (!daily || !roomUrl) {
   return (
    <div className="flex flex-col h-full bg-white dark:bg-[#090E17] rounded-xl items-center justify-center gap-4">
     <div className="w-16 h-16 relative flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-white/5" />
      <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      <VideoIcon className="w-6 h-6 text-primary" />
     </div>
     <p className="text-slate-500 font-medium tracking-wide animate-pulse">Connecting to secure video server...</p>
    </div>
   );
  }

 return (
  <DailyProvider callObject={daily}>
   <VideoRoomInner roomUrl={roomUrl} onLeave={onLeave} isPipMode={isPipMode} togglePipMode={togglePipMode} />
  </DailyProvider>
 );
}


