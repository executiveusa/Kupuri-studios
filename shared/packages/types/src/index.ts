// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Comics & Stories
export interface Comic {
  id: string;
  userId: string;
  title: string;
  description?: string;
  theme: string; // 'pokemon', 'anime', 'fantasy', etc.
  status: 'draft' | 'generating' | 'completed' | 'published';
  pages: Page[];
  characterIds: string[];
  thumbnail?: string;
  metadata: ComicMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface Page {
  id: string;
  comicId: string;
  pageNumber: number;
  content: string;
  imageUrl?: string;
  panels: Panel[];
  choices: Choice[];
  createdAt: Date;
}

export interface Panel {
  id: string;
  pageId: string;
  panelNumber: number;
  imageUrl: string;
  description: string;
  characters: string[]; // character IDs
  speechBubbles: SpeechBubble[];
}

export interface SpeechBubble {
  id: string;
  panelId: string;
  character: string;
  text: string;
  type: 'speech' | 'thought' | 'narration';
  position: { x: number; y: number };
}

export interface Choice {
  id: string;
  pageId: string;
  text: string;
  nextPageId?: string;
  requiredTokens: number;
  consequence?: string;
}

export interface ComicMetadata {
  ageRating: 'G' | 'PG' | 'PG-13' | '18+';
  genre: string[];
  tags: string[];
  voiceActors?: string[];
  backgroundMusic?: string;
  views: number;
  likes: number;
  shares: number;
}

// Characters
export interface Character {
  id: string;
  userId: string;
  name: string;
  description: string;
  imageUrl: string;
  faceEmbedding?: number[];
  metadata: CharacterMetadata;
  nftTokenId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CharacterMetadata {
  personality: string[];
  voice?: string;
  voiceVendor?: 'elevenlabs' | 'google' | 'azure';
  appearances: number;
  isFeatured: boolean;
  customizationOptions: Record<string, any>;
}

// Tokens & Economy
export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  bonus: number; // percentage
  description: string;
  popular: boolean;
}

export const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    tokens: 1100,
    price: 9.99,
    bonus: 10,
    description: '1,100 tokens',
    popular: false,
  },
  {
    id: 'creator',
    name: 'Creator',
    tokens: 6000,
    price: 39.99,
    bonus: 20,
    description: '6,000 tokens',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    tokens: 20250,
    price: 99.99,
    bonus: 35,
    description: '20,250 tokens',
    popular: false,
  },
  {
    id: 'studio',
    name: 'Studio',
    tokens: 75000,
    price: 299.99,
    bonus: 50,
    description: '75,000 tokens',
    popular: false,
  },
];

export interface TokenBalance {
  userId: string;
  balance: number;
  spent: number;
  earned: number;
  updatedAt: Date;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'spend' | 'bonus' | 'refund';
  amount: number;
  reason: string;
  relatedId?: string; // comic id, order id, etc.
  createdAt: Date;
}

// Payments
export interface StripeCheckoutSession {
  sessionId: string;
  userId: string;
  priceId: string;
  packageId: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

// NFT
export interface NFT {
  id: string;
  userId: string;
  contractAddress: string;
  tokenId: string;
  type: 'character' | 'comic' | 'badge';
  metadata: NFTMetadata;
  transactionHash?: string;
  mintedAt: Date;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  externalUrl?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

// Print on Demand
export interface PODOrder {
  id: string;
  userId: string;
  comicId: string;
  provider: 'printful' | 'printify';
  providerId: string;
  product: 'hardcover' | 'paperback' | 'ebook';
  quantity: number;
  price: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'failed';
  trackingNumber?: string;
  shippingAddress: ShippingAddress;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Analytics
export interface AnalyticsEvent {
  id: string;
  userId?: string;
  event: string;
  properties: Record<string, any>;
  timestamp: Date;
}

// API Response Wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
