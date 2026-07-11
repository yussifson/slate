import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, AlertCircle, Activity, Sparkles, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
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
    
          </div>
        </div>
      </div>
    </div>
  );
}
