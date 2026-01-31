/**
 * @kupuri/ecosystem-types
 * 
 * Shared TypeScript types for the Kupuri Studios ecosystem
 * Used across all bubble apps and backend services
 */

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: Plan;
  tokenBalance: number;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
  permissions: Permission[];
}

export type Plan = 'free' | 'pro' | 'enterprise';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  marketing: boolean;
}

export type Permission = 
  | 'create:project'
  | 'delete:project'
  | 'manage:team'
  | 'manage:billing'
  | 'admin:full';

// ============================================================================
// TOKENS & BILLING
// ============================================================================

export interface TokenTransaction {
  id: string;
  userId: string;
  amount: number;
  type: TokenTransactionType;
  bubble: BubbleId;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type TokenTransactionType = 
  | 'purchase'
  | 'usage'
  | 'refund'
  | 'bonus'
  | 'subscription';

export interface TokenUsage {
  bubble: BubbleId;
  amount: number;
  lastUsed: Date;
}

export interface TokenBalance {
  total: number;
  available: number;
  reserved: number;
  usageByBubble: Record<BubbleId, number>;
}

// ============================================================================
// BUBBLES (ECOSYSTEM APPS)
// ============================================================================

export type BubbleId = 
  | 'jaaz' 
  | 'postiz' 
  | 'designer' 
  | 'analytics' 
  | 'studio';

export interface Bubble {
  id: BubbleId;
  name: string;
  description: string;
  icon: string;
  color: string;
  href: string;
  status: BubbleStatus;
  version: string;
}

export type BubbleStatus = 'active' | 'beta' | 'coming-soon' | 'maintenance';

export interface BubbleConfig {
  bubble: BubbleId;
  features: FeatureFlag[];
  limits: BubbleLimits;
  integrations: Integration[];
}

export interface BubbleLimits {
  maxProjects: number;
  maxStorage: number; // in MB
  maxGenerations: number; // per day
  maxAgents: number;
}

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  plans: Plan[];
}

// ============================================================================
// PROJECTS
// ============================================================================

export interface Project {
  id: string;
  userId: string;
  bubble: BubbleId;
  name: string;
  description?: string;
  status: ProjectStatus;
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export type ProjectStatus = 
  | 'draft' 
  | 'active' 
  | 'processing' 
  | 'completed' 
  | 'archived';

export interface ProjectSettings {
  isPublic: boolean;
  allowComments: boolean;
  collaborators: string[];
}

// ============================================================================
// AI AGENTS
// ============================================================================

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  bubble: BubbleId;
  description: string;
  model: ModelConfig;
  capabilities: AgentCapability[];
  status: AgentStatus;
  metadata?: Record<string, unknown>;
}

export type AgentType = 
  | 'assistant'
  | 'generator'
  | 'analyzer'
  | 'scheduler'
  | 'reviewer';

export type AgentCapability = 
  | 'text-generation'
  | 'image-generation'
  | 'video-generation'
  | 'audio-generation'
  | 'code-generation'
  | 'analysis'
  | 'scheduling'
  | 'research';

export type AgentStatus = 'idle' | 'running' | 'paused' | 'error';

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export type ModelProvider = 
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure'
  | 'groq'
  | 'ollama'
  | 'custom';

// ============================================================================
// GENERATIONS & CONTENT
// ============================================================================

export interface Generation {
  id: string;
  projectId: string;
  agentId?: string;
  type: GenerationType;
  status: GenerationStatus;
  input: GenerationInput;
  output?: GenerationOutput;
  tokensUsed: number;
  costTokens: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export type GenerationType = 
  | 'video'
  | 'image'
  | 'audio'
  | 'text'
  | 'code'
  | 'social-post';

export type GenerationStatus = 
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface GenerationInput {
  prompt: string;
  systemPrompt?: string;
  context?: string;
  references?: string[];
  settings?: Record<string, unknown>;
}

export interface GenerationOutput {
  content: string | string[];
  format: string;
  url?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// INTEGRATIONS
// ============================================================================

export interface Integration {
  id: string;
  userId: string;
  type: IntegrationType;
  status: IntegrationStatus;
  credentials?: Record<string, string>;
  settings?: Record<string, unknown>;
  lastSync?: Date;
}

export type IntegrationType = 
  | 'twitter'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'youtube'
  | 'tiktok'
  | 'google-drive'
  | 'dropbox'
  | 'slack'
  | 'discord'
  | 'zapier'
  | 'webhook';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

// ============================================================================
// WEBHOOKS & EVENTS
// ============================================================================

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  bubble: BubbleId;
  payload: WebhookPayload;
  timestamp: Date;
  signature: string;
}

export type WebhookEventType = 
  | 'generation.started'
  | 'generation.completed'
  | 'generation.failed'
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'token.low'
  | 'token.depleted'
  | 'user.updated'
  | 'integration.connected'
  | 'integration.disconnected';

export interface WebhookPayload {
  eventType: WebhookEventType;
  resourceId: string;
  resourceType: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: Required<ApiMeta>;
}

// ============================================================================
// JAAZ-SPECIFIC TYPES
// ============================================================================

export interface JaazVideo {
  id: string;
  projectId: string;
  title: string;
  script: string;
  scenes: JaazScene[];
  style: JaazVideoStyle;
  status: GenerationStatus;
  outputUrl?: string;
  duration?: number;
  createdAt: Date;
}

export interface JaazScene {
  id: string;
  order: number;
  type: 'text' | 'image' | 'video' | 'transition';
  content: string;
  voiceover?: string;
  duration: number;
  settings?: Record<string, unknown>;
}

export interface JaazVideoStyle {
  template: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  voice: string;
  music?: string;
  branding?: JaazBranding;
}

export interface JaazBranding {
  logo?: string;
  watermark?: string;
  colors?: string[];
  fonts?: string[];
}

// ============================================================================
// POSTIZ-SPECIFIC TYPES
// ============================================================================

export interface PostizPost {
  id: string;
  projectId: string;
  content: string;
  media?: PostizMedia[];
  platforms: PostizPlatform[];
  schedule?: PostizSchedule;
  status: PostStatus;
  analytics?: PostAnalytics;
  createdAt: Date;
}

export interface PostizMedia {
  id: string;
  type: 'image' | 'video' | 'gif';
  url: string;
  altText?: string;
}

export interface PostizPlatform {
  type: IntegrationType;
  settings?: Record<string, unknown>;
  status: 'pending' | 'published' | 'failed';
  publishedUrl?: string;
}

export interface PostizSchedule {
  publishAt: Date;
  timezone: string;
  recurring?: PostizRecurrence;
}

export interface PostizRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate?: Date;
}

export type PostStatus = 
  | 'draft'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed';

export interface PostAnalytics {
  impressions: number;
  engagements: number;
  clicks: number;
  shares: number;
  comments: number;
}
