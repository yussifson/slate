import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, Monitor, StopCircle, Video, Mic, MicOff, Save,
  X, ArrowLeft, Layers, Clock, CheckCircle, AlertCircle,
  Play, Pause, RotateCcw, Upload
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/api/supabaseClient';
import { logAuditEvent } from '@/lib/auditLogger';
import { useAuth } from '@/lib/AuthContext';
import { getPlanLimits, getUserPlan } from '@/lib/clipadPricing';
import PaywallModal from '@/components/clipad/PaywallModal';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { playAlertSound } from '@/lib/audioAlerts';


const MODES = [
  { id: 'screen_camera', icon: Monitor, label: 'Screen + Camera', desc: 'Picture-in-picture: screen with your face overlay' },
  { id: 'camera_only', icon: Camera, label: 'Camera Only', desc: 'Just your webcam, no screen recording' },
  { id: 'screen_only', icon: Monitor, label: 'Screen Only', desc: 'Screen and system audio, no camera' },
];

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}


const DB_NAME = 'ClipadRecordingsDB';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

const openDB = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = (e) => {
    e.target.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const saveRecordingState = async (id, chunks) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ id, chunks, timestamp: Date.now() });
    return new Promise(resolve => tx.oncomplete = resolve);
  } catch (err) { console.error('IDB Save Error:', err); }
};

const getRecordingState = async (id) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) { console.error('IDB Get Error:', err); return null; }
};

const deleteRecordingState = async (id) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    return new Promise(resolve => tx.oncomplete = resolve);
  } catch (err) { console.error('IDB Delete Error:', err); }
};

export default function RecordVideo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (!id) {
      navigate(`/record/${uuidv4()}`, { replace: true });
    }
  }, [id, navigate]);
  
  const [showRecoverPrompt, setShowRecoverPrompt] = useState(false);
  const [recoveredChunks, setRecoveredChunks] = useState(null);

  useEffect(() => {
    if (id && user && (user.clipad_plan === 'pro' || user.clipad_plan === 'enterprise')) {
      getRecordingState(id).then(state => {
        if (state && state.chunks && state.chunks.length > 0) {
          if (Date.now() - state.timestamp > 86400000) {
             deleteRecordingState(id);
          } else {
             setRecoveredChunks(state.chunks);
             setShowRecoverPrompt(true);
          }
        }
      });
    }
  }, [id, user]);

  const handleRecover = () => {
    chunksRef.current = recoveredChunks;
    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    setVideoBlob(blob);
    setRecordingUrl(url);
    setPhase('review');
    setShowRecoverPrompt(false);
  };
  
  const handleDiscardRecovery = () => {
    deleteRecordingState(id);
    setShowRecoverPrompt(false);
  };

  const [mode, setMode] = useState('screen_camera');
  const isRecordingRef = useRef(false);

  const [phase, setPhase] = useState('setup'); // setup | recording | review | uploading | done
  const [micEnabled, setMicEnabled] = useState(true);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoBlob, setVideoBlob] = useState(null);
  const [newCompanyId, setNewCompanyId] = useState(null);
  
  const handlersRef = useRef({});
  useEffect(() => {
    handlersRef.current = { toggleMicTrack, toggleWebcam, togglePause, stopRecording };
  });
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [selectedSpace, setSelectedSpace] = useState('');
  const [spaces, setSpaces] = useState([]);
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');

  const canvasRef = useRef(null);
  const previewRef = useRef(null); // main preview for screen + camera
  const playbackRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);
  const streamsRef = useRef({ screen: null, camera: null });
  const recognitionRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pipWindow, setPipWindow] = useState(null);
  const [micVolume, setMicVolume] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const pipContainerRef = useRef(null);
  const recordStreamRef = useRef(null);

  useEffect(() => {
    // Load spaces user has access to
    const loadSpaces = async () => {
      if (user?.id) {
        const [mySpacesRes, memberSpacesRes] = await Promise.all([
          supabase.from('clipad_spaces').select('id, name').eq('created_by', user.id).order('created_at', { ascending: false }),
          supabase.from('clipad_space_members').select('space_id').eq('user_id', user.id)
        ]);
        const memberIds = memberSpacesRes.data?.map(m => m.space_id) || [];
        let allSpaces = mySpacesRes.data || [];
        if (memberIds.length > 0) {
          const { data: memberSpaceData } = await supabase.from('clipad_spaces').select('id, name').in('id', memberIds);
          const existingIds = new Set(allSpaces.map(s => s.id));
          allSpaces = [...allSpaces, ...(memberSpaceData || []).filter(s => !existingIds.has(s.id))];
        }
        // Also include public spaces
        const { data: publicSpaceData } = await supabase.from('clipad_spaces').select('id, name').eq('is_private', false);
        const existingIds2 = new Set(allSpaces.map(s => s.id));
        allSpaces = [...allSpaces, ...(publicSpaceData || []).filter(s => !existingIds2.has(s.id))];
        allSpaces.sort((a, b) => a.name?.localeCompare(b.name));
        setSpaces(allSpaces);
      }
    };
    loadSpaces();
    return () => stopEverything();
  }, [user?.id]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      startMediaRecorder();
      setCountdown(null);
    }
  }, [countdown]);

  const stopEverything = () => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);
    if (recognitionRef.current) recognitionRef.current.stop();
    if (audioContextRef.current) audioContextRef.current.close().catch(()=>{});
    Object.values(streamsRef.current).forEach(s => s?.getTracks().forEach(t => t.stop()));
    if (pipWindow) pipWindow.close();
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      clearInterval(timerRef.current);
    } else if (mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      const startTimeOffset = recordingSeconds * 1000;
      const newStartTime = Date.now() - startTimeOffset;
      const planLimits = getPlanLimits(user);
      const maxSeconds = planLimits.maxAsyncVideoDurationSeconds;

      timerRef.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - newStartTime) / 1000);
        setRecordingSeconds(seconds);
        
        if (seconds >= maxSeconds) {
          playAlertSound();
          stopRecording();
          setShowPaywall(true);
        }
      }, 1000);
    }
  };

  const toggleWebcam = () => {
    const track = streamsRef.current.camera?.getVideoTracks()[0];
    if (track) track.enabled = !track.enabled;
  };

  const toggleMicTrack = () => {
    setMicEnabled(!micEnabled);
    const track = streamsRef.current.camera?.getAudioTracks()[0] || streamsRef.current.screen?.getAudioTracks()[0];
    if (track) track.enabled = !micEnabled;
  };

  const startPip = async (stream) => {
    if (!('documentPictureInPicture' in window)) {
      toast({ title: 'PiP Not Supported', description: 'Your browser does not support Document PiP.', variant: 'destructive' });
      return;
    }
    try {
      // Shrink PiP window strictly to the buttons' size to avoid the 'big background card'
      const pip = await window.documentPictureInPicture.requestWindow({ width: 280, height: 72 });
      
      // Copy styles
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          if (styleSheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = styleSheet.href;
            pip.document.head.appendChild(link);
          } else if (styleSheet.cssRules) {
            const style = document.createElement('style');
            Array.from(styleSheet.cssRules).forEach(rule => style.appendChild(document.createTextNode(rule.cssText)));
            pip.document.head.appendChild(style);
          }
        } catch (e) {
          // Cross-origin stylesheet error, skip
        }
      });

      // Construct native PiP UI inside the PiP Document
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) pip.document.documentElement.classList.add('dark');
      
      pip.document.body.style.margin = '0';
      // Make the PiP window sleek and clean
      pip.document.body.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc'; 
      pip.document.body.style.display = 'flex';
      pip.document.body.style.alignItems = 'center';
      pip.document.body.style.justifyContent = 'center';
      pip.document.body.style.height = '100vh';
      pip.document.body.style.overflow = 'hidden';

      const controlsWrapper = document.createElement('div');
      controlsWrapper.style.display = 'flex';
      controlsWrapper.style.justifyContent = 'center';
      controlsWrapper.style.gap = '16px';
      controlsWrapper.style.width = '100%';
      controlsWrapper.style.height = '100%';
      controlsWrapper.style.alignItems = 'center';

      const createBtn = (iconSvg, type) => {
        const btn = document.createElement('button');
        btn.innerHTML = iconSvg;
        btn.style.padding = '12px';
        btn.style.borderRadius = '50%';
        btn.style.border = '2px solid transparent';
        btn.style.cursor = 'pointer';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.transition = 'all 0.2s';
        
        if (type === 'slate') {
          btn.style.backgroundColor = isDark ? '#334155' : '#e2e8f0';
          btn.style.color = isDark ? '#fff' : '#0f172a';
        } else if (type === 'red') {
          btn.style.backgroundColor = '#ef4444';
          btn.style.color = '#fff';
          btn.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
        }
        
        btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
        btn.onmouseout = () => btn.style.transform = 'scale(1)';
        
        return btn;
      };

      // Simple SVG icons
      const micIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>`;
      const camIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>`;
      const pauseIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
      const stopIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`;

      const micBtn = createBtn(micIcon, 'slate');
      const camBtn = createBtn(camIcon, 'slate');
      const pauseBtn = createBtn(pauseIcon, 'slate');
      const stopBtn = createBtn(stopIcon, 'red');

      let pipMicState = micEnabled;

      micBtn.onclick = () => {
        handlersRef.current.toggleMicTrack();
        pipMicState = !pipMicState;
        if (!pipMicState) {
          micBtn.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
          micBtn.style.color = '#ef4444';
          micBtn.style.boxShadow = 'none';
          micBtn.style.borderColor = 'transparent';
        } else {
          micBtn.style.backgroundColor = isDark ? '#334155' : '#e2e8f0';
          micBtn.style.color = isDark ? '#fff' : '#0f172a';
        }
      };

      camBtn.onclick = () => handlersRef.current.toggleWebcam();
      pauseBtn.onclick = () => handlersRef.current.togglePause();
      stopBtn.onclick = () => { handlersRef.current.stopRecording(); window.focus(); };
      
      // Mic glowing setup
      let audioCtx, analyser, dataArray, source, glowId;
      try {
        const track = streamsRef.current.camera?.getAudioTracks()[0] || streamsRef.current.screen?.getAudioTracks()[0];
        if (track) {
          const stream = new MediaStream([track]);
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          analyser = audioCtx.createAnalyser();
          source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 256;
          dataArray = new Uint8Array(analyser.frequencyBinCount);
          
          const updateGlow = () => {
            if (!pipMicState) {
               micBtn.style.boxShadow = 'none';
               micBtn.style.borderColor = 'transparent';
            } else {
               analyser.getByteFrequencyData(dataArray);
               const avg = dataArray.reduce((a,b)=>a+b)/dataArray.length;
               if (avg > 15) {
                 micBtn.style.boxShadow = `0 0 ${Math.min(15, avg/2)}px rgba(16, 185, 129, ${Math.min(0.6, avg/100)})`;
                 micBtn.style.borderColor = `rgba(16, 185, 129, 0.4)`;
               } else {
                 micBtn.style.boxShadow = 'none';
                 micBtn.style.borderColor = 'transparent';
               }
            }
            glowId = pip.requestAnimationFrame(updateGlow);
          };
          updateGlow();
        }
      } catch(e) { console.error('Audio glow error:', e); }

      pip.addEventListener('pagehide', () => {
        if (glowId) pip.cancelAnimationFrame(glowId);
        if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
        setPipWindow(null);
      });

      controlsWrapper.appendChild(micBtn);
      controlsWrapper.appendChild(camBtn);
      controlsWrapper.appendChild(pauseBtn);
      controlsWrapper.appendChild(stopBtn);

      pip.document.body.appendChild(controlsWrapper);

      pip.addEventListener('pagehide', () => {
        setPipWindow(null);
      });
      setPipWindow(pip);
    } catch (err) {
      console.error(err);
      toast({ title: 'PiP Failed', description: err.message, variant: 'destructive' });
    }
  };

  const startRecording = async () => {
    // Plan Limit Check: Check if user has exceeded storage or monthly recordings
    try {
      const maxStorageGB = getLimit(user, 'maxStorageGB') || 2;
      
      // Check total storage used this month (heuristic: 1 min = 15MB)
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      const { data: vids } = await supabase
        .from('clipad_videos')
        .select('duration_seconds')
        .eq('creator_id', user.id)
        .gte('created_at', firstDayOfMonth.toISOString());
      if (vids) {
        const totalSeconds = vids.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
        const totalGB = (totalSeconds * 0.25) / 1024;
        if (maxStorageGB !== Infinity && totalGB >= maxStorageGB) {
          setPaywallProps({
            featureName: "Cloud Storage Limit Reached",
            limitDescription: `You have reached the maximum monthly storage limit of ${maxStorageGB}GB for your current plan. Please upgrade to record more videos.`
          });
          setShowPaywall(true);
          return;
        }
      }

      const maxRecordings = getLimit(user, 'maxVideoRecordingsPerMonth');
      if (maxRecordings !== Infinity) {
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);
        
        const { count, error } = await supabase
          .from('clipad_videos')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', user.id)
          .gte('created_at', firstDayOfMonth.toISOString());
          
        if (count >= maxRecordings) {
          setPaywallProps({
            featureName: "Record Async Videos",
            limitDescription: `You have reached the maximum limit of ${maxRecordings} recordings this month on your current plan.`
          });
          setShowPaywall(true);
          return;
        }
      }
    } catch (err) {
      console.error("Error checking limits", err);
    }

    if (!title) {
      toast({ title: 'Missing Title', description: 'Please enter a video title before recording.', variant: 'destructive' });
      return;
    }
    const success = await prepareStreamsAndPip();
    if (success) {
      setCountdown(5);
    }
  };

  const prepareStreamsAndPip = async () => {
    try {
      // Initialize AudioContext immediately during the click event to avoid being suspended
      const audioCtx = new AudioContext();
      audioCtx.resume();
      audioContextRef.current = audioCtx;

      let screenStream = null;
      let cameraStream = null;

      if (mode === 'screen_camera' || mode === 'screen_only') {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 60 } }, audio: { echoCancellation: true, noiseSuppression: true } });
        streamsRef.current.screen = screenStream;
        // If user stops screen share from browser UI
        screenStream.getVideoTracks()[0].onended = () => stopRecording();
      }

      if (mode === 'screen_camera' || mode === 'camera_only') {
        try {
          cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }, 
            audio: micEnabled ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000, channelCount: 2 } : false 
          });
          streamsRef.current.camera = cameraStream;
        } catch (camErr) {
          console.warn("Camera failed to load:", camErr);
          toast({ title: 'Camera Unavailable', description: 'Proceeding without camera stream.', variant: 'default' });
          if (mode === 'camera_only') throw camErr;
        }
      }

      let recordStream;

      if (mode === 'screen_camera' && screenStream && cameraStream) {
        // True PiP via canvas compositing
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = 1920;
        canvas.height = 1080;

        const screenVideo = document.createElement('video');
        screenVideo.srcObject = screenStream;
        screenVideo.muted = true;
        await screenVideo.play();

        const camVideo = document.createElement('video');
        camVideo.srcObject = cameraStream;
        camVideo.muted = true;
        await camVideo.play();

        const drawFrame = () => {
          ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
          // PiP: bottom-right corner, 25% of canvas width
          const pipW = canvas.width * 0.22;
          const pipH = pipW * (camVideo.videoHeight / (camVideo.videoWidth || 1)) || pipW * 0.75;
          const pipX = canvas.width - pipW - 32;
          const pipY = canvas.height - pipH - 32;
          // Rounded clip
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(pipX, pipY, pipW, pipH, 20);
          ctx.clip();
          ctx.drawImage(camVideo, pipX, pipY, pipW, pipH);
          ctx.restore();
          // Shadow ring
          ctx.strokeStyle = 'rgba(99,102,241,0.8)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.roundRect(pipX, pipY, pipW, pipH, 20);
          ctx.stroke();
          animFrameRef.current = requestAnimationFrame(drawFrame);
        };
        drawFrame();

        // Merge audio and setup analyzer using the early initialized audioCtx
        const audioCtx = audioContextRef.current;
        const dest = audioCtx.createMediaStreamDestination();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        if (screenStream && screenStream.getAudioTracks().length > 0) {
          const screenAudio = audioCtx.createMediaStreamSource(new MediaStream(screenStream.getAudioTracks()));
          screenAudio.connect(dest);
        }
        if (cameraStream && cameraStream.getAudioTracks().length > 0 && micEnabled) {
          const micSource = audioCtx.createMediaStreamSource(new MediaStream(cameraStream.getAudioTracks()));
          micSource.connect(dest);
          micSource.connect(analyser); // Analyze mic specifically
        }

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          setMicVolume(sum / dataArray.length);
          if (mediaRecorderRef.current?.state === 'recording') {
            requestAnimationFrame(checkVolume);
          }
        };
        checkVolume();

        const canvasStream = canvas.captureStream(30);
        let recordStream = new MediaStream([...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
        recordStreamRef.current = recordStream;
        
        // Show composited canvas directly in preview window
        if (previewRef.current) {
          previewRef.current.srcObject = canvasStream;
          previewRef.current.play().catch(()=>{});
        }
      } else if (screenStream) {
        // screen_only: properly merge system audio + mic audio
        const audioCtx = audioContextRef.current;
        const dest = audioCtx.createMediaStreamDestination();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        if (screenStream.getAudioTracks().length > 0) {
          const screenAudio = audioCtx.createMediaStreamSource(new MediaStream(screenStream.getAudioTracks()));
          screenAudio.connect(dest);
        }
        if (cameraStream && cameraStream.getAudioTracks().length > 0 && micEnabled) {
          const micSource = audioCtx.createMediaStreamSource(new MediaStream(cameraStream.getAudioTracks()));
          micSource.connect(dest);
          micSource.connect(analyser);
        } else if (screenStream.getAudioTracks().length === 0 && micEnabled) {
          // No system audio AND no camera — try to get mic directly
          try {
            const micOnly = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000, channelCount: 2 }, video: false });
            streamsRef.current.mic = micOnly;
            const micSource = audioCtx.createMediaStreamSource(micOnly);
            micSource.connect(dest);
            micSource.connect(analyser);
          } catch (_) { console.warn('Mic fallback failed'); }
        }

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          setMicVolume(sum / dataArray.length);
          if (mediaRecorderRef.current?.state === 'recording') requestAnimationFrame(checkVolume);
        };
        checkVolume();

        // Combine: screen video + merged audio
        let recordStream = new MediaStream([
          ...screenStream.getVideoTracks(),
          ...dest.stream.getAudioTracks()
        ]);
        recordStreamRef.current = recordStream;
        if (previewRef.current) {
          previewRef.current.srcObject = screenStream;
          previewRef.current.play().catch(()=>{});
        }
      } else if (cameraStream) {
        // camera_only: same audio mixing
        const audioCtx = audioContextRef.current;
        const dest = audioCtx.createMediaStreamDestination();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        if (cameraStream.getAudioTracks().length > 0 && micEnabled) {
          const micSource = audioCtx.createMediaStreamSource(new MediaStream(cameraStream.getAudioTracks()));
          micSource.connect(dest);
          micSource.connect(analyser);
        }
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          setMicVolume(sum / dataArray.length);
          if (mediaRecorderRef.current?.state === 'recording') requestAnimationFrame(checkVolume);
        };
        checkVolume();
        let recordStream = new MediaStream([
          ...cameraStream.getVideoTracks(),
          ...dest.stream.getAudioTracks()
        ]);
        recordStreamRef.current = recordStream;
        if (previewRef.current) {
          previewRef.current.srcObject = cameraStream;
          previewRef.current.play().catch(()=>{});
        }
      } else {
        throw new Error('No stream available');
      }

      // Auto-open PiP if appropriate
      if (mode === 'screen_camera' || mode === 'camera_only') {
        startPip(cameraStream);
      }
      return true;
    } catch (err) {
      console.error(err);
      toast({ title: 'Stream Error', description: err.message || 'Could not acquire media.', variant: 'destructive' });
      return false;
    }
  };

  const startMediaRecorder = () => {
    if (!recordStreamRef.current) return;

    try {
      // Pick best mimeType with audio codec (opus) to guarantee audio in output
      const mimeType = 
        MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' :
        MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' :
        MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';
      const recorderOptions = mimeType ? { mimeType, videoBitsPerSecond: 3000000, audioBitsPerSecond: 128000 } : { videoBitsPerSecond: 3000000, audioBitsPerSecond: 128000 };
      const recorder = new MediaRecorder(recordStreamRef.current, recorderOptions);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = e => { if (e.data.size > 0) { chunksRef.current.push(e.data); if (user?.clipad_plan === 'pro' || user?.clipad_plan === 'enterprise') saveRecordingState(id, chunksRef.current); } };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoBlob(blob);
        setRecordingUrl(url);
        stopEverything();
        
        // Auto-save immediately upon stop
        setPhase('uploading');
        setUploadProgress(0);
        try {
          // Simulate progress
          const progressInterval = setInterval(() => setUploadProgress(p => Math.min(p + 8, 90)), 400);

          const videoTitle = title.trim() || `Recording - ${new Date().toLocaleDateString()}`;
          const fileName = `${user.id}/${Date.now()}.webm`;
          
          const { error: storageError } = await supabase.storage
            .from('clipad_videos')
            .upload(fileName, blob, { contentType: 'video/webm' });
            
          clearInterval(progressInterval);
          if (storageError) throw storageError;
          
          setUploadProgress(95);
          const publicUrl = supabase.storage.from('clipad_videos').getPublicUrl(fileName).data.publicUrl;
          
          const { data: videoRecord, error: dbError } = await supabase.from('clipad_videos').insert({
            creator_id: user.id,
            video_url: publicUrl,
            title: videoTitle,
            space_id: selectedSpace || null,
            duration_seconds: recordingSeconds,
          }).select().single();
          
          if (dbError) throw dbError;
          
          setActiveVideoId(videoRecord.id);
          toast({ title: 'Recording Auto-Saved!', description: 'Your video is securely saved. You can now edit details or share it.', variant: 'default' });
          setUploadProgress(100);
          setPhase('review');
          deleteRecordingState(id);
        } catch (err) {
          console.error('Auto-save failed:', err);
          toast({ title: 'Auto-save Failed', description: err.message || 'Please try saving manually.', variant: 'destructive' });
          setPhase('review'); // fallback to review to allow manual save attempt
        }
      };

      recorder.start(1000); // collect in 1s chunks
      setPhase('recording');
      isRecordingRef.current = true;
      setRecordingSeconds(0);
      const startTime = Date.now();
      clearInterval(timerRef.current);
      const planLimits = getPlanLimits(user);
      const maxSeconds = planLimits.maxAsyncVideoDurationSeconds;

      timerRef.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        setRecordingSeconds(seconds);
        
        if (seconds >= maxSeconds) {
          playAlertSound();
          stopRecording();
          setShowPaywall(true);
        }
      }, 1000);

      toast({ title: '● Recording started', description: 'Click Stop when done.' });

      // Start Speech Recognition
      if (micEnabled && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        try {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.onresult = (event) => {
            let finalStr = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) finalStr += event.results[i][0].transcript + ' ';
            }
            if (finalStr) setTranscript(prev => prev + finalStr);
          };
          recognition.onend = () => {
            if (isRecordingRef.current) {
              try { recognition.start(); } catch (err) {}
            }
          };
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) { console.warn("Speech recognition failed to start", e); }
      }

    } catch (err) {
      console.error(err);
      const msg = err.name === 'NotAllowedError' ? 'Permission denied. Please allow screen/camera access.' : err.message;
      toast({ title: 'Could not start recording', description: msg, variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (err) {}
    }
  };

  const uploadRecording = async () => {
    if (!videoBlob || !user) return;
    
    // If it was auto-saved, just update details and redirect
    if (activeVideoId) {
      setPhase('uploading');
      try {
        await supabase.from('clipad_videos').update({
          title: title.trim() || `Recording - ${new Date().toLocaleDateString()}`,
          description: description.trim() || null,
          space_id: selectedSpace || null,
        }).eq('id', activeVideoId);
        
        if (transcript.trim().length > 10) {
          import('@/lib/cloudflareAI').then(({ generateText }) => {
            generateText([
              { role: 'system', content: 'You are an AI assistant. Summarize the following video transcript. Return ONLY valid JSON with two keys: "summary" (a string summarizing the video concisely) and "action_items" (an array of objects, each with "title", "owner", and "context"). Do not wrap the JSON in markdown blocks.' },
              { role: 'user', content: transcript.trim() }
            ]).then(async (aiResult) => {
              try {
                let text = typeof aiResult === 'string' ? aiResult : aiResult?.response;
                if (!text) return;
                if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(text);
                
                if (parsed.summary) {
                  await supabase.from('clipad_videos').update({ ai_summary: parsed.summary }).eq('id', activeVideoId);
                }
                if (parsed.action_items && Array.isArray(parsed.action_items) && parsed.action_items.length > 0) {
                  const inserts = parsed.action_items.map(ai => ({
                    space_id: selectedSpace || null,
                    title: ai.title,
                    assigned_to: ai.owner || null,
                    context: ai.context || null,
                    is_complete: false,
                  }));
                  await supabase.from('clipad_action_items').insert(inserts);
                }
              } catch(e) { console.warn("Failed to parse AI output", e); }
            }).catch(()=>{});
          });
        }
        
        toast({ title: '✓ Details updated!', description: 'Your recording has been finalized.' });
        setTimeout(() => navigate(`/spaces/${selectedSpace || ''}`), 1000);
      } catch (err) {
        toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
        setPhase('review');
      }
      return;
    }

    // Fallback full upload if auto-save failed
    setPhase('uploading');
    setUploadProgress(0);

    try {
      const videoTitle = title.trim() || `Recording - ${new Date().toLocaleDateString()}`;
      const fileName = `${user.id}/${Date.now()}.webm`;

      const progressInterval = setInterval(() => setUploadProgress(p => Math.min(p + 8, 90)), 400);

      const { error: storageError } = await supabase.storage
        .from('clipad_videos')
        .upload(fileName, videoBlob, { contentType: 'video/webm' });

      clearInterval(progressInterval);
      if (storageError) throw storageError;

      setUploadProgress(95);
      const publicUrl = supabase.storage.from('clipad_videos').getPublicUrl(fileName).data.publicUrl;

      const { data: videoRecord, error: dbError } = await supabase.from('clipad_videos').insert({
        creator_id: user.id,
        video_url: publicUrl,
        title: videoTitle,
        space_id: selectedSpace || null,
        duration_seconds: recordingSeconds,
      }).select().single();

      if (dbError) throw dbError;

      if (transcript.trim().length > 10) {
        import('@/lib/cloudflareAI').then(({ generateText }) => {
          generateText([
            { role: 'system', content: 'You are an AI assistant. Summarize the following video transcript. Return ONLY valid JSON with two keys: "summary" (a string summarizing the video concisely) and "action_items" (an array of objects, each with "title", "owner", and "context"). Do not wrap the JSON in markdown blocks.' },
            { role: 'user', content: transcript.trim() }
          ]).then(async (aiResult) => {
            try {
              let text = typeof aiResult === 'string' ? aiResult : aiResult?.response;
              if (!text) return;
              if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(text);
              
              if (parsed.summary) {
                await supabase.from('clipad_videos').update({ ai_summary: parsed.summary }).eq('id', videoRecord.id);
              }
              if (parsed.action_items && Array.isArray(parsed.action_items) && parsed.action_items.length > 0) {
                const inserts = parsed.action_items.map(ai => ({
                  space_id: selectedSpace || null,
                  title: ai.title,
                  assigned_to: ai.owner || null,
                  context: ai.context || null,
                  is_complete: false,
                }));
                await supabase.from('clipad_action_items').insert(inserts);
              }
            } catch(e) { console.warn("Failed to parse AI output", e); }
          }).catch(()=>{});
        });
      }

      setUploadProgress(100);
      setPhase('done');
      toast({ title: '✓ Video saved!', description: 'Your recording is ready to share.' });
      deleteRecordingState(id);

      // Navigate to the watch page after a brief pause
      setTimeout(() => navigate(`/watch/${videoRecord.id}`), 1500);
    } catch (err) {
      console.error(err);
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
      setPhase('review');
    }
  };

  const discard = () => {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    setVideoBlob(null);
    setRecordingUrl(null);
    setRecordingSeconds(0);
    setTitle('');
    setDescription('');
    setTranscript('');
    setPhase('setup');
    deleteRecordingState(id);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 page-enter overflow-x-hidden pb-24 md:pb-8">
      {/* Hidden canvas for PiP compositing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center gap-3 px-6 h-16 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all hover:-translate-y-0.5">
          <ArrowLeft className="w-4 h-4 text-slate-500" /> Back
        </button>
        <span className="text-foreground font-semibold">Record Async Video</span>
        {phase === 'recording' && (
          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-primary text-sm font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {formatDuration(recordingSeconds)}
            </span>
          </div>
        )}
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* SETUP PHASE */}
        {phase === 'setup' && (
          <>
            <div>
              <h1 className="text-2xl font-black text-foreground mb-1">Choose your recording mode</h1>
              <p className="text-muted-foreground text-sm">Record a video message for your team. All recordings are stored in CliPad.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              {MODES.map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex-1 flex flex-col items-center justify-center p-4 rounded-full border transition-all duration-300 shadow-sm hover:shadow-md ${mode === m.id ? 'border-primary bg-gradient-to-r from-primary to-primary text-white scale-[1.02]' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-primary/50'}`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <Icon className="w-4 h-4" />
                      {m.label}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Video Title *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Feature Walkthrough"
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-primary/60 transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Add to Space *</label>
                <select
                  value={selectedSpace}
                  onChange={e => setSelectedSpace(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary/60 transition-all shadow-sm"
                >
                  <option value="">No space</option>
                  {spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setMicEnabled(!micEnabled)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${micEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${micEnabled ? 'left-5' : 'left-1'}`} />
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  {micEnabled ? <Mic className="w-4 h-4 text-primary" /> : <MicOff className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                  {micEnabled ? 'Microphone on' : 'Microphone off'}
                </span>
              </label>
            </div>

            <button
              onClick={startRecording}
              disabled={countdown !== null || !title.trim() || !selectedSpace}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl ${countdown !== null || !title.trim() || !selectedSpace ? 'bg-slate-400 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500'} text-white font-bold shadow-2xl shadow-red-500/25 transition-all hover:scale-[1.02]`}
            >
              <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
              {countdown !== null ? `Starting in ${countdown}...` : 'Start Recording'}
            </button>
          </>
        )}

        {/* COUNTDOWN OVERLAY */}
        {countdown !== null && countdown > 0 && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-9xl font-black text-white animate-pulse">
              {countdown}
            </div>
          </div>
        )}

        {/* RECORDING PHASE */}
        {phase === 'recording' && (
          <div className="flex flex-col items-center gap-8">
            <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden bg-black aspect-video">
              {mode === 'screen_camera' && (
                <>
                  <video ref={previewRef} autoPlay muted playsInline className="w-full h-full object-contain" />
                </>
              )}
              {mode === 'camera_only' && (
                <video ref={previewRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
              )}
              {mode === 'screen_only' && (
                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                  <div className="text-center text-muted-foreground">
                    <Monitor className="w-16 h-16 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Recording your screen…</p>
                  </div>
                </div>
              )}

              {/* Recording indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-foreground text-sm font-mono font-bold">{formatDuration(recordingSeconds)}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={togglePause}
                className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold transition-all"
              >
                {isPaused ? <Play className="w-5 h-5 text-emerald-500" /> : <Pause className="w-5 h-5" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              
              {!pipWindow && ('documentPictureInPicture' in window) && (
                <button
                  onClick={() => startPip(streamsRef.current?.camera)}
                  className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30 font-bold transition-all"
                >
                  <Monitor className="w-5 h-5" /> Open PiP Controls
                </button>
              )}

              <button
                onClick={stopRecording}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-foreground font-bold shadow-xl shadow-red-500/25 transition-all ml-auto"
              >
                <StopCircle className="w-5 h-5" /> Stop Recording
              </button>
            </div>
          </div>
        )}

        {/* REVIEW PHASE */}
        {phase === 'review' && recordingUrl && (
          <div className="space-y-6">
            {!activeVideoId && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-500">Unsaved Draft</h4>
                  <p className="text-xs text-amber-500/80 mt-1">This recording is stored locally and will be permanently deleted in 24 hours. Please click Save to upload it.</p>
                </div>
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Review your recording</h2>
              <p className="text-muted-foreground text-sm">{formatDuration(recordingSeconds)} · {(videoBlob?.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black aspect-video">
              <video ref={playbackRef} src={recordingUrl} controls className="w-full h-full object-contain" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Title *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Give your video a title"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Space *</label>
                <select
                  value={selectedSpace}
                  onChange={e => setSelectedSpace(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500/60 transition-all"
                >
                  <option value="">No space</option>
                  {spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {activeVideoId && (
              <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">Share Link</h4>
                  <p className="text-xs text-indigo-700/70 dark:text-indigo-300/70">{window.location.origin}/watch/{activeVideoId}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/watch/${activeVideoId}`);
                    toast({ title: 'Copied!', description: 'Share link copied to clipboard.' });
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Copy
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Description (optional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this video about?"
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-all resize-none"
              />
            </div>

            <div className="flex gap-4">
              <button onClick={discard} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary border border-border text-gray-400 font-semibold text-sm transition-all">
                <RotateCcw className="w-4 h-4" /> Discard
              </button>
              <button onClick={uploadRecording} disabled={!title.trim() || !selectedSpace} className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-foreground font-bold shadow-lg shadow-primary/25 transition-all">
                <Upload className="w-4 h-4" /> {activeVideoId ? 'Save Details' : 'Save to CliPad'}
              </button>
            </div>
          </div>
        )}

        {/* UPLOADING PHASE */}
        {phase === 'uploading' && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-indigo-500/20 flex items-center justify-center mb-2">
              <Upload className="w-8 h-8 text-primary animate-bounce" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Uploading your video…</h2>
            <div className="w-80">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Uploading</span><span>{uploadProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary/80 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* DONE PHASE */}
        {phase === 'done' && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Video saved!</h2>
            <p className="text-muted-foreground text-sm">Redirecting to your video…</p>
          </div>
        )}
      </div>
      
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="Longer Recordings"
        limitDescription={`You have reached the ${getUserPlan(user) === 'pro' ? '1-hour' : '15-minute'} recording limit on the ${getUserPlan(user)} plan.`}
      />
    </div>
  );
}
