/**
 * Kupuri Studios - Voice Recorder Component
 * Records audio, transcribes via Whisper, generates video scripts
 * Part of the 7-Day MVP Sprint
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2, Sparkles, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onTranscriptionComplete?: (text: string) => void;
  onVideoGenerated?: (videoUrl: string) => void;
  maxDurationSeconds?: number;
  language?: 'es' | 'en';
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'transcribing' | 'generating' | 'complete';

interface GenerationResult {
  transcription: string;
  script: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptionComplete,
  onVideoGenerated,
  maxDurationSeconds = 60,
  language = 'es'
}) => {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000 // Optimal for Whisper
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        processRecording();
      };
      
      mediaRecorder.start(1000); // Collect data every second
      setState('recording');
      setDuration(0);
      
      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDurationSeconds) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
      
      toast({
        title: language === 'es' ? '🎤 Grabando...' : '🎤 Recording...',
        description: language === 'es' 
          ? 'Habla claramente sobre tu video' 
          : 'Speak clearly about your video',
      });
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(language === 'es' 
        ? 'No se pudo acceder al micrófono' 
        : 'Could not access microphone');
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' 
          ? 'Por favor permite el acceso al micrófono' 
          : 'Please allow microphone access',
        variant: 'destructive'
      });
    }
  }, [maxDurationSeconds, language, toast]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const processRecording = useCallback(async () => {
    setState('processing');
    setProgress(10);
    
    try {
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Step 1: Transcribe
      setState('transcribing');
      setProgress(30);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);
      
      const transcribeResponse = await fetch('/api/transcription/transcribe', {
        method: 'POST',
        body: formData
      });
      
      if (!transcribeResponse.ok) {
        throw new Error('Transcription failed');
      }
      
      const { text: transcription } = await transcribeResponse.json();
      setProgress(50);
      
      onTranscriptionComplete?.(transcription);
      
      // Step 2: Generate video script
      setState('generating');
      setProgress(60);
      
      const scriptResponse = await fetch('/api/video/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: transcription,
          language,
          duration: Math.min(duration * 2, 120) // Double the recording length for video
        })
      });
      
      if (!scriptResponse.ok) {
        throw new Error('Script generation failed');
      }
      
      const { script, videoUrl, thumbnailUrl } = await scriptResponse.json();
      setProgress(90);
      
      // Step 3: Complete
      setResult({
        transcription,
        script,
        videoUrl,
        thumbnailUrl
      });
      
      setProgress(100);
      setState('complete');
      
      if (videoUrl) {
        onVideoGenerated?.(videoUrl);
      }
      
      toast({
        title: language === 'es' ? '✨ ¡Video generado!' : '✨ Video generated!',
        description: language === 'es' 
          ? 'Tu video está listo para descargar' 
          : 'Your video is ready to download',
      });
      
    } catch (err) {
      console.error('Processing failed:', err);
      setError(language === 'es' 
        ? 'Error al procesar el audio' 
        : 'Failed to process audio');
      setState('idle');
      
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: (err as Error).message,
        variant: 'destructive'
      });
    }
  }, [duration, language, onTranscriptionComplete, onVideoGenerated, toast]);

  const reset = useCallback(() => {
    setState('idle');
    setDuration(0);
    setProgress(0);
    setResult(null);
    setError(null);
    audioChunksRef.current = [];
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusMessage = () => {
    const messages = {
      idle: language === 'es' ? 'Presiona para grabar' : 'Press to record',
      recording: language === 'es' ? 'Grabando...' : 'Recording...',
      processing: language === 'es' ? 'Procesando audio...' : 'Processing audio...',
      transcribing: language === 'es' ? 'Transcribiendo...' : 'Transcribing...',
      generating: language === 'es' ? 'Generando video...' : 'Generating video...',
      complete: language === 'es' ? '¡Listo!' : 'Complete!'
    };
    return messages[state];
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-slate-900/80 backdrop-blur-md border-slate-700/50">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {language === 'es' ? '🎬 Crear Video' : '🎬 Create Video'}
        </CardTitle>
        <CardDescription className="text-slate-400">
          {language === 'es' 
            ? 'Describe tu video en voz y nosotros lo creamos' 
            : 'Describe your video by voice and we create it'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Recording Button */}
        <div className="flex flex-col items-center gap-4">
          <AnimatePresence mode="wait">
            {state === 'idle' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25"
                >
                  <Mic className="w-10 h-10" />
                </Button>
              </motion.div>
            )}
            
            {state === 'recording' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Button
                    size="lg"
                    onClick={stopRecording}
                    className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25"
                  >
                    <Square className="w-8 h-8" />
                  </Button>
                </motion.div>
                <div className="text-2xl font-mono text-white">
                  {formatDuration(duration)} / {formatDuration(maxDurationSeconds)}
                </div>
                <Progress 
                  value={(duration / maxDurationSeconds) * 100} 
                  className="w-48 h-2"
                />
              </motion.div>
            )}
            
            {['processing', 'transcribing', 'generating'].includes(state) && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                </div>
                <Progress value={progress} className="w-48 h-2" />
              </motion.div>
            )}
            
            {state === 'complete' && result && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-4 w-full"
              >
                <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-green-400" />
                </div>
                
                {result.thumbnailUrl && (
                  <img 
                    src={result.thumbnailUrl} 
                    alt="Video thumbnail"
                    className="w-full rounded-lg shadow-lg"
                  />
                )}
                
                <div className="flex gap-2 w-full">
                  {result.videoUrl && (
                    <Button asChild className="flex-1 bg-purple-500 hover:bg-purple-600">
                      <a href={result.videoUrl} download>
                        <Download className="w-4 h-4 mr-2" />
                        {language === 'es' ? 'Descargar' : 'Download'}
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="flex-1 border-slate-600"
                    onClick={() => {
                      if (result.videoUrl) {
                        navigator.share?.({ url: result.videoUrl });
                      }
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {language === 'es' ? 'Compartir' : 'Share'}
                  </Button>
                </div>
                
                <Button 
                  variant="ghost" 
                  onClick={reset}
                  className="text-slate-400 hover:text-white"
                >
                  {language === 'es' ? 'Crear otro video' : 'Create another video'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Status Message */}
          <p className="text-slate-400 text-sm">
            {getStatusMessage()}
          </p>
          
          {/* Error Message */}
          {error && (
            <p className="text-red-400 text-sm">
              {error}
            </p>
          )}
        </div>
        
        {/* Transcription Preview */}
        {result?.transcription && state === 'complete' && (
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h4 className="text-sm font-medium text-slate-300 mb-2">
              {language === 'es' ? 'Transcripción:' : 'Transcription:'}
            </h4>
            <p className="text-slate-400 text-sm">
              {result.transcription}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceRecorder;
