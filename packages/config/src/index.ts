/**
 * @kupuri/config - Shared Configuration
 * 
 * Central configuration for the Kupuri Studios ecosystem
 */

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_CONFIG = {
  baseUrl: process.env.KUPURI_API_URL || 'http://localhost:8000',
  version: 'v1',
  timeout: 30000, // 30 seconds
  retries: 3,
} as const;

// ============================================================================
// ECOSYSTEM BUBBLES
// ============================================================================

export const BUBBLES = {
  jaaz: {
    id: 'jaaz',
    name: 'JAAZ',
    description: 'AI Video Creation Studio',
    color: '#8B5CF6', // Purple
    icon: 'video',
    href: '/jaaz',
    apiPath: '/api/jaaz',
  },
  postiz: {
    id: 'postiz',
    name: 'POSTIZ',
    description: 'Social Media Automation',
    color: '#3B82F6', // Blue
    icon: 'share',
    href: '/postiz',
    apiPath: '/api/postiz',
  },
  designer: {
    id: 'designer',
    name: 'Designer',
    description: 'Graphic Design Studio',
    color: '#EC4899', // Pink
    icon: 'palette',
    href: '/designer',
    apiPath: '/api/designer',
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    description: 'Metrics & Reporting',
    color: '#22C55E', // Green
    icon: 'chart',
    href: '/analytics',
    apiPath: '/api/analytics',
  },
} as const;

export type BubbleConfig = typeof BUBBLES[keyof typeof BUBBLES];

// ============================================================================
// AI MODEL CONFIGURATION
// ============================================================================

export const MODEL_CONFIG = {
  defaultProvider: 'anthropic',
  providers: {
    anthropic: {
      models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
      defaultModel: 'claude-3-5-sonnet-20241022',
      maxTokens: 8192,
    },
    openai: {
      models: ['gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
      defaultModel: 'gpt-4o',
      maxTokens: 4096,
    },
    google: {
      models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
      defaultModel: 'gemini-1.5-pro',
      maxTokens: 8192,
    },
    groq: {
      models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
      defaultModel: 'llama-3.1-70b-versatile',
      maxTokens: 32768,
    },
  },
} as const;

// ============================================================================
// TOKEN PRICING
// ============================================================================

export const TOKEN_PRICING = {
  // Base token costs per operation type
  costs: {
    textGeneration: 1,
    imageGeneration: 10,
    videoGeneration: 50,
    audioGeneration: 5,
    codeGeneration: 2,
    analysis: 1,
    scheduling: 0,
  },
  // Multipliers per model tier
  modelMultipliers: {
    'claude-3-opus': 3,
    'claude-3-5-sonnet': 1,
    'claude-3-haiku': 0.5,
    'gpt-4-turbo': 2,
    'gpt-4o': 1.5,
    'gpt-4o-mini': 0.3,
    'gemini-1.5-pro': 1,
    'gemini-1.5-flash': 0.3,
  },
  // Plan token allocations
  plans: {
    free: {
      monthlyTokens: 1000,
      rollover: false,
    },
    pro: {
      monthlyTokens: 10000,
      rollover: true,
      maxRollover: 5000,
    },
    enterprise: {
      monthlyTokens: 100000,
      rollover: true,
      maxRollover: 50000,
    },
  },
} as const;

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURE_FLAGS = {
  // Global features
  darkMode: true,
  animations: true,
  analytics: true,
  
  // JAAZ features
  jaazBetaFeatures: false,
  jaazLongVideos: false, // Videos > 5 min
  jaazCustomVoices: true,
  jaazHeygenIntegration: true,
  
  // POSTIZ features
  postizScheduling: true,
  postizBulkUpload: true,
  postizAiCaptions: true,
  postizAnalytics: true,
  
  // Designer features
  designerTemplates: true,
  designerAiGeneration: false, // Coming soon
  
  // Analytics features
  analyticsRealtime: false,
  analyticsExport: true,
} as const;

// ============================================================================
// LIMITS
// ============================================================================

export const LIMITS = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxVideoLength: 300, // 5 minutes in seconds
  maxProjectsPerUser: {
    free: 5,
    pro: 50,
    enterprise: Infinity,
  },
  maxConcurrentGenerations: {
    free: 1,
    pro: 5,
    enterprise: 20,
  },
  rateLimit: {
    requests: 100,
    windowMs: 60000, // 1 minute
  },
} as const;

// ============================================================================
// ROUTES
// ============================================================================

export const ROUTES = {
  // Auth
  login: '/login',
  signup: '/signup',
  logout: '/logout',
  forgotPassword: '/forgot-password',
  
  // Dashboard
  dashboard: '/',
  settings: '/settings',
  billing: '/billing',
  
  // JAAZ
  jaaz: '/jaaz',
  jaazProject: '/jaaz/:projectId',
  jaazEditor: '/jaaz/:projectId/editor',
  
  // POSTIZ
  postiz: '/postiz',
  postizCompose: '/postiz/compose',
  postizSchedule: '/postiz/schedule',
  postizAnalytics: '/postiz/analytics',
  
  // Designer
  designer: '/designer',
  designerProject: '/designer/:projectId',
  
  // Analytics
  analytics: '/analytics',
} as const;

// ============================================================================
// THEME COLORS (for Tailwind)
// ============================================================================

export const THEME_COLORS = {
  kupuri: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // Primary
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },
  jaaz: {
    DEFAULT: '#8B5CF6',
    light: '#A78BFA',
    dark: '#7C3AED',
  },
  postiz: {
    DEFAULT: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
  },
  designer: {
    DEFAULT: '#EC4899',
    light: '#F472B6',
    dark: '#DB2777',
  },
  analytics: {
    DEFAULT: '#22C55E',
    light: '#4ADE80',
    dark: '#16A34A',
  },
} as const;

// ============================================================================
// EXPORT DEFAULT CONFIG
// ============================================================================

export const config = {
  api: API_CONFIG,
  bubbles: BUBBLES,
  models: MODEL_CONFIG,
  tokens: TOKEN_PRICING,
  features: FEATURE_FLAGS,
  limits: LIMITS,
  routes: ROUTES,
  colors: THEME_COLORS,
} as const;

export default config;
