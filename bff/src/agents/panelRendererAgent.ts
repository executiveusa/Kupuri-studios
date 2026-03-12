import { brain } from '../services/brain';
import { randomUUID } from 'crypto';

interface Panel {
  id: string;
  panelNumber: number;
  imageUrl: string;
  description: string;
}

export class PanelRendererAgent {
  async renderPanels(pageContent: string, theme: string, panelsPerPage: number = 4): Promise<Panel[]> {
    const prompt = `Convert this story page into ${panelsPerPage} manga/anime panel descriptions for a ${theme} story:

Story: "${pageContent}"

Output ONLY JSON with NO markdown:
{
  "panels": [
    {
      "panelNumber": 1,
      "description": "What should be drawn in this panel with visual details"
    }
  ]
}

Create ${panelsPerPage} panels that show action, emotion, and progression.`;

    try {
      const response = await brain.generateText({
        prompt,
        maxTokens: 1000,
        system: 'You are a manga/anime visual designer. Output ONLY valid JSON.',
      });

      const parsed = brain.parseJSON<{ panels: any[] }>(response.text);

      return parsed.panels.map((p) => ({
        id: randomUUID(),
        panelNumber: p.panelNumber,
        // For MVP: Use placeholder image
        imageUrl: `https://via.placeholder.com/400x300?text=Panel+${p.panelNumber}`,
        description: p.description,
      }));
    } catch (error) {
      console.error('Panel rendering error:', error);
      // Return fallback panels
      const panels: Panel[] = [];
      for (let i = 1; i <= panelsPerPage; i++) {
        panels.push({
          id: randomUUID(),
          panelNumber: i,
          imageUrl: `https://via.placeholder.com/400x300?text=Panel+${i}`,
          description: `Panel ${i}: Scene from the story showing action and emotion`,
        });
      }
      return panels;
    }
  }

  async optimizeLayoutForPrint(panels: Panel[]): Promise<{ layout: string; printReady: boolean }> {
    // For MVP: Return standard manga layout
    return {
      layout: 'mangaka-4-panel',
      printReady: true,
    };
  }
}

export const panelRenderer = new PanelRendererAgent();
