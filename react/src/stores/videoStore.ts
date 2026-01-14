/**
 * Kupuri Studios - Video Generation Store
 * Zustand store for voice-to-video pipeline state management
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { videoApi, type GenerateScriptResponse, type VideoStatusResponse, type TranscriptionResult } from '../api/videoApi';

export type PipelineStage = 
  | 'idle' 
  | 'recording' 
  | 'transcribing' 
  | 'generating-script' 
  | 'generating-video' 
  | 'completed' 
  | 'error';

export interface VideoProject {
  id: string;
  createdAt: string;
  transcription?: TranscriptionResult;
  script?: GenerateScriptResponse;
  video?: VideoStatusResponse;
  status: PipelineStage;
  error?: string;
}

interface VideoState {
  // Current pipeline state
  currentStage: PipelineStage;
  currentProject: VideoProject | null;
  isProcessing: boolean;
  error: string | null;
  
  // Project history
  projects: VideoProject[];
  
  // Settings
  selectedAvatar: string | null;
  selectedVoice: string | null;
  language: 'es' | 'en';
  videoDuration: number;
  videoStyle: string;
  
  // Audio recording
  audioBlob: Blob | null;
  
  // Actions
  setStage: (stage: PipelineStage) => void;
  setAudioBlob: (blob: Blob | null) => void;
  setError: (error: string | null) => void;
  
  // Settings actions
  setAvatar: (avatarId: string | null) => void;
  setVoice: (voiceId: string | null) => void;
  setLanguage: (lang: 'es' | 'en') => void;
  setDuration: (seconds: number) => void;
  setStyle: (style: string) => void;
  
  // Pipeline actions
  startPipeline: (audioBlob: Blob) => Promise<VideoProject>;
  transcribeAudio: (blob: Blob) => Promise<TranscriptionResult>;
  generateScript: (text: string) => Promise<GenerateScriptResponse>;
  pollVideoStatus: (jobId: string) => Promise<VideoStatusResponse>;
  
  // Project management
  addProject: (project: VideoProject) => void;
  removeProject: (id: string) => void;
  clearHistory: () => void;
  reset: () => void;
}

const generateId = () => `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useVideoStore = create<VideoState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentStage: 'idle',
        currentProject: null,
        isProcessing: false,
        error: null,
        projects: [],
        selectedAvatar: null,
        selectedVoice: null,
        language: 'es',
        videoDuration: 60,
        videoStyle: 'professional',
        audioBlob: null,
        
        // Basic actions
        setStage: (stage) => set({ currentStage: stage }),
        setAudioBlob: (blob) => set({ audioBlob: blob }),
        setError: (error) => set({ error, currentStage: error ? 'error' : get().currentStage }),
        
        // Settings actions
        setAvatar: (avatarId) => set({ selectedAvatar: avatarId }),
        setVoice: (voiceId) => set({ selectedVoice: voiceId }),
        setLanguage: (lang) => set({ language: lang }),
        setDuration: (seconds) => set({ videoDuration: seconds }),
        setStyle: (style) => set({ videoStyle: style }),
        
        // Transcribe audio
        transcribeAudio: async (blob) => {
          set({ currentStage: 'transcribing', isProcessing: true, error: null });
          try {
            const result = await videoApi.transcribeAudio(blob, get().language);
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Transcription failed';
            set({ error: message, currentStage: 'error' });
            throw error;
          }
        },
        
        // Generate script
        generateScript: async (text) => {
          const state = get();
          set({ currentStage: 'generating-script', isProcessing: true });
          try {
            const result = await videoApi.generateScript({
              topic: text,
              language: state.language,
              duration: state.videoDuration,
              style: state.videoStyle,
              avatarId: state.selectedAvatar || undefined,
              voiceId: state.selectedVoice || undefined,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Script generation failed';
            set({ error: message, currentStage: 'error' });
            throw error;
          }
        },
        
        // Poll video status
        pollVideoStatus: async (jobId) => {
          set({ currentStage: 'generating-video' });
          try {
            const result = await videoApi.waitForVideo(jobId);
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Video generation failed';
            set({ error: message, currentStage: 'error' });
            throw error;
          }
        },
        
        // Full pipeline
        startPipeline: async (audioBlob) => {
          const state = get();
          const projectId = generateId();
          
          const project: VideoProject = {
            id: projectId,
            createdAt: new Date().toISOString(),
            status: 'recording',
          };
          
          set({
            currentProject: project,
            isProcessing: true,
            error: null,
            currentStage: 'transcribing',
          });
          
          try {
            // Step 1: Transcribe
            const transcription = await state.transcribeAudio(audioBlob);
            project.transcription = transcription;
            project.status = 'generating-script';
            set({ currentProject: { ...project } });
            
            // Step 2: Generate script
            const script = await state.generateScript(transcription.text);
            project.script = script;
            
            // Step 3: Generate video if job started
            if (script.video_job_id) {
              project.status = 'generating-video';
              set({ currentProject: { ...project }, currentStage: 'generating-video' });
              
              const video = await state.pollVideoStatus(script.video_job_id);
              project.video = video;
            }
            
            // Complete
            project.status = 'completed';
            set({
              currentProject: { ...project },
              currentStage: 'completed',
              isProcessing: false,
            });
            
            // Add to history
            state.addProject(project);
            
            return project;
            
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Pipeline failed';
            project.status = 'error';
            project.error = message;
            
            set({
              currentProject: { ...project },
              currentStage: 'error',
              isProcessing: false,
              error: message,
            });
            
            throw error;
          }
        },
        
        // Project management
        addProject: (project) => set((state) => ({
          projects: [project, ...state.projects].slice(0, 50), // Keep last 50
        })),
        
        removeProject: (id) => set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),
        
        clearHistory: () => set({ projects: [] }),
        
        reset: () => set({
          currentStage: 'idle',
          currentProject: null,
          isProcessing: false,
          error: null,
          audioBlob: null,
        }),
      }),
      {
        name: 'kupuri-video-store',
        partialize: (state) => ({
          projects: state.projects,
          selectedAvatar: state.selectedAvatar,
          selectedVoice: state.selectedVoice,
          language: state.language,
          videoDuration: state.videoDuration,
          videoStyle: state.videoStyle,
        }),
      }
    ),
    { name: 'VideoStore' }
  )
);

// Selectors for optimized re-renders
export const selectCurrentStage = (state: VideoState) => state.currentStage;
export const selectIsProcessing = (state: VideoState) => state.isProcessing;
export const selectCurrentProject = (state: VideoState) => state.currentProject;
export const selectProjects = (state: VideoState) => state.projects;
export const selectError = (state: VideoState) => state.error;
export const selectSettings = (state: VideoState) => ({
  avatar: state.selectedAvatar,
  voice: state.selectedVoice,
  language: state.language,
  duration: state.videoDuration,
  style: state.videoStyle,
});
