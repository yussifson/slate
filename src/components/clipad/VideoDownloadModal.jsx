import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { hasFeature } from '@/lib/clipadPricing';
import { Download, AlertCircle, Loader2, PlayCircle, Lock } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

export default function VideoDownloadModal({ open, onOpenChange, videoId, videoFileName, videoTitle, spaceId }) {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  
  const ffmpegRef = useRef(null);

  const canDownload = hasFeature(user, 'hasVideoDownload');

  const QUALITIES = [
    { id: '1080p', label: '1080p HD (Original)', desc: 'Best quality, fastest download', ext: 'webm' },
    { id: '720p', label: '720p HD', desc: 'Good balance of quality and size', ext: 'mp4' },
    { id: '480p', label: '480p SD', desc: 'Smallest file size', ext: 'mp4' }
  ];

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    
    // Lazy load so we don't increase initial bundle size
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');
    
    const ffmpeg = new FFmpeg();
    ffmpeg.on('progress', ({ progress }) => {
      setProgress(Math.round(progress * 100));
    });
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const downloadDirect = async (signedUrl, filename) => {
    setStatusText('Downloading original video...');
    setProgress(0);
    
    const response = await fetch(signedUrl);
    if (!response.ok) throw new Error('Failed to fetch video');
    
    const contentLength = response.headers.get('content-length');
    const total = parseInt(contentLength, 10);
    
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    
    while(true) {
      const {done, value} = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (total) {
        setProgress(Math.round((received / total) * 100));
      }
    }
    
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `${filename}.webm`);
    URL.revokeObjectURL(url);
  };

  const transcodeAndDownload = async (signedUrl, filename, resolution) => {
    setStatusText('Loading transcoder engine...');
    setProgress(0);
    
    // Check if SharedArrayBuffer is available (required for ffmpeg.wasm in modern browsers)
    if (typeof SharedArrayBuffer === 'undefined') {
      console.warn("SharedArrayBuffer is not available. Falling back to original download.");
      setError("Browser security restrictions prevent transcoding. Downloading original quality instead.");
      await new Promise(r => setTimeout(r, 2000));
      await downloadDirect(signedUrl, filename);
      return;
    }

    try {
      const ffmpeg = await loadFFmpeg();
      
      setStatusText('Fetching original video...');
      // Fetch into memory array buffer
      const response = await fetch(signedUrl);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const inputName = 'input.webm';
      const outputName = 'output.mp4';
      
      await ffmpeg.writeFile(inputName, uint8Array);
      
      setStatusText(`Converting to ${resolution}...`);
      
      // Scale options
      const scaleMap = {
        '720p': 'scale=-2:720',
        '480p': 'scale=-2:480'
      };
      
      await ffmpeg.exec([
        '-i', inputName,
        '-vf', scaleMap[resolution],
        '-c:v', 'libx264',
        '-preset', 'ultrafast', // fast for browser
        '-crf', '28',
        '-c:a', 'aac',
        outputName
      ]);
      
      setStatusText('Finishing up...');
      const fileData = await ffmpeg.readFile(outputName);
      const data = new Uint8Array(fileData);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `${filename}.mp4`);
      URL.revokeObjectURL(url);
      
      // Cleanup memory
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
      
    } catch (err) {
      console.error(err);
      throw new Error("Transcoding failed. " + err.message);
    }
  };

  const triggerDownload = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownload = async () => {
    if (!canDownload) return;
    
    setDownloading(true);
    setError(null);
    setProgress(0);
    
    try {
      setStatusText('Securing download link...');
      
      // Get short-lived signed URL for downloading
      const { data, error: signError } = await supabase.storage
        .from('clipad_videos')
        .createSignedUrl(videoFileName, 60 * 10); // 10 minutes
        
      if (signError) throw signError;
      
      const safeTitle = (videoTitle || 'Clipad_Video').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      if (selectedQuality === '1080p') {
        await downloadDirect(data.signedUrl, safeTitle);
      } else {
        await transcodeAndDownload(data.signedUrl, safeTitle, selectedQuality);
      }
      
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
      
    } catch (err) {
      console.error('Download failed:', err);
      setError(err.message || 'Download failed. Please try again.');
    } finally {
      if (!error) {
         setDownloading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !downloading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" /> Download Video
          </DialogTitle>
          <DialogDescription>
            Save this video locally to your device.
          </DialogDescription>
        </DialogHeader>

        {!canDownload ? (
          <div className="py-6 px-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Pro Feature</h3>
              <p className="text-sm text-slate-500 mt-1">Video downloads are only available on Pro and Enterprise plans.</p>
            </div>
            <Button className="w-full" onClick={() => { onOpenChange(false); /* Should trigger paywall open here, can pass callback if needed */ }}>
              Upgrade Plan
            </Button>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!downloading ? (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Quality</label>
                <div className="space-y-2">
                  {QUALITIES.map(q => (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuality(q.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        selectedQuality === q.id 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-primary/40'
                      }`}
                    >
                      <div>
                        <div className={`font-medium ${selectedQuality === q.id ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                          {q.label}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{q.desc}</div>
                      </div>
                      <div className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        .{q.ext}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{statusText}</div>
                  {progress > 0 && (
                    <div className="text-2xl font-black text-primary mt-2">{progress}%</div>
                  )}
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {selectedQuality !== '1080p' && typeof SharedArrayBuffer !== 'undefined' && (
                  <p className="text-xs text-slate-500 mt-2">Transcoding happens directly in your browser securely.</p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={downloading}>
            Cancel
          </Button>
          {canDownload && !downloading && (
            <Button onClick={handleDownload}>
              Start Download
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
