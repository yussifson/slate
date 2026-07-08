import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, AlertCircle, Sparkles, Copy, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { VIRTUAL_BACKGROUNDS } from './VideoRoom';

export default function PreJoinScreen({ roomName, onJoin, defaultName = '' }) {
  const [userName, setUserName] = useState(defaultName);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [error, setError] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [volume, setVolume] = useState(0);
  const [selectedBg, setSelectedBg] = useState(VIRTUAL_BACKGROUNDS[0]);
  
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        setLocalStream(stream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Apply initial toggle states
        stream.getAudioTracks().forEach(track => {
          track.enabled = isMicOn;
        });
        stream.getVideoTracks().forEach(track => {
          track.enabled = isVideoOn;
        });

        setError(null);
      } catch (err) {
        if (err.name !== 'NotFoundError') {
          console.warn("Could not access camera/mic for pre-join preview", err);
        }
        if (mounted) {
          setError("Camera or microphone access denied. You can still join without them.");
          setIsMicOn(false);
          setIsVideoOn(false);
        }
      }
    };

    startMedia();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Audio Visualizer Effect
  useEffect(() => {
    if (!localStream || !isMicOn) {
      setVolume(0);
      return;
    }

    let audioContext;
    let analyser;
    let microphone;
    let animationFrame;

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 256;

      microphone = audioContext.createMediaStreamSource(localStream);
      microphone.connect(analyser);

      const checkVolume = () => {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        let values = 0;
        for (let i = 0; i < array.length; i++) {
          values += array[i];
        }
        const average = values / array.length;

        setVolume(Math.min(100, Math.round((average / 256) * 100 * 3)));
        animationFrame = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn("AudioContext error for visualizer", err);
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(console.error);
      }
    };
  }, [localStream, isMicOn]);

  const toggleMic = () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = newState;
      });
    }
  };

  const toggleVideo = () => {
    const newState = !isVideoOn;
    setIsVideoOn(newState);
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = newState;
      });
    }
  };

  const handleJoinClick = () => {
    if (!userName.trim()) {
      toast({ title: 'Name required', description: 'Please enter your name to join.', variant: 'destructive' });
      return;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    onJoin({
      name: userName.trim(),
      micOn: isMicOn,
      videoOn: isVideoOn,
      backgroundConfig: selectedBg
    });
  };

  return (
    <div className="w-screen h-screen bg-[#F8FAFC] dark:bg-[#030712] flex flex-col lg:flex-row items-center justify-center p-6 lg:p-12 gap-8 lg:gap-16 relative overflow-hidden font-sans">
      
      {/* Fluid Dynamics Background Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[30%] -left-[10%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-primary/20 to-blue-500/10 blur-[120px] dark:from-primary/10 dark:to-blue-500/5 mix-blend-multiply dark:mix-blend-screen" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-tr from-cyan-400/20 to-emerald-400/10 blur-[140px] dark:from-cyan-400/10 dark:to-emerald-400/5 mix-blend-multiply dark:mix-blend-screen" 
        />
      </div>

      {/* Left Side: Camera Preview */}
      <motion.div 
        initial={{ opacity: 0, x: -30, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex-1 flex flex-col items-center lg:items-end justify-center w-full max-w-3xl"
      >
        <div className="relative w-full aspect-video bg-white/20 dark:bg-black/20 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden flex items-center justify-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-white/50 dark:border-white/10 group">
          
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 ${!isVideoOn ? 'opacity-0' : 'opacity-100'}`} 
          />
          
          <AnimatePresence>
            {!isVideoOn && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md z-10"
              >
                <div className="w-24 h-24 bg-white/10 dark:bg-black/20 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/20 dark:border-white/5">
                  <VideoOff className="w-10 h-10 text-white drop-shadow-md" />
                </div>
                <p className="font-semibold text-xl text-white tracking-wide drop-shadow-md">Camera is off</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-6 left-6 right-6 bg-rose-500/90 backdrop-blur-md border border-rose-400/50 text-white px-6 py-4 rounded-2xl flex items-start gap-4 shadow-xl z-20"
              >
                <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                <p className="text-sm font-semibold leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Controls Dock */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-20 w-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Audio Visualizer */}
            <div className={`flex items-center gap-1.5 h-6 transition-all duration-300 ${isMicOn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i}
                  className="w-1.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-75"
                  style={{ height: `${Math.max(20, volume * (Math.random() * 0.5 + 0.5))}%` }}
                />
              ))}
            </div>

            <div className="flex items-center gap-3 bg-white/20 dark:bg-black/40 backdrop-blur-xl px-5 py-3 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-white/30 dark:border-white/10">
              <Button 
                onClick={toggleMic}
                variant={isMicOn ? "ghost" : "destructive"}
                size="icon"
                className={`w-12 h-12 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${isMicOn ? 'hover:bg-white/20 text-white' : 'shadow-lg shadow-rose-500/30'}`}
              >
                {isMicOn ? <Mic className="w-5 h-5 drop-shadow-md" /> : <MicOff className="w-5 h-5 text-white" />}
              </Button>
              <Button 
                onClick={toggleVideo}
                variant={isVideoOn ? "ghost" : "destructive"}
                size="icon"
                className={`w-12 h-12 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${isVideoOn ? 'hover:bg-white/20 text-white' : 'shadow-lg shadow-rose-500/30'}`}
              >
                {isVideoOn ? <VideoIcon className="w-5 h-5 drop-shadow-md" /> : <VideoOff className="w-5 h-5 text-white" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Virtual Background Selector */}
        <div className="w-full mt-6 bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-[2rem] p-5 shadow-xl border border-white/50 dark:border-white/10">
          <div className="flex items-center justify-between mb-4 px-2">
             <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-wide">Virtual Background</h3>
             <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">Preview applies after joining</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-2 custom-scrollbar snap-x">
             {VIRTUAL_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBg(bg)}
                  className={`relative shrink-0 snap-center rounded-2xl overflow-hidden transition-all duration-300 ${
                    selectedBg.id === bg.id 
                      ? 'ring-4 ring-primary shadow-lg shadow-primary/30 scale-105 z-10' 
                      : 'hover:ring-2 hover:ring-primary/50 opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{ width: '100px', height: '64px' }}
                  title={bg.label}
                >
                  {bg.type === 'none' ? (
                    <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                      <VideoOff className="w-5 h-5 text-slate-400" />
                    </div>
                  ) : bg.type === 'background-blur' ? (
                    <div className="w-full h-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center overflow-hidden relative">
                       <div className="absolute inset-0 bg-slate-400/50 backdrop-blur-md"></div>
                       <Sparkles className="w-5 h-5 text-white z-10" />
                    </div>
                  ) : (
                    <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
                  )}
                  {selectedBg.id === bg.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    </div>
                  )}
                </button>
             ))}
          </div>
        </div>
      </motion.div>

      {/* Right Side: Join Form */}
      <motion.div 
        initial={{ opacity: 0, x: 30, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="relative z-10 flex-1 flex flex-col items-center lg:items-start justify-center w-full max-w-md space-y-10 bg-white/40 dark:bg-black/40 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl border border-white/50 dark:border-white/10"
      >
        <div className="w-full text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-primary/20">
            <Sparkles className="w-3 h-3" /> Ready
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
            Join Meeting
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
            {roomName || 'Secure Meeting Room'}
          </p>
        </div>

        <div className="w-full space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider">Your Name</label>
            <input
              type="text"
              placeholder="e.g. Jane Doe"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-5 py-4 bg-white/60 dark:bg-[#111827]/60 backdrop-blur-sm border border-white/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-base font-semibold shadow-inner transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && userName.trim()) handleJoinClick(); }}
            />
          </div>

          <Button
            className="w-full h-14 text-lg rounded-2xl font-bold shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white transition-all hover:scale-105 active:scale-95 border border-white/20"
            disabled={!userName.trim()}
            onClick={handleJoinClick}
          >
            Ask to join <ChevronRight className="w-5 h-5 ml-1" />
          </Button>

          <Button
            variant="ghost"
            className="w-full h-12 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 rounded-xl font-bold transition-all"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast({ title: 'Copied!', description: 'Meeting link copied to clipboard.' });
            }}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy meeting link
          </Button>
        </div>
      </motion.div>

    </div>
  );
}
