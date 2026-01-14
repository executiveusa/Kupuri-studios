/**
 * Kupuri Studios - Voice to Video Page
 * Complete voice-to-video pipeline interface
 * Part of the 7-Day MVP Sprint
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Video, 
  FileText, 
  Download, 
  Play, 
  RefreshCw,
  ChevronRight,
  Sparkles,
  Waveform,
  Check,
  AlertCircle,
  Settings,
  Globe,
  Clock,
  Palette
} from 'lucide-react';
import { VoiceRecorder } from '../components/voice/VoiceRecorder';
import { 
  useVideoStore, 
  selectCurrentStage, 
  selectIsProcessing, 
  selectCurrentProject,
  selectError,
  selectSettings 
} from '../stores/videoStore';

const stages = [
  { id: 'recording', icon: Mic, label: 'Grabar', labelEn: 'Record' },
  { id: 'transcribing', icon: Waveform, label: 'Transcribir', labelEn: 'Transcribe' },
  { id: 'generating-script', icon: FileText, label: 'Guión', labelEn: 'Script' },
  { id: 'generating-video', icon: Video, label: 'Video', labelEn: 'Video' },
  { id: 'completed', icon: Check, label: 'Listo', labelEn: 'Done' },
] as const;

export function VoiceToVideoPage() {
  const currentStage = useVideoStore(selectCurrentStage);
  const isProcessing = useVideoStore(selectIsProcessing);
  const currentProject = useVideoStore(selectCurrentProject);
  const error = useVideoStore(selectError);
  const settings = useVideoStore(selectSettings);
  
  const startPipeline = useVideoStore((s) => s.startPipeline);
  const reset = useVideoStore((s) => s.reset);
  const setLanguage = useVideoStore((s) => s.setLanguage);
  const setDuration = useVideoStore((s) => s.setDuration);
  const setStyle = useVideoStore((s) => s.setStyle);
  
  const [showSettings, setShowSettings] = useState(false);
  
  const isSpanish = settings.language === 'es';

  const handleRecordingComplete = async (audioBlob: Blob) => {
    try {
      await startPipeline(audioBlob);
    } catch (err) {
      console.error('Pipeline failed:', err);
    }
  };

  const getStageIndex = () => {
    return stages.findIndex(s => s.id === currentStage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {isSpanish ? 'Voz a Video' : 'Voice to Video'}
                </h1>
                <p className="text-xs text-gray-400">
                  {isSpanish ? 'Crea videos profesionales con tu voz' : 'Create professional videos with your voice'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/10 bg-black/30 backdrop-blur-xl overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Language */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    <Globe className="w-4 h-4" />
                    {isSpanish ? 'Idioma' : 'Language'}
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => setLanguage(e.target.value as 'es' | 'en')}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    {isSpanish ? 'Duración' : 'Duration'}
                  </label>
                  <select
                    value={settings.duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value={30}>30 {isSpanish ? 'segundos' : 'seconds'}</option>
                    <option value={60}>60 {isSpanish ? 'segundos' : 'seconds'}</option>
                    <option value={90}>90 {isSpanish ? 'segundos' : 'seconds'}</option>
                    <option value={120}>2 {isSpanish ? 'minutos' : 'minutes'}</option>
                  </select>
                </div>

                {/* Style */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    <Palette className="w-4 h-4" />
                    {isSpanish ? 'Estilo' : 'Style'}
                  </label>
                  <select
                    value={settings.style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="professional">{isSpanish ? 'Profesional' : 'Professional'}</option>
                    <option value="casual">{isSpanish ? 'Casual' : 'Casual'}</option>
                    <option value="energetic">{isSpanish ? 'Energético' : 'Energetic'}</option>
                    <option value="educational">{isSpanish ? 'Educativo' : 'Educational'}</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const stageIndex = getStageIndex();
            const isActive = stage.id === currentStage;
            const isComplete = stageIndex > index || currentStage === 'completed';
            const isPending = stageIndex < index;
            
            return (
              <React.Fragment key={stage.id}>
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    opacity: isPending ? 0.4 : 1,
                  }}
                  className={`
                    flex flex-col items-center gap-2
                    ${isActive ? 'text-violet-400' : isComplete ? 'text-green-400' : 'text-gray-500'}
                  `}
                >
                  <div className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${isActive ? 'bg-violet-500/20 ring-2 ring-violet-500' : 
                      isComplete ? 'bg-green-500/20' : 'bg-white/5'}
                  `}>
                    {isComplete && !isActive ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">
                    {isSpanish ? stage.label : stage.labelEn}
                  </span>
                </motion.div>
                
                {index < stages.length - 1 && (
                  <ChevronRight className={`w-4 h-4 ${stageIndex > index ? 'text-green-400' : 'text-gray-600'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <AnimatePresence mode="wait">
          {/* Recording Stage */}
          {(currentStage === 'idle' || currentStage === 'recording') && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  {isSpanish ? '¿De qué quieres hablar?' : 'What do you want to talk about?'}
                </h2>
                <p className="text-gray-400">
                  {isSpanish 
                    ? 'Graba tu idea y la convertiremos en un video profesional' 
                    : 'Record your idea and we\'ll turn it into a professional video'}
                </p>
              </div>
              
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                maxDuration={120}
                language={settings.language}
              />
            </motion.div>
          )}

          {/* Processing Stages */}
          {(currentStage === 'transcribing' || currentStage === 'generating-script' || currentStage === 'generating-video') && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 mx-auto rounded-full bg-violet-500/20 flex items-center justify-center"
                >
                  <RefreshCw className="w-8 h-8 text-violet-400" />
                </motion.div>
                
                <h2 className="text-2xl font-bold text-white">
                  {currentStage === 'transcribing' && (isSpanish ? 'Transcribiendo tu audio...' : 'Transcribing your audio...')}
                  {currentStage === 'generating-script' && (isSpanish ? 'Generando guión...' : 'Generating script...')}
                  {currentStage === 'generating-video' && (isSpanish ? 'Creando tu video...' : 'Creating your video...')}
                </h2>
                
                <p className="text-gray-400">
                  {isSpanish 
                    ? 'Esto puede tomar unos momentos. No cierres esta ventana.' 
                    : 'This may take a few moments. Don\'t close this window.'}
                </p>
              </div>

              {/* Show transcription if available */}
              {currentProject?.transcription && (
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">
                    {isSpanish ? 'Transcripción' : 'Transcription'}
                  </h3>
                  <p className="text-white">{currentProject.transcription.text}</p>
                </div>
              )}

              {/* Show script if available */}
              {currentProject?.script && (
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">
                    {isSpanish ? 'Guión Generado' : 'Generated Script'}
                  </h3>
                  <h4 className="text-lg font-bold text-white mb-2">{currentProject.script.title}</h4>
                  <p className="text-gray-300 whitespace-pre-wrap">{currentProject.script.script}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                    <span>Modelo: {currentProject.script.model_used}</span>
                    <span>Costo estimado: ${currentProject.script.cost_estimate}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Completed Stage */}
          {currentStage === 'completed' && currentProject && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <Check className="w-10 h-10 text-green-400" />
                </motion.div>
                
                <h2 className="text-2xl font-bold text-white">
                  {isSpanish ? '¡Video listo!' : 'Video ready!'}
                </h2>
              </div>

              {/* Video Preview */}
              {currentProject.video?.video_url ? (
                <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
                  <video
                    src={currentProject.video.video_url}
                    poster={currentProject.video.thumbnail_url}
                    controls
                    className="w-full aspect-[9/16] max-h-[500px] mx-auto"
                  />
                  
                  <div className="p-4 flex items-center justify-center gap-4">
                    <a
                      href={currentProject.video.video_url}
                      download
                      className="flex items-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      {isSpanish ? 'Descargar' : 'Download'}
                    </a>
                  </div>
                </div>
              ) : (
                // Script only view (no video)
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4">{currentProject.script?.title}</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{currentProject.script?.script}</p>
                </div>
              )}

              {/* Create Another */}
              <div className="text-center">
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  {isSpanish ? 'Crear otro video' : 'Create another video'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Error Stage */}
          {currentStage === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                
                <h2 className="text-2xl font-bold text-white">
                  {isSpanish ? 'Algo salió mal' : 'Something went wrong'}
                </h2>
                
                <p className="text-red-400">{error}</p>
              </div>

              <div className="text-center">
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  {isSpanish ? 'Intentar de nuevo' : 'Try again'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default VoiceToVideoPage;
