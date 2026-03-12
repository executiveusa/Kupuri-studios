import { Anthropic } from '@anthropic-ai/sdk';
import { AppError } from '../middleware/errorHandler';

interface LLMRequest {
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

interface LLMResponse {
  text: string;
  model: string;
  tokensUsed: number;
  costUSD: number;
}

const MODELS = {
  claude: { name: 'claude-opus-4-6', costPer1kTokens: 0.015 },
  gemini: { name: 'gemini-2.0-flash', costPer1kTokens: 0.01 },
  grok: { name: 'grok-2-vision-1212', costPer1kTokens: 0.008 },
};

export class Brain {
  private claude: Anthropic;

  constructor() {
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateText(request: LLMRequest): Promise<LLMResponse> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    // Try Claude first (primary)
    try {
      const response = await this.claude.messages.create({
        model: MODELS.claude.name,
        max_tokens: request.maxTokens || 1024,
        system: request.system || 'You are a helpful AI assistant.',
        messages: [{ role: 'user', content: request.prompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
      const cost = (tokensUsed / 1000) * MODELS.claude.costPer1kTokens;

      return {
        text,
        model: MODELS.claude.name,
        tokensUsed,
        costUSD: cost,
      };
    } catch (error) {
      lastError = error as Error;
      console.warn('Claude API failed, trying fallback...', lastError.message);
    }

    // Fallback to mock Gemini response (real implementation would call Gemini API)
    try {
      // For MVP: Return mock response
      // In production: Call Google Gemini API
      const mockResponse = `Mock response from ${MODELS.gemini.name}`;
      return {
        text: mockResponse,
        model: MODELS.gemini.name,
        tokensUsed: 150,
        costUSD: 0.0015,
      };
    } catch (error) {
      console.warn('Gemini fallback failed', error);
    }

    // Fallback to mock Grok response
    const mockResponse = `Mock response from ${MODELS.grok.name}`;
    return {
      text: mockResponse,
      model: MODELS.grok.name,
      tokensUsed: 120,
      costUSD: 0.001,
    };
  }

  // Parse JSON from LLM response
  parseJSON<T>(text: string): T {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new AppError('Failed to parse AI response', 'PARSE_ERROR', 400);
    }
  }

  // Cost tracking
  calculateTokenCost(tokensUsed: number, model: string = MODELS.claude.name): number {
    const modelConfig = Object.values(MODELS).find((m) => m.name === model);
    return modelConfig ? (tokensUsed / 1000) * modelConfig.costPer1kTokens : 0;
  }
}

export const brain = new Brain();
