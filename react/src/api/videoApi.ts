/**
 * Kupuri Studios - Video Generation API Client
 * Frontend API client for voice-to-video pipeline
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface GenerateScriptRequest {
  topic: string;
  language?: string;
  duration?: number;
  style?: string;
  avatarId?: string;
  voiceId?: string;
}

export interface GenerateScriptResponse {
  script: string;
  title: string;
  hook: string;
  cta: string;
  estimated_duration: number;
  video_job_id?: string;
  video_url?: string;
  thumbnail_url?: string;
  model_used: string;
  cost_estimate: number;
}

export interface VideoStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
}

export interface Avatar {
  avatar_id: string;
  avatar_name: string;
  preview_image_url?: string;
}

export interface Voice {
  voice_id: string;
  name: string;
  preview_url?: string;
  labels?: Record<string, string>;
}

export interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  confidence?: number;
}

class VideoApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Transcribe audio using Whisper
   */
  async transcribeAudio(audioBlob: Blob, language: string = 'es'): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('language', language);

    const response = await fetch(`${this.baseUrl}/api/transcription/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Transcription failed' }));
      throw new Error(error.detail || 'Failed to transcribe audio');
    }

    return response.json();
  }

  /**
   * Generate video script from topic or transcription
   */
  async generateScript(request: GenerateScriptRequest): Promise<GenerateScriptResponse> {
    const response = await fetch(`${this.baseUrl}/api/video/generate-script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: request.topic,
        language: request.language || 'es',
        duration: request.duration || 60,
        style: request.style || 'professional',
        avatar_id: request.avatarId,
        voice_id: request.voiceId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Script generation failed' }));
      throw new Error(error.detail || 'Failed to generate script');
    }

    return response.json();
  }

  /**
   * Check video generation status
   */
  async getVideoStatus(jobId: string): Promise<VideoStatusResponse> {
    const response = await fetch(`${this.baseUrl}/api/video/status/${jobId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Status check failed' }));
      throw new Error(error.detail || 'Failed to check video status');
    }

    return response.json();
  }

  /**
   * Poll for video completion
   */
  async waitForVideo(
    jobId: string,
    onProgress?: (status: VideoStatusResponse) => void,
    maxAttempts: number = 60,
    intervalMs: number = 5000
  ): Promise<VideoStatusResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getVideoStatus(jobId);
      
      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'completed') {
        return status;
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Video generation failed');
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Video generation timed out');
  }

  /**
   * Get available avatars
   */
  async getAvatars(): Promise<{ avatars: Avatar[]; defaults: Record<string, string> }> {
    const response = await fetch(`${this.baseUrl}/api/video/avatars`);

    if (!response.ok) {
      return { avatars: [], defaults: {} };
    }

    return response.json();
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<{ voices: Voice[]; defaults: Record<string, string> }> {
    const response = await fetch(`${this.baseUrl}/api/video/voices`);

    if (!response.ok) {
      return { voices: [], defaults: {} };
    }

    return response.json();
  }

  /**
   * Health check for video services
   */
  async healthCheck(): Promise<{
    status: string;
    heygen_configured: boolean;
    elevenlabs_configured: boolean;
    litellm_status: Record<string, unknown>;
  }> {
    const response = await fetch(`${this.baseUrl}/api/video/health`);

    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return response.json();
  }

  /**
   * Full voice-to-video pipeline
   */
  async voiceToVideo(
    audioBlob: Blob,
    options: Partial<GenerateScriptRequest> = {},
    onProgress?: (stage: string, data?: unknown) => void
  ): Promise<{
    transcription: TranscriptionResult;
    script: GenerateScriptResponse;
    video?: VideoStatusResponse;
  }> {
    // Stage 1: Transcribe
    onProgress?.('transcribing');
    const transcription = await this.transcribeAudio(audioBlob, options.language);
    onProgress?.('transcribed', transcription);

    // Stage 2: Generate script
    onProgress?.('generating-script');
    const script = await this.generateScript({
      topic: transcription.text,
      ...options,
    });
    onProgress?.('script-ready', script);

    // Stage 3: Generate video (if job started)
    let video: VideoStatusResponse | undefined;
    if (script.video_job_id) {
      onProgress?.('generating-video');
      video = await this.waitForVideo(script.video_job_id, (status) => {
        onProgress?.('video-progress', status);
      });
      onProgress?.('video-ready', video);
    }

    return { transcription, script, video };
  }
}

// Export singleton instance
export const videoApi = new VideoApiClient();

// Export class for custom instances
export { VideoApiClient };

// Hook for React Query integration
export const videoApiKeys = {
  avatars: ['video', 'avatars'] as const,
  voices: ['video', 'voices'] as const,
  health: ['video', 'health'] as const,
  status: (jobId: string) => ['video', 'status', jobId] as const,
};
