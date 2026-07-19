import React, { useState, useRef, useEffect } from 'react';
import {
  Camera, Monitor, Mic, MicOff, CheckCircle,
  Play, Pause, AlertCircle, RefreshCw, XCircle, ArrowLeft,
  Wand2, AlignLeft, Clock, Upload, RotateCcw, Sparkles, Lock, Unlock, ChevronDown
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/api/supabaseClient';
import { generateText } from '@/lib/cloudflareAI';
import { detectDecisions, detectCommitments, writeOrgEvent } from '@/lib/clipadIntelligence';
import { useAuth } from '@/lib/AuthContext';
import { getPlanLimits, getUserPlan, getLimit } from '@/lib/clipadPricing';
import PaywallModal from '@/components/clipad/PaywallModal';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import * as tus from 'tus-js-client';
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
    if (id && user) {
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
  const [hasDisplayMedia, setHasDisplayMedia] = useState(true);

  useEffect(() => {
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
    setHasDisplayMedia(supported);
    if (!supported) setMode('camera_only');
  }, []);

  const isRecordingRef = useRef(false);

  const [phase, setPhase] = useState('setup'); // setup | recording | review | uploading | done
  const [micEnabled, setMicEnabled] = useState(true);

  const [activeVideoId, setActiveVideoId] = useState(null);
  const [selectedSpace, setSelectedSpace] = useState('');
  const [spaces, setSpaces] = useState([]);
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState('internal');
  const [lockType, setLockType] = useState('none');
  const [unlockDate, setUnlockDate] = useState('');
  const [unlockTime, setUnlockTime] = useState('');
  const [transcript, setTranscript] = useState('');

  const canvasRef = useRef(null);
  const previewRef = useRef(null); // main preview for screen + camera
  const playbackRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);
  const streamsRef = useRef({ screen: null, camera: null });
  const wsRef = useRef(null);
  const wsReconnectAttemptsRef = useRef(0);
  const wsMaxReconnects = 5;
  const wsBufferedChunksRef = useRef([]); // chunks buffered during WS outage
  const wsIsReconnectingRef = useRef(false);
  const wsEndRequestedRef = useRef(false); // true once user stops recording

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
  const [teleprompterText, setTeleprompterText] = useState('');
  const [showTeleprompter, setShowTeleprompter] = useState(true);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptPrompt, setScriptPrompt] = useState('');
  const [scrollSpeed, setScrollSpeed] = useState(3);
  const teleprompterRef = useRef(null);

  const [camPos, setCamPos] = useState({ x: 75, y: 70 });
  const camPosRef = useRef({ x: 75, y: 70 });
  const isDraggingPiP = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialCamPos = useRef({ x: 0, y: 0 });

  const handlePiPMouseDown = (e) => {
    isDraggingPiP.current = true;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    initialCamPos.current = { ...camPosRef.current };
  };

  const handlePiPMouseMove = (e) => {
    if (!isDraggingPiP.current) return;
    const container = document.getElementById('preview-container');
    if (!container) return;
    
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    
    const dxPercent = (dx / container.clientWidth) * 100;
    const dyPercent = (dy / container.clientHeight) * 100;
    
    let newX = initialCamPos.current.x + dxPercent;
    let newY = initialCamPos.current.y + dyPercent;
    
    newX = Math.max(0, Math.min(newX, 78)); // max 100 - 22 width
    newY = Math.max(0, Math.min(newY, 87)); // 100 - 13 height
    
    setCamPos({ x: newX, y: newY });
    camPosRef.current = { x: newX, y: newY };
  };

  const handlePiPMouseUp = () => {
    isDraggingPiP.current = false;
  };

  useEffect(() => {
    document.addEventListener('mousemove', handlePiPMouseMove);
    document.addEventListener('mouseup', handlePiPMouseUp);
    return () => {
      document.removeEventListener('mousemove', handlePiPMouseMove);
      document.removeEventListener('mouseup', handlePiPMouseUp);
    };
  }, []);
  
  // Clean AI output of markdown symbols so the teleprompter reads as plain spoken text
  const cleanScriptText = (text) => {
    return text
      .replace(/^#{1,6}\s*/gm, '')           // Remove heading markers (# ## ###)
      .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1') // Remove bold/italic *text*
      .replace(/_{1,3}(.*?)_{1,3}/g, '$1')   // Remove _italic_
      .replace(/^[-*+]\s+/gm, '')            // Remove bullet points
      .replace(/^\d+\.\s+/gm, '')           // Remove numbered lists
      .replace(/`{1,3}[^`]*`{1,3}/g, '')    // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
      .replace(/\n{3,}/g, '\n\n')            // Collapse excessive blank lines
      .trim();
  };

  const generateScript = async () => {
    if (!scriptPrompt.trim()) return;
    setIsGeneratingScript(true);
    try {
      const prompt = `Write a professional, engaging teleprompter script for a video recording about: ${scriptPrompt}. Write it as plain spoken text with short paragraphs. Do NOT use any markdown formatting, bullet points, asterisks, or special characters. Just write natural spoken sentences.`;
      const res = await generateText([{ role: 'user', content: prompt }]);
      if (res) setTeleprompterText(cleanScriptText(typeof res === 'string' ? res : res.response || ''));
    } catch (e) {
      console.error('Failed to generate script', e);
    }
    setIsGeneratingScript(false);
  };
  
  const refineScript = async () => {
    if (!teleprompterText.trim()) return;
    setIsGeneratingScript(true);
    try {
      const prompt = `Rewrite this teleprompter script to be much more punchy, engaging, and concise. Make it sound natural to speak. Write it as plain spoken text only. Do NOT use any markdown, bullet points, asterisks, or special characters:\n\n${teleprompterText}`;
      const res = await generateText([{ role: 'user', content: prompt }]);
      if (res) setTeleprompterText(cleanScriptText(typeof res === 'string' ? res : res.response || ''));
    } catch (e) {
      console.error('Failed to refine script', e);
    }
    setIsGeneratingScript(false);
  };
  
  useEffect(() => {
    let scrollInterval;
    if (phase === 'recording' && showTeleprompter && teleprompterText && scrollSpeed > 0) {
      scrollInterval = setInterval(() => {
        if (teleprompterRef.current) {
          teleprompterRef.current.scrollTop += scrollSpeed;
        }
      }, 100);
    }
    return () => clearInterval(scrollInterval);
  }, [phase, showTeleprompter, teleprompterText, scrollSpeed]);
  const [studioSound, setStudioSound] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingSecondsRef = useRef(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoBlob, setVideoBlob] = useState(null);
  const [recordingUrl, setRecordingUrl] = useState(null);
  const [newCompanyId, setNewCompanyId] = useState(null);
  
  const handlersRef = useRef({});
  useEffect(() => {
    handlersRef.current = { toggleMicTrack, toggleWebcam, togglePause, stopRecording };
  });

  useEffect(() => {
    const handleOffline = () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        handlersRef.current.togglePause();
        toast({ title: '⚠️ Network Disconnected', description: 'Recording paused automatically.', variant: 'destructive' });
      }
    };
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [toast]);

  // Two-Way Sync for PiP Window UI
  useEffect(() => {
    if (!pipWindow) return;
    try {
      const doc = pipWindow.document;
      
      const pauseBtn = doc.getElementById('pip-pause-btn');
      if (pauseBtn) {
        const pauseIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
        const playIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
        if (isPaused) {
          pauseBtn.innerHTML = playIcon;
          pauseBtn.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
          pauseBtn.style.color = '#10b981';
        } else {
          pauseBtn.innerHTML = pauseIcon;
          pauseBtn.style.backgroundColor = '#e2e8f0';
          pauseBtn.style.color = '#0f172a';
        }
      }

      const micBtn = doc.getElementById('pip-mic-btn');
      if (micBtn) {
        if (!micEnabled) {
          micBtn.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
          micBtn.style.color = '#ef4444';
          micBtn.style.boxShadow = 'none';
        } else {
          micBtn.style.backgroundColor = '#e2e8f0';
          micBtn.style.color = '#0f172a';
        }
      }
    } catch (err) {}
  }, [isPaused, micEnabled, pipWindow]);

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
    if (pipWindow) {
      try { pipWindow.close(); } catch(e) {}
      setPipWindow(null);
    }
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

  const startPip = async (pipPromise) => {
    if (!('documentPictureInPicture' in window)) {
      toast({ title: 'PiP Not Supported', description: 'Your browser does not support Document PiP.', variant: 'destructive' });
      return;
    }
    try {
      // Wait for the synchronously-started PiP window to resolve
      const pip = await pipPromise;
      if (!pip) return;
      
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
      // Blend the PiP background with Chrome's dark title bar
      pip.document.body.style.backgroundColor = '#202124'; 
      pip.document.body.style.display = 'flex';
      pip.document.body.style.alignItems = 'center';
      pip.document.body.style.justifyContent = 'center';
      pip.document.body.style.height = '100vh';
      pip.document.body.style.overflow = 'hidden';

      const controlsWrapper = document.createElement('div');
      controlsWrapper.style.display = 'flex';
      controlsWrapper.style.justifyContent = 'center';
      controlsWrapper.style.gap = '12px';
      controlsWrapper.style.padding = '10px 20px';
      controlsWrapper.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
      controlsWrapper.style.backdropFilter = 'blur(10px)';
      controlsWrapper.style.borderRadius = '24px';
      controlsWrapper.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
      controlsWrapper.style.position = 'absolute';
      controlsWrapper.style.bottom = '16px';
      controlsWrapper.style.transform = 'scale(0.9)';
      controlsWrapper.style.transition = 'opacity 0.2s';

      const createBtn = (iconSvg, type) => {
        const btn = document.createElement('button');
        btn.innerHTML = iconSvg;
        btn.style.padding = '14px';
        btn.style.borderRadius = '50%';
        btn.style.border = 'none';
        btn.style.cursor = 'pointer';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.transition = 'all 0.2s ease';
        
        if (type === 'slate') {
          btn.style.backgroundColor = '#e2e8f0';
          btn.style.color = '#0f172a';
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
      const micIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>`;
      const camIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>`;
      const pauseIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
      const playIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
      const stopIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect></svg>`;

      const micBtn = createBtn(micIcon, 'slate');
      const camBtn = createBtn(camIcon, 'slate');
      const pauseBtn = createBtn(pauseIcon, 'slate');
      const stopBtn = createBtn(stopIcon, 'red');

      let pipMicState = micEnabled;
      let pipCamState = true;
      let pipPauseState = false;

      micBtn.onclick = () => {
        handlersRef.current.toggleMicTrack();
        pipMicState = !pipMicState;
        if (!pipMicState) {
          micBtn.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
          micBtn.style.color = '#ef4444';
          micBtn.style.boxShadow = 'none';
        } else {
          micBtn.style.backgroundColor = '#e2e8f0';
          micBtn.style.color = '#0f172a';
        }
      };

      camBtn.onclick = () => {
        handlersRef.current.toggleWebcam();
        pipCamState = !pipCamState;
        if (!pipCamState) {
          camBtn.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
          camBtn.style.color = '#ef4444';
        } else {
          camBtn.style.backgroundColor = '#e2e8f0';
          camBtn.style.color = '#0f172a';
        }
      };

      pauseBtn.onclick = () => {
        handlersRef.current.togglePause();
        pipPauseState = !pipPauseState;
        if (pipPauseState) {
          pauseBtn.innerHTML = playIcon;
          pauseBtn.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
          pauseBtn.style.color = '#10b981';
        } else {
          pauseBtn.innerHTML = pauseIcon;
          pauseBtn.style.backgroundColor = '#e2e8f0';
          pauseBtn.style.color = '#0f172a';
        }
      };

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
            } else {
               analyser.getByteFrequencyData(dataArray);
               const avg = dataArray.reduce((a,b)=>a+b)/dataArray.length;
               if (avg > 15) {
                 micBtn.style.boxShadow = `0 0 ${Math.min(15, avg/2)}px rgba(16, 185, 129, ${Math.min(0.6, avg/100)})`;
               } else {
                 micBtn.style.boxShadow = 'none';
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

      // Add Video element for camera preview
      const videoEl = document.createElement('video');
      videoEl.autoplay = true;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.style.width = '100%';
      videoEl.style.height = '100%';
      videoEl.style.objectFit = 'cover';
      videoEl.style.transform = 'scaleX(-1)';
      videoEl.style.backgroundColor = '#000';
      if (streamsRef.current?.camera) {
        videoEl.srcObject = streamsRef.current.camera;
      }
      
      pip.document.body.appendChild(videoEl);
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
    if (!title) {
      toast({ title: 'Missing Title', description: 'Please enter a video title before recording.', variant: 'destructive' });
      return;
    }

    // IMMEDIATELY request PiP window to consume the synchronous user gesture
    let pipPromise = null;
    if (('documentPictureInPicture' in window) && (mode === 'screen_camera' || mode === 'camera_only')) {
      pipPromise = window.documentPictureInPicture.requestWindow({ width: 320, height: 180 }).catch(e => {
        console.warn('PiP auto-start failed:', e);
        return null;
      });
    }

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
      if (pipPromise) startPip(pipPromise);
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
        screenVideo.playsInline = true;
        screenVideo.srcObject = screenStream;
        screenVideo.muted = true;
        await screenVideo.play();

        const camVideo = document.createElement('video');
        camVideo.playsInline = true;
        camVideo.srcObject = cameraStream;
        camVideo.muted = true;
        await camVideo.play();

        const drawFrame = () => {
          ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
          // PiP: bottom-right corner, 25% of canvas width
          const pipW = canvas.width * 0.22;
          const pipH = pipW * (camVideo.videoHeight / (camVideo.videoWidth || 1)) || pipW * 0.75;
          // Use camPosRef percentages to position on 1920x1080 canvas
          const pipX = (camPosRef.current.x / 100) * canvas.width;
          const pipY = (camPosRef.current.y / 100) * canvas.height;
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
          previewRef.current.srcObject = mode === 'screen_camera' ? screenStream : canvasStream;
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
      if (pipPromise) {
        startPip(pipPromise);
      }
      return true;
    } catch (err) {
      console.error(err);
      toast({ title: 'Stream Error', description: 'Could not access camera or screen. ' + err.message, variant: 'destructive' });
      stopEverything();
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

      // Reset reconnect state
      wsReconnectAttemptsRef.current = 0;
      wsBufferedChunksRef.current = [];
      wsIsReconnectingRef.current = false;
      wsEndRequestedRef.current = false;

      const wsUrl = 'wss://slate-2fli.onrender.com';

      // ── Application-level heartbeat to keep Render from sleeping ──
      let wsPingInterval = null;
      const startPingInterval = (socket) => {
        wsPingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'PING' }));
          }
        }, 20000);
      };
      const stopPingInterval = () => clearInterval(wsPingInterval);

      // ── Backpressure-safe chunk sending ──
      const pendingChunks = [];
      let isFlushing = false;
      const flushChunks = (socket) => {
        if (isFlushing) return;
        isFlushing = true;
        while (pendingChunks.length > 0) {
          if (socket.readyState !== WebSocket.OPEN) break;
          if (socket.bufferedAmount > 5 * 1024 * 1024) {
            setTimeout(() => flushChunks(socket), 200);
            isFlushing = false;
            return;
          }
          const chunk = pendingChunks.shift();
          socket.send(chunk);
        }
        isFlushing = false;
      };

      const connectWS = async (isReconnect = false) => {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = async () => {
          wsIsReconnectingRef.current = false;
          wsReconnectAttemptsRef.current = 0;
          const { data: { session } } = await supabase.auth.getSession();
          ws.send(JSON.stringify({ type: 'START', userId: user.id, token: session?.access_token }));
          if (!isReconnect) {
            // First connection — start recording
            recorder.start(1000); // 1-second chunks
          } else {
            // Reconnected — replay buffered chunks first
            toast({ title: '🔄 Reconnected', description: 'Uploading buffered recording data...' });
            for (const bufferedChunk of wsBufferedChunksRef.current) {
              if (ws.readyState === WebSocket.OPEN) ws.send(bufferedChunk);
            }
            wsBufferedChunksRef.current = [];
            // If user already stopped, send END now
            if (wsEndRequestedRef.current) {
              ws.send(JSON.stringify({ type: 'END' }));
            }
          }
          startPingInterval(ws);
        };

        ws.onmessage = async (event) => {
          const msg = JSON.parse(event.data);
          if (msg.type === 'PROGRESS') {
            setUploadProgress(Math.max(msg.percent || 0, uploadProgress));
          } else if (msg.type === 'SUCCESS') {
            stopPingInterval();
            const publicUrl = supabase.storage.from('clipad_videos').getPublicUrl(msg.fileName).data.publicUrl;
            setRecordingUrl(publicUrl);

            const videoTitle = title.trim() || `Recording - ${new Date().toLocaleDateString()}`;
            const { data: videoRecord, error: dbError } = await supabase.from('clipad_videos').insert({
              creator_id: user.id,
              video_url: publicUrl,
              title: videoTitle,
              space_id: selectedSpace || null,
              duration_seconds: recordingSecondsRef.current,
            }).select().single();

            if (!dbError) {
              setActiveVideoId(videoRecord.id);
              toast({ title: 'Recording Saved!', description: 'Your video is securely saved in the cloud.', variant: 'default' });
              setUploadProgress(100);
              setPhase('review');
              deleteRecordingState(id);
            } else {
              console.error('DB insert error:', dbError);
              toast({ title: 'Save Error', description: dbError.message, variant: 'destructive' });
              setPhase('review');
            }
          } else if (msg.type === 'ERROR') {
            stopPingInterval();
            toast({ title: 'Upload Error', description: msg.error, variant: 'destructive' });
            setPhase('review');
          }
          // PONG — no-op, keepalive confirmed
        };

        ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          stopPingInterval();
        };

        ws.onclose = (evt) => {
          stopPingInterval();
          // Normal close (code 1000 / 1001) — do nothing
          if (evt.code === 1000 || evt.code === 1001) return;

          if (!isRecordingRef.current && !wsEndRequestedRef.current) return;

          const attemptsLeft = wsMaxReconnects - wsReconnectAttemptsRef.current;
          if (attemptsLeft > 0 && (isRecordingRef.current || wsEndRequestedRef.current)) {
            wsIsReconnectingRef.current = true;
            wsReconnectAttemptsRef.current++;
            const delay = Math.min(1000 * Math.pow(2, wsReconnectAttemptsRef.current - 1), 15000);
            console.warn(`WebSocket closed (code ${evt.code}), reconnecting in ${delay}ms (attempt ${wsReconnectAttemptsRef.current}/${wsMaxReconnects})`);
            toast({ title: '⚠️ Connection lost', description: `Reconnecting... (${wsReconnectAttemptsRef.current}/${wsMaxReconnects})` });
            setTimeout(() => connectWS(true), delay);
          } else {
            console.error('WebSocket permanently failed after max reconnect attempts.');
            toast({ title: '❌ Connection Lost', description: 'Upload connection failed. Recording paused. You can wait for network or stop to save locally.', variant: 'destructive' });
            if (isRecordingRef.current && mediaRecorderRef.current?.state === 'recording') {
              handlersRef.current.togglePause();
            }
          }
        };
      };

      recorder.ondataavailable = e => {
        if (e.data.size > 0) {
          // Always save to IndexedDB for crash recovery
          chunksRef.current.push(e.data);
          saveRecordingState(id, chunksRef.current);

          if (wsRef.current?.readyState === WebSocket.OPEN) {
            pendingChunks.push(e.data);
            flushChunks(wsRef.current);
          } else {
            // WS not ready — buffer the chunk for later replay on reconnect
            wsBufferedChunksRef.current.push(e.data);
          }
        }
      };
      
      recorder.onstop = async () => {
        stopEverything();
        setPhase('uploading');
        setUploadProgress(10);
        wsEndRequestedRef.current = true;
        // Flush any remaining buffered chunks before signalling END
        let endAttempts = 0;
        const waitAndEnd = () => {
          endAttempts++;
          if (pendingChunks.length > 0 || (wsRef.current?.bufferedAmount || 0) > 0) {
            setTimeout(waitAndEnd, 300);
            return;
          }
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'END' }));
          } else if (wsIsReconnectingRef.current && endAttempts < 30) {
            // Still reconnecting — END will be sent after reconnect (handled in onopen)
            setTimeout(waitAndEnd, 500);
          } else {
             // Permanent failure or timeout
             toast({ title: 'Upload Failed', description: 'Could not reach cloud storage. Downloading your recording locally instead.', variant: 'destructive' });
             const blob = new Blob(chunksRef.current, { type: 'video/webm' });
             const url = URL.createObjectURL(blob);
             const a = document.createElement('a');
             a.href = url;
             a.download = `recording-fallback-${Date.now()}.webm`;
             a.click();
             URL.revokeObjectURL(url);
             setPhase('review');
          }
        };
        waitAndEnd();
      };

      // Initial connection
      connectWS(false);

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
        recordingSecondsRef.current = seconds;
        
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
    if (!user) return;
    
    let finalUnlockAt = null;
    let finalIsLocked = false;

    if (lockType === 'manual') {
      finalIsLocked = true;
    } else if (lockType === 'scheduled') {
      if (!unlockDate || !unlockTime) {
        toast({ title: 'Date/Time required', description: 'Please set the unlock schedule.', variant: 'destructive' });
        return;
      }
      finalIsLocked = true;
      finalUnlockAt = new Date(`${unlockDate}T${unlockTime}`).toISOString();
    }
    
    // If it was auto-saved, just update details and redirect
    if (activeVideoId) {
      setPhase('uploading');
      try {
        await supabase.from('clipad_videos').update({
          title: title.trim() || `Recording - ${new Date().toLocaleDateString()}`,
          description: description.trim() || null,
          space_id: selectedSpace || null,
          visibility: visibility,
          // is_locked: finalIsLocked, // Temporarily disabled
          unlock_at: finalUnlockAt,
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
                
                // --- ADDED FOR ORG MEMORY ENGINE: Decisions & Commitments ---
                const [foundDecisions, foundCommitments] = await Promise.all([
                  detectDecisions(transcript.trim(), { team_space_id: selectedSpace || null, related_meeting_id: activeVideoId }),
                  detectCommitments(transcript.trim(), { team_space_id: selectedSpace || null, meeting_id: activeVideoId })
                ]);
                
                for (const d of foundDecisions) {
                  const { error } = await supabase.from('clipad_decisions').insert({ ...d, reasoning_text: d.rationale || null });
                  if (!error) {
                    await writeOrgEvent({
                      space_id: selectedSpace || null,
                      event_type: 'decision_logged',
                      title: d.decision_text.substring(0, 80),
                      actor_id: user?.id,
                      source_id: activeVideoId,
                      source_table: 'clipad_videos',
                      importance: d.importance_score || 5,
                    });
                  }
                }
                
                for (const c of foundCommitments) {
                  const { error } = await supabase.from('clipad_commitments').insert(c);
                  if (!error) {
                    await writeOrgEvent({
                      space_id: selectedSpace || null,
                      event_type: 'commitment_detected',
                      title: c.commitment_text.substring(0, 80),
                      actor_id: user?.id,
                      source_id: activeVideoId,
                      source_table: 'clipad_videos',
                      importance: 4,
                    });
                  }
                }
                // -----------------------------------------------------------

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

      const { data: { session } } = await supabase.auth.getSession();
      
      await new Promise((resolve, reject) => {
        const upload = new tus.Upload(videoBlob, {
          endpoint: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            authorization: `Bearer ${session?.access_token}`,
            'x-upsert': 'true', 
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: 'clipad_videos',
            objectName: fileName,
            contentType: 'video/webm',
            cacheControl: '3600',
          },
          chunkSize: 6 * 1024 * 1024,
          onError: function (error) {
             reject(error);
          },
          onProgress: function (bytesUploaded, bytesTotal) {
             const percentage = ((bytesUploaded / bytesTotal) * 100);
             setUploadProgress(Math.min(percentage, 95));
          },
          onSuccess: function () {
             resolve();
          }
        });
        upload.start();
      });

      setUploadProgress(95);
      const publicUrl = supabase.storage.from('clipad_videos').getPublicUrl(fileName).data.publicUrl;

      const { data: videoRecord, error: dbError } = await supabase.from('clipad_videos').insert({
        creator_id: user.id,
        video_url: publicUrl,
        title: videoTitle,
        space_id: selectedSpace || null,
        duration_seconds: recordingSeconds,
        visibility: visibility,
        // is_locked: finalIsLocked, // Temporarily disabled
        unlock_at: finalUnlockAt,
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

              // --- ADDED FOR ORG MEMORY ENGINE: Decisions & Commitments ---
              const [foundDecisions, foundCommitments] = await Promise.all([
                detectDecisions(transcript.trim(), { team_space_id: selectedSpace || null, related_meeting_id: videoRecord.id }),
                detectCommitments(transcript.trim(), { team_space_id: selectedSpace || null, meeting_id: videoRecord.id })
              ]);
              
              for (const d of foundDecisions) {
                const { error } = await supabase.from('clipad_decisions').insert({ ...d, reasoning_text: d.rationale || null });
                if (!error) {
                  await writeOrgEvent({
                    space_id: selectedSpace || null,
                    event_type: 'decision_logged',
                    title: d.decision_text.substring(0, 80),
                    actor_id: user?.id,
                    source_id: videoRecord.id,
                    source_table: 'clipad_videos',
                    importance: d.importance_score || 5,
                  });
                }
              }
              
              for (const c of foundCommitments) {
                const { error } = await supabase.from('clipad_commitments').insert(c);
                if (!error) {
                  await writeOrgEvent({
                    space_id: selectedSpace || null,
                    event_type: 'commitment_detected',
                    title: c.commitment_text.substring(0, 80),
                    actor_id: user?.id,
                    source_id: videoRecord.id,
                    source_table: 'clipad_videos',
                    importance: 4,
                  });
                }
              }
              // -----------------------------------------------------------

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
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-full bg-[#f0f2f5] dark:bg-background text-slate-900 dark:text-slate-100 page-enter overflow-x-hidden pb-24 md:pb-8">
      {/* Hidden canvas for PiP compositing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center gap-3 px-6 h-16 bg-white/50 dark:bg-background/80 backdrop-blur-3xl border-b border-black/5 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 dark:bg-[#202c33]/95 backdrop-blur-md border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md text-sm font-semibold text-slate-700 dark:text-foreground transition-all hover:-translate-y-0.5">
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
                if ((m.id === 'screen_camera' || m.id === 'screen_only') && !hasDisplayMedia) return null;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex-1 flex items-center justify-center p-4 md:rounded-full rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md ${mode === m.id ? 'border-primary bg-gradient-to-r from-primary to-emerald-500 text-white scale-[1.02]' : 'bg-white/95 dark:bg-[#202c33]/95 border-black/5 dark:border-white/5 text-slate-700 dark:text-foreground hover:border-primary/50'}`}
                  >
                    <div className="flex items-center gap-2 font-bold text-[15px] md:text-sm">
                      <Icon className="w-5 h-5 md:w-4 md:h-4" />
                      {m.label}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-muted-foreground mb-2 uppercase tracking-wider">Video Title *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Feature Walkthrough"
                  className="w-full px-4 py-3 rounded-xl bg-white/95 dark:bg-[#202c33]/95 border border-black/5 dark:border-white/5 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-primary/60 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-muted-foreground mb-2 uppercase tracking-wider">Add to Space *</label>
                <select
                  value={selectedSpace}
                  onChange={e => setSelectedSpace(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/95 dark:bg-[#202c33]/95 border border-black/5 dark:border-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary/60 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
                >
                  <option value="">No space</option>
                  {spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setMicEnabled(!micEnabled)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${micEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${micEnabled ? 'left-5' : 'left-1'}`} />
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-foreground flex items-center gap-2">
                  {micEnabled ? <Mic className="w-4 h-4 text-primary" /> : <MicOff className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                  {micEnabled ? 'Microphone on' : 'Microphone off'}
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setStudioSound(!studioSound)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${studioSound ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${studioSound ? 'left-5' : 'left-1'}`} />
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-foreground flex items-center gap-2">
                  <Wand2 className={`w-4 h-4 ${studioSound ? 'text-indigo-500' : 'text-slate-400'}`} />
                  Studio Sound (AI)
                </span>
              </label>
            </div>

            <div className="bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5 backdrop-blur-md rounded-xl p-4 space-y-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-muted-foreground uppercase tracking-wider mb-2">
                <AlignLeft className="w-4 h-4" /> Teleprompter
              </label>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="E.g., Announce Q3 Roadmap..."
                  className="flex-1 bg-white/95 dark:bg-[#202c33]/95 border border-black/5 dark:border-white/5 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  value={scriptPrompt}
                  onChange={e => setScriptPrompt(e.target.value)}
                />
                <button 
                  onClick={generateScript}
                  disabled={isGeneratingScript || !scriptPrompt.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  {isGeneratingScript ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  Write Script
                </button>
              </div>

              <div className="relative">
                <textarea
                  placeholder="Or paste your script here..."
                  className="w-full h-32 bg-white/95 dark:bg-[#202c33]/95 border border-black/5 dark:border-white/5 rounded-lg p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  value={teleprompterText}
                  onChange={e => setTeleprompterText(e.target.value)}
                />
                {teleprompterText && (
                  <button 
                    onClick={refineScript}
                    disabled={isGeneratingScript}
                    className="absolute bottom-3 right-3 bg-white dark:bg-[#202c33] hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-foreground border border-black/5 dark:border-white/5 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
                    title="Make it punchy!"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" /> Refine
                  </button>
                )}
              </div>
            </div>

            <div className="w-full mt-6 mb-8 z-50">
              <button
                onClick={startRecording}
                disabled={countdown !== null || !title.trim() || !selectedSpace}
                className={`w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl ${countdown !== null || !title.trim() || !selectedSpace ? 'bg-slate-400 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500'} text-white font-bold text-lg shadow-[0_8px_30px_rgba(225,29,72,0.3)] transition-all hover:scale-[1.02]`}
              >
                <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
                {countdown !== null ? `Starting in ${countdown}...` : 'Start Recording'}
              </button>
            </div>
          </>
        )}

        {/* COUNTDOWN OVERLAY */}
        {countdown !== null && countdown > 0 && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 dark:bg-background/80 backdrop-blur-2xl m-0 p-0 border-0">
            <div className="relative flex items-center justify-center w-48 h-48">
              {/* Inner glow pulsating */}
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 blur-2xl animate-pulse" />
              
              {/* Expanding ping ring */}
              <div className="absolute inset-0 rounded-full border-[2px] border-emerald-500/40 animate-ping" style={{ animationDuration: '1s' }} />
              
              {/* Outer spinning dashed ring */}
              <div className="absolute -inset-4 rounded-full border-[2px] border-dashed border-emerald-400/50 animate-[spin_4s_linear_infinite]" />
              
              {/* Solid circle with glassy background */}
              <div className="relative w-full h-full flex items-center justify-center rounded-full bg-white/40 dark:bg-card/40 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-[0_8px_32px_rgba(16,185,129,0.3)]">
                {/* Number */}
                <div key={countdown} className="text-8xl md:text-9xl font-black text-emerald-600 dark:text-white drop-shadow-md animate-in zoom-in duration-300">
                  {countdown}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RECORDING PHASE */}
        {phase === 'recording' && (
          <div className="flex flex-col items-center gap-6 relative pb-24">
            
            {teleprompterText && showTeleprompter && (
              <div className="relative w-full max-w-4xl mx-auto mb-6 bg-white/95 dark:bg-[#202c33]/95 backdrop-blur-3xl border border-black/5 dark:border-white/5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden z-40 transition-all flex flex-col">
                <div className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5 px-5 py-3 flex items-center justify-between cursor-move">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                    <h3 className="text-xs font-black text-slate-700 dark:text-foreground uppercase tracking-widest">AI Teleprompter</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-muted-foreground bg-white/50 dark:bg-black/20 px-4 py-1.5 rounded-full border border-black/5 dark:border-white/5">
                      <span>Speed</span>
                      <input type="range" min="0" max="10" value={scrollSpeed} onChange={e => setScrollSpeed(Number(e.target.value))} className="w-24 h-2 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                    </div>
                    <button 
                      onClick={() => setShowTeleprompter(false)}
                      className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white transition-colors p-1"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div 
                  ref={teleprompterRef}
                  className="p-8 md:p-12 max-h-96 overflow-y-auto text-2xl md:text-3xl lg:text-[32px] font-medium text-slate-800 dark:text-white leading-[1.6] text-center scroll-smooth drop-shadow-sm"
                >
                  {teleprompterText.split('\n').map((line, i) => <p key={i} className="mb-6 last:mb-0 opacity-90 hover:opacity-100 transition-opacity">{line}</p>)}
                </div>
              </div>
            )}

            <div id="preview-container" className="relative w-full max-w-2xl rounded-3xl overflow-hidden bg-black aspect-video shadow-2xl ring-1 ring-white/10 select-none">
              <audio ref={audioRef} autoPlay style={{ display: 'none' }} />
              {mode === 'screen_camera' && (
                <>
                  <video ref={previewRef} autoPlay muted playsInline className="w-full h-full object-contain" />
                  {streamsRef.current?.camera && (
                    <div 
                      className="absolute z-50 cursor-grab active:cursor-grabbing rounded-xl overflow-hidden shadow-xl ring-2 ring-indigo-500/80 bg-black"
                      style={{ 
                        width: '22%', 
                        left: `${camPos.x}%`, 
                        top: `${camPos.y}%`, 
                        aspectRatio: '16/9' 
                      }}
                      onMouseDown={handlePiPMouseDown}
                    >
                      <video 
                        autoPlay 
                        muted 
                        playsInline 
                        className="w-full h-full object-cover scale-x-[-1]" 
                        ref={v => { if (v && v.srcObject !== streamsRef.current?.camera) v.srcObject = streamsRef.current?.camera; }} 
                      />
                    </div>
                  )}
                </>
              )}
              {mode === 'camera_only' && (
                <video ref={previewRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
              )}
              {mode === 'screen_only' && (
                <div className="w-full h-full flex items-center justify-center bg-black/5 dark:bg-card">
                  <div className="text-center text-muted-foreground">
                    <Monitor className="w-16 h-16 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Recording your screen…</p>
                  </div>
                </div>
              )}

              {/* Recording indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-sm font-mono font-bold">{formatDuration(recordingSeconds)}</span>
              </div>
            </div>

            {/* FLOATING PILL CONTROLS */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-white/50 dark:bg-background/80 backdrop-blur-3xl border border-black/5 dark:border-white/5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              <button
                onClick={togglePause}
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${isPaused ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : 'bg-white/95 dark:bg-[#202c33]/95 text-slate-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10'}`}
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
              </button>
              
              {!pipWindow && ('documentPictureInPicture' in window) && (
                <button
                  onClick={() => startPip(window.documentPictureInPicture.requestWindow({ width: 320, height: 180 }).catch(console.error))}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white/95 dark:bg-[#202c33]/95 text-indigo-500 dark:text-indigo-400 hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                  title="Open PiP Controls"
                >
                  <Monitor className="w-5 h-5" />
                </button>
              )}

              {teleprompterText && !showTeleprompter && (
                <button
                  onClick={() => setShowTeleprompter(true)}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white/95 dark:bg-[#202c33]/95 text-slate-600 dark:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                  title="Show Teleprompter"
                >
                  <AlignLeft className="w-5 h-5" />
                </button>
              )}

              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>

              <button
                onClick={stopRecording}
                className="flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-red-500 hover:bg-red-400 text-white font-bold transition-all shadow-lg shadow-red-500/20"
              >
                <div className="w-4 h-4 bg-white rounded-sm"></div>
                Stop
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
              <p className="text-muted-foreground text-sm">{formatDuration(recordingSeconds)} · {0} MB</p>
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
                  className="w-full px-4 py-3 rounded-xl bg-white/95 dark:bg-[#202c33]/95 border border-black/5 dark:border-white/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-slate-900 dark:text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Space *</label>
                <select
                  value={selectedSpace}
                  onChange={e => setSelectedSpace(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/95 dark:bg-[#202c33]/95 border border-black/5 dark:border-white/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-all"
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
                className="w-full px-4 py-3 rounded-xl bg-white/95 dark:bg-[#202c33]/95 border border-black/5 dark:border-white/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-slate-900 dark:text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-all resize-none"
              />
            </div>

            {/* Action Row: Visibility, Lock Settings & Save Buttons */}
            <div className="mt-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="flex-1 max-w-[220px]">
                  <label className="hidden sm:block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Visibility</label>
                  <select
                    value={visibility}
                    onChange={e => setVisibility(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/95 dark:bg-[#202c33]/95 border border-black/5 dark:border-white/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-slate-900 dark:text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all cursor-pointer font-semibold"
                  >
                    <option value="internal">Internal (Company Only)</option>
                    <option value="external">External (Anyone with link)</option>
                  </select>
                </div>

                <div className="flex-1 max-w-[220px]">
                  <label className="hidden sm:block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Access Control</label>
                  <div className="relative inline-block w-full">
                    <select
                      value={lockType}
                      onChange={e => setLockType(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white/95 dark:bg-[#202c33]/95 border border-black/5 dark:border-white/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-slate-900 dark:text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all cursor-pointer font-semibold"
                    >
                    <option value="none">Public (Space Members)</option>
                    <option value="manual">Locked (Only Me)</option>
                    <option value="scheduled">Scheduled Release</option>
                  </select>
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {lockType === 'none' && <Unlock className="w-4 h-4 text-emerald-500" />}
                    {lockType === 'manual' && <Lock className="w-4 h-4 text-indigo-500" />}
                    {lockType === 'scheduled' && <Clock className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button onClick={discard} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 font-semibold text-sm transition-all shadow-sm">
                  <RotateCcw className="w-4 h-4" /> Discard
                </button>
                <button onClick={uploadRecording} disabled={!title.trim() || !selectedSpace} className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-foreground font-bold shadow-lg shadow-primary/25 transition-all">
                  <Upload className="w-4 h-4" /> {activeVideoId ? 'Save Details' : 'Save to CliPad'}
                </button>
              </div>
            </div>

            {lockType === 'scheduled' && (
              <div className="mt-4 p-5 bg-amber-50/50 dark:bg-amber-500/10 rounded-xl border border-amber-100/50 dark:border-amber-500/20 backdrop-blur-md flex gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-amber-800 dark:text-amber-500 mb-1.5">Unlock Date</label>
                  <input type="date" value={unlockDate} onChange={e => setUnlockDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/95 dark:bg-[#202c33]/95 border border-black/5 dark:border-white/5 text-slate-900 dark:text-white text-sm" min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-amber-800 dark:text-amber-500 mb-1.5">Unlock Time</label>
                  <input type="time" value={unlockTime} onChange={e => setUnlockTime(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/95 dark:bg-[#202c33]/95 border border-black/5 dark:border-white/5 text-slate-900 dark:text-white text-sm" />
                </div>
              </div>
            )}
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
