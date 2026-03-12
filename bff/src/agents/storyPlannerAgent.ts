import { brain } from '../services/brain';
import { randomUUID } from 'crypto';

interface StoryRequest {
  theme: string;
  characterName?: string;
  userPreferences?: string;
}

interface Page {
  id: string;
  pageNumber: number;
  content: string;
  choices: Choice[];
}

interface Choice {
  id: string;
  text: string;
  consequence: string;
}

export class StoryPlannerAgent {
  async generateStory(request: StoryRequest): Promise<{ pages: Page[]; totalPages: number }> {
    const prompt = `Create a ${request.theme} themed CYOA (Choose Your Own Adventure) story.
${request.characterName ? `Main character: ${request.characterName}` : ''}
${request.userPreferences ? `User preferences: ${request.userPreferences}` : ''}

Generate 5-8 pages of an interactive story.

Output ONLY valid JSON (no markdown, no code blocks):
{
  "pages": [
    {
      "pageNumber": 1,
      "content": "Story text describing the scene, atmosphere, and situation.",
      "choices": [
        {"text": "Choice option A", "consequence": "What happens if chosen"},
        {"text": "Choice option B", "consequence": "Alternative outcome"}
      ]
    }
  ]
}`;

    try {
      const response = await brain.generateText({
        prompt,
        maxTokens: 2000,
        system: 'You are a creative storyteller. Output ONLY valid JSON with no markdown formatting.',
      });

      const parsed = brain.parseJSON<{ pages: any[] }>(response.text);

      const pages: Page[] = parsed.pages.map((p) => ({
        id: randomUUID(),
        pageNumber: p.pageNumber,
        content: p.content,
        choices: p.choices.map((c: any) => ({
          id: randomUUID(),
          text: c.text,
          consequence: c.consequence || '',
        })),
      }));

      return { pages, totalPages: pages.length };
    } catch (error) {
      console.error('Story generation error:', error);
      // Return fallback story
      return {
        pages: [
          {
            id: randomUUID(),
            pageNumber: 1,
            content: `Your ${request.theme || 'adventure'} begins here. The path ahead branches into multiple possibilities, each with its own unique challenges and rewards.`,
            choices: [
              { id: randomUUID(), text: 'Take the left path', consequence: 'Discover ancient ruins' },
              { id: randomUUID(), text: 'Take the right path', consequence: 'Meet mysterious travelers' },
              { id: randomUUID(), text: 'Wait and observe', consequence: 'Learn something important' },
            ],
          },
        ],
        totalPages: 1,
      };
    }
  }
}

export const storyPlanner = new StoryPlannerAgent();
