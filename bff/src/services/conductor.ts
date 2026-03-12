import { db, comics, tokenTransactions, tokenBalances } from '../db/index';
import { eq } from 'drizzle-orm';
import { AppError } from '../middleware/errorHandler';
import { brain } from './brain';

interface WorkflowContext {
  userId: string;
  comicId: string;
  theme: string;
  title: string;
  description: string;
  characterIds: string[];
}

interface GenerationResult {
  comicId: string;
  story: string;
  pages: Array<{
    pageNumber: number;
    content: string;
    choices: Array<{
      text: string;
      nextPageId?: string;
    }>;
  }>;
  tokensCost: number;
}

const TOKEN_COSTS = {
  story_generation: 150,
  panel_rendering: 100,
  export_pdf: 50,
};

export class Conductor {
  async generateComic(context: WorkflowContext): Promise<GenerationResult> {
    // Check token balance
    const balance = await this.checkTokenBalance(context.userId);
    const totalCost = Object.values(TOKEN_COSTS).reduce((a, b) => a + b, 0);

    if (balance < totalCost) {
      throw new AppError(
        `Insufficient tokens. Need ${totalCost}, have ${balance}`,
        'INSUFFICIENT_TOKENS',
        402
      );
    }

    try {
      // Step 1: Generate story
      const story = await this.generateStory(context);
      await this.deductTokens(context.userId, TOKEN_COSTS.story_generation, `Story generation: ${context.comicId}`);

      // Step 2: Parse story into pages
      const pages = this.parseStoryPages(story);
      await this.deductTokens(context.userId, TOKEN_COSTS.panel_rendering, `Panel rendering: ${context.comicId}`);

      // Step 3: Update comic with generated story
      await db
        .update(comics)
        .set({
          status: 'completed',
          metadata: { pages, tokensUsed: totalCost },
          updatedAt: new Date(),
        })
        .where(eq(comics.id, context.comicId));

      await this.deductTokens(context.userId, TOKEN_COSTS.export_pdf, `Export PDF: ${context.comicId}`);

      return {
        comicId: context.comicId,
        story,
        pages,
        tokensCost: totalCost,
      };
    } catch (error) {
      // Rollback: mark as failed
      await db
        .update(comics)
        .set({ status: 'generating', updatedAt: new Date() })
        .where(eq(comics.id, context.comicId));

      throw error;
    }
  }

  private async generateStory(context: WorkflowContext): Promise<string> {
    const prompt = `
Create a ${context.theme} themed CYOA (Choose Your Own Adventure) story.
Title: ${context.title}
Description: ${context.description}

Output as JSON:
{
  "pages": [
    {
      "pageNumber": 1,
      "content": "Story text here...",
      "choices": [
        { "text": "Choice A", "consequence": "What happens" },
        { "text": "Choice B", "consequence": "Alternative outcome" }
      ]
    }
  ]
}

Create 5-8 pages total.
`;

    const response = await brain.generateText({
      prompt,
      maxTokens: 2000,
      system:
        'You are a creative storyteller. Output ONLY valid JSON, no markdown, no code blocks.',
    });

    return response.text;
  }

  private parseStoryPages(
    story: string
  ): Array<{
    pageNumber: number;
    content: string;
    choices: Array<{ text: string; nextPageId?: string }>;
  }> {
    try {
      const parsed = brain.parseJSON<{
        pages: Array<{ pageNumber: number; content: string; choices: Array<{ text: string }> }>;
      }>(story);

      return parsed.pages.map((p) => ({
        pageNumber: p.pageNumber,
        content: p.content,
        choices: p.choices.map((c) => ({ text: c.text })),
      }));
    } catch {
      // Fallback to mock pages
      return [
        {
          pageNumber: 1,
          content: 'Your adventure begins here...',
          choices: [
            { text: 'Go left' },
            { text: 'Go right' },
            { text: 'Wait and observe' },
          ],
        },
      ];
    }
  }

  private async checkTokenBalance(userId: string): Promise<number> {
    const balance = await db.query.tokenBalances.findFirst({
      where: eq(tokenBalances.userId, userId),
    });

    return balance?.balance || 0;
  }

  private async deductTokens(userId: string, amount: number, reason: string): Promise<void> {
    await db
      .update(tokenBalances)
      .set({
        balance: db.raw(`balance - ${amount}`),
        spent: db.raw(`spent + ${amount}`),
        updatedAt: new Date(),
      })
      .where(eq(tokenBalances.userId, userId));

    await db.insert(tokenTransactions).values({
      id: crypto.randomUUID(),
      userId,
      type: 'spend',
      amount,
      reason,
    });
  }
}

export const conductor = new Conductor();
