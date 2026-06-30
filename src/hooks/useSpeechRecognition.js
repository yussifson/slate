import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function useSpeechRecognition({ onTranscript }) {
  const [isListening, setIsListening] = useState(false);
  const [hasSupport, setHasSupport] = useState(false);
  const recognitionRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setHasSupport(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (onTranscriptRef.current) {
            onTranscriptRef.current(currentTranscript);
          }
        };

        recognitionRef.current.onerror = (event) => {
          // console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = async () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      try { recognitionRef.current.stop(); } catch(e) {}
      setIsListening(false);
    } else {
      // Explicitly request microphone permission to trigger the browser popup
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Stop the stream tracks immediately since SpeechRecognition manages its own stream
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        toast.error("Microphone access is blocked. Please click the site settings icon in your browser address bar to allow it.");
        return;
      }

      try { recognitionRef.current.start(); } catch(e) {}
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try { recognitionRef.current.stop(); } catch(e) {}
      setIsListening(false);
    }
  };

  return {
    isListening,
    hasSupport,
    toggleListening,
    stopListening
  };
}
