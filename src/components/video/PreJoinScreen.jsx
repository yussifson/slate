import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, AlertCircle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function PreJoinScreen({ roomName, onJoin, defaultName = '' }) {
  const [userName, setUserName] = useState(defaultName);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [error, setError] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [volume, setVolume] = useState(0);
  
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
        console.warn("Could not access camera/mic for pre-join preview", err);
        if (mounted) {
          // If they explicitly denied, or no device found
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
  }, []); // Run once on mount

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
        // Amplify average for visual effect (0 to 100)
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

  // Toggle handlers for the preview tracks
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
    
    // Stop local preview tracks before passing control to Daily
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    onJoin({
      name: userName.trim(),
      micOn: isMicOn,
      videoOn: isVideoOn
    });
  };

  return (
    <div className="w-screen h-screen bg-slate-50 dark:bg-[#090E17] flex flex-col md:flex-row items-center justify-center p-4 gap-8 overflow-y-auto">
      
      {/* Left Side: Camera Preview */}
      <div className="flex flex-col items-center w-full max-w-3xl">
        <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl border border-slate-200/60 dark:border-white/10 flex items-center justify-center transition-colors">
          
          {/* Video element is always rendered to preserve srcObject, but hidden when isVideoOn is false */}
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover transform -scale-x-100 ${!isVideoOn ? 'hidden' : ''}`} 
          />
          
          {!isVideoOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 z-10">
              <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-200/50 dark:border-white/5">
                <VideoOff className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="font-medium text-lg text-slate-600 dark:text-slate-300 tracking-wide">Camera is off</p>
            </div>
          )}

          {error && (
            <div className="absolute top-4 left-4 right-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 px-5 py-4 rounded-2xl flex items-start gap-3 backdrop-blur-xl shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Overlay Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20">
            {/* Audio Visualizer */}
            <div className={`flex items-center gap-1.5 h-6 transition-opacity duration-300 ${isMicOn ? 'opacity-100' : 'opacity-0'}`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i}
                  className="w-1.5 bg-green-500 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(20, volume * (Math.random() * 0.5 + 0.5))}%` }}
                />
              ))}
            </div>

            <div className="flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 py-3 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-lg shadow-black/5">
              <Button 
                onClick={toggleMic}
                variant={isMicOn ? "outline" : "destructive"}
                size="icon"
                className={`w-14 h-14 rounded-full shadow-sm transition-all duration-300 ${isMicOn ? 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700' : ''}`}
              >
                {isMicOn ? <Mic className="w-6 h-6 text-slate-700 dark:text-slate-300" /> : <MicOff className="w-6 h-6" />}
              </Button>
              <Button 
                onClick={toggleVideo}
                variant={isVideoOn ? "outline" : "destructive"}
                size="icon"
                className={`w-14 h-14 rounded-full shadow-sm transition-all duration-300 ${isVideoOn ? 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700' : ''}`}
              >
                {isVideoOn ? <VideoIcon className="w-6 h-6 text-slate-700 dark:text-slate-300" /> : <VideoOff className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Join Form */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl border border-slate-200/60 dark:border-white/10 p-10 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Ready to join?</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">{roomName || 'Secure Meeting'}</p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Your Name</label>
            <input
              type="text"
              placeholder="e.g. Jane Doe"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-lg transition-shadow"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && userName.trim()) handleJoinClick(); }}
            />
          </div>

          <Button
            className="w-full py-7 text-xl rounded-2xl font-semibold shadow-lg shadow-primary/25"
            disabled={!userName.trim()}
            onClick={handleJoinClick}
          >
            Ask to join
          </Button>

          <Button
            variant="ghost"
            className="w-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-6 rounded-2xl font-medium"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast({ title: 'Copied!', description: 'Meeting link copied to clipboard.' });
            }}
          >
            Copy meeting link
          </Button>
        </div>
      </div>

    </div>
  );
}
