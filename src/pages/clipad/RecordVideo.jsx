import React, { useState, useRef, useEffect } from 'react';
import { Camera, Monitor, StopCircle, Video, Mic, Share, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

export default function RecordVideo() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);

  const screenVideoRef = useRef(null);
  const cameraVideoRef = useRef(null);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      // Get screen stream
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Get camera/mic stream
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Display in UI
      if (screenVideoRef.current) screenVideoRef.current.srcObject = screenStream;
      if (cameraVideoRef.current) cameraVideoRef.current.srcObject = cameraStream;

      // Combine streams using Web Audio API and Canvas (simplified for MVP: just record screen + mic)
      // For a true PiP recording, we'd draw both to a canvas and capture the canvas stream.
      // Here we will just record the screen stream + microphone for simplicity in this scaffold.
      const audioCtx = new AudioContext();
      const dest = audioCtx.createMediaStreamDestination();
      
      const screenAudio = screenStream.getAudioTracks()[0];
      if (screenAudio) {
        audioCtx.createMediaStreamSource(new MediaStream([screenAudio])).connect(dest);
      }
      
      const cameraAudio = cameraStream.getAudioTracks()[0];
      if (cameraAudio) {
        audioCtx.createMediaStreamSource(new MediaStream([cameraAudio])).connect(dest);
      }

      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);

      const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        setRecordingUrl(URL.createObjectURL(blob));
        
        // Stop all tracks
        screenStream.getTracks().forEach(t => t.stop());
        cameraStream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      toast({ title: 'Recording Started', description: 'Your screen and audio are now being recorded.' });
      
    } catch (err) {
      console.error(err);
      toast({ title: 'Recording Error', description: 'Could not access screen or camera.', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadRecording = async () => {
    if (!videoBlob || !user) return;
    setIsUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('clipad_videos')
        .upload(fileName, videoBlob);
        
      if (error) throw error;
      
      const publicUrl = supabase.storage.from('clipad_videos').getPublicUrl(fileName).data.publicUrl;

      // Save to database
      const { error: dbError } = await supabase.from('clipad_videos').insert({
        creator_id: user.id,
        video_url: publicUrl,
        title: `CliPad Recording - ${new Date().toLocaleDateString()}`
      });

      if (dbError) throw dbError;

      toast({ title: 'Upload Successful', description: 'Your video has been saved to CliPad.' });
      
    } catch (err) {
      console.error(err);
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8 h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Record Video</h1>
          <p className="text-muted-foreground mt-1">Capture your screen and camera asynchronously.</p>
        </div>
        <div className="flex gap-4">
          {!isRecording ? (
            <Button onClick={startRecording} className="gap-2" disabled={!!recordingUrl}>
              <Video className="w-4 h-4" /> Start Recording
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive" className="gap-2">
              <StopCircle className="w-4 h-4" /> Stop Recording
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-800 shadow-2xl flex items-center justify-center">
        {!isRecording && !recordingUrl ? (
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <Monitor className="w-16 h-16 opacity-50" />
            <p>Click "Start Recording" to select a screen to share.</p>
          </div>
        ) : recordingUrl ? (
          <video src={recordingUrl} controls className="w-full h-full object-contain" />
        ) : (
          <>
            <video ref={screenVideoRef} autoPlay muted className="w-full h-full object-contain" />
            <div className="absolute bottom-6 right-6 w-48 aspect-video bg-black rounded-xl overflow-hidden border-2 border-primary shadow-2xl">
              <video ref={cameraVideoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />
            </div>
          </>
        )}
      </div>

      {recordingUrl && (
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => { setRecordingUrl(null); setVideoBlob(null); }}>
            Discard
          </Button>
          <Button onClick={uploadRecording} disabled={isUploading} className="gap-2">
            {isUploading ? 'Uploading...' : <><Save className="w-4 h-4" /> Save to CliPad</>}
          </Button>
        </div>
      )}
    </div>
  );
}
