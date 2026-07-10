import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, Monitor, StopCircle, Video, Mic, MicOff, Save,
  X, ArrowLeft, Layers, Clock, CheckCircle, AlertCircle,
  Play, Pause, RotateCcw, Upload
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';

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

export default function RecordVideo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState('screen_camera');
  const [phase, setPhase] = useState('setup'); // setup | recording | review | uploading | done
  const [micEnabled, setMicEnabled] = useState(true);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoBlob, setVideoBlob] = useState(null);
  const [recordingUrl, setRecordingUrl] = useState(null);
  const [title, setTitle] = useState('');
  const [selectedSpace, setSelectedSpace] = useState('');
  const [spaces, setSpaces] = useState([]);
  const [description, setDescription] = useState('');

  const canvasRef = useRef(null);
  const previewRef = useRef(null); // camera preview only
  const playbackRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);
  const streamsRef = useRef({ screen: null, camera: null });

  useEffect(() => {
    // Load spaces for selection
    supabase.from('clipad_spaces').select('id, name').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setSpaces(data);
    });
    return () => stopEverything();
  }, []);

  const stopEverything = () => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);
    Object.values(streamsRef.current).forEach(s => s?.getTracks().forEach(t => t.stop()));
  };

  const startRecording = async () => {
    try {
      let screenStream = null;
      let cameraStream = null;

      if (mode === 'screen_camera' || mode === 'screen_only') {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
        streamsRef.current.screen = screenStream;
        // If user stops screen share from browser UI
        screenStream.getVideoTracks()[0].onended = () => stopRecording();
      }

      if (mode === 'screen_camera' || mode === 'camera_only') {
        try {
          cameraStream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: micEnabled });
          streamsRef.current.camera = cameraStream;
          // Show camera preview overlay
          if (previewRef.current) {
            previewRef.current.srcObject = cameraStream;
            previewRef.current.play().catch(() => {});
          }
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

        // Merge audio
        const audioCtx = new AudioContext();
        const dest = audioCtx.createMediaStreamDestination();
        if (screenStream.getAudioTracks().length) {
          audioCtx.createMediaStreamSource(new MediaStream(screenStream.getAudioTracks())).connect(dest);
        }
        if (cameraStream.getAudioTracks().length && micEnabled) {
          audioCtx.createMediaStreamSource(new MediaStream(cameraStream.getAudioTracks())).connect(dest);
        }

        const canvasStream = canvas.captureStream(30);
        recordStream = new MediaStream([...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
      } else if (screenStream) {
        // Fallback to screen stream if camera failed in PiP mode or if it was screen_only
        recordStream = screenStream;
      } else if (cameraStream) {
        recordStream = cameraStream;
      } else {
        throw new Error('No stream available');
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      const recorder = new MediaRecorder(recordStream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoBlob(blob);
        setRecordingUrl(url);
        setPhase('review');
        stopEverything();
      };

      recorder.start(1000); // collect in 1s chunks
      setPhase('recording');
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);

      toast({ title: '● Recording started', description: 'Click Stop when done.' });
    } catch (err) {
      console.error(err);
      const msg = err.name === 'NotAllowedError' ? 'Permission denied. Please allow screen/camera access.' : err.message;
      toast({ title: 'Could not start recording', description: msg, variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);
  };

  const uploadRecording = async () => {
    if (!videoBlob || !user) return;
    setPhase('uploading');
    setUploadProgress(0);

    try {
      const videoTitle = title.trim() || `Recording - ${new Date().toLocaleDateString()}`;
      const fileName = `${user.id}/${Date.now()}.webm`;

      // Simulate progress while uploading
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
        description: description.trim() || null,
        space_id: selectedSpace || null,
        duration_seconds: recordingSeconds,
      }).select().single();

      if (dbError) throw dbError;

      setUploadProgress(100);
      setPhase('done');
      toast({ title: '✓ Video saved!', description: 'Your recording is ready to share.' });

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
    setPhase('setup');
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-background page-enter text-foreground">
      {/* Hidden canvas for PiP compositing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center gap-3 px-6 h-14 bg-background page-enter/90 backdrop-blur-xl border-b border-border">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-foreground font-semibold">Record Async Video</span>
        {phase === 'recording' && (
          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-red-400 text-sm font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MODES.map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`p-5 rounded-2xl border text-left transition-all ${mode === m.id ? 'border-indigo-500/60 bg-primary/10' : 'border-white/[0.08] bg-white/[0.03] hover:border-white/15'}`}
                  >
                    <Icon className={`w-6 h-6 mb-3 ${mode === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="font-semibold text-foreground text-sm mb-1">{m.label}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{m.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Video Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Feature Walkthrough"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Add to Space (optional)</label>
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

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setMicEnabled(!micEnabled)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${micEnabled ? 'bg-primary' : 'bg-secondary/80'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${micEnabled ? 'left-5' : 'left-1'}`} />
                </div>
                <span className="text-sm text-gray-300 flex items-center gap-2">
                  {micEnabled ? <Mic className="w-4 h-4 text-primary" /> : <MicOff className="w-4 h-4 text-muted-foreground" />}
                  {micEnabled ? 'Microphone on' : 'Microphone off'}
                </span>
              </label>
            </div>

            <button
              onClick={startRecording}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-foreground font-bold shadow-2xl shadow-red-500/25 transition-all hover:scale-[1.02]"
            >
              <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
              Start Recording
            </button>
          </>
        )}

        {/* RECORDING PHASE */}
        {phase === 'recording' && (
          <div className="flex flex-col items-center gap-8">
            <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden bg-black aspect-video">
              {mode === 'screen_camera' && (
                <>
                  {/* The canvas shows the composited feed */}
                  <canvas ref={canvasRef} className="w-full h-full object-contain hidden" />
                  {/* Show a placeholder since canvas compositing draws off-screen for recording */}
                  <div className="w-full h-full flex items-center justify-center bg-slate-900">
                    <div className="text-center text-muted-foreground">
                      <Monitor className="w-16 h-16 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Recording your screen + camera…</p>
                    </div>
                  </div>
                  {/* Camera PiP preview */}
                  <div className="absolute bottom-4 right-4 w-36 aspect-video rounded-xl overflow-hidden border-2 border-indigo-500 shadow-2xl">
                    <video ref={previewRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  </div>
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

            <button
              onClick={stopRecording}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-foreground font-bold shadow-xl shadow-red-500/25 transition-all"
            >
              <StopCircle className="w-5 h-5" /> Stop Recording
            </button>
          </div>
        )}

        {/* REVIEW PHASE */}
        {phase === 'review' && recordingUrl && (
          <div className="space-y-6">
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
                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Space</label>
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
              <button onClick={discard} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary border border-border text-gray-300 font-semibold text-sm transition-all">
                <RotateCcw className="w-4 h-4" /> Discard & Re-record
              </button>
              <button onClick={uploadRecording} className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-foreground font-bold shadow-lg shadow-primary/25 transition-all">
                <Upload className="w-4 h-4" /> Save to CliPad
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
    </div>
  );
}
